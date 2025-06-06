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

// Drop unique index on name and create compound index
const setupIndexes = async () => {
  try {
    // Drop the existing unique index on name if it exists
    await Product.collection.dropIndex('name_1');
    console.log('Dropped unique index on name field');

    // Create a compound index on name and category
    await Product.collection.createIndex(
      { name: 1, category: 1 },
      { unique: true }
    );
    console.log('Created compound index on name and category');
  } catch (error) {
    console.log('Index setup completed:', error.message);
  }
};

// Call setupIndexes when connecting to database
connectDB().then(() => {
  setupIndexes();
});

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
// Serve profile images
app.use('/profiles', express.static(path.join(__dirname, 'upload/profiles')));

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

// Configure multer for user profile image uploads
const userProfileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './upload/profiles';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const userProfileUpload = multer({
  storage: userProfileStorage,
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
}).single('profileImage');

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

    // Check if product with same name exists in the same category
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }, // Case-insensitive match
      category: category.trim()
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'A product with this name already exists in this category. Please use a different name or select a different category.'
      });
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

    // Save image to disk with a unique filename
    const filename = `product_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`;
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
    const category = req.query.category; // Get the category query parameter
    let products;

    // Fetch products with optional category filter
    if (category) {
      products = await Product.find({ category: category }).lean();
    } else {
      products = await Product.find({}).lean();
    }

    // Map products to include the full image URL
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
  cartData: { type: Object, default: {} },
  favoriteData: { type: Object, default: {} },
  date: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  profileImage: { type: String },
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

app.put('/user/update', fetchUser, (req, res) => {
  userProfileUpload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { name, phone, address } = req.body;
      const updateData = { name, phone, address };

      // If a new profile image was uploaded, add it to the update data
      if (req.file) {
        // Update the image URL to include the full server URL
        updateData.profileImage = `http://localhost:5000/profiles/${req.file.filename}`;
      }

      const updatedUser = await Users.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, select: '-password -cartData -favoriteData -verificationToken' }
      );

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Format the response to include the full image URL
      const userResponse = {
        ...updatedUser.toObject(),
        profileImage: updatedUser.profileImage
      };

      res.json({ 
        success: true, 
        user: userResponse, 
        message: 'User details updated successfully' 
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
});

// Modified /signup endpoint for OTP
app.post('/signup', async (req, res) => {
  let { name, email, password, address, phone } = req.body;
  try {
    // Trim inputs
    name = name.trim();
    email = email.trim();
    password = password.trim();
    address = address.trim();
    phone = phone.trim();

    // Validate inputs
    if (!name || !email || !password || !address || !phone) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!/^[a-zA-Z0-9]+@gmail\.com$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Gmail address.' });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must be 10 digits.' });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' });
    }

    // Check if user exists
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Existing user found with same email.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Initialize cart and favorite
    const cartData = {};
    for (let i = 0; i < 300; i++) cartData[i] = 0;
    const favoriteData = {};

    // Create user
    const newUser = new Users({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
      cartData,
      favoriteData,
      isVerified: false,
      verificationToken: otp,
      verificationTokenExpires: otpExpires
    });
    await newUser.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Verification OTP',
      html: `<p>Your OTP is: <strong>${otp}</strong>. Please enter this code to verify your account.</p>`
    };
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'OTP sent to your email. Please enter it to verify your account.' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
});

// Original /verify-email endpoint (kept for backward compatibility)
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

// Modified /resend-verification endpoint for OTP
app.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified.' });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;
    user.verificationToken = otp;
    user.verificationTokenExpires = otpExpires;
    await user.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Resend: Your Verification OTP',
      html: `<p>Your new OTP is: <strong>${otp}</strong>. Please enter this code to verify your account.</p>`
    };
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'New OTP sent to your email.' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
});

