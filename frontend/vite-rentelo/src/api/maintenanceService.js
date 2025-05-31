import api from './index';

export const submitNewMaintenanceRequest = (requestData) => {
  return api.post('/maintenance-requests', requestData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getMyMaintenanceRequests = (params) => {
  return api.get('/maintenance-requests', { params });
};