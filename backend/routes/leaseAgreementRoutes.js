const express = require('express');
const {
    createLeaseAgreement,
    getLeaseAgreements,
    getLeaseAgreementById,
    updateLeaseAgreement,
    renewLeaseAgreement,
    requestLeaseSignature,
    handleSignatureWebhook,
    sendLeaseExpiryNotifications,
    terminateLease,
    deleteLeaseAgreement
} = require('../controllers/leaseAgreementController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, authorize('landlord', 'property_manager', 'admin'), createLeaseAgreement)
    .get(protect, authorize('landlord', 'property_manager', 'admin', 'tenant'), getLeaseAgreements);

router.route('/:id')
    .get(protect, authorize('landlord', 'property_manager', 'admin', 'tenant'), getLeaseAgreementById)
    .put(protect, authorize('landlord', 'property_manager', 'admin'), updateLeaseAgreement)
    .delete(protect, authorize('landlord', 'property_manager', 'admin'), deleteLeaseAgreement);

router.post('/:id/renew', protect, authorize('landlord', 'property_manager', 'admin'), renewLeaseAgreement);
router.post('/:id/terminate', protect, authorize('landlord', 'property_manager', 'admin'), terminateLease);


router.post('/:id/request-signature', protect, authorize('landlord', 'property_manager', 'admin'), requestLeaseSignature);
router.post('/signature/webhook', handleSignatureWebhook);

router.post('/notifications/expiry', protect, authorize('admin', 'system'), sendLeaseExpiryNotifications);


module.exports = router;