// Modified /verify-otp endpoint to handle both email verification and password reset
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    // Check if this is a password reset OTP or email verification OTP
    if (user.verificationToken !== otp || user.verificationTokenExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    
    // For password reset, we don't mark the user as verified yet
    // We just verify the OTP and let the frontend handle the transition to reset password
    if (user.isVerified) {
      // This is a password reset OTP
      res.json({ success: true, message: 'OTP verified successfully. Please reset your password.' });
    } else {
      // This is an email verification OTP
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();
      res.json({ success: true, message: 'Email verified successfully.' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
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
      return res.status(400).json({ success: false, errors: 'Email not verified. Please check your email for the OTP.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, errors: 'Wrong Password' });
    }

    // Generate token with 2hrs expiration
    const token = Jwt.sign({ user: { id: user.id } }, 'secret_ecom', { expiresIn: '1h' });
    res.json({ success: true, token, expiresIn: 7200 }); // Send expiration time in seconds
  } catch (error) {
    console.error('Login error:', error.stack);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Add new endpoint to check session validity
app.get('/check-session', fetchUser, async (req, res) => {
  try {
    // If fetchUser middleware passes, the token is valid
    res.json({ success: true, message: 'Session is valid' });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Session expired' });
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
    const BASE_URL = process.env.BACKEND_URI || 'http://localhost:5000';
    const products = await Product.aggregate([
      { $match: { category: { $in: ['men', 'women', 'kid'] } } },
      { $sample: { size: 8 } },
    ]);

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
  try {
    let userData = await Users.findOne({ _id: req.user.id });
    const { itemId, size } = req.body;
    
    // Initialize the cart item if it doesn't exist
    if (!userData.cartData[itemId]) {
      userData.cartData[itemId] = { quantity: 0, size: 'N/A' };
    }
    
    // Update the quantity and size
    userData.cartData[itemId].quantity += 1;
    if (size) {
      userData.cartData[itemId].size = size;
    }
    
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.json({ message: 'Added to Cart', cartData: userData.cartData });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/RemoveCart', fetchUser, async (req, res) => {
  try {
    let userData = await Users.findOne({ _id: req.user.id });
    const { itemId } = req.body;
    
    if (!userData.cartData[itemId]) {
      return res.status(400).json({ error: 'Item not found in cart' });
    }

    // Remove the item completely from cart
    delete userData.cartData[itemId];
    
    await Users.findOneAndUpdate(
      { _id: req.user.id }, 
      { cartData: userData.cartData }
    );
    
    res.json({ success: true, message: 'Item removed from cart', cartData: userData.cartData });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.post('/RemoveFavourite', fetchUser, async (req, res) => {
  try {
    let userData = await Users.findOne({ _id: req.user.id });
    const { itemId } = req.body;
    
    if (!userData.favoriteData[itemId]) {
      return res.status(400).json({ error: 'Item not found in favorites' });
    }

    // Remove the item completely from favorites
    delete userData.favoriteData[itemId];
    
    await Users.findOneAndUpdate(
      { _id: req.user.id }, 
      { favoriteData: userData.favoriteData }
    );
    
    res.json({ success: true, message: 'Item removed from favorites', favoriteData: userData.favoriteData });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.post('/getfavourite', fetchUser, async (req, res) => {
  try {
    const userData = await Users.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json(userData.favoriteData);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/initialize-khalti', fetchUser, async (req, res) => {
  try {
    const { cartItems, totalPrice, paymentMethod } = req.body;
    console.log('Processing payment:', { cartItems, totalPrice, paymentMethod });

    if (!cartItems || !totalPrice || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid request: cartItems and totalPrice required' });
    }
    const user = await Users.findById(req.user.id).select('name email phone');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const purchasedItems = [];
    let calculatedTotalPrice = 0;

    for (const item of cartItems) {
      if (!item.productId || !item.quantity || !item.size) {
        return res.status(400).json({ success: false, message: 'Each item must have productId, quantity, and size' });
      }
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });

      const size = product.sizes.find((s) => s.size === item.size);
      if (!size || size.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Size ${item.size} not available or insufficient quantity for product ${product.name}` });
      }

      const itemTotalPrice = product.new_price * item.quantity;
      calculatedTotalPrice += itemTotalPrice;

      const purchasedItem = await PurchasedItem.create({
        user: req.user.id,
        product: item.productId,
        totalPrice: itemTotalPrice * 100, // Store in paisa
        quantity: item.quantity,
        size: item.size,
        productImage: product.image,
        paymentMethod: paymentMethod || 'khalti',
      });
      purchasedItems.push(purchasedItem);

      // Update product stock
      const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
      product.sizes[sizeIndex].quantity = Math.max(0, product.sizes[sizeIndex].quantity - item.quantity);
      await product.save();
    }

    if (Math.abs(calculatedTotalPrice - totalPrice) > 0.01) {
      return res.status(400).json({ success: false, message: 'Total price mismatch' });
    }

    const transactionId = `ORDER-${Date.now()}-${purchasedItems[0]._id}`;
    const orderDetails = await Promise.all(
      purchasedItems.map(async (item) => {
        const product = await Product.findById(item.product);
        return {
          productName: product.name,
          quantity: item.quantity,
          size: item.size,
          totalPrice: item.totalPrice / 100,
          productImage: item.productImage,
        };
      })
    );

    if (paymentMethod === 'COD') {
      await PurchasedItem.updateMany(
        { _id: { $in: purchasedItems.map(p => p._id) } },
        { payment: 'completed' }
      );
    
      // Generate codTransactionId once
      const timestamp = Date.now();
      const codTransactionId = `COD-${timestamp}-${purchasedItems[0]._id}`;
      
      const paymentPromises = purchasedItems.map(async (item) => {
        const product = await Product.findById(item.product);
        return Payment.create({
          user: item.user,
          transactionId: codTransactionId,
          pidx: `COD-${timestamp}-${item._id}`,
          product: item.product,
          productName: product.name,
          quantity: item.quantity,
          size: item.size,
          amount: item.totalPrice,
          productImage: item.productImage,
          purchasedItemId: item._id,
          paymentGateway: 'COD',
          status: 'success',
          paymentDate: new Date(),
        });
      });
    
      const payments = await Promise.all(paymentPromises);
    
      // Send order confirmation email for COD
      if (user.email) {
        const orderDetailsForEmail = [];
        const attachments = [];

        for (let i = 0; i < purchasedItems.length; i++) {
          const item = purchasedItems[i];
          const product = await Product.findById(item.product);
          const imagePath = item.productImage.startsWith('/')
            ? path.join(__dirname, 'upload/images', path.basename(item.productImage))
            : item.productImage;

          let imageData;
          try {
            imageData = fs.readFileSync(imagePath);
          } catch (err) {
            console.error(`Failed to read image for product ${product.name}:`, err);
            imageData = null;
          }

          const cid = `product_${i}_${Date.now()}`;
          orderDetailsForEmail.push({
            productName: product.name,
            quantity: item.quantity,
            size: item.size,
            totalPrice: (item.totalPrice / 100).toFixed(2),
            imageCid: imageData ? cid : null,
          });

          if (imageData) {
            attachments.push({
              filename: path.basename(imagePath),
              content: imageData,
              cid: cid,
            });
          }
        }

        const totalAmount = orderDetailsForEmail.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Your Order Confirmation - Cash on Delivery',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Order Confirmation</h2>
              <p>Dear ${user.name || 'Customer'},</p>
              <p>Thank you for your purchase! Your order has been successfully placed via Cash on Delivery. Below are the details of your order:</p>
              <h3 style="color: #333;">Order Details</h3>
              <p><strong>Transaction ID:</strong> ${codTransactionId}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    <th style="padding: 10px; border: 1px solid #ddd;">Product</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Image</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Quantity</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Size</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Price (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderDetailsForEmail.map(item => `
                    <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;">${item.productName}</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">
                        ${item.imageCid
                          ? `<img src="cid:${item.imageCid}" alt="${item.productName}" style="width: 50px; height: auto;" />`
                          : 'No image available'}
                      </td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${item.quantity}</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${item.size}</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${item.totalPrice}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <p><strong>Total Amount:</strong> Rs. ${totalAmount}</p>
              <p>You have chosen Cash on Delivery. Please ensure the amount is ready when the order is delivered.</p>
              <p>Your order will be processed soon, and you will receive updates on the delivery status.</p>
              <p>If you have any questions, please contact our support team.</p>
              <p>Thank you for shopping with us!</p>
              <p style="color: #777;">Best regards,<br>Sneaker.Np</p>
            </div>
          `,
          attachments: attachments,
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`COD order confirmation email sent to ${user.email} with ${attachments.length} image(s) attached`);
        } catch (emailError) {
          console.error('Error sending COD order confirmation email:', emailError);
        }
      }

      const redirectUrl = `${process.env.FRONTEND_URL}/payment-success?transaction_id=${codTransactionId}`;
    
      return res.json({
        success: true,
        purchasedItems,
        transaction_id: codTransactionId,
        orderDetails,
        redirect_url: redirectUrl,
      });
    }
    
    const paymentDetails = {
      amount: totalPrice * 100, // Convert to paisa
      purchase_order_id: purchasedItems[0]._id.toString(),
      purchase_order_name: 'Cart Purchase',
      return_url: `${process.env.BACKEND_URI}/complete-khalti-payment`,
      website_url: process.env.FRONTEND_URL || 'http://localhost:5173',
      customer_info: {
        name: user.name || 'Customer',
        email: user.email || 'customer@example.com',
        phone: user.phone || '9800000000', // Use actual user phone number with fallback
      },
    };
    console.log('Khalti paymentDetails:', paymentDetails);

    const paymentInitiate = await initializeKhaltiPayment(paymentDetails);
    if (!paymentInitiate.payment_url) {
      throw new Error('Khalti payment initialization failed: No payment URL returned');
    }

    res.json({ success: true, purchasedItems, payment: paymentInitiate, orderDetails });
  } catch (error) {
    console.error('Error initializing Khalti payment:', error);
    res.status(500).json({ success: false, message: 'Error initializing payment', error: error.message });
  }
});

app.get('/complete-khalti-payment', async (req, res) => {
    const { pidx, transaction_id, amount, purchase_order_id, status } = req.query;
    
    try {
        if (status === 'failed') {
            const failureRedirectUrl = `${process.env.FRONTEND_URL}/payment-failure?reason=insufficient_balance`;
            return res.redirect(failureRedirectUrl);
        }

        // Verify Khalti payment
        const paymentInfo = await verifyKhaltiPayment(pidx);
        
        if (paymentInfo.status !== 'Completed' || paymentInfo.transaction_id !== transaction_id || Number(paymentInfo.total_amount) !== Number(amount)) {
            const failureRedirectUrl = `${process.env.FRONTEND_URL}/payment-failure?reason=verification_failed`;
            return res.redirect(failureRedirectUrl);
        }

        // Find the purchased item
        const purchasedItem = await PurchasedItem.findById(purchase_order_id);
        if (!purchasedItem || purchasedItem.totalPrice !== Number(amount)) {
            const failureRedirectUrl = `${process.env.FRONTEND_URL}/payment-failure?reason=purchased_item_not_found_or_amount_mismatch`;
            return res.redirect(failureRedirectUrl);
        }

        // Update product stock
        const product = await Product.findById(purchasedItem.product);
        if (!product) {
            const failureRedirectUrl = `${process.env.FRONTEND_URL}/payment-failure?reason=product_not_found`;
            return res.redirect(failureRedirectUrl);
        }

        const sizeIndex = product.sizes.findIndex(s => s.size === purchasedItem.size);
        if (sizeIndex === -1) {
            const failureRedirectUrl = `${process.env.FRONTEND_URL}/payment-failure?reason=size_not_found`;
            return res.redirect(failureRedirectUrl);
        }

        // Update product quantity
        const newQuantity = Math.max(0, product.sizes[sizeIndex].quantity - purchasedItem.quantity);
        product.sizes[sizeIndex].quantity = newQuantity;
        await product.save();

        // Mark purchase as completed
        await PurchasedItem.findByIdAndUpdate(purchase_order_id, { payment: 'completed' });

        // Create payment record
        const payment = await Payment.create({
            user: purchasedItem.user,
            transactionId: transaction_id,
            pidx,
            product: purchasedItem.product,
            productName: product.name,
            quantity: purchasedItem.quantity,
            size: purchasedItem.size,
            amount: Number(amount),
            productImage: purchasedItem.productImage,
            purchasedItemId: purchasedItem._id,
            dataFromVerificationReq: paymentInfo,
            apiQueryFromUser: req.query,
            paymentGateway: 'khalti',
            status: 'success',
        });

        // Send confirmation email
        const user = await Users.findById(purchasedItem.user).select('name email');
        if (user) {
            const imagePath = purchasedItem.productImage.startsWith('/')
                ? path.join(__dirname, 'upload/images', path.basename(purchasedItem.productImage))
                : purchasedItem.productImage;

            let imageData;
            try {
                imageData = fs.readFileSync(imagePath);
            } catch (err) {
                console.error('Error reading product image:', err);
                imageData = null;
            }

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Your Order Confirmation',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #333;">Order Confirmation</h2>
                        <p>Dear ${user.name},</p>
                        <p>Thank you for your purchase! Your order has been successfully placed. Below are the details of your order:</p>
                        
                        <h3 style="color: #333;">Order Details</h3>
                        <p><strong>Transaction ID:</strong> ${transaction_id}</p>
                        <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0;">
                            <img src="cid:productImage" alt="${product.name}" style="max-width: 200px; height: auto; margin-bottom: 15px; display: block;" />
                            <p><strong>Product:</strong> ${product.name}</p>
                            <p><strong>Quantity:</strong> ${purchasedItem.quantity}</p>
                            <p><strong>Size:</strong> ${purchasedItem.size}</p>
                            <p><strong>Total Amount:</strong> Rs. ${purchasedItem.totalPrice / 100}</p>
                        </div>

                        <p>Your order will be processed soon, and you will receive updates on the delivery status.</p>
                        <p>If you have any questions, please contact our support team.</p>
                        
                        <p style="color: #777;">Best regards,<br>Sneaker.Np Team</p>
                    </div>
                `,
                attachments: imageData ? [{
                    filename: path.basename(imagePath),
                    content: imageData,
                    cid: 'productImage'
                }] : []
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`Order confirmation email sent to ${user.email}`);
            } catch (emailError) {
                console.error('Error sending order confirmation email:', emailError);
            }
        }

        // Redirect to success page
        const successRedirectUrl = `${process.env.FRONTEND_URL}/payment-success?transaction_id=${transaction_id}`;
        return res.redirect(successRedirectUrl);
    } catch (error) {
        console.error('Error in complete-khalti-payment:', error);
        const failureRedirectUrl = `${process.env.FRONTEND_URL}/payment-failure?reason=server_error`;
        return res.redirect(failureRedirectUrl);
    }
});

app.get('/api/payments/:transactionId', async (req, res) => {
  try {
    const payments = await Payment.find({ transactionId: req.params.transactionId })
      .populate({ path: 'purchasedItemId', populate: { path: 'product', select: 'name image' } });

    if (!payments || payments.length === 0) {
      return res.status(400).json({ success: false, message: 'No payments found' });
    }

    const BASE_URL = process.env.BACKEND_URI || 'http://localhost:5000';

    const orderDetails = payments.map(payment => ({
      productName: payment.purchasedItemId?.product?.name || 'N/A',
      quantity: payment.purchasedItemId?.quantity || 0,
      size: payment.purchasedItemId?.size || 'N/A',
      totalPrice: payment.amount / 100,
      productImage: payment.productImage?.startsWith('http')
        ? payment.productImage
        : `${BASE_URL}${payment.productImage}`,
      paymentDate: payment.paymentDate || payment.createdAt,
    }));

    res.json({ success: true, orderDetails });
  } catch (error) {
    console.error('Error fetching payment details:', error);
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
    const BASE_URL = process.env.BACKEND_URI || 'http://localhost:5000';
    const orders = await PurchasedItem.find({ user: req.user.id })
      .populate('product', 'name image')
      .lean(); // Use lean() for better performance and to allow modification

    // Map orders to include full image URL
    const ordersWithFullUrls = orders.map((order) => ({
      ...order,
      product: {
        ...order.product,
        image: order.product.image.startsWith('http')
          ? order.product.image
          : `${BASE_URL}${order.product.image}`,
      },
    }));

    res.json({ success: true, orders: ordersWithFullUrls });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/user/reviews', fetchUser, async (req, res) => {
  try {
    const BASE_URL = process.env.BACKEND_URI || 'http://localhost:5000';
    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name image')
      .sort({ date: -1 })
      .lean(); // Use lean() for better performance and to allow modification

    // Map reviews to include full image URL
    const reviewsWithFullUrls = reviews.map((review) => ({
      ...review,
      product: {
        ...review.product,
        image: review.product.image.startsWith('http')
          ? review.product.image
          : `${BASE_URL}${review.product.image}`,
      },
    }));

    res.json({ success: true, reviews: reviewsWithFullUrls });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
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
    console.error('Error submitting review:', error);
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

//endpoint for restocking product by admin
app.post('/restockproduct', async (req, res) => {
  try {
    const { id, sizes } = req.body;
    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

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

    // Check each size input
    for (const sizeInput of sizes) {
      const existingSize = product.sizes.find(s => s.size === sizeInput.size);
      
      if (existingSize) {
        if (existingSize.quantity > 0) {
          return res.status(400).json({
            success: false,
            message: `Size ${sizeInput.size} already exists with quantity ${existingSize.quantity}. Please remove the existing size first or update it.`
          });
        } else if (existingSize.quantity === 0) {
          // Replace the size with quantity 0
          existingSize.quantity = Number(sizeInput.quantity);
        }
      } else {
        // Add new size
        product.sizes.push({
          size: sizeInput.size.trim(),
          quantity: Number(sizeInput.quantity),
        });
      }
    }

    // Remove any sizes with quantity 0
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
    const { page = 1, filter = 'all', status = 'pending' } = req.query;
    const limit = 10; // Increased from 5 to 10 for better pagination
    const skip = (page - 1) * limit;

    let dateFilter = {};
    if (filter === 'today') {
      dateFilter = {
        purchaseDate: { $gte: new Date().setHours(0, 0, 0, 0) }
      };
    } else if (filter === 'week') {
      dateFilter = {
        purchaseDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      };
    } else if (filter === 'month') {
      dateFilter = {
        purchaseDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      };
    }

    // Add delivery status filter
    const deliveryFilter = status === 'delivered' ? 
      { delivery: 'delivered' } : 
      { delivery: { $ne: 'delivered' } };

    const orders = await PurchasedItem.find({
      ...dateFilter,
      ...deliveryFilter
    })
      .populate('user', 'name email address')
      .populate('product', 'name image')
      .skip(skip)
      .limit(limit)
      .sort({ purchaseDate: -1 })
      .lean();

    // Format productImage to include base URL if necessary
    const formattedOrders = orders.map(order => ({
      ...order,
      productImage: order.productImage
        ? order.productImage.startsWith('http')
          ? order.productImage
          : `${process.env.BASE_URL || 'http://localhost:5000'}${order.productImage}`
        : null
    }));

    const totalOrders = await PurchasedItem.countDocuments({
      ...dateFilter,
      ...deliveryFilter
    });
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({ success: true, orders: formattedOrders, totalPages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.put('/admin/update-order-status', async (req, res) => {
  try {
    const { orderId, payment, delivery } = req.body;
    const validPayments = ['pending', 'completed', 'refunded'];
    const validDeliveries = ['pending', 'processing', 'shipped', 'delivered'];

    if (payment && !validPayments.includes(payment)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }
    if (delivery && !validDeliveries.includes(delivery)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery status' });
    }

    const order = await PurchasedItem.findById(orderId)
      .populate('user', 'name email')
      .populate('product', 'name image');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update order status
    if (payment) order.payment = payment;
    if (delivery) order.delivery = delivery;
    await order.save();

    // Send email notification if delivery status is changed to 'delivered'
    if (delivery === 'delivered' && order.user && order.user.email) {
      // Get the product image path
      const imagePath = order.productImage.startsWith('/')
        ? path.join(__dirname, 'upload/images', path.basename(order.productImage))
        : order.productImage;

      let imageData;
      try {
        imageData = fs.readFileSync(imagePath);
      } catch (err) {
        console.error('Error reading product image:', err);
        imageData = null;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: order.user.email,
        subject: 'Your Order has been Delivered!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Order Update</h2>
            <p>Dear ${order.user.name},</p>
            <p>Great news! Your order has been delivered successfully.</p>
            
            <h3 style="color: #333;">Order Details</h3>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <img src="cid:productImage" alt="${order.product.name}" style="max-width: 200px; height: auto; margin-bottom: 15px; display: block;" />
              <p><strong>Product:</strong> ${order.product.name}</p>
              <p><strong>Quantity:</strong> ${order.quantity}</p>
              <p><strong>Size:</strong> ${order.size}</p>
              <p><strong>Total Amount:</strong> Rs. ${order.totalPrice / 100}</p>
            </div>

            <p>We hope you enjoy your purchase! If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p style="color: #777;">Best regards,<br>Sneaker.Np Team</p>
          </div>
        `,
        attachments: imageData ? [{
          filename: path.basename(imagePath),
          content: imageData,
          cid: 'productImage'
        }] : []
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Delivery notification email sent to ${order.user.email}`);
      } catch (emailError) {
        console.error('Error sending delivery notification email:', emailError);
      }
    }

    // Format the response
    const formattedOrder = {
      ...order.toObject(),
      productImage: order.productImage
        ? order.productImage.startsWith('http')
          ? order.productImage
          : `${process.env.BASE_URL || 'http://localhost:5000'}${order.productImage}`
        : null
    };

    res.json({ success: true, order: formattedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Review-related endpoints
app.get('/admin/reviews', async (req, res) => {
  try {
    const { page = 1, filter = 'all' } = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;

    let dateFilter = {};
    const now = new Date();

    if (filter === 'today') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter = {
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      };
    } else if (filter === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      dateFilter = {
        date: { $gte: startOfWeek },
      };
    } else if (filter === 'month') {
      const startOfMonth = new Date(now);
      startOfMonth.setMonth(now.getMonth() - 1);
      dateFilter = {
        date: { $gte: startOfMonth },
      };
    }

    const BASE_URL = process.env.BACKEND_URI || 'http://localhost:5000';
    const reviews = await Review.find({
      status: { $ne: 'Deleted' },
      ...dateFilter,
    })
      .populate('user', 'name email')
      .populate('product', 'name image')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Review.countDocuments({
      status: { $ne: 'Deleted' },
      ...dateFilter,
    });

    // Transform reviews to ensure full image URL
    const formattedReviews = reviews.map(review => ({
      ...review,
      product: {
        ...review.product,
        image: review.product.image.startsWith('http')
          ? review.product.image
          : `${BASE_URL}${review.product.image}`,
      },
    }));

    res.json({
      success: true,
      reviews: formattedReviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/admin/review/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: 'Deleted' },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review marked as deleted' });
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
      status: { $ne: 'Deleted' }
    })
      .populate('user', 'name profileImage')
      .select('rating feedback adminFeedback date user')
      .sort({ date: -1 })
      .lean();

    console.log('Reviews found:', reviews);

    const BASE_URL = process.env.BACKEND_URI || 'http://localhost:5000';
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      user: {
        ...review.user,
        profileImage: review.user.profileImage ? 
          (review.user.profileImage.startsWith('http') ? 
            review.user.profileImage : 
            `${BASE_URL}${review.user.profileImage}`) : 
          null
      },
      rating: review.rating,
      feedback: review.feedback,
      adminFeedback: review.adminFeedback,
      date: review.date,
    }));

    res.json({ success: true, reviews: formattedReviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin schema for OTP storage
const AdminSession = mongoose.model('AdminSession', new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String },
  otpExpires: { type: Date },
  createdAt: { type: Date, default: Date.now, expires: '1h' } // Auto-delete after 1 hour
}));

// Admin login endpoint
app.post('/adminlogin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Admin login attempt:', { email }); // Debug request

    // Validate input
    if (!email || !password) {
      console.log('Validation failed: Missing email or password');
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Check if email matches .env
    if (email !== process.env.EMAIL_USER) {
      console.log('Validation failed: Invalid email');
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    // Check password
    const isPasswordValid = password === process.env.ADMIN_PASSWORD;
    if (!isPasswordValid) {
      console.log('Validation failed: Invalid password');
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    // Store OTP
    await AdminSession.findOneAndUpdate(
      { email },
      { email, otp, otpExpires },
      { upsert: true, new: true }
    );

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Admin Login OTP',
      html: `<p>Your OTP for admin login is: <strong>${otp}</strong>. This code expires in 10 minutes.</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP sent to:', email);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// OTP verification endpoint
app.post('/admin/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Find admin session
    const session = await AdminSession.findOne({ email });
    if (!session) {
      return res.status(400).json({ success: false, message: 'No active session found' });
    }

    // Verify OTP and expiration
    if (session.otp !== otp || session.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Generate JWT token
    const token = Jwt.sign({ admin: { email } }, 'secret_ecom', { expiresIn: '3h' });

    // Clean up session
    await AdminSession.deleteOne({ email });

    res.json({ success: true, token, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Middleware to protect admin routes
const verifyAdmin = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied: No token provided' });
  }

  try {
    const verified = Jwt.verify(token, 'secret_ecom');
    if (!verified.admin) {
      return res.status(401).json({ success: false, message: 'Not authorized as admin' });
    }
    req.admin = verified.admin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Example protected admin route
app.get('/admin/protected', verifyAdmin, (req, res) => {
  res.json({ success: true, message: 'Welcome to the admin dashboard' });
});

// Add admin feedback endpoint
app.put('/admin/review/:id/feedback', verifyAdmin, async (req, res) => {
  try {
    const { adminFeedback } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { adminFeedback },
      { new: true }
    ).populate('user', 'name email')
      .populate('product', 'name image');

    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/admin/transactions', async (req, res) => {
  try {
    const { page = 1, filter = 'all' } = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;

    let dateFilter = {};
    const now = new Date();

    if (filter === 'today') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter = {
        paymentDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      };
    } else if (filter === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      dateFilter = {
        paymentDate: { $gte: startOfWeek },
      };
    } else if (filter === 'month') {
      const startOfMonth = new Date(now);
      startOfMonth.setMonth(now.getMonth() - 1);
      dateFilter = {
        paymentDate: { $gte: startOfMonth },
      };
    }

    const transactions = await Payment.find(dateFilter)
      .populate('user', 'name email')
      .populate({
        path: 'purchasedItemId',
        populate: {
          path: 'product',
          select: 'name image'
        }
      })
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const BASE_URL = process.env.BACKEND_URI || 'http://localhost:5000';

    // Format the transactions data
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      user: transaction.user,
      product: transaction.purchasedItemId?.product || null,
      productImage: transaction.productImage
        ? transaction.productImage.startsWith('http')
          ? transaction.productImage
          : `${BASE_URL}${transaction.productImage}`
        : null,
      amount: transaction.amount,
      paymentMethod: transaction.paymentGateway,
      status: transaction.status,
      createdAt: transaction.paymentDate,
    }));

    const totalTransactions = await Payment.countDocuments(dateFilter);
    const totalPages = Math.ceil(totalTransactions / limit);

    res.json({
      success: true,
      transactions: formattedTransactions,
      totalPages,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get overview statistics
app.get('/admin/overview', async (req, res) => {
  try {
    // Get total products
    const totalProducts = await Product.countDocuments();

    // Get total earnings (sum of all completed payments)
    const totalEarnings = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get total orders
    const totalOrders = await PurchasedItem.countDocuments();

    // Get total users
    const totalUsers = await Users.countDocuments();

    // Get new users (users created in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await Users.countDocuments({
      date: { $gte: thirtyDaysAgo }
    });

    // Get pending orders count
    const pendingOrders = await PurchasedItem.countDocuments({ delivery: 'pending' });

    // Get monthly sales data
    const monthlySales = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 5 }
    ]);

    // Get yearly sales trend
    const yearlySales = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: { $year: '$paymentDate' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get top selling products with proper population
    const topProducts = await PurchasedItem.aggregate([
      {
        $group: {
          _id: '$product',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get product details for top products
    const productIds = topProducts.map(p => p._id);
    const products = await Product.find({ _id: { $in: productIds } }).select('name');

    // Create a map of product IDs to names
    const productMap = products.reduce((acc, product) => {
      acc[product._id.toString()] = product.name;
      return acc;
    }, {});

    // Format top products with names
    const formattedTopProducts = topProducts.map(product => ({
      name: productMap[product._id.toString()] || 'Unknown Product',
      value: product.count
    }));

    // Get recent transactions
    const recentTransactions = await Payment.find({ status: 'success' })
      .populate('user', 'name email')
      .populate({
        path: 'purchasedItemId',
        populate: {
          path: 'product',
          select: 'name'
        }
      })
      .sort({ paymentDate: -1 })
      .limit(5)
      .lean();

    // Format recent transactions
    const formattedRecentTransactions = recentTransactions.map(transaction => ({
      id: transaction._id,
      user: transaction.user?.name || 'Unknown User',
      product: transaction.purchasedItemId?.product?.name || 'Unknown Product',
      amount: transaction.amount / 100,
      date: transaction.paymentDate
    }));

    res.json({
      success: true,
      data: {
        totalProducts,
        totalEarnings: (totalEarnings[0]?.total || 0) / 100,
        totalOrders,
        totalUsers,
        newUsers,
        pendingOrders,
        monthlySales: monthlySales.map(sale => ({
          name: new Date(sale._id.year, sale._id.month - 1).toLocaleString('default', { month: 'short' }),
          sales: sale.total / 100
        })),
        yearlySales: yearlySales.map(sale => ({
          year: sale._id.toString(),
          total: sale.total / 100
        })),
        topProducts: formattedTopProducts,
        recentTransactions: formattedRecentTransactions
      }
    });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// Forgot password endpoint
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in user document
    user.verificationToken = otp;
    user.verificationTokenExpires = otpExpiry;
    await user.save();

    // Send email with OTP
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <h1>Password Reset Request</h1>
        <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
        <h2>${otp}</h2>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ success: false, message: 'Error sending OTP.' });
  }
});

// Reset password endpoint
app.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify OTP
    if (user.verificationToken !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // Check if OTP has expired
    if (user.verificationTokenExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear verification token
    user.password = hashedPassword;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ success: false, message: 'Error resetting password.' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Add new endpoint to check admin session validity
app.get('/admin/check-session', verifyAdmin, async (req, res) => {
  try {
    // If verifyAdmin middleware passes, the token is valid
    res.json({ success: true, message: 'Session is valid' });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Session expired' });
  }
});

// Endpoint for editing product size
app.post('/editsize', async (req, res) => {
  try {
    const { id, oldSize, newSize, newQuantity } = req.body;
    
    // Validate input
    if (!id || !oldSize || !newSize || newQuantity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: id, oldSize, newSize, and newQuantity are required' 
      });
    }

    // Find the product
    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Find the size to update
    const sizeIndex = product.sizes.findIndex(s => s.size === oldSize);
    if (sizeIndex === -1) {
      return res.status(404).json({ success: false, message: 'Size not found in product' });
    }

    // Check if new size already exists (if changing size)
    if (oldSize !== newSize) {
      const existingSize = product.sizes.find(s => s.size === newSize);
      if (existingSize) {
        return res.status(400).json({ 
          success: false, 
          message: 'A size with this value already exists for this product' 
        });
      }
    }

    // Update the size
    product.sizes[sizeIndex] = {
      size: newSize,
      quantity: Number(newQuantity)
    };

    // Save the changes
    await product.save();

    res.json({ 
      success: true, 
      message: 'Size updated successfully',
      product 
    });
  } catch (error) {
    console.error('Error updating size:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating size: ' + error.message 
    });
  }
});

// Add edit product endpoint
app.post('/editproduct', async (req, res) => {
  try {
    const { id, name, new_price, description, sizes } = req.body;

    // Validate input
    if (!id || !name?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate price
    const price = parseFloat(new_price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });
    }

    // Validate sizes
    if (!Array.isArray(sizes) || sizes.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one size is required' });
    }

    for (const size of sizes) {
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

    // Find and update the product
    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if name is being changed and if it conflicts with another product
    if (name !== product.name) {
      const existingProduct = await Product.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        category: product.category,
        _id: { $ne: product._id }
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'A product with this name already exists in this category'
        });
      }
    }

    // Update product
    product.name = name.trim();
    product.new_price = price;
    product.description = description.trim();
    product.sizes = sizes.map(size => ({
      size: size.size.trim(),
      quantity: Number(size.quantity)
    }));

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        id: product.id,
        name: product.name,
        new_price: product.new_price,
        description: product.description,
        sizes: product.sizes
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Error updating product' });
  }
});

// Add endpoint for removing size
app.post('/removesize', async (req, res) => {
  try {
    const { id, size } = req.body;

    // Validate input
    if (!id || !size) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID and size are required' 
      });
    }

    // Find the product
    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Find the size to remove
    const sizeIndex = product.sizes.findIndex(s => s.size === size);
    if (sizeIndex === -1) {
      return res.status(404).json({ success: false, message: 'Size not found in product' });
    }

    // Remove the size
    product.sizes.splice(sizeIndex, 1);

    // Save the changes
    await product.save();

    res.json({ 
      success: true, 
      message: 'Size removed successfully',
      product 
    });
  } catch (error) {
    console.error('Error removing size:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error removing size: ' + error.message 
    });
  }
});

app.post('/getcart', fetchUser, async (req, res) => {
  try {
    const userData = await Users.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json(userData.cartData);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/AddToFavourite', fetchUser, async (req, res) => {
  try {
    const { itemId, size } = req.body;
    
    // Find user and update favoriteData in one operation
    const updatedUser = await Users.findOneAndUpdate(
      { _id: req.user.id },
      { 
        $set: { 
          [`favoriteData.${itemId}`]: { 
            quantity: 1, 
            size: size || 'N/A' 
          } 
        } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ 
      success: true, 
      favoriteData: updatedUser.favoriteData 
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});