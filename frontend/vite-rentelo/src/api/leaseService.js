import api from './index';

export const getLeases = (params) => {
  return api.get('/leases', { params });
};

export const getLeaseDetails = (id) => {
  return api.get(`/leases/${id}`);
};

export const createLease = (leaseData) => {
  return api.post('/leases', leaseData);
};

export const updateLease = (id, leaseData) => {
  return api.put(`/leases/${id}`, leaseData);
};

export const renewLease = (id, renewalData) => {
  return api.post(`/leases/${id}/renew`, renewalData);
};

export const terminateLease = (id, terminationData) => {
  return api.post(`/leases/${id}/terminate`, terminationData);
};

export const requestLeaseSignatureApi = (id, signerEmail) => {
    return api.post(`/leases/${id}/request-signature`, { signerEmail });
};