import api from './index';

export const getProperties = (params) => {
  return api.get('/properties', { params });
};

export const getPropertyById = (id) => {
  return api.get(`/properties/${id}`);
};

export const createProperty = (propertyData) => {
  return api.post('/properties', propertyData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateProperty = (id, propertyData) => {
  return api.put(`/properties/${id}`, propertyData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteProperty = (id) => {
  return api.delete(`/properties/${id}`);
};