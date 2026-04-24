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

  useEffect(() => {
    if (userId && secret) {
      completeVerification(userId, secret);
    }
  }, [userId, secret]);

  const completeVerification = async (uid, sec) => {
    setStatus('verifying');

    // Step 1: Call updateVerification — ignore any throw,
    // Appwrite sometimes throws even on success.
    let updateError = null;
    try {
      await account.updateVerification(uid, sec);
    } catch (error) {
      console.warn('updateVerification threw:', error.message);
      updateError = error;
    }

    // Step 2: Try to get the current user to confirm verification.
    // If the user opened the link in a new tab (no session), account.get()
    // returns 401. In that case we trust updateVerification succeeded
    // (if it didn't throw a 400) and redirect them to sign in.
    try {
      const freshUser = await account.get();
      if (freshUser?.emailVerification) {
        await refreshUser();
        setStatus('success');
        setTimeout(
          () => navigate('/dashboard/journal', { replace: true }),
          2000,
        );
      } else {
        // Session exists but still not verified — link was invalid/expired
        setStatus('error');
        setMessage(
          'This link is invalid or has already been used. Please request a new one.',
        );
      }
    } catch (sessionError) {
      // 401 — no active session in this browser tab.
      // If updateVerification didn't throw a hard error, it worked.
      if (!updateError || updateError.code === 0) {
        // Treat as success — send them to sign in
        setStatus('success');
        setTimeout(() => navigate('/auth', { replace: true }), 2500);
      } else {
        setStatus('error');
        setMessage('Verification failed. The link may be invalid or expired.');
      }
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
        setMessage('Not verified yet — check your inbox and click the link.');
      }
    } catch (error) {
      navigate('/auth', { replace: true });
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
            <p className="verify-text" style={{ marginTop: '1rem' }}>
              Please wait…
            </p>
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
              Your email has been confirmed.
              <br />
              Taking you to sign in…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
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
            {user ? (
              <button
                className="auth-submit"
                onClick={handleResend}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Verification Email'}
              </button>
            ) : (
              <button className="auth-submit" onClick={() => navigate('/auth')}>
                Sign in to resend
              </button>
            )}
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
                Sign in with a different account
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Default: waiting state (no userId/secret in URL) ──
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
            <strong style={{ color: '#4caf50' }}>
              {user?.email ?? 'your email'}
            </strong>
            .
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

          {user && (
            <button
              className="auth-submit verify-resend-btn"
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend email'}
            </button>
          )}
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
