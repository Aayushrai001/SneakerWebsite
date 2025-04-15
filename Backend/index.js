const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const Jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { initializeKhaltiPayment, verifyKhaltiPayment } = require('./khalti');
const PurchasedItem = require('./models/purchasedItemModel');
const Payment = require('./models/paymentModel');
const Product = require('./models/Product');
const Review = require('./models/Review');
const connectDB = require('./connectDB');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify nodemailer configuration
transporter.verify((error, success) => {
  if (error) console.error('Nodemailer config error:', error);
  else console.log('Nodemailer ready');
});

// Define allowed origins
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
connectDB();

const uploadDir = './upload/images';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from the upload directory
app.use('/images', express.static(uploadDir));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only .jpg and .png files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
}).single('product');

// Add product endpoint
app.post('/addproduct', upload, async (req, res) => {
  try {
    console.log('Received /addproduct request:', {
      body: req.body,
      file: req.file?.originalname,
    });

    // Validate image presence
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Product image is required' });
    }

    // Validate image dimensions using sharp
    const imageMetadata = await sharp(req.file.buffer).metadata();
    if (imageMetadata.width !== 840 || imageMetadata.height !== 840) {
      return res.status(400).json({
        success: false,
        message: 'Image must be exactly 840x840 pixels',
      });
    }

    // Parse product details
    const { name, category, brand, new_price, description, sizes } = req.body;

    // Validate required fields
    if (!name?.trim() || !category?.trim() || !brand?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'All text fields are required' });
    }

    // Validate price
    const price = parseFloat(new_price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });
    }

    // Parse and validate sizes
    let parsedSizes;
    try {
      parsedSizes = JSON.parse(sizes || '[]');
      if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one size is required' });
      }
    } catch (error) {
      console.error('Failed to parse sizes:', sizes, error);
      return res.status(400).json({ success: false, message: 'Invalid sizes format' });
    }

    // Validate each size entry
    for (const size of parsedSizes) {
      if (!size.size?.trim()) {
        return res.status(400).json({ success: false, message: 'Size cannot be empty' });
      }
      if (!Number.isInteger(Number(size.quantity)) || Number(size.quantity) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a non-negative integer',
        });
      }
    }

    // Save image to disk
    const filename = `product_${Date.now()}${path.extname(req.file.originalname)}`;
    const imagePath = path.join(uploadDir, filename);
    await sharp(req.file.buffer)
      .toFormat('jpeg') // Convert to JPEG for consistency
      .jpeg({ quality: 80 }) // Optimize image
      .toFile(imagePath);
    console.log('Image saved:', imagePath);

    // Generate unique product ID
    const lastProduct = await Product.findOne().sort({ id: -1 }).exec();
    const newId = lastProduct ? lastProduct.id + 1 : 1;

    // Create new product
    const newProduct = new Product({
      id: newId,
      name: name.trim(),
      image: `/images/${filename}`, // Relative path for client access
      category: category.trim(),
      brand: brand.trim(),
      new_price: price,
      description: description.trim(),
      sizes: parsedSizes.map((size) => ({
        size: size.size.trim(),
        quantity: Number(size.quantity),
      })),
      createdAt: new Date(), // Optional: Track creation time
    });

    // Save product to database
    const savedProduct = await newProduct.save();
    console.log('Product saved:', {
      id: savedProduct.id,
      mongoId: savedProduct._id,
      sizes: savedProduct.sizes,
    });

    // Respond with success
    return res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: {
        id: savedProduct.id,
        name: savedProduct.name,
        image: savedProduct.image,
        category: savedProduct.category,
        brand: savedProduct.brand,
        new_price: savedProduct.new_price,
        description: savedProduct.description,
        sizes: savedProduct.sizes,
      },
    });
  } catch (error) {
    console.error('Error in /addproduct:', error.stack);
    return res.status(500).json({
      success: false,
      message: `Error adding product: ${error.message}`,
    });
  }
});

