import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../../api/index';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const verifyAndSetUser = useCallback(async (currentToken) => {
    if (!currentToken) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      api.defaults.headers.common['Authorization'] = '';
      setLoading(false);
      return false;
    }

    try {
      const decoded = jwtDecode(currentToken);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        api.defaults.headers.common['Authorization'] = '';
        setLoading(false);
        return false;
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        try {
            const res = await api.get('/auth/me');
            localStorage.setItem('user', JSON.stringify(res.data));
            setUser(res.data);
        } catch (fetchError) {
            console.error("Failed to fetch user details after decoding token:", fetchError);
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            api.defaults.headers.common['Authorization'] = '';
            setLoading(false);
            return false;
        }
      }
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Token verification failed:", error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      api.defaults.headers.common['Authorization'] = '';
      setLoading(false);
      return false;
    }
  }, []);


  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      verifyAndSetUser(storedToken);
    } else {
      setLoading(false);
    }
  }, [verifyAndSetUser]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, ...userData } = response.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token: newToken, ...newUserData } = response.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUserData));
      setToken(newToken);
      setUser(newUserData);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return true;
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    api.defaults.headers.common['Authorization'] = '';
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAuthenticated, setUser, verifyAndSetUser }}>
      {children}
    </AuthContext.Provider>
  );
};