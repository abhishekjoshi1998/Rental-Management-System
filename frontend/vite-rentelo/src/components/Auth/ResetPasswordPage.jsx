
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPasswordRequest } from '../../api/authService';
import AlertMessage from '../Common/AlertMessage';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await resetPasswordRequest(token, password);
      setMessage('Password has been reset successfully! You can now login.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      {message && <AlertMessage type="success" message={message} />}
      {error && <AlertMessage type="error" message={error} />}
      {!message && (
         <form onSubmit={handleSubmit}>
             <div>
             <label htmlFor="password">New Password:</label>
             <input
                 type="password"
                 id="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
             />
             </div>
             <div>
             <label htmlFor="confirmPassword">Confirm New Password:</label>
             <input
                 type="password"
                 id="confirmPassword"
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 required
             />
             </div>
             <button type="submit" disabled={loading}>
             {loading ? 'Resetting...' : 'Reset Password'}
             </button>
         </form>
      )}
      <p>
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
};

export default ResetPasswordPage;