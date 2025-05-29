const Stripe = require('stripe');
const config = require('../config');
const logger = require('../utils/logger');

const stripe = Stripe(config.stripeSecretKey);

const createPaymentIntent = async (amount, currency = 'usd', customerId, metadata = {}) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Amount in cents
            currency: currency,
            customer: customerId, // Optional: Stripe customer ID
            metadata: metadata,   // e.g., { leaseId: '...', rentMonth: '...' }
            automatic_payment_methods: { enabled: true },
        });
        logger.info(`PaymentIntent created: ${paymentIntent.id} for amount ${amount}`);
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        };
    } catch (error) {
        logger.error('Error creating Stripe PaymentIntent:', error);
        throw error;
    }
};

const confirmPayment = async (paymentIntentId) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        logger.info(`PaymentIntent retrieved: ${paymentIntent.id}, status: ${paymentIntent.status}`);
        if (paymentIntent.status === 'succeeded') {
            return { success: true, paymentIntent };
        } else {
            return { success: false, status: paymentIntent.status, paymentIntent };
        }
    } catch (error) {
        logger.error('Error confirming Stripe payment:', error);
        throw error;
    }
};

const createStripeCustomer = async (email, name, phone) => {
    try {
        const customer = await stripe.customers.create({
            email,
            name,
            phone,
        });
        logger.info(`Stripe customer created: ${customer.id}`);
        return customer;
    } catch (error) {
        logger.error('Error creating Stripe customer:', error);
        throw error;
    }
};

const handleWebhook = (rawBody, signature) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Set this in .env
    let event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err) {
        logger.error(`Webhook signature verification failed: ${err.message}`);
        throw new Error('Webhook signature verification failed');
    }
    logger.info(`Received Stripe webhook event: ${event.type}`);
    return event;
};


module.exports = {
    createPaymentIntent,
    confirmPayment,
    createStripeCustomer,
    handleWebhook
};