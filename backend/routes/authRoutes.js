const express = require('express');
const {
    registerUser,
    loginUser,
    getMe,
    forgotPassword,
    resetPassword,
    checkAuth
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/check', protect, checkAuth); // To check if user is still authenticated on frontend
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);


module.exports = router;