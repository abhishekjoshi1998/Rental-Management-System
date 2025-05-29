const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../services/encryptionService'); // Make sure this path is correct

const TenantApplicationSchema = new mongoose.Schema({
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    personalInfo: {
        fullName: String,
        dateOfBirth: Date,
        ssn: String,
        phone: String,
        email: String,
    },
    currentAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        duration: String,
        reasonForLeaving: String,
    },
    employmentHistory: [{
        employer: String,
        position: String,
        startDate: Date,
        endDate: Date,
        supervisorName: String,
        supervisorPhone: String,
        monthlyIncome: Number,
    }],
    references: [{
        name: String,
        relationship: String,
        phone: String,
        email: String,
    }],
    documents: [{
        documentType: { type: String, enum: ['id', 'proof_of_income', 'reference_letter', 'identification_doc', 'income_proof_doc', 'reference_letter_doc', 'other_doc', 'other'] },
        fileName: String,
        filePath: String,
        uploadDate: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['pending', 'under_review', 'approved', 'rejected', 'waitlisted'],
        default: 'pending'
    },
    applicationDate: { type: Date, default: Date.now },
    notes: String,
    backgroundCheckStatus: {
        type: String,
        enum: ['not_started', 'pending', 'completed_clear', 'completed_issues', 'failed'],
        default: 'not_started'
    },
    backgroundCheckId: String, // To store ID from third-party service
    backgroundCheckReportUrl: String,
    creditCheckScore: Number,
}, { timestamps: true });

TenantApplicationSchema.pre('save', function(next) {
    if (this.isModified('personalInfo.ssn') && this.personalInfo.ssn) {
        this.personalInfo.ssn = encrypt(this.personalInfo.ssn);
    }
    next();
});

TenantApplicationSchema.methods.getDecryptedSSN = function() {
    if (this.personalInfo && this.personalInfo.ssn) {
        return decrypt(this.personalInfo.ssn);
    }
    return null;
};


const TenantApplication = mongoose.model('TenantApplication', TenantApplicationSchema);
module.exports = TenantApplication;