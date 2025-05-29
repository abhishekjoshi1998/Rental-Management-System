const express = require('express');
const {
    submitApplication,
    getApplications,
    getApplicationById,
    updateApplicationStatus,
    uploadApplicationDocument,
    deleteApplicationDocument,
    initiateApplicationBackgroundCheck,
    getApplicationBackgroundCheckStatus
} = require('../controllers/tenantApplicationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

const applicationUploads = upload.fields([
    { name: 'identification_doc', maxCount: 2 },
    { name: 'income_proof_doc', maxCount: 3 },
    { name: 'reference_letter_doc', maxCount: 3 },
    { name: 'other_doc', maxCount: 5 }
]);


router.route('/')
    .post(protect, authorize('tenant'), applicationUploads, submitApplication)
    .get(protect, authorize('landlord', 'property_manager', 'admin', 'tenant'), getApplications);

router.route('/:id')
    .get(protect, authorize('landlord', 'property_manager', 'admin', 'tenant'), getApplicationById);

router.put('/:id/status', protect, authorize('landlord', 'property_manager', 'admin'), updateApplicationStatus);

router.post('/:id/documents', protect, authorize('tenant', 'admin', 'property_manager'), upload.array('documents', 5), uploadApplicationDocument);
router.delete('/:applicationId/documents/:documentId', protect, authorize('tenant', 'admin', 'property_manager'), deleteApplicationDocument);

router.post('/:id/background-check', protect, authorize('landlord', 'property_manager', 'admin'), initiateApplicationBackgroundCheck);
router.get('/:id/background-check/status', protect, authorize('landlord', 'property_manager', 'admin'), getApplicationBackgroundCheckStatus);


module.exports = router;