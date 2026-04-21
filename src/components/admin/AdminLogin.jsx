// src/components/admin/AdminLogin.jsx
import React, { useState } from 'react';
import { account } from '../../lib/appwrite';
import { Shield, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Query } from 'appwrite';
import { ADMIN_SESSION_KEY } from './ProtectedAdminRoute';
import './_adminLogin.scss';

const AdminLogin = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Always start a fresh session for admin login —
      // delete any existing session first (user or admin)
      try {
        await account.deleteSession('current');
      } catch (_) {}

      // Create a new email session
      await account.createEmailPasswordSession(
        formData.email,
        formData.password,
      );
      const user = await account.get();

      // Verify admin privileges
      const isAdmin = await verifyAdminAccess(user);

      if (!isAdmin) {
        // Not an admin — delete session and show error
        try {
          await account.deleteSession('current');
        } catch (_) {}
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      // ✅ Admin confirmed — set the admin session flag in sessionStorage.
      // This flag is independent of the user session flag, so logging in
      // here does NOT affect a regular user session in another tab.
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');

      if (onLoginSuccess) onLoginSuccess(user);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Admin login error:', err);
      if (err.code === 401) {
        setError('Invalid email or password');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyAdminAccess = async (user) => {
    // Method 1: Env variable whitelist
    const adminEmails =
      import.meta.env.VITE_ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
    if (adminEmails.includes(user.email)) return true;

    // Method 2: role field in users collection
    try {
      const { databases } = await import('../../lib/appwrite');
      const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

      const userDoc = await databases.listDocuments(
        DATABASE_ID,
        USERS_TABLE_ID,
        [Query.equal('email', user.email)],
      );

      if (userDoc.documents.length > 0) {
        return userDoc.documents[0].role === 'admin';
      }
    } catch (error) {
      console.error('Error verifying admin access:', error);
    }

    return false;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-shield-icon">
              <Shield size={40} />
            </div>
            <h1>CoreFX Admin</h1>
            <p>Welcome back, administrator!</p>
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@corepipsfx.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="admin-login-footer">
            <p className="security-notice">
              <Shield size={12} />
              Restricted to authorized administrators only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
