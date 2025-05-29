const RentPayment = require('../models/RentPayment');
const LeaseAgreement = require('../models/LeaseAgreement');
const User = require('../models/User');
const Property = require('../models/Property');
const { createPaymentIntent, handleWebhook, confirmPayment, createStripeCustomer } = require('../services/paymentGatewayService');
const notificationService = require('../services/notificationService');
const { getRedisClient } = require('../config/redisClient');
const AuditLog = require('../models/AuditLog');

exports.initiateRentPayment = async (req, res, next) => {
    const { leaseId, amount, paymentMethod = 'stripe', notes } = req.body;
    const tenantId = req.user.id;

    try {
        const lease = await LeaseAgreement.findById(leaseId).populate('tenants').populate('property');
        if (!lease || !lease.tenants.some(t => t._id.toString() === tenantId)) {
            return res.status(404).json({ message: 'Lease not found or not associated with this tenant.' });
        }
        if (lease.rentAmount !== Number(amount)) {
             return res.status(400).json({ message: `Payment amount ${amount} does not match lease rent amount ${lease.rentAmount}.` });
        }

        const user = await User.findById(tenantId);
        if (!user.stripeCustomerId) {
             const stripeCustomer = await createStripeCustomer(user.email, `${user.firstName} ${user.lastName}`, user.phone);
             user.stripeCustomerId = stripeCustomer.id;
             await user.save();
        }


        const paymentIntentData = await createPaymentIntent(
            amount,
            'usd',
            user.stripeCustomerId,
            {
                leaseId: lease._id.toString(),
                tenantId: tenantId,
                propertyId: lease.property._id.toString(),
                rentMonth: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`
            }
        );

        const paymentRecord = await RentPayment.create({
            tenant: tenantId,
            lease: leaseId,
            property: lease.property._id,
            amount,
            paymentMethod: paymentMethod,
            transactionId: paymentIntentData.paymentIntentId,
            status: 'pending',
            dueDate: lease.rentDueDate ? new Date(new Date().getFullYear(), new Date().getMonth(), lease.rentDueDate) : new Date(),
            notes
        });

        req.auditEntity = 'RentPayment';
        req.auditEntityId = paymentRecord._id;

        res.json({ clientSecret: paymentIntentData.clientSecret, paymentId: paymentRecord._id });
    } catch (error) {
        next(error);
    }
};

exports.stripeWebhookHandler = async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = handleWebhook(req.rawBody, sig);
    } catch (err) {
        await AuditLog.create({
            action: 'STRIPE_WEBHOOK_FAILURE',
            details: { error: err.message, headers: req.headers },
            ipAddress: req.ip,
            status: 'failure',
            errorMessage: err.message
        });
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    const paymentIntent = event.data.object;
    let paymentRecord;

    try {
        if (event.type === 'payment_intent.succeeded') {
            paymentRecord = await RentPayment.findOne({ transactionId: paymentIntent.id });
            if (paymentRecord && paymentRecord.status === 'pending') {
                paymentRecord.status = 'succeeded';
                paymentRecord.paymentDate = new Date(paymentIntent.created * 1000);
                if (paymentIntent.charges && paymentIntent.charges.data.length > 0) {
                    paymentRecord.receiptUrl = paymentIntent.charges.data[0].receipt_url;
                }
                await paymentRecord.save();

                const tenantUser = await User.findById(paymentRecord.tenant);
                if (tenantUser) {
                    await notificationService.sendEmail(
                        tenantUser.email,
                        'Rent Payment Successful',
                        `<p>Dear ${tenantUser.firstName},</p><p>Your rent payment of $${paymentRecord.amount} for lease ID ${paymentRecord.lease} was successful.</p><p>Transaction ID: ${paymentIntent.id}</p>${paymentRecord.receiptUrl ? `<p>View receipt: <a href="${paymentRecord.receiptUrl}">here</a></p>` : ''}`
                    );
                }
                await AuditLog.create({
                    user: paymentRecord.tenant,
                    action: 'RENT_PAYMENT_SUCCEEDED_WEBHOOK',
                    entity: 'RentPayment',
                    entityId: paymentRecord._id,
                    details: { transactionId: paymentIntent.id, amount: paymentIntent.amount / 100 },
                    status: 'success'
                });
            }
        } else if (event.type === 'payment_intent.payment_failed') {
            paymentRecord = await RentPayment.findOne({ transactionId: paymentIntent.id });
            if (paymentRecord) {
                paymentRecord.status = 'failed';
                await paymentRecord.save();

                const tenantUser = await User.findById(paymentRecord.tenant);
                 if (tenantUser) {
                    await notificationService.sendEmail(
                        tenantUser.email,
                        'Rent Payment Failed',
                        `<p>Dear ${tenantUser.firstName},</p><p>Your rent payment of $${paymentRecord.amount} for lease ID ${paymentRecord.lease} failed.</p><p>Reason: ${paymentIntent.last_payment_error ? paymentIntent.last_payment_error.message : 'Unknown'}</p><p>Please try again or contact support.</p>`
                    );
                }
                 await AuditLog.create({
                    user: paymentRecord.tenant,
                    action: 'RENT_PAYMENT_FAILED_WEBHOOK',
                    entity: 'RentPayment',
                    entityId: paymentRecord._id,
                    details: { transactionId: paymentIntent.id, error: paymentIntent.last_payment_error },
                    status: 'failure',
                    errorMessage: paymentIntent.last_payment_error ? paymentIntent.last_payment_error.message : 'Payment failed'
                });
            }
        }
        res.json({ received: true });
    } catch (error) {
         await AuditLog.create({
            action: 'STRIPE_WEBHOOK_PROCESSING_ERROR',
            entity: 'RentPayment',
            entityId: paymentRecord ? paymentRecord._id : null,
            details: { transactionId: paymentIntent.id, eventType: event.type, error: error.message, stack: error.stack },
            ipAddress: req.ip,
            status: 'failure',
            errorMessage: error.message
        });
        next(error);
    }
};

exports.getPaymentHistory = async (req, res, next) => {
    const { page = 1, limit = 10, status, leaseId, propertyId, tenantIdForAdmin } = req.query;
    let query = {};

    if (req.user.role === 'tenant') {
        query.tenant = req.user.id;
    } else if (req.user.role === 'landlord' || req.user.role === 'property_manager') {
        const userProperties = await Property.find({
             $or: [{ landlord: req.user.id }, { propertyManager: req.user.id }]
        }).select('_id');
        query.property = { $in: userProperties.map(p => p._id) };
        if (tenantIdForAdmin) query.tenant = tenantIdForAdmin;

    } else if (req.user.role === 'admin') {
        if (tenantIdForAdmin) query.tenant = tenantIdForAdmin;
    }


    if (status) query.status = status;
    if (leaseId) query.lease = leaseId;
    if (propertyId) query.property = propertyId;


    try {
        const payments = await RentPayment.find(query)
            .populate('lease', 'startDate endDate property')
            .populate('tenant', 'firstName lastName email')
            .populate('property', 'address.street')
            .sort({ paymentDate: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await RentPayment.countDocuments(query);

        res.json({
            payments,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalPayments: count
        });
    } catch (error) {
        next(error);
    }
};

exports.getPaymentById = async (req, res, next) => {
    try {
        const payment = await RentPayment.findById(req.params.id)
            .populate('lease', 'startDate endDate rentAmount property')
            .populate('tenant', 'firstName lastName email')
            .populate('property', 'address landlord propertyManager');

        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        const isOwner = payment.tenant._id.toString() === req.user.id;
        const isLandlord = req.user.role === 'landlord' && payment.property && payment.property.landlord && payment.property.landlord.toString() === req.user.id;
        const isPropertyManager = req.user.role === 'property_manager' && payment.property && (payment.property.landlord.toString() === req.user.id || (payment.property.propertyManager && payment.property.propertyManager.toString() === req.user.id));
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isLandlord && !isPropertyManager && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this payment record' });
        }

        res.json(payment);
    } catch (error) {
        next(error);
    }
};

exports.sendPaymentReminders = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reminderDaysBefore = 3;
        const reminderDate = new Date(today);
        reminderDate.setDate(today.getDate() + reminderDaysBefore);

        const overdueDaysStart = 1;
        const overdueStartDate = new Date(today);
        overdueStartDate.setDate(today.getDate() - overdueDaysStart);

        const leasesForReminder = await LeaseAgreement.find({
            isActive: true,
            endDate: { $gte: today },
            rentDueDate: { $gte: today.getDate(), $lte: reminderDate.getDate() },
        }).populate('tenants', 'email firstName');

        const leasesForOverdue = await LeaseAgreement.find({
            isActive: true,
            endDate: { $gte: overdueStartDate },
            rentDueDate: { $lt: today.getDate(), $gte: overdueStartDate.getDate()}
        }).populate('tenants', 'email firstName lastName');


        let reminderSentCount = 0;
        for (const lease of leasesForReminder) {
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const paymentMade = await RentPayment.findOne({
                lease: lease._id,
                status: 'succeeded',
                $expr: {
                    $and: [
                        { $eq: [{ $month: '$paymentDate' }, currentMonth + 1] },
                        { $eq: [{ $year: '$paymentDate' }, currentYear] }
                    ]
                }
            });

            if (!paymentMade) {
                for (const tenant of lease.tenants) {
                    await notificationService.sendRentReminderEmail(tenant.email, tenant.firstName, `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(lease.rentDueDate).padStart(2,'0')}`, lease.rentAmount);
                    reminderSentCount++;
                }
            }
        }
        
        let overdueSentCount = 0;
        for (const lease of leasesForOverdue) {
            const currentMonth = overdueStartDate.getMonth();
            const currentYear = overdueStartDate.getFullYear();

             const paymentMade = await RentPayment.findOne({
                lease: lease._id,
                status: 'succeeded',
                 $expr: {
                    $and: [
                        { $eq: [{ $month: '$paymentDate' }, currentMonth + 1] },
                        { $eq: [{ $year: '$paymentDate' }, currentYear] }
                    ]
                }
            });
            if (!paymentMade) {
                 for (const tenant of lease.tenants) {
                    await notificationService.sendOverdueRentEmail(tenant.email, `${tenant.firstName} ${tenant.lastName}`, `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(lease.rentDueDate).padStart(2,'0')}`, lease.rentAmount);
                    overdueSentCount++;
                }
            }
        }
        
        req.auditEntity = 'SystemTask';
        req.auditEntityId = null;


        res.json({ message: "Payment reminders processing completed.", remindersSent: reminderSentCount, overdueNoticesSent: overdueSentCount });
    } catch (error) {
        next(error);
    }
};

exports.manuallyRecordPayment = async (req, res, next) => {
    const { leaseId, tenantId, amount, paymentDate, paymentMethod, notes, transactionId } = req.body;

    try {
        const lease = await LeaseAgreement.findById(leaseId);
        if (!lease) return res.status(404).json({ message: "Lease not found." });

        const tenant = await User.findById(tenantId);
        if (!tenant) return res.status(404).json({ message: "Tenant not found." });

        if (!lease.tenants.map(t => t.toString()).includes(tenantId)) {
            return res.status(400).json({ message: "Tenant is not associated with this lease." });
        }


        const paymentRecord = await RentPayment.create({
            tenant: tenantId,
            lease: leaseId,
            property: lease.property,
            amount,
            paymentDate: paymentDate || new Date(),
            paymentMethod: paymentMethod || 'manual_cash_check',
            transactionId: transactionId || `manual_${Date.now()}`,
            status: 'succeeded',
            dueDate: new Date(new Date(paymentDate || Date.now()).getFullYear(), new Date(paymentDate || Date.now()).getMonth(), lease.rentDueDate),
            notes
        });

        req.auditEntity = 'RentPayment';
        req.auditEntityId = paymentRecord._id;

        await notificationService.sendEmail(
            tenant.email,
            'Rent Payment Recorded',
            `<p>Dear ${tenant.firstName},</p><p>A rent payment of $${amount} for lease ID ${leaseId} has been manually recorded on your behalf.</p><p>Payment Method: ${paymentMethod}</p>${notes ? `<p>Notes: ${notes}</p>` : ''}`
        );

        res.status(201).json(paymentRecord);

    } catch (error) {
        next(error);
    }
};