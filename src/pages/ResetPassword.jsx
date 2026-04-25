// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff } from 'lucide-react';
import corefxLogo from '../assets/logo.png';
import './_authPage.scss';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completePasswordRecovery } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      setTimeout(() => navigate('/auth'), 3000);
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
              <img src={corefxLogo} alt="CoreFx" className="calculator-logo" />
            </div>
            <p>Password reset successful! Redirecting to login…</p>
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
            <img src={corefxLogo} alt="CoreFx" className="calculator-logo" />
          </div>
          <p>Enter your new password</p>
        </div>

        <div className="auth-form">
          {error && <div className="auth-server-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="auth-field password-field">
              <div className="auth-input-wrapper">
                <Lock size={20} className="auth-icon" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="has-toggle"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((p) => !p)}
                  className="toggle-password-btn"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-field password-field">
              <div className="auth-input-wrapper">
                <Lock size={20} className="auth-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="has-toggle"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="toggle-password-btn"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
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

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => navigate('/auth')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
