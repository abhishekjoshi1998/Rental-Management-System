const TenantApplication = require('../models/TenantApplication');
const User = require('../models/User'); // To link applicant
const Property = require('../models/Property'); // Assuming Property model, create it if not present
const { getRedisClient } = require('../config/redisClient');
const { initiateBackgroundCheck } = require('../services/backgroundCheckService');
const { encrypt, decrypt } = require('../services/encryptionService'); // For SSN etc.
const upload = require('../middlewares/uploadMiddleware');
const notificationService = require('../services/notificationService');


exports.submitApplication = async (req, res, next) => {
    const { propertyId, personalInfo, currentAddress, employmentHistory, references } = req.body;
    try {
        const applicant = req.user.id;
        // Validate property exists
        const propertyExists = await Property.findById(propertyId);
        if (!propertyExists) return res.status(404).json({ message: 'Property not found' });

        // Encrypt sensitive data like SSN if provided
        // if (personalInfo.ssn) personalInfo.ssn = encrypt(personalInfo.ssn);
        
        const application = await TenantApplication.create({
            applicant,
            property: propertyId,
            personalInfo,
            currentAddress,
            employmentHistory,
            references,
            status: 'pending'
        });
        
        req.auditEntity = 'TenantApplication';
        req.auditEntityId = application._id;

        // Notify landlord/PM
        // await notificationService.sendNewApplicationEmail(propertyExists.landlord, applicant.name, application._id);

        res.status(201).json(application);
    } catch (error) { next(error); }
    res.status(501).json({ message: "Not Implemented" });
};

exports.getApplications = async (req, res, next) => {
    // For landlord/PM to view all applications for their properties, or admin for all
    const { propertyId, status, applicantId } = req.query;
    const query = {};
    if (req.user.role === 'landlord' || req.user.role === 'property_manager') {
        const userProperties = await Property.find({ landlord: req.user.id }).select('_id');
        query.property = { $in: userProperties.map(p => p._id) };
    }
    if (propertyId) query.property = propertyId;
    if (status) query.status = status;
    if (applicantId) query.applicant = applicantId;

    if (req.user.role === 'tenant') query.applicant = req.user.id;
    
    try {
        const applications = await TenantApplication.find(query).populate('applicant', 'firstName lastName email').populate('property', 'address');
        res.json(applications);
    } catch (error) { next(error); }
    res.status(501).json({ message: "Not Implemented" });
};

exports.getApplicationById = async (req, res, next) => {
    const redisClient = getRedisClient();
    const cacheKey = `application:${req.params.id}`;
    try {
        // Check access rights (tenant owns it, or landlord/PM owns the property associated)
        const application = await TenantApplication.findById(req.params.id)
            .populate('applicant', 'firstName lastName email phone')
            .populate('property', 'address landlord');
        
        if (!application) return res.status(404).json({ message: 'Application not found' });

        // Access control
        const isOwner = application.applicant._id.toString() === req.user.id;
        const isPropertyManager = req.user.role === 'property_manager' && application.property.landlord.toString() === req.user.id; // Simplified
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isPropertyManager && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this application' });
        }

        // Decrypt SSN if needed and authorized
        // if (application.personalInfo.ssn && (isPropertyManager || isAdmin)) {
        //    application.personalInfo.ssn = decrypt(application.personalInfo.ssn);
        // } else {
        //    application.personalInfo.ssn = '********'; // Mask if not authorized
        // }
        
        res.json(application);
    } catch (error) { next(error); }
    res.status(501).json({ message: "Not Implemented" });
};

exports.updateApplicationStatus = async (req, res, next) => {
    const { status, notes } = req.body;
    try {
        const application = await TenantApplication.findById(req.params.id).populate('applicant', 'email firstName');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        // Authorization check (landlord/PM of the property)
        application.status = status;
        if (notes) application.notes = notes;
        await application.save();
        
        req.auditEntity = 'TenantApplication';
        req.auditEntityId = application._id;

        // Notify applicant
        // await notificationService.sendApplicationStatusUpdateEmail(application.applicant.email, application.applicant.firstName, application._id, status);

        res.json(application);
    } catch (error) { next(error); }
    res.status(501).json({ message: "Not Implemented" });
};

exports.uploadApplicationDocument = async (req, res, next) => {
    try {
        const application = await TenantApplication.findById(req.params.id);
        if (!application) return res.status(404).json({ message: 'Application not found' });
        if (application.applicant.toString() !== req.user.id && req.user.role !== 'admin') { // Only applicant or admin can upload
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

        const uploadedDocs = req.files.map(file => ({
            documentType: req.body.documentType || 'other', // Get type from body or default
            fileName: file.filename,
            filePath: `/uploads/applications/${file.filename}` // Path where multer saved it
        }));
        
        application.documents.push(...uploadedDocs);
        await application.save();

        req.auditEntity = 'TenantApplication';
        req.auditEntityId = application._id;

        res.json({ message: 'Documents uploaded successfully', application });
    } catch (error) { next(error); }
    res.status(501).json({ message: "Not Implemented" });
};

exports.initiateApplicationBackgroundCheck = async (req, res, next) => {
    try {
        const application = await TenantApplication.findById(req.params.id).populate('applicant');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        // Authorization check: Landlord/PM for the property
        
        const checkResult = await initiateBackgroundCheck(application.applicant._id, {
            fullName: application.applicant.firstName + " " + application.applicant.lastName,
            // ... other necessary PII for background check
        });
        
        application.backgroundCheckStatus = checkResult.status;
        // application.backgroundCheckId = checkResult.checkId; // Store external ID if needed
        await application.save();
        
        req.auditEntity = 'TenantApplication';
        req.auditEntityId = application._id;

        res.json({ message: 'Background check initiated', status: checkResult.status, application });
    } catch (error) { next(error); }
    res.status(501).json({ message: "Not Implemented" });
};