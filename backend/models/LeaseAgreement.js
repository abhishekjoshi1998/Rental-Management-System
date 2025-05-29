const mongoose = require('mongoose');

const LeaseAgreementSchema = new mongoose.Schema({
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rentAmount: { type: Number, required: true },
    rentDueDate: { type: Number, min: 1, max: 31, required: true }, // Day of the month
    securityDeposit: { type: Number, default: 0 },
    termsAndConditions: String, // Could be a link to a document or stored text
    isActive: { type: Boolean, default: false }, // Becomes true after signing
    isRenewed: { type: Boolean, default: false },
    originalLeaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaseAgreement', default: null }, // If renewed
    signatures: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        signedAt: Date,
        digitalSignature: String, // Could be a hash or reference to a signature service
    }],
    terminationDate: Date,
    terminationReason: String,
    moveInDate: Date,
    moveOutDate: Date,
    lateFeePolicy: String,
    petPolicy: String,
    utilitiesIncluded: [String], // e.g., ['water', 'gas']
    renewalNotified: { type: Boolean, default: false },
    expiryNotified: { type: Boolean, default: false },
}, { timestamps: true });

const LeaseAgreement = mongoose.model('LeaseAgreement', LeaseAgreementSchema);
module.exports = LeaseAgreement;