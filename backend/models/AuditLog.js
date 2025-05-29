const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, 
    action: { type: String, required: true }, 
    entity: { type: String }, 
    entityId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed }, 
    ipAddress: { type: String },
    userAgent: { type: String },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
    errorMessage: { type: String }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
module.exports = AuditLog;