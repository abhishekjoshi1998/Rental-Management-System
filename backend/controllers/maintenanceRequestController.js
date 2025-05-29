const MaintenanceRequest = require('../models/MaintenanceRequest');
const Property = require('../models/Property');
const LeaseAgreement = require('../models/LeaseAgreement');
const User = require('../models/User');
const { getRedisClient } = require('../config/redisClient');
const notificationService = require('../services/notificationService');
const path = require('path');
const fs = require('fs');

exports.submitMaintenanceRequest = async (req, res, next) => {
    const { propertyId, leaseId, issueDescription, category, urgency, preferredAvailability } = req.body;
    const tenantId = req.user.id;

    try {
        const property = await Property.findById(propertyId);
        if (!property) return res.status(404).json({ message: "Property not found." });

        let lease = null;
        if (leaseId) {
            lease = await LeaseAgreement.findOne({ _id: leaseId, tenants: tenantId, property: propertyId });
            if (!lease) return res.status(400).json({ message: "Invalid lease or not associated with this tenant/property." });
        } else {
             lease = await LeaseAgreement.findOne({ tenants: tenantId, property: propertyId, isActive: true }).sort({ endDate: -1 });
             if (!lease) return res.status(400).json({ message: "No active lease found for this tenant on the property." });
        }


        const photos = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                photos.push({
                    fileName: file.filename,
                    filePath: `/uploads/maintenance_photos/${file.filename}`
                });
            });
        }

        const maintenanceRequest = await MaintenanceRequest.create({
            tenant: tenantId,
            property: propertyId,
            lease: lease._id,
            issueDescription,
            category,
            urgency: urgency || 'medium',
            preferredAvailability,
            photos,
            status: 'submitted',
            updates: [{ updatedBy: tenantId, status: 'submitted', notes: 'Request submitted by tenant.' }]
        });

        req.auditEntity = 'MaintenanceRequest';
        req.auditEntityId = maintenanceRequest._id;

        const landlordOrManager = await User.findById(property.propertyManager || property.landlord);
        if (landlordOrManager) {
            await notificationService.sendEmail(
                landlordOrManager.email,
                `New Maintenance Request: #${maintenanceRequest._id}`,
                `<p>A new maintenance request has been submitted by tenant ${req.user.firstName} ${req.user.lastName} for property ${property.address.street}.</p><p>Issue: ${issueDescription}</p>`
            );
        }


        res.status(201).json(maintenanceRequest);
    } catch (error) {
        next(error);
    }
};

exports.getMaintenanceRequests = async (req, res, next) => {
    const { propertyId, status, category, urgency, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const query = {};

    if (req.user.role === 'tenant') {
        query.tenant = req.user.id;
    } else if (req.user.role === 'landlord' || req.user.role === 'property_manager') {
        const userProperties = await Property.find({
            $or: [{ landlord: req.user.id }, { propertyManager: req.user.id }]
        }).select('_id');
        const propertyIds = userProperties.map(p => p._id);
        
        if (propertyId) {
            if (!propertyIds.map(String).includes(String(propertyId))) {
                return res.status(403).json({ message: "Not authorized to view requests for this property." });
            }
            query.property = propertyId;
        } else {
             query.property = { $in: propertyIds };
        }
    } else if (req.user.role === 'admin') {
         if (propertyId) query.property = propertyId;
    }


    if (status) query.status = status;
    if (category) query.category = category;
    if (urgency) query.urgency = urgency;


    try {
        const requests = await MaintenanceRequest.find(query)
            .populate('tenant', 'firstName lastName email')
            .populate('property', 'address.street')
            .populate('assignedTo', 'firstName lastName email')
            .populate('updates.updatedBy', 'firstName lastName')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await MaintenanceRequest.countDocuments(query);

        res.json({
            requests,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalRequests: count
        });
    } catch (error) {
        next(error);
    }
};

exports.getMaintenanceRequestById = async (req, res, next) => {
    const redisClient = getRedisClient();
    const cacheKey = `maintenance:${req.params.id}`;

    try {
        if (redisClient && redisClient.isOpen) {
            const cachedRequest = await redisClient.get(cacheKey);
            if (cachedRequest) return res.json(JSON.parse(cachedRequest));
        }

        const request = await MaintenanceRequest.findById(req.params.id)
            .populate('tenant', 'firstName lastName email phone')
            .populate('property', 'address landlord propertyManager')
            .populate('lease', 'startDate endDate')
            .populate('assignedTo', 'firstName lastName email phone')
            .populate('updates.updatedBy', 'firstName lastName email');

        if (!request) {
            return res.status(404).json({ message: 'Maintenance request not found.' });
        }

        const isTenantOwner = request.tenant._id.toString() === req.user.id;
        const isLandlordOrManager = req.user.role === 'landlord' || req.user.role === 'property_manager';
        let canAccess = false;
        if (isLandlordOrManager) {
            const prop = await Property.findById(request.property._id);
            if(prop && (prop.landlord.toString() === req.user.id || (prop.propertyManager && prop.propertyManager.toString() === req.user.id))){
                canAccess = true;
            }
        }
        const isAdmin = req.user.role === 'admin';

        if (!isTenantOwner && !canAccess && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this maintenance request.' });
        }


        if (redisClient && redisClient.isOpen) {
            await redisClient.set(cacheKey, JSON.stringify(request), { EX: 3600 });
        }
        res.json(request);
    } catch (error) {
        next(error);
    }
};

exports.updateMaintenanceRequest = async (req, res, next) => {
    const { status, notes, assignedTo, serviceProviderName, serviceProviderContact, resolutionDetails } = req.body;
    const updaterId = req.user.id;

    try {
        const request = await MaintenanceRequest.findById(req.params.id).populate('tenant', 'email firstName lastName').populate('property', 'landlord propertyManager');
        if (!request) {
            return res.status(404).json({ message: 'Maintenance request not found.' });
        }

        const isLandlordOrManager = req.user.role === 'landlord' || req.user.role === 'property_manager';
        let canUpdate = false;
        if (isLandlordOrManager) {
            if(request.property && (request.property.landlord.toString() === req.user.id || (request.property.propertyManager && request.property.propertyManager.toString() === req.user.id))){
                canUpdate = true;
            }
        }
        const isAdmin = req.user.role === 'admin';
        const isTenantOwner = request.tenant._id.toString() === req.user.id;


        if (!canUpdate && !isAdmin && !(isTenantOwner && status === 'cancelled')) {
             return res.status(403).json({ message: 'Not authorized to update this maintenance request.' });
        }
        
        let statusChanged = false;
        if (status && request.status !== status) {
            request.status = status;
            statusChanged = true;
        }
        if (assignedTo) request.assignedTo = assignedTo;
        if (serviceProviderName) request.serviceProvider.name = serviceProviderName;
        if (serviceProviderContact) request.serviceProvider.contact = serviceProviderContact;
        if (resolutionDetails) request.resolutionDetails = resolutionDetails;
        if (status === 'completed') request.completionDate = new Date();

        request.updates.push({ updatedBy: updaterId, status: status || request.status, notes: notes || 'Status updated.' });

        await request.save();

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`maintenance:${req.params.id}`);
        }
        
        req.auditEntity = 'MaintenanceRequest';
        req.auditEntityId = request._id;

        if (statusChanged) {
            await notificationService.sendMaintenanceStatusUpdateEmail(
                request.tenant.email,
                `${request.tenant.firstName} ${request.tenant.lastName}`,
                request._id,
                request.status,
                notes
            );
        }


        res.json(request);
    } catch (error) {
        next(error);
    }
};

