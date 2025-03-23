// Import dependencies
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const Jwt = require('jsonwebtoken');
const { send } = require('process');
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
    favoriteData: {
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
     // Initialize cart data with 300 items set to 0
     let favorite = {};
     for (let i = 0; i < 300; i++) {
       favorite[i] = 0;
     }

    // Create a new user with the matching schema field names
    const user = new Users({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      cartData: cart,
      favoriteData: favorite,
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

//creating middleware to fetch user
const fetchuser = async(req,res,next)=>{
  const token = req.header('auth-token');
  if(!token){
    res.status(401).send({errors:"Please authenticate using valide token"})
  }
  else{
    try{
      const data = Jwt.verify(token,'secret_ecom');
      req.user= data.user;
      next();
    }catch(error){
      res.status(401).send({errors:"Please authenticate using valide token"})
    }
  }
}

//endpoint for adding products in cart
app.post('/AddToCart',fetchuser, async(req,res)=>{
  console.log("added",req.body.itemId)
  let userData = await Users.findOne({_id:req.user.id})
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData})
  res.send("Added")
})

//endpoint for removing products in cart
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

//endpoint to get cartdata
app.post('/getcart',fetchuser,async(req,res)=>{
  console.log("GetCart")
  let userData = await Users.findOne({_id:req.user.id})
  res.json(userData.cartData)
})

// Endpoint for adding products to favourites
app.post('/AddToFavourite', fetchuser, async (req, res) => {
  try {
    console.log("Added to Favourite:", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });

    // Increase favourite count
    userData.favoriteData[req.body.itemId] += 1;
    await Users.findOneAndUpdate(
      { _id: req.user.id },
      { favoriteData: userData.favoriteData },
      { new: true } // Return updated document
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


// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));