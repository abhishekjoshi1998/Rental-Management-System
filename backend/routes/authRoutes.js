const express = require('express');
const {
    registerUser,
    loginUser,
    getMe,
    forgotPassword,
    resetPassword,
    checkAuth
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/check', protect, checkAuth); 
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);


module.exports = router;