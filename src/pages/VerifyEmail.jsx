// src/pages/VerifyEmail.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { account } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import corefxLogo from '../assets/logo.png';
import { Mail, Send, CheckCircle, RefreshCw } from 'lucide-react';
import './_authPage.scss';
import './VerifyEmail.scss';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, resendVerification, refreshUser } = useAuth();

  const [status, setStatus] = useState('idle'); // 'idle' | 'sent' | 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  // If URL has userId + secret (user clicked email link), complete verification
  useEffect(() => {
    if (userId && secret) {
      completeVerification(userId, secret);
    }
  }, [userId, secret]);

  // ── Complete verification from email link ──────────────────
  const completeVerification = async (uid, sec) => {
    setStatus('verifying');
    let updateError = null;
    try {
      await account.updateVerification(uid, sec);
    } catch (error) {
      console.warn('updateVerification threw:', error.message);
      updateError = error;
    }

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
        setStatus('error');
        setMessage(
          'This link is invalid or has already been used. Please request a new one.',
        );
      }
    } catch (sessionError) {
      // No active session — user opened link in a new tab/browser
      // If updateVerification didn't throw a hard error, it worked
      if (!updateError || updateError.code === 0) {
        setStatus('success');
        setTimeout(() => navigate('/auth', { replace: true }), 2500);
      } else {
        setStatus('error');
        setMessage('Verification failed. The link may be invalid or expired.');
      }
    }
  };

  // ── Send verification email (first time) ──────────────────
  const handleSendEmail = async () => {
    setSending(true);
    setMessage('');
    try {
      await resendVerification();
      setStatus('sent');
      setMessage('');
      startCooldown();
    } catch (error) {
      setMessage(error.message || 'Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ── Resend verification email ─────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setSending(true);
    setMessage('');
    try {
      await resendVerification();
      setMessage('Email resent! Check your inbox.');
      startCooldown();
    } catch (error) {
      setMessage(error.message || 'Failed to resend. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const startCooldown = () => {
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
  };

  // ── Check if user has verified ────────────────────────────
  const handleCheckVerified = async () => {
    setChecking(true);
    setMessage('');
    try {
      const updated = await refreshUser();
      if (updated?.emailVerification) {
        navigate('/dashboard/journal', { replace: true });
      } else {
        setMessage('Not verified yet — check your inbox and click the link.');
      }
    } catch (error) {
      navigate('/auth', { replace: true });
    } finally {
      setChecking(false);
    }
  };

  // ── Verifying in progress (from email link) ───────────────
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

  // ── Verification succeeded ────────────────────────────────
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
              Taking you to the dashboard…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────
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
                disabled={resendCooldown > 0 || sending}
              >
                {sending
                  ? 'Sending…'
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Send New Link'}
              </button>
            ) : (
              <button className="auth-submit" onClick={() => navigate('/auth')}>
                Sign in to continue
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

  // ── IDLE: User has not sent the email yet ─────────────────
  if (status === 'idle') {
    return (
      <div className="auth-page">
        <div className="auth-container verify-container">
          <div className="auth-header">
            <div className="auth-logo">
              <img src={corefxLogo} alt="CoreFx" className="calculator-logo" />
            </div>
            <p>Verify your email</p>
          </div>

          <div className="auth-form verify-body">
            <div className="verify-icon">
              <Mail size={32} strokeWidth={1.5} />
            </div>

            <p className="verify-text">
              Click the button below to send a verification link to{' '}
              <strong style={{ color: '#4caf50' }}>
                {user?.email ?? 'your email'}
              </strong>
              .
            </p>

            {message && <div className="auth-server-error">{message}</div>}

            <button
              className="auth-submit verify-send-btn"
              onClick={handleSendEmail}
              disabled={sending}
            >
              {sending ? (
                'Sending…'
              ) : (
                <>
                  <Send
                    size={16}
                    style={{ marginRight: '8px', verticalAlign: 'middle' }}
                  />
                  Send Verification Email
                </>
              )}
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
                Sign in with a different account
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── SENT: Email has been sent, waiting for user to click link ──
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
          <div className="verify-icon verify-icon--sent">
            <Mail size={32} strokeWidth={1.5} />
          </div>

          <p className="verify-text">
            We sent a link to{' '}
            <strong style={{ color: '#4caf50' }}>
              {user?.email ?? 'your email'}
            </strong>
            .
            <br />
            Click it to activate your account, then come back here.
          </p>

          {message && (
            <div
              className={
                message.includes('resent') || message.includes('sent')
                  ? 'verify-success-msg'
                  : 'auth-server-error'
              }
            >
              {message}
            </div>
          )}

          {/* Primary CTA — check if verified */}
          <button
            className="auth-submit"
            onClick={handleCheckVerified}
            disabled={checking}
            style={{ marginBottom: '12px' }}
          >
            {checking ? (
              'Checking…'
            ) : (
              <>
                <CheckCircle
                  size={16}
                  style={{ marginRight: '8px', verticalAlign: 'middle' }}
                />
                I've clicked the link — continue
              </>
            )}
          </button>

          {/* Resend button — only visible after first send */}
          <button
            className="auth-submit verify-resend-btn"
            onClick={handleResend}
            disabled={resendCooldown > 0 || sending}
          >
            {sending ? (
              'Sending…'
            ) : resendCooldown > 0 ? (
              `Resend in ${resendCooldown}s`
            ) : (
              <>
                <RefreshCw
                  size={14}
                  style={{ marginRight: '8px', verticalAlign: 'middle' }}
                />
                Resend email
              </>
            )}
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
