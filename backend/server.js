require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redisClient');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tenantApplicationRoutes = require('./routes/tenantApplicationRoutes');
const rentPaymentRoutes = require('./routes/rentPaymentRoutes');
const leaseAgreementRoutes = require('./routes/leaseAgreementRoutes');
const maintenanceRequestRoutes = require('./routes/maintenanceRequestRoutes');
const { auditLogMiddleware } = require('./middlewares/auditLogMiddleware');

const app = express();

connectDB();
connectRedis();

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.get('/', (req, res) => {
    res.send('Rental Management System API is running...');
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received. Closing http server.');
    server.close(() => {
        logger.info('Http server closed.');
        process.exit(0);
    });
});