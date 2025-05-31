import api from './index';

export const submitNewMaintenanceRequest = (requestData) => {
  return api.post('/maintenance-requests', requestData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getMaintenanceRequests = (params) => {
  return api.get('/maintenance-requests', { params });
};

export const getMaintenanceRequestDetails = (id) => {
  return api.get(`/maintenance-requests/${id}`);
};

export const updateMaintenanceRequestStatus = (id, updateData) => {
  return api.put(`/maintenance-requests/${id}`, updateData);
};

export const addMaintenanceFeedback = (id, feedbackData) => {
    return api.post(`/maintenance-requests/${id}/feedback`, feedbackData);
};