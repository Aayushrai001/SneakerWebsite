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
const Review = require('./models/Review');
const connectDB = require('./connectDB');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

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

app.use('/images', express.static(uploadDir));

app.get('/', (req, res) => res.send('MERN App is running!'));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

app.post('/upload', upload.single('product'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: 0, message: 'No file uploaded' });
  }
  res.json({ success: 1, image_url: `http://localhost:${PORT}/images/${req.file.filename}` });
});

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
    res.status(201).json({ success: 1, name: req.body.name, message: 'Product added successfully', product: newProduct });
  } catch (error) {
    res.status(500).json({ success: 0, message: 'Error adding product', error: error.message });
  }
});

app.post('/removeproduct', async (req, res) => {
  try {
    const removedProduct = await Product.findOneAndDelete({ id: req.body.id });
    if (!removedProduct) return res.status(404).json({ success: 0, message: 'Product not found' });
    res.json({ success: true, name: req.body.name, message: 'Product removed successfully', product: removedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting product', error: error.message });
  }
});

app.get('/allproducts', async (req, res) => {
  try {
    let products = await Product.find({});
    res.send(products);
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
    const user = await Users.findById(req.user.id).select('-password -cartData -favoriteData');
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
      { new: true, select: '-password -cartData -favoriteData' }
    );
    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: updatedUser, message: 'User details updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/signup', async (req, res) => {
  try {
    let check = await Users.findOne({ email: req.body.email });
    if (check) return res.status(400).json({ success: false, errors: 'Existing user found with same email' });
    let cart = {}; for (let i = 0; i < 300; i++) cart[i] = 0;
    let favorite = {}; for (let i = 0; i < 300; i++) favorite[i] = 0;
    const user = new Users({ name: req.body.name, email: req.body.email, password: req.body.password, cartData: cart, favoriteData: favorite });
    await user.save();
    const token = Jwt.sign({ user: { id: user.id } }, 'secret_ecom');
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/login', async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (user && req.body.password === user.password) {
    const token = Jwt.sign({ user: { id: user.id } }, 'secret_ecom');
    res.json({ success: true, token });
  } else {
    res.json({ success: false, errors: user ? "Wrong Password" : "Wrong Email Id" });
  }
});

app.get('/newcollections', async (req, res) => {
  try {
    const newCollection = await Product.aggregate([{ $sample: { size: 8 } }]);
    res.json(newCollection);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/popular", async (req, res) => {
  try {
    const products = await Product.aggregate([{ $match: { category: { $in: ["men", "women", "kid"] } } }, { $sample: { size: 4 } }]);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post('/AddToCart', fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Added");
});

app.post('/RemoveCart', fetchUser, async (req, res) => {
  try {
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] > 0) {
      userData.cartData[req.body.itemId] -= 1;
      if (userData.cartData[req.body.itemId] === 0) delete userData.cartData[req.body.itemId];
      await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
      return res.json({ message: "Item removed", cartData: userData.cartData });
    }
    res.status(400).json({ error: "Item not found in cart or already at 0" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
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
    res.json({ message: "Added to Favourite", favoriteData: userData.favoriteData });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/RemoveFavourite', fetchUser, async (req, res) => {
  try {
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.favoriteData[req.body.itemId] > 0) {
      userData.favoriteData[req.body.itemId] -= 1;
      if (userData.favoriteData[req.body.itemId] === 0) delete userData.favoriteData[req.body.itemId];
      await Users.findOneAndUpdate({ _id: req.user.id }, { favoriteData: userData.favoriteData });
      return res.json({ message: "Item removed from Favourite", favoriteData: userData.favoriteData });
    }
    res.status(400).json({ error: "Item not found in favourites or already at 0" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
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
    res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=server_error`);
  }
});

app.get('/api/payments/:transactionId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ transactionId: req.params.transactionId })
      .populate({ path: 'purchasedItemId', populate: { path: 'product', select: 'name image' } });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
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
  res.json({ message: "Cart cleared" });
});

app.post('/clearfavourite', fetchUser, async (req, res) => {
  await Users.findOneAndUpdate({ _id: req.user.id }, { favoriteData: {} });
  res.json({ message: "Favourites cleared" });
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

// endpoint to fetch reviews approved by admin
app.get('/product/:productId/reviews', async (req, res) => {
  try {
    let product;
    // Try finding by MongoDB _id first
    if (mongoose.Types.ObjectId.isValid(req.params.productId)) {
      product = await Product.findById(req.params.productId);
    }
    // If not found, try finding by numeric id
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
    
    console.log(`Fetched ${reviews.length} approved reviews for product ${product._id}`); // Debug log
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));