const mongoose = require('mongoose');

const MaintenanceRequestSchema = new mongoose.Schema({
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    lease: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaseAgreement' },
    issueDescription: { type: String, required: true },
    category: { type: String, enum: ['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'other'], required: true },
    urgency: { type: String, enum: ['low', 'medium', 'high', 'emergency'], default: 'medium' },
    status: { type: String, enum: ['submitted', 'received', 'in_progress', 'assigned', 'on_hold', 'completed', 'cancelled'], default: 'submitted' },
    photos: [{
        fileName: String,
        filePath: String, // URL or path
    }],
    preferredAvailability: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Could be a landlord, PM, or service provider user
    serviceProvider: { // Or a dedicated service provider entity if more complex
        name: String,
        contact: String,
    },
    resolutionDetails: String,
    completionDate: Date,
    feedback: {
        rating: Number, // 1-5
        comments: String,
    },
    updates: [{
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: String,
        notes: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const MaintenanceRequest = mongoose.model('MaintenanceRequest', MaintenanceRequestSchema);
module.exports = MaintenanceRequest;