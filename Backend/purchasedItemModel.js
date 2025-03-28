const mongoose = require('mongoose');

const purchasedItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  totalPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  productImage: { type: String, required: true }, // Added field for image URL
  purchaseDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['khalti'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('PurchasedItem', purchasedItemSchema);