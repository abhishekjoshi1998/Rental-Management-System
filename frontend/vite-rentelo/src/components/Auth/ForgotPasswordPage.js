// src/pages/Auth/ForgotPasswordPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordRequest } from '../../api/authService';
import AlertMessage from '../../components/Common/AlertMessage';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await forgotPasswordRequest(email);
      setMessage('If an account with that email exists, a password reset link has been sent.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      <p>Enter your email address and we'll send you a link to reset your password.</p>
      {message && <AlertMessage type="success" message={message} />}
      {error && <AlertMessage type="error" message={error} />}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email Address:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <p>
        Remember your password? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;