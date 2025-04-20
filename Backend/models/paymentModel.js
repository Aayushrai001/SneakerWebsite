const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  transactionId: { type: String, unique: true },
  pidx: { type: String, unique: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  amount: { type: Number, required: true },
  productImage: { type: String, required: true },
  purchasedItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchasedItem' },
  dataFromVerificationReq: { type: Object },
  apiQueryFromUser: { type: Object },
  paymentGateway: { type: String, enum: ['khalti', 'COD'], required: true },
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'pending' },
  paymentDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);