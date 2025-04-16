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

// Temporary storage for admin OTP (in-memory; use a database in production)
const adminOtps = new Map();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify nodemailer configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Nodemailer config error:', error.message);
  } else {
    console.log('Nodemailer ready to send emails');
  }
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
      .toFormat('jpeg')
      .jpeg({ quality: 80 })
      .toFile(imagePath);
    console.log('Image saved:', imagePath);

    // Generate unique product ID
    const lastProduct = await Product.findOne().sort({ id: -1 }).exec();
    const newId = lastProduct ? lastProduct.id + 1 : 1;

    // Create new product
    const newProduct = new Product({
      id: newId,
      name: name.trim(),
      image: `/images/${filename}`,
      category: category.trim(),
      brand: brand.trim(),
      new_price: price,
      description: description.trim(),
      sizes: parsedSizes.map((size) => ({
        size: size.size.trim(),
        quantity: Number(size.quantity),
      })),
      createdAt: new Date(),
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
    const category = req.query.category;
    let products;

    if (category) {
      products = await Product.find({ category: category }).lean();
    } else {
      products = await Product.find({}).lean();
    }

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
  resetPasswordToken: { type: String }, // New field for password reset OTP
  resetPasswordExpires: { type: Date }, // New field for password reset OTP expiration
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

// Modified /adminlogin endpoint to send OTP
app.post('/adminlogin', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate admin credentials
    if (email !== 'arai03178@gmail.com' || password !== 'admin@123') {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in memory (use a database in production)
    adminOtps.set(email, { otp, expires: otpExpires });

    // Send OTP email to admin email from .env
    const mailOptions = {
      from: `"Sneaker App Admin" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Admin email from .env
      subject: 'Admin Login OTP',
      html: `<p>Your OTP for admin login is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Admin OTP email sent to ${process.env.EMAIL_USER}: ${otp}`);
      res.json({ success: true, message: 'OTP sent to your email. Please verify to continue.' });
    } catch (emailError) {
      console.error('Failed to send admin OTP email:', emailError.message);
      adminOtps.delete(email); // Clean up OTP on failure
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.', error: emailError.message });
    }
  } catch (error) {
    console.error('Error during admin login:', error.message);
    res.status(500).json({ success: false, message: 'Server error during admin login' });
  }
});

// New endpoint to verify admin OTP
app.post('/admin/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    // Check if OTP exists for the email
    const storedOtpData = adminOtps.get(email);
    if (!storedOtpData) {
      return res.status(400).json({ success: false, message: 'No OTP found for this email. Please try logging in again.' });
    }

    // Check if OTP has expired
    if (storedOtpData.expires < Date.now()) {
      adminOtps.delete(email);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please try logging in again.' });
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // OTP is valid; clean up and generate token
    adminOtps.delete(email);
    const token = Jwt.sign({ admin: { email } }, 'secret_ecom', { expiresIn: '1h' });
    res.json({ success: true, token, message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Error verifying admin OTP:', error.message);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
});

// signup endpoint for OTP
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
    const otpExpires = Date.now() + 10 * 60 * 1000;

    // Initialize cart and favorite
    const cartData = {};
    for (let i = 0; i < 300; i++) cartData[i] = 0;
    const favoriteData = {};
    for (let i = 0; i < 300; i++) favoriteData[i] = 0;

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
      from: `"Sneaker App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification OTP',
      html: `<p>Your OTP is: <strong>${otp}</strong>. Please enter this code to verify your account. It will expire in 10 minutes.</p>`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}: ${otp}`);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError.message);
      await Users.deleteOne({ email });
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.', error: emailError.message });
    }

    res.json({ success: true, message: 'OTP sent to your email. Please enter it to verify your account.' });
  } catch (error) {
    console.error('Error during signup:', error.message);
    res.status(500).json({ success: false, message: 'Failed to process signup. Please try again.', error: error.message });
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

// Modified /verify-otp endpoint to complete signup and login
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account already verified.' });
    }
    if (user.verificationToken !== otp || user.verificationTokenExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Generate JWT token for automatic login
    const token = Jwt.sign({ user: { id: user.id } }, 'secret_ecom', { expiresIn: '1h' });

    res.json({ success: true, message: 'Account verified and logged in successfully.', token, name: user.name });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// New endpoint for forgot password OTP
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in user document
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = otpExpires;
    await user.save();

    // Send OTP email
    const mailOptions = {
      from: `"Sneaker App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP',
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong>. Please enter this code to reset your password. It will expire in 10 minutes.</p>`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Password reset OTP sent to ${email}: ${otp}`);
      res.json({ success: true, message: 'OTP sent to your email for password reset.' });
    } catch (emailError) {
      console.error('Failed to send password reset OTP:', emailError.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Error in forgot-password:', error.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// New endpoint to reset password after OTP verification
app.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    // Validate password
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'
      });
    }

    const user = await Users.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear OTP fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Error in reset-password:', error.message);
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

    // Generate token
    const token = Jwt.sign({ user: { id: user.id } }, 'secret_ecom');
    res.json({ success: true, token, name: user.name });
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
    const BASE_URL = process.env.BACKEND_URI || 'http://localhost:5000';
    const products = await Product.aggregate([
      { $match: { category: { $in: ['men', 'women', 'kid'] } } },
      { $sample: { size: 4 } },
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
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Added");
});

app.post('/RemoveCart', async (req, res) => {
  try {
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] > 0) {
      userData.cartData[req.body.itemId] -= 1;
      if (userData.cartData[req.body.itemId] === 0) delete userData.cartData[req.body.itemId];
      await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
      return res.json({ message: 'Item removed', cartData: userData.cartData });
    }

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

// Endpoint for restocking product by admin
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

    sizes.forEach(sizeInput => {
      const existingSize = product.sizes.find(s => s.size === sizeInput.size);
      if (existingSize) {
        existingSize.quantity = Number(sizeInput.quantity);
      } else {
        product.sizes.push({
          size: sizeInput.size.trim(),
          quantity: Number(sizeInput.quantity),
        });
      }
    });

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));