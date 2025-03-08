// Import dependencies
const express = require('express');
const multer = require('multer');
const connectDB = require('./connectDb');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

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

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
