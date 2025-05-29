const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // User performing the action, null for system
    action: { type: String, required: true }, // e.g., 'CREATE_LEASE', 'PROCESS_PAYMENT', 'UPDATE_USER_PROFILE'
    entity: { type: String }, // e.g., 'LeaseAgreement', 'RentPayment'
    entityId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed }, // Can store before/after states or other relevant info
    ipAddress: { type: String },
    userAgent: { type: String },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
    errorMessage: { type: String }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
module.exports = AuditLog;