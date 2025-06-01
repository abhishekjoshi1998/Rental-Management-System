import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../../api/index'; 
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom'; 

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); 
  const navigate = useNavigate(); 

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    api.defaults.headers.common['Authorization'] = '';
    console.log("User logged out from AuthContext.");
    navigate('/login'); // Navigate to login on logout
  }, [navigate]);

  const verifyAndSetUser = useCallback(async (currentToken) => {
    if (!currentToken) {
      setUser(null);
      setToken(null);
      // No need to remove from localStorage here as this function is called *with* a token
      api.defaults.headers.common['Authorization'] = '';
      setLoading(false);
      return false;
    }

    try {
      const decoded = jwtDecode(currentToken);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        console.log("Token expired.");
        logout(); // Use the logout function to clear everything and navigate
        setLoading(false);
        return false;
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      // Try to fetch user from localStorage first
      const storedUserString = localStorage.getItem('user');
      if (storedUserString) {
          try {
              const storedUser = JSON.parse(storedUserString);
              setUser(storedUser);
          } catch (e) {
              // Invalid JSON in localStorage, clear it and fetch
              localStorage.removeItem('user');
              // Fall through to fetch from API
          }
      }
      
      // If user is not set from localStorage or to refresh/verify user data
      if (!user || !storedUserString) { // Fetch if no user or localStorage was empty/invalid
          try {
            console.log("No user in state or localStorage, fetching /auth/me");
            const res = await api.get('/auth/me');
            localStorage.setItem('user', JSON.stringify(res.data));
            setUser(res.data);
          } catch (fetchError) {
            console.error("Failed to fetch user details with token:", fetchError.response?.data?.message || fetchError.message);
            logout(); // If /auth/me fails with a valid-looking token, something is wrong
            setLoading(false);
            return false;
          }
      }

      setLoading(false);
      return true;
    } catch (error) {
      console.error("Token verification/decoding failed:", error);
      logout(); // Invalid token, logout
      setLoading(false);
      return false;
    }
  }, [logout, user]); // Added `user` to dependency array for the refresh logic


  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    console.log("AuthContext useEffect: storedToken =", storedToken);
    if (storedToken) {
      setToken(storedToken); // Set token state
      verifyAndSetUser(storedToken);
    } else {
      setLoading(false); // No token, so not loading user data
    }
  }, []); // Run only once on mount to check initial token

  // Listener for 401 errors from api interceptor
  useEffect(() => {
    const handleAuthError = (event) => {
      console.log("AuthContext caught 'auth-error-401' event. Logging out.");
      logout();
    };

    window.addEventListener('auth-error-401', handleAuthError);
    return () => {
      window.removeEventListener('auth-error-401', handleAuthError);
    };
  }, [logout]); // Depend on logout callback

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, ...userData } = response.data; // Assuming backend returns user data without password
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData)); // Store user data
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return true;
    } catch (error) {
      console.error('Login failed in AuthContext:', error.response?.data?.message || error.message);
      throw error; // Re-throw for the form to handle displaying the error
    }
  };

  const register = async (userDataToRegister) => {
    try {
      const response = await api.post('/auth/register', userDataToRegister);
      // Assuming successful registration also logs the user in or returns a token + user data
      const { token: newToken, ...newUserData } = response.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUserData));
      setToken(newToken);
      setUser(newUserData);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return true;
    } catch (error) {
      // This console.error is the one you saw at line 109 (or similar)
      console.error('Registration failed in AuthContext:', error.response?.data?.message || error.message);
      throw error; // Re-throw for the form to handle displaying the error
    }
  };

  // This is a derived state, no need to put it in useState
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAuthenticated, setUser, verifyAndSetUser }}>
      {!loading && children}
      {loading && <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5em'}}>Initializing App...</div>}
    </AuthContext.Provider>
  );
};