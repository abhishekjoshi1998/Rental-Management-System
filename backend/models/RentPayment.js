const mongoose = require('mongoose');

const RentPaymentSchema = new mongoose.Schema({
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lease: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaseAgreement', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'other'], required: true },
    transactionId: { type: String, unique: true }, // From payment gateway
    status: { type: String, enum: ['pending', 'succeeded', 'failed', 'refunded'], default: 'pending' },
    dueDate: { type: Date, required: true },
    notes: String,
    receiptUrl: String, // URL to the payment receipt
}, { timestamps: true });

const RentPayment = mongoose.model('RentPayment', RentPaymentSchema);
module.exports = RentPayment;