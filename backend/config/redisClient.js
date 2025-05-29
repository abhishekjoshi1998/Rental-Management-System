const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = async () => {
    redisClient = redis.createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));
    redisClient.on('connect', () => logger.info('Connected to Redis'));
    redisClient.on('reconnecting', () => logger.info('Reconnecting to Redis...'));
    redisClient.on('end', () => logger.info('Redis connection closed.'));

    try {
        await redisClient.connect();
    } catch (err) {
        logger.error('Failed to connect to Redis:', err);
    }
};

const getRedisClient = () => {
    if (!redisClient || !redisClient.isOpen) {
        logger.warn('Redis client not connected or not initialized. Attempting to reconnect.');
        connectRedis(); // Attempt to reconnect if not connected
    }
    return redisClient;
};

module.exports = { connectRedis, getRedisClient };