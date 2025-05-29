const User = require('../models/User');
const { getRedisClient } = require('../config/redisClient');
const { encrypt, decrypt } = require('../services/encryptionService'); // If encrypting user data fields
const upload = require('../middlewares/uploadMiddleware'); // For profile picture


exports.getUserProfile = async (req, res, next) => {
    const redisClient = getRedisClient();
    const cacheKey = `user:${req.user.id}`;
    try {
        if (redisClient && redisClient.isOpen) {
            const cachedUser = await redisClient.get(cacheKey);
            if (cachedUser) return res.json(JSON.parse(cachedUser));
        }
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (redisClient && redisClient.isOpen) {
            await redisClient.set(cacheKey, JSON.stringify(user), { EX: 3600 }); // Cache for 1 hour
        }
        res.json(user);
    } catch (error) { next(error); }
    res.status(501).json({ message: "Not Implemented" });
};

exports.updateUserProfile = async (req, res, next) => {
    const { firstName, lastName, phone, address } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phone = phone || user.phone;
        if (address) user.address = { ...user.address, ...address };
        
        if (req.file) { // For profile picture update
             user.profilePicture = `/uploads/profile_pictures/${req.file.filename}`; 
        }

        const updatedUser = await user.save();
        
        const redisClient = getRedisClient();
        const cacheKey = `user:${req.user.id}`;
        if (redisClient && redisClient.isOpen) await redisClient.del(cacheKey); // Invalidate cache

        req.auditEntity = 'User';
        req.auditEntityId = updatedUser._id;

        res.json({
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            address: updatedUser.address,
            profilePicture: updatedUser.profilePicture
        });
    } catch (error) { next(error); }
    res.status(501).json({ message: "Not Implemented" });
};

// Admin specific user management
exports.getAllUsers = async (req, res, next) => { res.status(501).json({ message: "Not Implemented" }); };
exports.getUserById = async (req, res, next) => { res.status(501).json({ message: "Not Implemented" }); };
exports.updateUserById = async (req, res, next) => { res.status(501).json({ message: "Not Implemented" }); };
exports.deleteUserById = async (req, res, next) => { res.status(501).json({ message: "Not Implemented" }); };
exports.changeUserRole = async (req, res, next) => { res.status(501).json({ message: "Not Implemented" }); };
exports.toggleUserActiveStatus = async (req, res, next) => { res.status(501).json({ message: "Not Implemented" }); };