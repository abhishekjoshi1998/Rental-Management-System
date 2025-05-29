const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    changeUserRole,
    toggleUserActiveStatus
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');


const router = express.Router();

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, upload.single('profilePicture'), updateUserProfile);

// Admin routes
router.route('/')
    .get(protect, authorize('admin', 'property_manager'), getAllUsers);

router.route('/:id')
    .get(protect, authorize('admin', 'property_manager'), getUserById)
    .put(protect, authorize('admin', 'property_manager'), updateUserById)
    .delete(protect, authorize('admin'), deleteUserById);

router.put('/:id/role', protect, authorize('admin'), changeUserRole);
router.put('/:id/status', protect, authorize('admin', 'property_manager'), toggleUserActiveStatus);

module.exports = router;