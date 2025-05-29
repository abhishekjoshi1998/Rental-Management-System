const User = require('../models/User');
const Property = require('../models/property');
const { getRedisClient } = require('../config/redisClient');
const { encrypt, decrypt } = require('../services/encryptionService');
const { createStripeCustomer } = require('../services/paymentGatewayService');
const fs = require('fs');
const path = require('path');

exports.getUserProfile = async (req, res, next) => {
    const redisClient = getRedisClient();
    const cacheKey = `user:${req.user.id}`;
    try {
        if (redisClient && redisClient.isOpen) {
            const cachedUser = await redisClient.get(cacheKey);
            if (cachedUser) {
                const user = JSON.parse(cachedUser);
                if (user.ssn) user.ssn = decrypt(user.ssn);
                return res.json(user);
            }
        }
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.ssn) user.ssn = decrypt(user.ssn);

        if (redisClient && redisClient.isOpen) {
            const userToCache = JSON.parse(JSON.stringify(user));
            if (userToCache.ssn) userToCache.ssn = encrypt(userToCache.ssn);
            await redisClient.set(cacheKey, JSON.stringify(userToCache), { EX: 3600 });
        }
        res.json(user);
    } catch (error) {
        next(error);
    }
};

exports.updateUserProfile = async (req, res, next) => {
    const { firstName, lastName, phone, address, ssn } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phone = phone || user.phone;
        if (address) {
            user.address = { ...user.address, ...JSON.parse(address) };
        }
        if (ssn) {
            user.ssn = encrypt(ssn);
        }

        if (req.file) {
            if (user.profilePicture && user.profilePicture !== `/uploads/profile_pictures/${req.file.filename}`) {
                const oldPath = path.join(__dirname, '..', user.profilePicture);
                 if (fs.existsSync(oldPath) && !user.profilePicture.startsWith('http')) {
                    fs.unlink(oldPath, (err) => {
                        if (err) console.error("Error deleting old profile picture:", err);
                    });
                }
            }
            user.profilePicture = `/uploads/profile_pictures/${req.file.filename}`;
        }

        const updatedUser = await user.save();

        const redisClient = getRedisClient();
        const cacheKey = `user:${req.user.id}`;
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(cacheKey);
        }

        req.auditEntity = 'User';
        req.auditEntityId = updatedUser._id;

        const responseUser = { ...updatedUser.toObject() };
        delete responseUser.password;
        if (responseUser.ssn) responseUser.ssn = decrypt(responseUser.ssn);

        res.json(responseUser);
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    const { role, page = 1, limit = 10, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const users = await User.find(query)
            .select('-password -resetPasswordToken -resetPasswordExpire -ssn')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.countDocuments(query);

        res.json({
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalUsers: count
        });
    } catch (error) {
        next(error);
    }
};

exports.getUserById = async (req, res, next) => {
    const redisClient = getRedisClient();
    const cacheKey = `user:${req.params.id}`;
    try {
        if (redisClient && redisClient.isOpen) {
            const cachedUser = await redisClient.get(cacheKey);
            if (cachedUser) {
                const user = JSON.parse(cachedUser);
                if (user.ssn) user.ssn = decrypt(user.ssn);
                 return res.json(user);
            }
        }

        const user = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpire');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.ssn && (req.user.role === 'admin' || req.user.role === 'property_manager' || req.user.id === user.id.toString())) {
            user.ssn = decrypt(user.ssn);
        } else if (user.ssn) {
            user.ssn = "*********";
        }


        if (redisClient && redisClient.isOpen) {
            const userToCache = JSON.parse(JSON.stringify(user));
            if (userToCache.ssn && userToCache.ssn !== "*********") userToCache.ssn = encrypt(userToCache.ssn);
            await redisClient.set(cacheKey, JSON.stringify(userToCache), { EX: 3600 });
        }
        res.json(user);
    } catch (error) {
        next(error);
    }
};

