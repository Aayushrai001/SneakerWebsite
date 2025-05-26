const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // Auto-incremented ID
  name: { type: String, required: true }, 
  image: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  new_price: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
  sizes: [
    {
      size: { type: String, required: true }, 
      quantity: { type: Number, required: true, min: 0 },
    },
  ],
  createdAt: { type: Date, default: Date.now }
});

// Create compound index for name and category
productSchema.index({ name: 1, category: 1 }, { unique: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;