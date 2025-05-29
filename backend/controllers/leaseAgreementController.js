const LeaseAgreement = require('../models/LeaseAgreement');
const Property = require('../models/Property');
const User = require('../models/User');
const { getRedisClient } = require('../config/redisClient');
const { requestSignature, getSignatureStatus } = require('../services/digitalSignatureService');
const notificationService = require('../services/notificationService');
const { v4: uuidv4 } = require('uuid');

exports.createLeaseAgreement = async (req, res, next) => {
    const { propertyId, tenants, startDate, endDate, rentAmount, rentDueDate, securityDeposit, termsAndConditions, petPolicy, utilitiesIncluded } = req.body;
    const landlordId = req.user.id;

    try {
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found.' });
        }
        if (property.landlord.toString() !== landlordId && (property.propertyManager && property.propertyManager.toString() !== landlordId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to create lease for this property.' });
        }

        if (!Array.isArray(tenants) || tenants.length === 0) {
            return res.status(400).json({ message: 'At least one tenant ID must be provided.' });
        }
        const tenantUsers = await User.find({ '_id': { $in: tenants }, role: 'tenant' });
        if (tenantUsers.length !== tenants.length) {
            return res.status(400).json({ message: 'One or more tenant IDs are invalid or not tenants.' });
        }

        const lease = await LeaseAgreement.create({
            property: propertyId,
            landlord: landlordId,
            tenants: tenantUsers.map(t => t._id),
            startDate,
            endDate,
            rentAmount,
            rentDueDate,
            securityDeposit,
            termsAndConditions,
            petPolicy,
            utilitiesIncluded,
            isActive: false,
        });

        req.auditEntity = 'LeaseAgreement';
        req.auditEntityId = lease._id;

        res.status(201).json(lease);
    } catch (error) {
        next(error);
    }
};

exports.getLeaseAgreements = async (req, res, next) => {
    const { propertyId, tenantId, isActive, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role === 'tenant') {
        query.tenants = req.user.id;
    } else if (req.user.role === 'landlord' || req.user.role === 'property_manager') {
        const userProperties = await Property.find({
            $or: [{ landlord: req.user.id }, { propertyManager: req.user.id }]
        }).select('_id');
        const propertyIds = userProperties.map(p => p._id);
        
        if (propertyId) {
            if (!propertyIds.map(String).includes(String(propertyId))) {
                return res.status(403).json({ message: "Not authorized to view leases for this property." });
            }
            query.property = propertyId;
        } else {
             query.property = { $in: propertyIds };
        }
        if (tenantId) query.tenants = tenantId;

    } else if (req.user.role === 'admin') {
        if (propertyId) query.property = propertyId;
        if (tenantId) query.tenants = tenantId;
    }

    if (isActive !== undefined) query.isActive = isActive === 'true' || isActive === true;

    try {
        const leases = await LeaseAgreement.find(query)
            .populate('property', 'address.street address.city')
            .populate('landlord', 'firstName lastName email')
            .populate('tenants', 'firstName lastName email')
            .sort({ startDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await LeaseAgreement.countDocuments(query);

        res.json({
            leases,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalLeases: count
        });
    } catch (error) {
        next(error);
    }
};

exports.getLeaseAgreementById = async (req, res, next) => {
    const redisClient = getRedisClient();
    const cacheKey = `lease:${req.params.id}`;

    try {
        if (redisClient && redisClient.isOpen) {
            const cachedLease = await redisClient.get(cacheKey);
            if (cachedLease) return res.json(JSON.parse(cachedLease));
        }

        const lease = await LeaseAgreement.findById(req.params.id)
            .populate('property', 'address landlord propertyManager')
            .populate('landlord', 'firstName lastName email')
            .populate('tenants', 'firstName lastName email');

        if (!lease) {
            return res.status(404).json({ message: 'Lease agreement not found.' });
        }

        const isTenant = lease.tenants.some(t => t._id.toString() === req.user.id);
        const isLandlord = lease.landlord._id.toString() === req.user.id || (lease.property.propertyManager && lease.property.propertyManager.toString() === req.user.id) ;
        const isAdmin = req.user.role === 'admin';

        if (!isTenant && !isLandlord && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this lease agreement.' });
        }

        if (redisClient && redisClient.isOpen) {
            await redisClient.set(cacheKey, JSON.stringify(lease), { EX: 3600 });
        }
        res.json(lease);
    } catch (error) {
        next(error);
    }
};

exports.updateLeaseAgreement = async (req, res, next) => {
    const { startDate, endDate, rentAmount, rentDueDate, securityDeposit, termsAndConditions, isActive, petPolicy, utilitiesIncluded } = req.body;
    try {
        const lease = await LeaseAgreement.findById(req.params.id).populate('property');
        if (!lease) {
            return res.status(404).json({ message: 'Lease agreement not found.' });
        }
        if (lease.property.landlord.toString() !== req.user.id && (lease.property.propertyManager && lease.property.propertyManager.toString() !== req.user.id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this lease.' });
        }

        if (startDate) lease.startDate = startDate;
        if (endDate) lease.endDate = endDate;
        if (rentAmount) lease.rentAmount = rentAmount;
        if (rentDueDate) lease.rentDueDate = rentDueDate;
        if (securityDeposit !== undefined) lease.securityDeposit = securityDeposit;
        if (termsAndConditions) lease.termsAndConditions = termsAndConditions;
        if (isActive !== undefined) lease.isActive = isActive;
        if (petPolicy) lease.petPolicy = petPolicy;
        if (utilitiesIncluded) lease.utilitiesIncluded = utilitiesIncluded;


        const updatedLease = await lease.save();

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`lease:${req.params.id}`);
        }
        
        req.auditEntity = 'LeaseAgreement';
        req.auditEntityId = updatedLease._id;

        res.json(updatedLease);
    } catch (error) {
        next(error);
    }
};

exports.renewLeaseAgreement = async (req, res, next) => {
    const { newEndDate, newRentAmount, newTerms } = req.body;
    const originalLeaseId = req.params.id;

    try {
        const originalLease = await LeaseAgreement.findById(originalLeaseId).populate('property');
        if (!originalLease) {
            return res.status(404).json({ message: 'Original lease not found.' });
        }
         if (originalLease.property.landlord.toString() !== req.user.id && (originalLease.property.propertyManager && originalLease.property.propertyManager.toString() !== req.user.id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to renew this lease.' });
        }


        const renewedLease = await LeaseAgreement.create({
            property: originalLease.property._id,
            landlord: originalLease.landlord,
            tenants: originalLease.tenants,
            startDate: new Date(originalLease.endDate.getTime() + 24 * 60 * 60 * 1000),
            endDate: newEndDate,
            rentAmount: newRentAmount || originalLease.rentAmount,
            rentDueDate: originalLease.rentDueDate,
            securityDeposit: originalLease.securityDeposit,
            termsAndConditions: newTerms || originalLease.termsAndConditions,
            petPolicy: originalLease.petPolicy,
            utilitiesIncluded: originalLease.utilitiesIncluded,
            isActive: false,
            isRenewed: true,
            originalLeaseId: originalLease._id,
        });

        originalLease.isActive = false;
        originalLease.terminationDate = originalLease.endDate;
        originalLease.terminationReason = 'Renewed';
        await originalLease.save();
        
        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`lease:${originalLeaseId}`);
        }

        req.auditEntity = 'LeaseAgreement';
        req.auditEntityId = renewedLease._id;


        res.status(201).json({ message: 'Lease renewed successfully.', originalLease, renewedLease });
    } catch (error) {
        next(error);
    }
};

