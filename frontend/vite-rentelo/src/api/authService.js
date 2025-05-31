import api from './index';

export const loginUser = (credentials) => {
  return api.post('/auth/login', credentials);
};

export const registerUser = (userData) => {
  return api.post('/auth/register', userData);
};

export const getProfile = () => {
  return api.get('/auth/me');
};

export const updateUserProfile = (profileData) => {
    if (profileData instanceof FormData) {
        return api.put('/users/profile', profileData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
    return api.put('/users/profile', profileData);
};

export const forgotPasswordRequest = (email) => {
    return api.post('/auth/forgotpassword', { email });
};

export const resetPasswordRequest = (token, password) => {
    return api.put(`/auth/resetpassword/${token}`, { password });
};