app.get('/allproducts', async (req, res) => {
  try {
    const BASE_URL = process.env.BACKEND_URI || 'http://localhost:5000';
    const products = await Product.find({}).lean(); 
    const productsWithFullUrls = products.map((product) => ({
      ...product,
      image: product.image.startsWith('http')
        ? product.image
        : `${BASE_URL}${product.image}`,
    }));
    res.json(productsWithFullUrls);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const Users = mongoose.model('Users', new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  phone: { type: String },
  address: { type: String },
  cartData: { type: Object },
  favoriteData: { type: Object },
  date: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
}));

const fetchUser = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) return res.status(401).json({ success: false, message: 'Access Denied: No token provided' });
  try {
    const data = Jwt.verify(token, 'secret_ecom');
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid Token' });
  }
};

app.get('/getusername', fetchUser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id).select('name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, name: user.name });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/user/details', fetchUser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id).select('-password -cartData -favoriteData -verificationToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/user/update', fetchUser, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updatedUser = await Users.findByIdAndUpdate(
      req.user.id,
      { name, phone, address },
      { new: true, select: '-password -cartData -favoriteData -verificationToken' }
    );
    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: updatedUser, message: 'User details updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/signup', async (req, res) => {
  try {
    // Validate input
    const { name, email, password, address, phone } = req.body;

    // Check required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, errors: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, errors: 'Email is required' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ success: false, errors: 'Password is required' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, errors: 'Address is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, errors: 'Phone number is required' });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, errors: 'Email must be a valid Gmail address (e.g., example123@gmail.com)' });
    }

    // Validate phone format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, errors: 'Phone number must be 10 digits' });
    }

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, errors: 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character' });
    }

    // Check for existing user
    let check = await Users.findOne({ email });
    if (check) {
      return res.status(400).json({ success: false, errors: 'Existing user found with same email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Initialize cart and favorite
    let cart = {}; for (let i = 0; i < 300; i++) cart[i] = 0;
    let favorite = {}; for (let i = 0; i < 300; i++) favorite[i] = 0;

    // Create user
    const user = new Users({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      address: address.trim(),
      phone: phone.trim(),
      cartData: cart,
      favoriteData: favorite,
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });
    await user.save();

    // Send verification email
    try {
      const verificationLink = `${process.env.BACKEND_URI}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      console.log('Sending verification email to:', email, 'from:', process.env.EMAIL_USER);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <h2>Welcome to Our Sneaker App!</h2>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
      console.log('Verification email sent successfully to:', email);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({ success: false, message: 'Failed to send verification email', error: emailError.message });
    }

    res.json({ success: true, message: 'Please check your email to verify your account.' });
  } catch (error) {
    console.error('Signup error:', error.stack);
    res.status(500).json({ success: false, message: 'Server error during signup', error: error.message });
  }
});

app.get('/verify-email', async (req, res) => {
  try {
    const { token, email } = req.query;
    const user = await Users.findOne({
      email,
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send verification email
    try {
      const verificationLink = `${process.env.BACKEND_URI}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Resend: Verify Your Email Address',
        html: `
          <h2>Welcome to Our Sneaker App!</h2>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({ success: false, message: 'Failed to send verification email', error: emailError.message });
    }

    res.json({ success: true, message: 'Verification email resent. Please check your email.' });
  } catch (error) {
    console.error('Resend verification error:', error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, errors: 'Email is required' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ success: false, errors: 'Password is required' });
    }

    // Find user
    let user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, errors: 'Wrong Email Id' });
    }

    // Check verification
    if (!user.isVerified) {
      return res.status(400).json({ success: false, errors: 'Email not verified. Please check your email for the verification link.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, errors: 'Wrong Password' });
    }

    // Generate token
    const token = Jwt.sign({ user: { id: user.id } }, 'secret_ecom');
    res.json({ success: true, token });
  } catch (error) {
    console.error('Login error:', error.stack);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

app.get('/newcollections', async (req, res) => {
  try {
    const BASE_URL = process.env.BACKEND_URI || 'http://localhost:5000';
    const newCollection = await Product.aggregate([{ $sample: { size: 8 } }]);
    const productsWithFullUrls = newCollection.map((product) => ({
      ...product,
      image: product.image.startsWith('http')
        ? product.image
        : `${BASE_URL}${product.image}`,
    }));
    res.json(productsWithFullUrls);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.get('/popular', async (req, res) => {
  try {
    const BASE_URL = process.env.BACKEND_URI || 'http://localhost:5000'; // Use env variable or default
    const products = await Product.aggregate([
      { $match: { category: { $in: ['men', 'women', 'kid'] } } },
      { $sample: { size: 4 } },
    ]);

    // Map products to include full image URLs
    const productsWithFullUrls = products.map((product) => ({
      ...product,
      image: product.image.startsWith('http')
        ? product.image
        : `${BASE_URL}${product.image}`,
    }));

    res.json(productsWithFullUrls);
  } catch (error) {
    console.error('Error fetching popular products:', error.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.post('/AddToCart', fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send('Added');
});

app.post('/RemoveCart', async (req, res) => {
  try {
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] > 0) {
      userData.cartData[req.body.itemId] -= 1;
      if (userData.cartData[req.body.itemId] === 0) delete userData.cartData[req.body.itemId];
      await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
      return res.json({ message: 'Item removed', cartData: userData.cartData });
    }uct

    res.status(400).json({ error: 'Item not found in cart or already at 0' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/getcart', fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

app.post('/AddToFavourite', fetchUser, async (req, res) => {
  try {
    let userData = await Users.findOne({ _id: req.user.id });
    userData.favoriteData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { favoriteData: userData.favoriteData });
    res.json({ message: 'Added to Favourite', favoriteData: userData.favoriteData });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/RemoveFavourite', fetchUser, async (req, res) => {
  try {
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.favoriteData[req.body.itemId] > 0) {
      userData.favoriteData[req.body.itemId] -= 1;
      if (userData.favoriteData[req.body.itemId] === 0) delete userData.favoriteData[req.body.itemId];
      await Users.findOneAndUpdate({ _id: req.user.id }, { favoriteData: userData.favoriteData });
      return res.json({ message: 'Item removed from Favourite', favoriteData: userData.favoriteData });
    }
    res.status(400).json({ error: 'Item not found in favourites or already at 0' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/getfavourite', fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.favoriteData);
});

app.post('/initialize-khalti', fetchUser, async (req, res) => {
  try {
    const { cartItems, totalPrice } = req.body;
    if (!cartItems || !totalPrice || !Array.isArray(cartItems)) {
      return res.status(400).json({ success: false, message: 'Invalid request: cartItems and totalPrice required' });
    }
    const user = await Users.findById(req.user.id).select('name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const purchasedItems = [];
    let calculatedTotalPrice = 0;
    for (const item of cartItems) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({ success: false, message: 'Each item must have productId and quantity' });
      }
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      // Validate size availability
      const size = product.sizes.find((s) => s.size === item.size);
      if (!size || size.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Size ${item.size} not available or insufficient quantity` });
      }
      const itemTotalPrice = product.new_price * item.quantity;
      calculatedTotalPrice += itemTotalPrice;
      const purchasedItem = await PurchasedItem.create({
        user: req.user.id,
        product: item.productId,
        totalPrice: itemTotalPrice * 100,
        quantity: item.quantity,
        size: item.size || 'N/A',
        productImage: product.image,
        paymentMethod: 'khalti',
      });
      purchasedItems.push(purchasedItem);
    }
    if (calculatedTotalPrice !== totalPrice) {
      return res.status(400).json({ success: false, message: 'Total price mismatch' });
    }
    const paymentDetails = {
      amount: totalPrice * 100,
      purchase_order_id: purchasedItems[0]._id.toString(),
      purchase_order_name: 'Cart/Favourite Purchase',
      return_url: `${process.env.BACKEND_URI}/complete-khalti-payment`,
      website_url: process.env.FRONTEND_URL || 'http://localhost:5173',
      customer_info: { name: user.name || 'Customer', email: user.email || 'customer@example.com', phone: '9800000000' },
    };
    const paymentInitiate = await initializeKhaltiPayment(paymentDetails);
    const orderDetails = await Promise.all(
      purchasedItems.map(async (item) => {
        const product = await Product.findById(item.product);
        return { productName: product.name, quantity: item.quantity, size: item.size, totalPrice: item.totalPrice / 100, productImage: item.productImage };
      })
    );
    res.json({ success: true, purchasedItems, payment: paymentInitiate, orderDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error initializing payment', error: error.message });
  }
});

