const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    changeUserRole,
    toggleUserActiveStatus,
    createStripeCustomerPortal // Assuming you added this to userController
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware'); 
const upload = require('../middleware/uploadMiddleware'); 

const router = express.Router();

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, upload.single('profilePicture'), updateUserProfile);

router.post('/stripe-portal', protect, createStripeCustomerPortal); 

// Admin routes
router.route('/')
    .get(protect, authorize('admin', 'property_manager'), getAllUsers);

router.route('/:id')
    .get(protect, authorize('admin', 'property_manager'), getUserById)
    .put(protect, authorize('admin', 'property_manager'), upload.single('profilePicture'), updateUserById) 
    .delete(protect, authorize('admin'), deleteUserById);

router.put('/:id/role', protect, authorize('admin'), changeUserRole);
router.put('/:id/status', protect, authorize('admin', 'property_manager'), toggleUserActiveStatus);

module.exports = router;