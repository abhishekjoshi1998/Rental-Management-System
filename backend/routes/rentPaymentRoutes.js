const express = require('express');
const {
    initiateRentPayment,
    stripeWebhookHandler,
    getPaymentHistory,
    getPaymentById,
    sendPaymentReminders,
    manuallyRecordPayment
} = require('../controllers/rentPaymentController');
const { protect, authorize } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.post('/webhook/stripe', express.raw({type: 'application/json'}), stripeWebhookHandler);

router.post('/initiate', protect, authorize('tenant'), initiateRentPayment);
router.get('/history', protect, authorize('tenant', 'landlord', 'property_manager', 'admin'), getPaymentHistory);
router.get('/:id', protect, authorize('tenant', 'landlord', 'property_manager', 'admin'), getPaymentById);

router.post('/reminders/send', protect, authorize('admin', 'system'), sendPaymentReminders);
router.post('/manual-record', protect, authorize('landlord', 'property_manager', 'admin'), manuallyRecordPayment);


module.exports = router;