app.get('/complete-khalti-payment', async (req, res) => {
  const { pidx, transaction_id, amount, purchase_order_id, status } = req.query;
  try {
    if (status === 'failed') return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=insufficient_balance`);
    const paymentInfo = await verifyKhaltiPayment(pidx);
    if (paymentInfo.status !== 'Completed' || paymentInfo.transaction_id !== transaction_id || Number(paymentInfo.total_amount) !== Number(amount)) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=verification_failed`);
    }
    const purchasedItem = await PurchasedItem.findById(purchase_order_id);
    if (!purchasedItem || purchasedItem.totalPrice !== Number(amount)) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=purchased_item_not_found_or_amount_mismatch`);
    }

    // Update product size quantity
    const product = await Product.findById(purchasedItem.product);
    if (!product) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=product_not_found`);
    }
    const sizeIndex = product.sizes.findIndex(s => s.size === purchasedItem.size);
    if (sizeIndex === -1) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=size_not_found`);
    }
    const newQuantity = Math.max(0, product.sizes[sizeIndex].quantity - purchasedItem.quantity);
    product.sizes[sizeIndex].quantity = newQuantity;
    await product.save();
    console.log(`Updated product ${product._id} size ${purchasedItem.size} to quantity ${newQuantity}`);

    await PurchasedItem.findByIdAndUpdate(purchase_order_id, { payment: 'completed' });
    const payment = await Payment.create({
      user: purchasedItem.user,
      transactionId: transaction_id,
      pidx,
      purchasedItemId: purchasedItem._id,
      amount: Number(amount),
      productImage: purchasedItem.productImage,
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: req.query,
      paymentGateway: 'khalti',
      status: 'success',
    });
    res.redirect(`${process.env.FRONTEND_URL}/payment-success?transaction_id=${transaction_id}`);
  } catch (error) {
    console.error('Error in complete-khalti-payment:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=server_error`);
  }
});