exports.updateUserById = async (req, res, next) => {
    const { firstName, lastName, email, role, phone, isActive, address, ssn } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.firstName = firstName !== undefined ? firstName : user.firstName;
        user.lastName = lastName !== undefined ? lastName : user.lastName;
        user.email = email !== undefined ? email : user.email;
        user.role = role !== undefined ? role : user.role;
        user.phone = phone !== undefined ? phone : user.phone;
        user.isActive = isActive !== undefined ? isActive : user.isActive;
        if (address) user.address = { ...user.address, ...address };
        if (ssn) user.ssn = encrypt(ssn);


        if (req.file) {
             if (user.profilePicture && user.profilePicture !== `/uploads/profile_pictures/${req.file.filename}`) {
                const oldPath = path.join(__dirname, '..', user.profilePicture);
                 if (fs.existsSync(oldPath) && !user.profilePicture.startsWith('http')) {
                    fs.unlink(oldPath, (err) => {
                        if (err) console.error("Error deleting old profile picture:", err);
                    });
                }
            }
            user.profilePicture = `/uploads/profile_pictures/${req.file.filename}`;
        }


        const updatedUser = await user.save();

        const redisClient = getRedisClient();
        const cacheKeyUser = `user:${updatedUser._id}`;
        const cacheKeyProfile = `user:${updatedUser._id}`;
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(cacheKeyUser);
            await redisClient.del(cacheKeyProfile);
        }

        req.auditEntity = 'User';
        req.auditEntityId = updatedUser._id;

        const responseUser = { ...updatedUser.toObject() };
        delete responseUser.password;
        if (responseUser.ssn) responseUser.ssn = decrypt(responseUser.ssn);

        res.json(responseUser);
    } catch (error) {
        next(error);
    }
};

exports.deleteUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot delete admin user' });
        }

        await User.deleteOne({ _id: req.params.id });


        const redisClient = getRedisClient();
        const cacheKeyUser = `user:${req.params.id}`;
        const cacheKeyProfile = `user:${req.params.id}`;
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(cacheKeyUser);
            await redisClient.del(cacheKeyProfile);
        }

        req.auditEntity = 'User';
        req.auditEntityId = req.params.id;

        res.json({ message: 'User removed successfully' });
    } catch (error) {
        next(error);
    }
};

exports.changeUserRole = async (req, res, next) => {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['tenant', 'landlord', 'property_manager', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.email === process.env.ADMIN_EMAIL && role !== 'admin') {
             return res.status(400).json({ message: 'Cannot change role of primary admin.' });
        }


        user.role = role;
        await user.save();

        const redisClient = getRedisClient();
        const cacheKeyUser = `user:${userId}`;
        const cacheKeyProfile = `user:${userId}`;

        if (redisClient && redisClient.isOpen) {
            await redisClient.del(cacheKeyUser);
            await redisClient.del(cacheKeyProfile);
        }

        req.auditEntity = 'User';
        req.auditEntityId = user._id;


        res.status(200).json({ message: `User role updated to ${role}.`, user: { _id: user._id, email: user.email, role: user.role } });
    } catch (error) {
        next(error);
    }
};


exports.toggleUserActiveStatus = async (req, res, next) => {
    const { isActive } = req.body;
    const userId = req.params.id;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean value.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.email === process.env.ADMIN_EMAIL && !isActive) {
             return res.status(400).json({ message: 'Cannot deactivate primary admin account.' });
        }

        user.isActive = isActive;
        await user.save();

        const redisClient = getRedisClient();
        const cacheKeyUser = `user:${userId}`;
        const cacheKeyProfile = `user:${userId}`;
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(cacheKeyUser);
            await redisClient.del(cacheKeyProfile);
        }
        
        req.auditEntity = 'User';
        req.auditEntityId = user._id;

        res.status(200).json({ message: `User active status set to ${isActive}.`, user: { _id: user._id, email: user.email, isActive: user.isActive } });
    } catch (error) {
        next(error);
    }
};

exports.createStripeCustomerPortal = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.stripeCustomerId) {
            return res.status(400).json({ message: 'Stripe customer ID not found for this user.' });
        }
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.CLIENT_URL}/profile`,
        });
        res.json({ url: session.url });
    } catch (error) {
        next(error);
    }
};