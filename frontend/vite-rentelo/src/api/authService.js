// src/api/authService.js
import api from './index';

export const loginUser = (credentials) => {
  return api.post('/auth/login', credentials);
};

export const registerUser = (userData) => {
  return api.post('/auth/register', userData);
};

export const getProfile = () => {
  return api.get('/auth/me'); // Or /users/profile depending on your backend
};

export const updateUserProfile = (profileData) => {
    // For FormData if profilePicture is a file
    if (profileData instanceof FormData) {
        return api.put('/users/profile', profileData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
    return api.put('/users/profile', profileData);
};

