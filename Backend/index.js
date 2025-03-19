// Import dependencies
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const Jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Use CORS middleware to enable cross-origin requests
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

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

// Product Schema and Model
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
      id: id,
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
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
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      unique: true,
    },
    cartData: {
      type: Object,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);

// Create endpoint for registering a user
app.post('/signup', async (req, res) => {
  try {
    // Check if a user already exists with the same email
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
      return res
        .status(400)
        .json({ success: false, errors: 'Existing user found with same email' });
    }

    // Initialize cart data with 300 items set to 0
    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i] = 0;
    }

    // Create a new user with the matching schema field names
    const user = new Users({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      cartData: cart,
    });

    await user.save();
    const data = {
      user: {
        id: user.id,
      },
    };
    const token = Jwt.sign(data, 'secret_ecom');
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//endpoint for user login
app.post('/login', async (req, res) => {
  let user = await Users.findOne({ email: req.body.email })
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = {
        user: {
          id: user.id
        }
      }
      const token = Jwt.sign(data, 'secret_ecom');
      res.json({ success: true, token });
    }
    else {
      res.json({ success: false, errors: "Wrong Passwords" });
    }
  }
  else {
    res.json({ success: false, errors: "Wrong Email Id" })
  }
})



// Middleware to verify JWT token
const fetchUser = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied' });
  }

  try {
    const data = Jwt.verify(token, 'secret_ecom');
    req.user = data.user; // Attach user info to the request object
    next();
  } catch (error) {
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


//new collection end point for newcollection data
app.get('/newcollections', async (req, res) => {
  try {
    const newCollection = await Product.aggregate([
      { $sample: { size: 8 } } 
    ]);

    console.log("New Collection Fetched");
    res.json(newCollection);
  } catch (error) {
    console.error("Error fetching new collections:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//popular endpoint
app.get("/popular", async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $match: { category: { $in: ["men", "women", "kid"] } } }, // Filter by category
      { $sample: { size: 4 } } 
    ]);

    console.log("Random popular products fetched");
    res.json(products);
  } catch (error) {
    console.error("Error fetching popular products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//endpoint for adding products in cart
app.post('/addtocart',async(req,res)=>{
  
})




// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));