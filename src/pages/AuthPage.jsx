import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './_authPage.scss';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setServerError('');

    try {
      if (isLogin) {
        // Login
        await login(formData.email, formData.password);
        navigate('/dashboard/journal');
      } else {
        // Register
        await register(formData.email, formData.password, formData.name);
        navigate('/dashboard/journal');
      }
    } catch (error) {
      console.error('Auth error:', error);

      // Handle specific Appwrite errors
      if (error.code === 401) {
        setServerError('Invalid email or password');
      } else if (error.code === 409) {
        setServerError('An account with this email already exists');
      } else if (error.message) {
        setServerError(error.message);
      } else {
        setServerError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setServerError('');
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <TrendingUp size={36} color="white" />
          </div>
          <h1>CoreFX</h1>
          <p>
            {isLogin ? 'Welcome back, trader!' : 'Start your trading journey'}
          </p>
        </div>

        {/* Form */}
        <div className="auth-form">
          {/* Server Error Message */}
          {serverError && (
            <div className="auth-server-error">{serverError}</div>
          )}

          {/* Name field (only for registration) */}
          {!isLogin && (
            <div className="auth-field">
              <div className="auth-input-wrapper">
                <User
                  size={20}
                  className={`auth-icon ${errors.name ? 'error' : ''}`}
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  className={errors.name ? 'error' : ''}
                />
              </div>
              {errors.name && <p className="auth-error">{errors.name}</p>}
            </div>
          )}

          {/* Email field */}
          <div className="auth-field">
            <div className="auth-input-wrapper">
              <Mail
                size={20}
                className={`auth-icon ${errors.email ? 'error' : ''}`}
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className={errors.email ? 'error' : ''}
              />
            </div>
            {errors.email && <p className="auth-error">{errors.email}</p>}
          </div>

          {/* Password field */}
          <div className="auth-field password-field">
            <div className="auth-input-wrapper">
              <Lock
                size={20}
                className={`auth-icon ${errors.password ? 'error' : ''}`}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className={`has-toggle ${errors.password ? 'error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password-btn"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="auth-error">{errors.password}</p>}
          </div>

          {/* Forgot Password (only for login) */}
          {isLogin && (
            <div className="auth-forgot">
              <a href="#" onClick={(e) => e.preventDefault()}>
                Forgot Password?
              </a>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="auth-submit"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>

          {/* Toggle Login/Register */}
          <div className="auth-toggle">
            <span className="auth-toggle-text">
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
            </span>
            <button
              type="button"
              onClick={toggleMode}
              className="auth-toggle-btn"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p>
            By continuing, you agree to CoreFX's Terms of Service and Privacy
            Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
