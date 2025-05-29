require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redisClient');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utills/logger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tenantApplicationRoutes = require('./routes/tenantApplicationRoutes');
const rentPaymentRoutes = require('./routes/rentPaymentRoutes');
const leaseAgreementRoutes = require('./routes/leaseAgreementRoutes');
const maintenanceRequestRoutes = require('./routes/maintenanceRequestRoutes');
const { auditLogMiddleware } = require('./middleware/auditLogMiddleware');

const app = express();

connectDB();
connectRedis();

const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3000'];
if (process.env.NODE_ENV === 'development' && process.env.ADDITIONAL_DEV_CLIENT_URL) {
    allowedOrigins.push(process.env.ADDITIONAL_DEV_CLIENT_URL);
}

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));

app.use(helmet());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

app.use(auditLogMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', tenantApplicationRoutes);
app.use('/api/payments', rentPaymentRoutes);
app.use('/api/leases', leaseAgreementRoutes);
app.use('/api/maintenance-requests', maintenanceRequestRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('Rental Management System API is running...');
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
    logger.error(`Unhandled Rejection: ${err.message}`, { error: err });
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received. Closing http server.');
    server.close(() => {
        logger.info('Http server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received. Closing http server.');
    server.close(() => {
        logger.info('Http server closed.');
        process.exit(0);
    });
});