exports.requestLeaseSignature = async (req, res, next) => {
    const { signerEmail } = req.body; // Could be multiple signers (landlord, tenant1, tenant2...)
    try {
        const lease = await LeaseAgreement.findById(req.params.id).populate('tenants').populate('landlord');
        if (!lease) return res.status(404).json({ message: 'Lease not found.' });

        const isLandlordOrManager = lease.landlord._id.toString() === req.user.id || (lease.property && lease.property.propertyManager && lease.property.propertyManager.toString() === req.user.id);
        if (!isLandlordOrManager && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to request signatures for this lease." });
        }

        const userToSign = lease.tenants.find(t => t.email === signerEmail) || (lease.landlord.email === signerEmail ? lease.landlord : null);
        if (!userToSign) {
            return res.status(400).json({ message: `User with email ${signerEmail} is not part of this lease.` });
        }

        const leaseDetailsForSignature = {
            id: lease._id,
            propertyAddress: lease.property.address.street,
            rent: lease.rentAmount,
            startDate: lease.startDate.toDateString(),
            endDate: lease.endDate.toDateString(),
        };

        const signatureRequest = await requestSignature(lease._id.toString(), signerEmail, leaseDetailsForSignature);
        
        const existingSignature = lease.signatures.find(sig => sig.userId.toString() === userToSign._id.toString());
        if (existingSignature) {
            existingSignature.eSignatureEnvelopeId = signatureRequest.envelopeId;
            existingSignature.eSignatureStatus = signatureRequest.status;
        } else {
            lease.signatures.push({
                userId: userToSign._id,
                eSignatureEnvelopeId: signatureRequest.envelopeId,
                eSignatureStatus: signatureRequest.status,
            });
        }
        await lease.save();

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) await redisClient.del(`lease:${req.params.id}`);

        req.auditEntity = 'LeaseAgreementSignature';
        req.auditEntityId = lease._id;

        res.json({ message: `Signature requested from ${signerEmail}`, envelopeId: signatureRequest.envelopeId });
    } catch (error) {
        next(error);
    }
};

