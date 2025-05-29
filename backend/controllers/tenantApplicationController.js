const TenantApplication = require('../models/TenantApplication');
const User = require('../models/User');
const Property = require('../models/Property');
const { getRedisClient } = require('../config/redisClient');
const { initiateBackgroundCheck, getBackgroundCheckStatus } = require('../services/backgroundCheckService');
const { encrypt, decrypt } = require('../services/encryptionService');
const notificationService = require('../services/notificationService');
const path = require('path');
const fs = require('fs');


exports.submitApplication = async (req, res, next) => {
    const { propertyId, personalInfo, currentAddress, employmentHistory, references } = req.body;
    try {
        const applicantId = req.user.id;
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        let parsedPersonalInfo = typeof personalInfo === 'string' ? JSON.parse(personalInfo) : personalInfo;
        let parsedCurrentAddress = typeof currentAddress === 'string' ? JSON.parse(currentAddress) : currentAddress;
        let parsedEmploymentHistory = typeof employmentHistory === 'string' ? JSON.parse(employmentHistory) : employmentHistory;
        let parsedReferences = typeof references === 'string' ? JSON.parse(references) : references;


        if (parsedPersonalInfo.ssn) {
            parsedPersonalInfo.ssn = encrypt(parsedPersonalInfo.ssn);
        }

        const documents = [];
        if (req.files && req.files.length > 0) {
             req.files.forEach(file => {
                documents.push({
                    documentType: file.fieldname, // Assuming fieldname indicates type e.g. 'id_doc', 'income_proof'
                    fileName: file.filename,
                    filePath: `/uploads/applications/${file.filename}`
                });
            });
        }


        const application = await TenantApplication.create({
            applicant: applicantId,
            property: propertyId,
            personalInfo: parsedPersonalInfo,
            currentAddress: parsedCurrentAddress,
            employmentHistory: parsedEmploymentHistory,
            references: parsedReferences,
            documents,
            status: 'pending'
        });

        req.auditEntity = 'TenantApplication';
        req.auditEntityId = application._id;

        const landlord = await User.findById(property.landlord);
        if (landlord && landlord.email) {
            await notificationService.sendEmail(
                landlord.email,
                'New Tenant Application Received',
                `<p>A new tenant application has been submitted for property: ${property.address.street}. Application ID: ${application._id}</p>`
            );
        }


        res.status(201).json(application);
    } catch (error) {
        next(error);
    }
};

