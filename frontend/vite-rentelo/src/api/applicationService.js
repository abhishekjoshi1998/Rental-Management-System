import api from './index';

export const submitNewApplication = (applicationData) => {
  return api.post('/applications', applicationData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getApplications = (params) => {
  return api.get('/applications', { params });
};

export const getApplicationDetails = (id) => {
  return api.get(`/applications/${id}`);
};

export const updateApplicationStatus = (id, statusData) => {
  return api.put(`/applications/${id}/status`, statusData);
};

export const initiateBackgroundCheckForApp = (id) => {
  return api.post(`/applications/${id}/background-check`);
};