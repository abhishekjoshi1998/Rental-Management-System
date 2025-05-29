const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = '..//utills/logger';
const { createStripeCustomer } = require('../services/paymentGatewayService');
const crypto = require('crypto');
const { sendEmail } = require('../services/notificationService');


const generateToken = (id) => {
    return jwt.sign({ id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
};

exports.registerUser = async (req, res, next) => {
    const { firstName, lastName, email, password, role, phone } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: role || 'tenant',
            phone
        });

        if (user) {
            // Optionally create a Stripe customer ID upon registration
            try {
                const stripeCustomer = await createStripeCustomer(user.email, `${user.firstName} ${user.lastName}`, user.phone);
                user.stripeCustomerId = stripeCustomer.id; // Assuming you add this field to User model
                await user.save();
            } catch (stripeError) {
                // Log error but don't fail registration
                // logger.error('Failed to create Stripe customer during registration:', stripeError);
            }


            req.auditEntity = 'User';
            req.auditEntityId = user._id;

            res.status(201).json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        next(error);
    }
};

exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            if (!user.isActive) {
                return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
            }
            res.json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with that email not found' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save({ validateBeforeSave: false });

        const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;
        const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>This link will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        try {
            await sendEmail(user.email, 'Password Reset Request', message);
            res.status(200).json({ message: 'Email sent with password reset instructions' });
        } catch (err) {
            // logger.error('Error sending password reset email:', err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    const resetToken = req.params.resetToken;
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    try {
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        
        req.auditEntity = 'User';
        req.auditEntityId = user._id;

        res.status(200).json({ message: 'Password reset successful', token: generateToken(user._id) });
    } catch (error) {
        next(error);
    }
};

exports.checkAuth = (req, res) => {
    if (req.user) {
        res.status(200).json({
            isAuthenticated: true,
            user: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                role: req.user.role,
            }
        });
    } else {
        res.status(401).json({ isAuthenticated: false, user: null });
    }
};