const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true }, // Add user field
  transactionId: { type: String, unique: true },
  pidx: { type: String, unique: true },
  purchasedItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchasedItem', required: true },
  amount: { type: Number, required: true },
  productImage: { type: String, required: true },
  dataFromVerificationReq: { type: Object },
  apiQueryFromUser: { type: Object },
  paymentGateway: { type: String, enum: ['khalti'], required: true },
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'pending' },
  paymentDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);