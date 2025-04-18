const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  purchasedItem: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchasedItem', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  feedback: { type: String, required: true },
  adminFeedback: { type: String }, 
  date: { type: Date, default: Date.now },
  status: { 
    type: String, 
    default: 'Complete'
  }, 
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);