exports.getApplications = async (req, res, next) => {
    const { propertyId, status, applicantId, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const query = {};

    if (req.user.role === 'tenant') {
        query.applicant = req.user.id;
    } else if (req.user.role === 'landlord' || req.user.role === 'property_manager') {
        const userProperties = await Property.find({
            $or: [{ landlord: req.user.id }, { propertyManager: req.user.id }]
        }).select('_id');
        query.property = { $in: userProperties.map(p => p._id) };
    }

    if (propertyId) query.property = propertyId;
    if (status) query.status = status;
    if (applicantId && (req.user.role === 'admin' || req.user.role === 'property_manager')) {
         query.applicant = applicantId;
    }


    try {
        const applications = await TenantApplication.find(query)
            .populate('applicant', 'firstName lastName email')
            .populate('property', 'address.street address.city')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await TenantApplication.countDocuments(query);

        applications.forEach(app => {
            if (app.personalInfo && app.personalInfo.ssn) {
                 if (req.user.role === 'admin' || req.user.role === 'property_manager' || (req.user.role === 'landlord' && app.property && app.property.landlord && app.property.landlord.toString() === req.user.id) || (app.applicant && app.applicant._id.toString() === req.user.id)) {
                    app.personalInfo.ssn = decrypt(app.personalInfo.ssn);
                } else {
                    app.personalInfo.ssn = '*********';
                }
            }
        });

        res.json({
            applications,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalApplications: count
        });
    } catch (error) {
        next(error);
    }
};

exports.getApplicationById = async (req, res, next) => {
    const redisClient = getRedisClient();
    const cacheKey = `application:${req.params.id}`;

    try {
        if (redisClient && redisClient.isOpen) {
            const cachedApp = await redisClient.get(cacheKey);
            if (cachedApp) {
                const application = JSON.parse(cachedApp);
                if (application.personalInfo && application.personalInfo.ssn) {
                    if (req.user.role === 'admin' || req.user.role === 'property_manager' || (req.user.role === 'landlord' && application.property && application.property.landlord && application.property.landlord.toString() === req.user.id) || (application.applicant && application.applicant._id.toString() === req.user.id)) {
                        application.personalInfo.ssn = decrypt(application.personalInfo.ssn);
                    } else {
                        application.personalInfo.ssn = '*********';
                    }
                }
                return res.json(application);
            }
        }

        const application = await TenantApplication.findById(req.params.id)
            .populate('applicant', 'firstName lastName email phone')
            .populate('property', 'address landlord propertyManager');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const isOwner = application.applicant._id.toString() === req.user.id;
        const isLandlord = req.user.role === 'landlord' && application.property && application.property.landlord && application.property.landlord.toString() === req.user.id;
        const isPropertyManager = req.user.role === 'property_manager' && application.property && (application.property.landlord.toString() === req.user.id || (application.property.propertyManager && application.property.propertyManager.toString() === req.user.id));
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isLandlord && !isPropertyManager && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this application' });
        }

        const appResponse = application.toObject();
        if (appResponse.personalInfo && appResponse.personalInfo.ssn) {
            if (isAdmin || isPropertyManager || isLandlord || isOwner) {
                appResponse.personalInfo.ssn = decrypt(appResponse.personalInfo.ssn);
            } else {
                appResponse.personalInfo.ssn = '*********';
            }
        }
        
        if (redisClient && redisClient.isOpen) {
            const appToCache = JSON.parse(JSON.stringify(appResponse)); // Create a deep copy for caching
            if (appToCache.personalInfo && appToCache.personalInfo.ssn && appToCache.personalInfo.ssn !== '*********') {
                appToCache.personalInfo.ssn = encrypt(appToCache.personalInfo.ssn);
            }
            await redisClient.set(cacheKey, JSON.stringify(appToCache), { EX: 3600 });
        }

        res.json(appResponse);
    } catch (error) {
        next(error);
    }
};

exports.updateApplicationStatus = async (req, res, next) => {
    const { status, notes, creditCheckScore } = req.body;
    const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'waitlisted'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid application status.' });
    }

    try {
        const application = await TenantApplication.findById(req.params.id).populate('applicant', 'email firstName lastName').populate('property', 'landlord propertyManager');
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const isLandlord = req.user.role === 'landlord' && application.property && application.property.landlord && application.property.landlord.toString() === req.user.id;
        const isPropertyManager = req.user.role === 'property_manager' && application.property && (application.property.landlord.toString() === req.user.id || (application.property.propertyManager && application.property.propertyManager.toString() === req.user.id));
        const isAdmin = req.user.role === 'admin';

        if (!isLandlord && !isPropertyManager && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this application status' });
        }

        application.status = status;
        if (notes) application.notes = notes;
        if (creditCheckScore !== undefined) application.creditCheckScore = creditCheckScore;

        await application.save();

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`application:${req.params.id}`);
        }

        req.auditEntity = 'TenantApplication';
        req.auditEntityId = application._id;

        await notificationService.sendEmail(
            application.applicant.email,
            `Application Status Update: ${application.applicant.firstName}`,
            `<p>Dear ${application.applicant.firstName},</p><p>The status of your application (ID: ${application._id}) has been updated to: <strong>${status}</strong>.</p>${notes ? `<p>Notes: ${notes}</p>` : ''}<p>Thank you.</p>`
        );

        res.json(application);
    } catch (error) {
        next(error);
    }
};

exports.uploadApplicationDocument = async (req, res, next) => {
    try {
        const application = await TenantApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        if (application.applicant.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'property_manager') {
            return res.status(403).json({ message: 'Not authorized to upload documents for this application' });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const documentType = req.body.documentType || 'other';

        const uploadedDocs = req.files.map(file => ({
            documentType: documentType,
            fileName: file.filename,
            filePath: `/uploads/applications/${file.filename}`
        }));

        application.documents.push(...uploadedDocs);
        await application.save();

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`application:${req.params.id}`);
        }

        req.auditEntity = 'TenantApplication';
        req.auditEntityId = application._id;

        res.json({ message: 'Documents uploaded successfully', application });
    } catch (error) {
        next(error);
    }
};

