const AuditLog = require('../models/AuditLog');
const logger = require('../utills/logger');

const auditLogMiddleware = async (req, res, next) => {
    const originalSend = res.send;
    let responseBody;

    res.send = function (body) {
        responseBody = body;
        originalSend.call(this, body);
    };

    res.on('finish', async () => {
        // Avoid logging for GET requests or OPTIONS, or unimportant routes
        if (req.method === 'GET' || req.method === 'OPTIONS' || req.originalUrl === '/' || req.originalUrl.startsWith('/api/auth/check')) {
            return;
        }

        try {
            const logEntry = new AuditLog({
                user: req.user ? req.user.id : null,
                action: `${req.method} ${req.originalUrl}`,
                entity: req.auditEntity, // To be set in controllers for specific entities
                entityId: req.auditEntityId, // To be set in controllers
                details: {
                    requestBody: req.body,
                    params: req.params,
                    query: req.query,
                    // responseBody: responseBody ? JSON.parse(responseBody) : null, // Can be large
                    statusCode: res.statusCode,
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'],
                status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure',
                errorMessage: res.statusCode >= 400 ? (responseBody ? (JSON.parse(responseBody).message || responseBody) : 'Error occurred') : null
            });
            await logEntry.save();
        } catch (error) {
            logger.error('Failed to save audit log:', error);
        }
    });
    next();
};

module.exports = { auditLogMiddleware };