app.get('/api/payments/:transactionId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ transactionId: req.params.transactionId })
      .populate({ path: 'purchasedItemId', populate: { path: 'product', select: 'name image' } });
    if (!payment) return res.status(400).json({ success: false, message: 'Payment not found' });
    const orderDetails = {
      productName: payment.purchasedItemId.product.name,
      quantity: payment.purchasedItemId.quantity,
      size: payment.purchasedItemId.size,
      totalPrice: payment.amount / 100,
      productImage: payment.productImage,
    };
    res.json({ success: true, payment, orderDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/clearcart', fetchUser, async (req, res) => {
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: {} });
  res.json({ message: 'Cart cleared' });
});

app.post('/clearfavourite', fetchUser, async (req, res) => {
  await Users.findOneAndUpdate({ _id: req.user.id }, { favoriteData: {} });
  res.json({ message: 'Favourites cleared' });
});

app.get('/user/orders', fetchUser, async (req, res) => {
  try {
    const orders = await PurchasedItem.find({ user: req.user.id })
      .populate('product', 'name image');
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/user/reviews', fetchUser, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name image')
      .sort({ date: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/user/review', fetchUser, async (req, res) => {
  const { purchasedItemId, rating, feedback } = req.body;
  try {
    const purchasedItem = await PurchasedItem.findById(purchasedItemId).populate('product');
    if (!purchasedItem) return res.status(400).json({ success: false, message: 'Invalid purchase' });
    const existingReview = await Review.findOne({ user: req.user.id, purchasedItem: purchasedItemId });
    if (existingReview) return res.status(400).json({ success: false, message: 'Review already submitted for this order' });
    const review = new Review({ user: req.user.id, product: purchasedItem.product._id, purchasedItem: purchasedItemId, rating, feedback });
    await review.save();
    res.json({ success: true, message: 'Review submitted successfully', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove product endpoint
app.post('/removeproduct', async (req, res) => {
  try {
    const { id } = req.body;
    const product = await Product.findOneAndDelete({ id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    // Optionally, delete the image file from the server
    const imagePath = path.join(__dirname, 'upload/images', path.basename(product.image));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    console.error('Error removing product:', error);
    res.status(500).json({ success: false, message: 'Error removing product' });
  }
});

// Restock product endpoint
app.post('/restockproduct', async (req, res) => {
  try {
    const { id, sizes } = req.body;
    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Validate sizes
    if (!Array.isArray(sizes) || sizes.length === 0) {
      return res.status(400).json({ success: false, message: 'Sizes array is required' });
    }

    for (const sizeInput of sizes) {
      if (!sizeInput.size || !sizeInput.size.trim()) {
        return res.status(400).json({ success: false, message: 'Size cannot be empty' });
      }
      if (!Number.isInteger(Number(sizeInput.quantity)) || Number(sizeInput.quantity) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a non-negative integer',
        });
      }
    }

    // Update or add sizes
    sizes.forEach(sizeInput => {
      const existingSize = product.sizes.find(s => s.size === sizeInput.size);
      if (existingSize) {
        // Update existing size quantity
        existingSize.quantity = Number(sizeInput.quantity);
      } else {
        // Add new size
        product.sizes.push({
          size: sizeInput.size.trim(),
          quantity: Number(sizeInput.quantity),
        });
      }
    });

    // Remove sizes with quantity 0 (optional)
    product.sizes = product.sizes.filter(s => s.quantity > 0);

    await product.save();
    res.json({ success: true, message: 'Product restocked successfully', product });
  } catch (error) {
    console.error('Error restocking product:', error);
    res.status(500).json({ success: false, message: 'Error restocking product' });
  }
});

app.get('/admin/orders', async (req, res) => {
  try {
    const orders = await PurchasedItem.find()
      .populate('user', 'name email')
      .populate('product', 'name image');
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/admin/update-order-status', async (req, res) => {
  try {
    const { orderId, payment, delivery } = req.body;
    const validPayments = ['pending', 'completed', 'refunded'];
    const validDeliveries = ['pending', 'delivered'];
    if (!validPayments.includes(payment)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }
    if (!validDeliveries.includes(delivery)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery status' });
    }

    const updatedOrder = await PurchasedItem.findByIdAndUpdate(
      orderId,
      { payment, delivery },
      { new: true }
    ).populate('user', 'name email')
     .populate('product', 'name image');
    
    if (!updatedOrder) return res.status(404).json({ success: false, message: 'Order not found' });
    
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/admin/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ status: { $ne: 'Deleted' } })
      .populate('user', 'name email')
      .populate('product', 'name image')
      .sort({ date: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/admin/review/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { status: 'Deleted' }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review marked as deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/admin/review/status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Deleted'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('user', 'name email')
      .populate('product', 'name image');
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/product/:productId/reviews', async (req, res) => {
  try {
    let product;
    if (mongoose.Types.ObjectId.isValid(req.params.productId)) {
      product = await Product.findById(req.params.productId);
    }
    if (!product) {
      product = await Product.findOne({ id: Number(req.params.productId) });
    }
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = await Review.find({ 
      product: product._id, 
      status: 'Approved' 
    })
      .populate('user', 'name')
      .sort({ date: -1 });
    
    console.log(`Fetched ${reviews.length} approved reviews for product ${product._id}`);
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/adminlogin', async (req, res) => {
  const { email, password } = req.body;
  if (email === 'arai03178@gmail.com' && password === 'admin@123') { 
    const token = 'your-jwt-token';
    return res.json({ success: true, token });
  }
  return res.json({ success: false, message: 'Invalid email or password' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));