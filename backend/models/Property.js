const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, default: 'USA' }
    },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    propertyManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
        type: String,
        enum: ['apartment', 'house', 'condo', 'townhouse', 'duplex', 'other'],
        required: true
    },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0.5 },
    squareFootage: { type: Number, min: 0 },
    rentAmount: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, default: 0, min: 0 },
    description: String,
    photos: [{
        fileName: String,
        filePath: String,
        description: String,
        isPrimary: { type: Boolean, default: false }
    }],
    amenities: [String],
    isAvailable: { type: Boolean, default: true },
    availableDate: Date,
    yearBuilt: Number,
    petPolicy: {
        allowed: { type: Boolean, default: false },
        details: String,
        maxPets: Number,
        weightLimit: Number,
        breedRestrictions: [String]
    },
    smokingPolicy: {
        allowed: { type: Boolean, default: false },
        details: String
    },
    leaseTerms: String,
    applicationFee: { type: Number, default: 0 },
    utilitiesIncluded: [String],
    virtualTourUrl: String,
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending_approval', 'rented', 'under_maintenance'],
        default: 'active'
    },
    notes: String,
    viewingInstructions: String,
}, { timestamps: true });

PropertySchema.index({ "address.street": 1, "address.city": 1, "address.zipCode": 1 }, { unique: true, partialFilterExpression: { "address.street": { $type: "string" } } });
PropertySchema.index({ rentAmount: 1, bedrooms: 1, bathrooms: 1 });
PropertySchema.index({ landlord: 1 });
PropertySchema.index({ propertyManager: 1 });


module.exports = mongoose.models.Property || mongoose.model('Property', PropertySchema);