const mongoose = require('mongoose');

const purchasedItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  totalPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  productImage: { type: String, required: true },
  purchaseDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['khalti'], required: true },
  payment: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
  delivery: { type: String, enum: ['pending', 'delivered'], default: 'pending' }, // New delivery field
}, { timestamps: true });

module.exports = mongoose.model('PurchasedItem', purchasedItemSchema);