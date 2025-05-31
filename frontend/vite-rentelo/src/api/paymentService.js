import api from './index';

export const initiatePaymentIntent = (paymentData) => {
  return api.post('/payments/initiate', paymentData);
};

export const getPaymentHistory = (params) => {
  return api.get('/payments/history', { params });
};

export const getPaymentDetails = (id) => {
  return api.get(`/payments/${id}`);
};

export const recordManualPayment = (paymentData) => {
    return api.post('/payments/manual-record', paymentData);
};