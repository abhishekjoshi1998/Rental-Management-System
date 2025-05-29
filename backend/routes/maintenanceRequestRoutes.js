const express = require('express');
const {
    submitMaintenanceRequest,
    getMaintenanceRequests,
    getMaintenanceRequestById,
    updateMaintenanceRequest,
    addMaintenanceRequestPhoto,
    deleteMaintenanceRequestPhoto,
    addFeedbackToMaintenanceRequest
} = require('../controllers/maintenanceRequestController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, authorize('tenant'), upload.array('photos', 5), submitMaintenanceRequest)
    .get(protect, authorize('tenant', 'landlord', 'property_manager', 'admin'), getMaintenanceRequests);

router.route('/:id')
    .get(protect, authorize('tenant', 'landlord', 'property_manager', 'admin'), getMaintenanceRequestById)
    .put(protect, authorize('tenant', 'landlord', 'property_manager', 'admin'), updateMaintenanceRequest);

router.post('/:id/photos', protect, authorize('tenant', 'landlord', 'property_manager', 'admin'), upload.array('photos', 5), addMaintenanceRequestPhoto);
router.delete('/:requestId/photos/:photoId', protect, authorize('tenant', 'landlord', 'property_manager', 'admin'), deleteMaintenanceRequestPhoto);

router.post('/:id/feedback', protect, authorize('tenant'), addFeedbackToMaintenanceRequest);


module.exports = router;