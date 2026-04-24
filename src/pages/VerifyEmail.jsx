// src/pages/VerifyEmail.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { account } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import corefxLogo from '../assets/logo.png';
import './_authPage.scss';
import './VerifyEmail.scss';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, resendVerification, refreshUser } = useAuth();

  const [status, setStatus] = useState('waiting'); // 'waiting' | 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  // ── On mount: if URL has userId + secret, complete verification ──
  useEffect(() => {
    if (userId && secret) {
      completeVerification(userId, secret);
    }
  }, [userId, secret]);

  const completeVerification = async (uid, sec) => {
    setStatus('verifying');
    try {
      await account.updateVerification(uid, sec);
    } catch (error) {
      // Appwrite sometimes throws even on success.
      // We check the actual account status regardless.
      console.warn(
        'updateVerification threw (may still have succeeded):',
        error.message,
      );
    }

    // Always check real verification status after the call —
    // this is the source of truth, not whether the call threw.
    try {
      const freshUser = await refreshUser();
      if (freshUser?.emailVerification) {
        setStatus('success');
        setTimeout(
          () => navigate('/dashboard/journal', { replace: true }),
          2000,
        );
      } else {
        // Genuinely failed — not yet verified on Appwrite
        setStatus('error');
        setMessage(
          'Verification failed. The link may be invalid or already used.',
        );
      }
    } catch (refreshError) {
      setStatus('error');
      setMessage(
        'Could not confirm verification status. Please try signing in.',
      );
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendVerification();
      setMessage('Verification email sent! Check your inbox.');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setMessage('Failed to send email. Please try again.');
    }
  };

  const handleCheckVerified = async () => {
    try {
      const updated = await refreshUser();
      if (updated?.emailVerification) {
        navigate('/dashboard/journal', { replace: true });
      } else {
        setMessage(
          "Your email isn't verified yet. Check your inbox and click the link.",
        );
      }
    } catch (error) {
      setMessage('Could not check status. Please try again.');
    }
  };

  // ── Verifying in progress ──
  if (status === 'verifying') {
    return (
      <div className="auth-page">
        <div className="auth-container verify-container">
          <div className="auth-header">
            <div className="auth-logo">
              <img src={corefxLogo} alt="CoreFx" className="calculator-logo" />
            </div>
            <p>Verifying your email…</p>
          </div>
          <div className="auth-form verify-body">
            <div className="verify-spinner" />
          </div>
        </div>
      </div>
    );
  }

  // ── Verification succeeded ──
  if (status === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-container verify-container">
          <div className="auth-header">
            <div className="auth-logo">
              <img src={corefxLogo} alt="CoreFx" className="calculator-logo" />
            </div>
            <p>Email verified!</p>
          </div>
          <div className="auth-form verify-body">
            <div className="verify-icon verify-icon--success">✓</div>
            <p className="verify-text">
              Your email has been confirmed. Taking you to the dashboard…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state (genuinely failed) ──
  if (status === 'error') {
    return (
      <div className="auth-page">
        <div className="auth-container verify-container">
          <div className="auth-header">
            <div className="auth-logo">
              <img src={corefxLogo} alt="CoreFx" className="calculator-logo" />
            </div>
            <p>Verification failed</p>
          </div>
          <div className="auth-form verify-body">
            <div className="verify-icon verify-icon--error">✕</div>
            {message && <div className="auth-server-error">{message}</div>}
            <button
              className="auth-submit"
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend Verification Email'}
            </button>
          </div>
          <div className="auth-footer">
            <p>
              Wrong account?{' '}
              <button
                className="auth-toggle-btn"
                onClick={() => navigate('/auth')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Sign out & sign in again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Default: waiting state ──
  return (
    <div className="auth-page">
      <div className="auth-container verify-container">
        <div className="auth-header">
          <div className="auth-logo">
            <img src={corefxLogo} alt="CoreFx" className="calculator-logo" />
          </div>
          <p>Check your inbox</p>
        </div>

        <div className="auth-form verify-body">
          <div className="verify-icon">✉</div>

          <p className="verify-text">
            We sent a verification link to{' '}
            <strong style={{ color: '#4caf50' }}>{user?.email}</strong>.
            <br />
            Click the link in the email to activate your account.
          </p>

          {message && (
            <div
              className={
                message.includes('sent')
                  ? 'verify-success-msg'
                  : 'auth-server-error'
              }
            >
              {message}
            </div>
          )}

          <button
            className="auth-submit"
            onClick={handleCheckVerified}
            style={{ marginBottom: '12px' }}
          >
            I've verified — continue
          </button>

          <button
            className="auth-submit verify-resend-btn"
            onClick={handleResend}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend email'}
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Wrong email?{' '}
            <button
              className="auth-toggle-btn"
              onClick={() => navigate('/auth')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Sign in with a different account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