exports.deleteApplicationDocument = async (req, res, next) => {
    const { applicationId, documentId } = req.params;
    try {
        const application = await TenantApplication.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        const isOwner = application.applicant.toString() === req.user.id;
        const isAdminOrManager = ['admin', 'property_manager'].includes(req.user.role);

        if (!isOwner && !isAdminOrManager) {
            return res.status(403).json({ message: 'Not authorized to delete this document.' });
        }

        const docIndex = application.documents.findIndex(doc => doc._id.toString() === documentId);
        if (docIndex === -1) {
            return res.status(404).json({ message: 'Document not found in application.' });
        }

        const document = application.documents[docIndex];
        const filePath = path.join(__dirname, '..', document.filePath);

        application.documents.splice(docIndex, 1);
        await application.save();
        
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error("Error deleting document file:", err);
            });
        }

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`application:${applicationId}`);
        }

        req.auditEntity = 'TenantApplicationDocument';
        req.auditEntityId = documentId;

        res.json({ message: 'Document deleted successfully.', application });

    } catch (error) {
        next(error);
    }
};


exports.initiateApplicationBackgroundCheck = async (req, res, next) => {
    try {
        const application = await TenantApplication.findById(req.params.id).populate('applicant', 'firstName lastName email').populate('property', 'landlord propertyManager');
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const isLandlord = req.user.role === 'landlord' && application.property && application.property.landlord && application.property.landlord.toString() === req.user.id;
        const isPropertyManager = req.user.role === 'property_manager' && application.property && (application.property.landlord.toString() === req.user.id || (application.property.propertyManager && application.property.propertyManager.toString() === req.user.id));
        const isAdmin = req.user.role === 'admin';

        if (!isLandlord && !isPropertyManager && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to initiate background check' });
        }

        const decryptedSSN = application.personalInfo.ssn ? decrypt(application.personalInfo.ssn) : null;

        const checkResult = await initiateBackgroundCheck(application.applicant._id, {
            fullName: `${application.applicant.firstName} ${application.applicant.lastName}`,
            email: application.applicant.email,
            dob: application.personalInfo.dateOfBirth,
            ssn: decryptedSSN,
        });

        application.backgroundCheckStatus = checkResult.status;
        await application.save();

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`application:${req.params.id}`);
        }

        req.auditEntity = 'TenantApplication';
        req.auditEntityId = application._id;

        res.json({ message: 'Background check initiated', status: checkResult.status, application });
    } catch (error) {
        next(error);
    }
};

exports.getApplicationBackgroundCheckStatus = async (req, res, next) => {
    try {
        const application = await TenantApplication.findById(req.params.id).populate('property', 'landlord propertyManager');
        if (!application || !application.backgroundCheckId) {
            return res.status(404).json({ message: 'Application or background check ID not found.' });
        }

        const isLandlord = req.user.role === 'landlord' && application.property && application.property.landlord && application.property.landlord.toString() === req.user.id;
        const isPropertyManager = req.user.role === 'property_manager' && application.property && (application.property.landlord.toString() === req.user.id || (application.property.propertyManager && application.property.propertyManager.toString() === req.user.id));
        const isAdmin = req.user.role === 'admin';

        if (!isLandlord && !isPropertyManager && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view background check status' });
        }

        const statusResult = await getBackgroundCheckStatus(application.backgroundCheckId);
        
        if (statusResult && statusResult.status && statusResult.status !== application.backgroundCheckStatus) {
            application.backgroundCheckStatus = statusResult.status;
            if (statusResult.reportUrl) application.backgroundCheckReportUrl = statusResult.reportUrl;
            await application.save();
            const redisClient = getRedisClient();
            if (redisClient && redisClient.isOpen) {
                await redisClient.del(`application:${req.params.id}`);
            }
        }

        res.json({ backgroundCheckId: application.backgroundCheckId, status: application.backgroundCheckStatus, reportUrl: application.backgroundCheckReportUrl });
    } catch (error) {
        next(error);
    }
};