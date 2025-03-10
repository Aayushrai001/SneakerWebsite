// Import dependencies
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Middleware
app.use(express.json());

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

// Image storage engine
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Upload endpoint
app.post('/upload', upload.single('product'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: 0, message: 'No file uploaded' });
  }

  res.json({
    success: 1,
    image_url: `http://localhost:${PORT}/images/${req.file.filename}`
  });
});

// Schema for creating products
const ProductSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true, 
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

const Product = mongoose.model('Product', ProductSchema);

// Add product endpoint
app.post('/addproduct', async (req, res) => {
  try {
    let products = await Product.find({});
    let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

    const newProduct = new Product({
      id: id,  // Fix: Assign computed ID
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
    });

    await newProduct.save();
    res.status(201).json({ success: 1, name: req.body.name, message: 'Product added successfully', product: newProduct });
  } catch (error) {
    res.status(500).json({ success: 0, message: 'Error adding product', error: error.message });
  }
});

//Delete product endpoint
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
      product: removedProduct
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting product', error: error.message });
  }
});

//getinn all product
app.get("/allproducts", async (req, res) => {
  try {
    let products = await Product.find({});
    console.log("All Products");
    res.send(products);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
