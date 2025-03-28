// index.js
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const Jwt = require('jsonwebtoken');
const { initializeKhaltiPayment, verifyKhaltiPayment } = require('./khalti');
const PurchasedItem = require('./purchasedItemModel');
const Payment = require('./paymentModel');
const Product = require('./models/Product');
const connectDB = require('./connectDB');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Use CORS middleware to enable cross-origin requests
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB using connectDB
connectDB();

// Ensure upload directory exists
const uploadDir = './upload/images';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static images
app.use('/images', express.static(uploadDir));

// Default route
app.get('/', (req, res) => {
  res.send('MERN App is running!');
});

// Image storage engine for multer
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Upload endpoint
app.post('/upload', upload.single('product'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: 0, message: 'No file uploaded' });
  }

  res.json({
    success: 1,
    image_url: `http://localhost:${PORT}/images/${req.file.filename}`,
  });
});

// Add product endpoint
app.post('/addproduct', async (req, res) => {
  try {
    let products = await Product.find({});
    let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

    const newProduct = new Product({
      id: id,
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      brand: req.body.brand,
      new_price: req.body.new_price,
      description: req.body.description,
      quantity: req.body.quantity,
    });

    await newProduct.save();
    res.status(201).json({
      success: 1,
      name: req.body.name,
      message: 'Product added successfully',
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: 0,
      message: 'Error adding product',
      error: error.message,
    });
  }
});

// Delete product endpoint
app.post('/removeproduct', async (req, res) => {
  try {
    const removedProduct = await Product.findOneAndDelete({ id: req.body.id });
    if (!removedProduct) {
      return res.status(404).json({ success: 0, message: 'Product not found' });
    }
    console.log("Removed");
    res.json({
      success: true,
      name: req.body.name,
      message: 'Product removed successfully',
      product: removedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message,
    });
  }
});

// Get all products endpoint
app.get('/allproducts', async (req, res) => {
  try {
    let products = await Product.find({});
    console.log("All Products");
    res.send(products);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Users Schema and Model
const Users = mongoose.model(
  'Users',
  new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String, unique: true },
    cartData: { type: Object },
    favoriteData: { type: Object },
    date: { type: Date, default: Date.now },
  })
);

// Create endpoint for registering a user
app.post('/signup', async (req, res) => {
  try {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
      return res
        .status(400)
        .json({ success: false, errors: 'Existing user found with same email' });
    }

    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i] = 0;
    }
    let favorite = {};
    for (let i = 0; i < 300; i++) {
      favorite[i] = 0;
    }

    const user = new Users({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      cartData: cart,
      favoriteData: favorite,
    });

    await user.save();
    const data = {
      user: { id: user.id },
    };
    const token = Jwt.sign(data, 'secret_ecom');
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint for user login
app.post('/login', async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = {
        user: { id: user.id },
      };
      const token = Jwt.sign(data, 'secret_ecom');
      res.json({ success: true, token });
    } else {
      res.json({ success: false, errors: "Wrong Passwords" });
    }
  } else {
    res.json({ success: false, errors: "Wrong Email Id" });
  }
});

// Middleware to verify JWT token
const fetchUser = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ success: false, message: 'Access Denied: No token provided' });
  }

  try {
    const data = Jwt.verify(token, 'secret_ecom');
    req.user = data.user;
    console.log('JWT Token Verified:', data);
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    res.status(401).json({ success: false, message: 'Invalid Token' });
  }
};