exports.addMaintenanceRequestPhoto = async (req, res, next) => {
    try {
        const request = await MaintenanceRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Maintenance request not found.' });
        }

        const isTenantOwner = request.tenant.toString() === req.user.id;
        const isLandlordOrManager = ['landlord', 'property_manager', 'admin'].includes(req.user.role);

        if (!isTenantOwner && !isLandlordOrManager) {
            return res.status(403).json({ message: 'Not authorized to add photos to this request.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded.' });
        }

        const newPhotos = req.files.map(file => ({
            fileName: file.filename,
            filePath: `/uploads/maintenance_photos/${file.filename}`
        }));

        request.photos.push(...newPhotos);
        await request.save();

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`maintenance:${req.params.id}`);
        }
        
        req.auditEntity = 'MaintenanceRequestPhoto';
        req.auditEntityId = request._id;

        res.json({ message: 'Photos added successfully.', request });
    } catch (error) {
        next(error);
    }
};

exports.deleteMaintenanceRequestPhoto = async (req, res, next) => {
    const { requestId, photoId } = req.params;
    try {
        const request = await MaintenanceRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Maintenance request not found.' });
        }

        const isTenantOwner = request.tenant.toString() === req.user.id;
        const isLandlordOrManager = ['landlord', 'property_manager', 'admin'].includes(req.user.role);

        if (!isTenantOwner && !isLandlordOrManager) {
            return res.status(403).json({ message: 'Not authorized to delete photos from this request.' });
        }

        const photoIndex = request.photos.findIndex(p => p._id.toString() === photoId);
        if (photoIndex === -1) {
            return res.status(404).json({ message: 'Photo not found in request.' });
        }

        const photo = request.photos[photoIndex];
        const filePath = path.join(__dirname, '..', photo.filePath);

        request.photos.splice(photoIndex, 1);
        await request.save();
        
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error("Error deleting photo file:", err);
            });
        }

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`maintenance:${requestId}`);
        }
        
        req.auditEntity = 'MaintenanceRequestPhoto';
        req.auditEntityId = photoId;


        res.json({ message: 'Photo deleted successfully.', request });
    } catch (error) {
        next(error);
    }
};

exports.addFeedbackToMaintenanceRequest = async (req, res, next) => {
    const { rating, comments } = req.body;
    const requestId = req.params.id;

    try {
        const request = await MaintenanceRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Maintenance request not found." });
        }

        if (request.tenant.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the tenant who submitted the request can add feedback." });
        }

        if (request.status !== 'completed') {
            return res.status(400).json({ message: "Feedback can only be added to completed requests." });
        }

        if (request.feedback && request.feedback.rating) {
            return res.status(400).json({ message: "Feedback has already been submitted for this request." });
        }

        request.feedback = {
            rating: Number(rating),
            comments: comments,
            submittedAt: new Date()
        };
        await request.save();

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`maintenance:${requestId}`);
        }
        
        req.auditEntity = 'MaintenanceRequestFeedback';
        req.auditEntityId = request._id;

        res.json({ message: "Feedback submitted successfully.", request });
    } catch (error) {
        next(error);
    }
};