exports.handleSignatureWebhook = async (req, res, next) => {
    const { envelopeId, status, signedAt, signerEmail } = req.body;
    try {
        const lease = await LeaseAgreement.findOne({ "signatures.eSignatureEnvelopeId": envelopeId }).populate('tenants');
        if (!lease) {
            console.warn(`Lease not found for signature envelope ID: ${envelopeId}`);
            return res.status(404).json({ message: 'Lease not found for this signature.' });
        }

        const signatureEntry = lease.signatures.find(sig => sig.eSignatureEnvelopeId === envelopeId);
        if (!signatureEntry) {
            console.warn(`Signature entry not found in lease ${lease._id} for envelope ID: ${envelopeId}`);
            return res.status(404).json({ message: 'Signature entry not found.' });
        }

        signatureEntry.eSignatureStatus = status;
        if (status === 'completed' && signedAt) {
            signatureEntry.signedAt = new Date(signedAt);
            signatureEntry.digitalSignature = `eSigned_via_service_${Date.now()}`;
        }
        await lease.save();

        const allSigned = lease.signatures.length === (lease.tenants.length + 1) && lease.signatures.every(sig => sig.eSignatureStatus === 'completed');
        if (allSigned && !lease.isActive) {
            lease.isActive = true;
            await lease.save();
            await notificationService.sendEmail(lease.landlord.email, 'Lease Fully Signed and Active', `Lease ${lease._id} is now fully signed and active.`);
            lease.tenants.forEach(async tenant => {
                 await notificationService.sendEmail(tenant.email, 'Lease Fully Signed and Active', `Your lease ${lease._id} is now fully signed and active.`);
            });
        }


        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) await redisClient.del(`lease:${lease._id}`);
        
        await AuditLog.create({
            action: 'LEASE_SIGNATURE_WEBHOOK',
            entity: 'LeaseAgreementSignature',
            entityId: lease._id,
            details: req.body,
            status: 'success'
        });

        res.status(200).json({ message: 'Signature status updated.' });
    } catch (error) {
         await AuditLog.create({
            action: 'LEASE_SIGNATURE_WEBHOOK_ERROR',
            details: { error: error.message, body: req.body },
            status: 'failure',
            errorMessage: error.message
        });
        next(error);
    }
};


exports.sendLeaseExpiryNotifications = async (req, res, next) => {
    try {
        const today = new Date();
        const notificationWindowDays = req.body.days || 60;
        const expiryWindowStart = new Date(today);
        expiryWindowStart.setDate(today.getDate() + notificationWindowDays);

        const expiringLeases = await LeaseAgreement.find({
            isActive: true,
            endDate: { $gte: today, $lte: expiryWindowStart },
            expiryNotified: { $ne: true }
        }).populate('tenants', 'email firstName lastName').populate('landlord', 'email firstName lastName');

        let count = 0;
        for (const lease of expiringLeases) {
            for (const tenant of lease.tenants) {
                await notificationService.sendLeaseExpiryNotification(tenant.email, `${tenant.firstName} ${tenant.lastName}`, lease.endDate, 'tenant');
            }
            await notificationService.sendLeaseExpiryNotification(lease.landlord.email, `${lease.landlord.firstName} ${lease.landlord.lastName}`, lease.endDate, 'landlord');
            
            lease.expiryNotified = true;
            await lease.save();
            count++;
        }
        
        req.auditEntity = 'SystemTask';

        res.json({ message: `${count} lease expiry notifications sent.` });
    } catch (error) {
        next(error);
    }
};

exports.terminateLease = async (req, res, next) => {
    const { terminationDate, terminationReason } = req.body;
    try {
        const lease = await LeaseAgreement.findById(req.params.id).populate('property');
        if (!lease) return res.status(404).json({ message: "Lease not found." });

        if (lease.property.landlord.toString() !== req.user.id && (lease.property.propertyManager && lease.property.propertyManager.toString() !== req.user.id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to terminate this lease." });
        }

        if (!lease.isActive) {
            return res.status(400).json({ message: "Cannot terminate an inactive lease. You can delete it if it was never active." });
        }

        lease.isActive = false;
        lease.terminationDate = terminationDate || new Date();
        lease.terminationReason = terminationReason || 'Terminated by landlord/manager.';
        await lease.save();

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`lease:${req.params.id}`);
        }
        
        req.auditEntity = 'LeaseAgreement';
        req.auditEntityId = lease._id;

        res.json({ message: "Lease terminated successfully.", lease });

    } catch (error) {
        next(error);
    }
};

exports.deleteLeaseAgreement = async (req, res, next) => {
    try {
        const lease = await LeaseAgreement.findById(req.params.id).populate('property');
        if (!lease) {
            return res.status(404).json({ message: 'Lease agreement not found.' });
        }
        if (lease.property.landlord.toString() !== req.user.id && (lease.property.propertyManager && lease.property.propertyManager.toString() !== req.user.id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this lease.' });
        }
        if (lease.isActive) {
            return res.status(400).json({ message: 'Cannot delete an active lease. Terminate it first.' });
        }


        await LeaseAgreement.deleteOne({ _id: req.params.id });

        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`lease:${req.params.id}`);
        }

        req.auditEntity = 'LeaseAgreement';
        req.auditEntityId = req.params.id;

        res.json({ message: 'Lease agreement deleted successfully.' });
    } catch (error) {
        next(error);
    }
};