// Fetch user name using JWT token
app.get('/getusername', fetchUser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id).select('name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, name: user.name });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// New collection endpoint for newcollection data
app.get('/newcollections', async (req, res) => {
  try {
    const newCollection = await Product.aggregate([
      { $sample: { size: 8 } },
    ]);

    console.log("New Collection Fetched");
    res.json(newCollection);
  } catch (error) {
    console.error("Error fetching new collections:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Popular endpoint
app.get("/popular", async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $match: { category: { $in: ["men", "women", "kid"] } } },
      { $sample: { size: 4 } },
    ]);

    console.log("Random popular products fetched");
    res.json(products);
  } catch (error) {
    console.error("Error fetching popular products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Middleware to fetch user (alternative version)
const fetchuser = async (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    res.status(401).send({ errors: "Please authenticate using valid token" });
  } else {
    try {
      const data = Jwt.verify(token, 'secret_ecom');
      req.user = data.user;
      next();
    } catch (error) {
      res.status(401).send({ errors: "Please authenticate using valid token" });
    }
  }
};

// Endpoint for adding products to cart
app.post('/AddToCart', fetchuser, async (req, res) => {
  console.log("added", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Added");
});

// Endpoint for removing products from cart
app.post('/RemoveCart', fetchuser, async (req, res) => {
  try {
    console.log("Removed:", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] && userData.cartData[req.body.itemId] > 0) {
      userData.cartData[req.body.itemId] -= 1;
      if (userData.cartData[req.body.itemId] === 0) {
        delete userData.cartData[req.body.itemId];
      }
      await Users.findOneAndUpdate(
        { _id: req.user.id },
        { cartData: userData.cartData },
        { new: true }
      );

      return res.json({ message: "Item removed", cartData: userData.cartData });
    } else {
      return res.status(400).json({ error: "Item not found in cart or already at 0" });
    }
  } catch (error) {
    console.error("Error in RemoveCart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to get cart data
app.post('/getcart', fetchuser, async (req, res) => {
  console.log("GetCart");
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

// Endpoint for adding products to favourites
app.post('/AddToFavourite', fetchuser, async (req, res) => {
  try {
    console.log("Added to Favourite:", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });

    userData.favoriteData[req.body.itemId] += 1;
    await Users.findOneAndUpdate(
      { _id: req.user.id },
      { favoriteData: userData.favoriteData },
      { new: true }
    );

    res.json({ message: "Added to Favourite", favoriteData: userData.favoriteData });
  } catch (error) {
    console.error("Error adding to favourite:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for removing products from favourites
app.post('/RemoveFavourite', fetchuser, async (req, res) => {
  try {
    console.log("Removed from Favourite:", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });

    if (userData.favoriteData[req.body.itemId] && userData.favoriteData[req.body.itemId] > 0) {
      userData.favoriteData[req.body.itemId] -= 1;
      if (userData.favoriteData[req.body.itemId] === 0) {
        delete userData.favoriteData[req.body.itemId];
      }

      await Users.findOneAndUpdate(
        { _id: req.user.id },
        { favoriteData: userData.favoriteData },
        { new: true }
      );

      return res.json({ message: "Item removed from Favourite", favoriteData: userData.favoriteData });
    } else {
      return res.status(400).json({ error: "Item not found in favourites or already at 0" });
    }
  } catch (error) {
    console.error("Error removing from favourite:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to get favourite data
app.post('/getfavourite', fetchuser, async (req, res) => {
  try {
    console.log("Get Favourite Data");
    let userData = await Users.findOne({ _id: req.user.id });
    res.json(userData.favoriteData);
  } catch (error) {
    console.error("Error fetching favourite data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/initialize-khalti', fetchUser, async (req, res) => {
  try {
    console.log('Received request to /initialize-khalti:', req.body);
    const { productId, totalPrice, quantity, size } = req.body;

    // Validate request body
    if (!productId || !totalPrice || !quantity || !size) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const calculatedTotalPrice = product.new_price * quantity;
    if (calculatedTotalPrice !== totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Total price mismatch',
        expected: calculatedTotalPrice,
        received: totalPrice,
      });
    }

    // Create a purchased item record with productImage
    const purchasedItem = await PurchasedItem.create({
      product: productId,
      totalPrice: totalPrice * 100, // Convert to paisa
      quantity,
      size,
      productImage: product.image, // Copy image from Product
      paymentMethod: 'khalti',
    });

    const user = await Users.findById(req.user.id).select('name email');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const paymentDetails = {
      amount: totalPrice * 100,
      purchase_order_id: purchasedItem._id.toString(),
      purchase_order_name: product.name,
      return_url: `${process.env.BACKEND_URI}/complete-khalti-payment`,
      website_url: process.env.FRONTEND_URL || 'http://localhost:5173',
      customer_info: {
        name: user.name || 'Customer',
        email: user.email || 'customer@example.com',
        phone: '9800000000',
      },
    };

    const paymentInitiate = await initializeKhaltiPayment(paymentDetails);

    // Store order details in localStorage (optional, for fallback)
    const orderDetails = {
      productName: product.name,
      quantity,
      size,
      totalPrice,
      productImage: product.image,
    };
    res.json({
      success: true,
      purchasedItem,
      payment: paymentInitiate,
      orderDetails, // Send to frontend for localStorage
    });
  } catch (error) {
    console.error('Error in /initialize-khalti:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing payment',
      error: error.message,
    });
  }
});

// Verify Khalti Payment
app.get('/complete-khalti-payment', async (req, res) => {
  const { pidx, transaction_id, amount, purchase_order_id, status } = req.query;

  try {
    if (status === 'failed') {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=insufficient_balance`);
    }

    const paymentInfo = await verifyKhaltiPayment(pidx);

    if (
      paymentInfo.status !== 'Completed' ||
      paymentInfo.transaction_id !== transaction_id ||
      Number(paymentInfo.total_amount) !== Number(amount)
    ) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=verification_failed`);
    }

    const purchasedItem = await PurchasedItem.findById(purchase_order_id);
    if (!purchasedItem || purchasedItem.totalPrice !== Number(amount)) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment-failure?reason=purchased_item_not_found_or_amount_mismatch`
      );
    }

    await PurchasedItem.findByIdAndUpdate(purchase_order_id, { status: 'completed' });

    // Create Payment with productImage from PurchasedItem
    const payment = await Payment.create({
      transactionId: transaction_id,
      pidx,
      purchasedItemId: purchasedItem._id,
      amount: Number(amount),
      productImage: purchasedItem.productImage, // Copy from PurchasedItem
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: req.query,
      paymentGateway: 'khalti',
      status: 'success',
    });

    // Store order details in localStorage (optional)
    const orderDetails = {
      productName: (await Product.findById(purchasedItem.product)).name,
      quantity: purchasedItem.quantity,
      size: purchasedItem.size,
      totalPrice: purchasedItem.totalPrice / 100, // Convert back to rupees
      productImage: purchasedItem.productImage,
    };
    // Note: localStorage can't be set server-side; this must be done client-side

    res.redirect(`${process.env.FRONTEND_URL}/payment-success?transaction_id=${transaction_id}`);
  } catch (error) {
    console.error('Error verifying Khalti payment:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=server_error`);
  }
});

// New endpoint to fetch payment details
app.get('/api/payments/:transactionId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ transactionId: req.params.transactionId })
      .populate({
        path: 'purchasedItemId',
        populate: { path: 'product', select: 'name image' },
      });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const orderDetails = {
      productName: payment.purchasedItemId.product.name,
      quantity: payment.purchasedItemId.quantity,
      size: payment.purchasedItemId.size,
      totalPrice: payment.amount / 100, // Convert back to rupees
      productImage: payment.productImage, // Use Payment's productImage
    };

    res.json({ success: true, payment, orderDetails });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));