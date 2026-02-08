// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, TrendingUp } from 'lucide-react';
import './_authPage.scss';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completePasswordRecovery } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    if (!userId || !secret) {
      setError('Invalid password reset link');
    }
  }, [userId, secret]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await completePasswordRecovery(userId, secret, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">
              <TrendingUp size={36} color="white" />
            </div>
            <h1>Password Reset Successful!</h1>
            <p>Redirecting you to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <TrendingUp size={36} color="white" />
          </div>
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>

        <div className="auth-form">
          {error && <div className="auth-server-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <div className="auth-input-wrapper">
                <Lock size={20} className="auth-icon" />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="has-toggle"
                />
              </div>
            </div>

            <div className="auth-field password-field">
              <div className="auth-input-wrapper">
                <Lock size={20} className="auth-icon" />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="has-toggle"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !userId || !secret}
              className="auth-submit"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
