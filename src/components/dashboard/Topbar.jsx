// components/dashboard/Topbar.jsx
import React, { useState, useEffect } from 'react';
import { FaBars } from 'react-icons/fa';
import {
  Bell,
  X,
  Info,
  AlertTriangle,
  CheckCircle,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const ANNOUNCEMENTS_TABLE = import.meta.env
  .VITE_APPWRITE_ANNOUNCEMENTS_TABLE_ID;
const USERS_TABLE = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

// ── localStorage helpers ──────────────────────────────────
const getReadIds = (userId) => {
  try {
    return JSON.parse(
      localStorage.getItem(`readAnnouncements_${userId}`) || '[]',
    );
  } catch {
    return [];
  }
};

const saveReadIds = (userId, ids) => {
  const merged = Array.from(new Set([...getReadIds(userId), ...ids]));
  localStorage.setItem(`readAnnouncements_${userId}`, JSON.stringify(merged));
};

// ── Audience filter ───────────────────────────────────────
// Determines whether a user should see a given announcement.
// userPlan:       'free' | 'pro'
// isPrivileged:   true if free user with at least one pro feature granted
const shouldSeeAnnouncement = (announcement, userPlan, isPrivileged) => {
  const audience = announcement.targetAudience;

  switch (audience) {
    case 'all':
      // Everyone sees it
      return true;

    case 'pro':
      // Full pro plan users only — privileged free users do NOT qualify
      return userPlan === 'pro';

    case 'free':
      // Pure free users only — no special access granted
      return userPlan === 'free' && !isPrivileged;

    case 'privileged':
      // Free users who have been granted at least one pro feature
      return userPlan === 'free' && isPrivileged;

    case 'free_all':
      // All free plan users: both pure free and privileged free
      return userPlan === 'free';

    default:
      return true;
  }
};

// ── Type helpers ──────────────────────────────────────────
const getTypeIcon = (type) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle size={18} />;
    case 'success':
      return <CheckCircle size={18} />;
    case 'promotion':
      return <Megaphone size={18} />;
    default:
      return <Info size={18} />;
  }
};

const getTypeStyles = (type) => {
  switch (type) {
    case 'warning':
      return {
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.25)',
      };
    case 'success':
      return {
        color: '#10b981',
        bg: 'rgba(16,185,129,0.08)',
        border: 'rgba(16,185,129,0.25)',
      };
    case 'promotion':
      return {
        color: '#a855f7',
        bg: 'rgba(168,85,247,0.08)',
        border: 'rgba(168,85,247,0.25)',
      };
    default:
      return {
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.08)',
        border: 'rgba(59,130,246,0.25)',
      };
  }
};

// ── Notification Bell ─────────────────────────────────────
const NotificationBell = ({ userId }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userPlan, setUserPlan] = useState('free');
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ── Fetch user profile (plan + feature flags) once on mount ──
  useEffect(() => {
    if (!userId || !USERS_TABLE) return;
    const fetchProfile = async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE, [
          Query.equal('userId', userId),
          Query.limit(1),
        ]);
        if (res.documents.length > 0) {
          const profile = res.documents[0];
          const plan = profile.plan || 'free';
          // A free user is "privileged" if any pro feature has been granted by admin
          const privileged =
            plan === 'free' &&
            !!(
              profile.hasJournalAccess ||
              profile.hasStrategiesAccess ||
              profile.hasBotAccess ||
              profile.hasAnalyticsAccess
            );
          setUserPlan(plan);
          setIsPrivileged(privileged);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };
    fetchProfile();
  }, [userId]);

  // ── Fetch & filter announcements whenever profile is ready ──
  useEffect(() => {
    if (!userId || !ANNOUNCEMENTS_TABLE) return;
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, userPlan, isPrivileged]);

  const fetchAnnouncements = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        ANNOUNCEMENTS_TABLE,
        [Query.orderDesc('$createdAt'), Query.limit(50)],
      );

      // Apply audience filter based on this user's plan and privilege status
      const filtered = response.documents.filter((a) =>
        shouldSeeAnnouncement(a, userPlan, isPrivileged),
      );

      setAnnouncements(filtered);
      const readIds = getReadIds(userId);
      setUnreadCount(filtered.filter((a) => !readIds.includes(a.$id)).length);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    // Mark all visible announcements as read
    saveReadIds(
      userId,
      announcements.map((a) => a.$id),
    );
    setUnreadCount(0);
  };

  const handleCloseModal = () => setShowModal(false);

  const totalCount = announcements.length;
  const hasUnread = unreadCount > 0;
  const badgeVisible = totalCount > 0;

  // RED  → unread count only
  // BLUE → total count (all read)
  const badgeColor = hasUnread ? '#ef4444' : '#0D3498';
  const badgeCount = hasUnread ? unreadCount : totalCount;

  return (
    <>
      {/* ── Bell button ── */}
      <button
        onClick={handleOpenModal}
        title="Notifications"
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#0D3498',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
        }}
      >
        <Bell size={22} />

        {badgeVisible && (
          <span
            style={{
              position: 'absolute',
              top: '0px',
              right: '0px',
              background: badgeColor,
              color: '#fff',
              fontSize: '10px',
              fontWeight: '700',
              borderRadius: '999px',
              minWidth: '17px',
              height: '17px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1,
              boxShadow: '0 0 0 2px var(--color-background-primary, #fff)',
              transition: 'background 0.3s ease',
            }}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {/* ── Modal ── */}
      {showModal && (
        <div
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-background-primary, #fff)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px 16px',
                borderBottom: '1px solid var(--color-border-tertiary)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <Bell
                  size={20}
                  style={{ color: 'var(--color-text-secondary)' }}
                />
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                  Notifications
                </h2>
                {totalCount > 0 && (
                  <span
                    style={{
                      background: 'var(--color-background-secondary)',
                      color: 'var(--color-text-secondary)',
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: '500',
                    }}
                  >
                    {totalCount}
                  </span>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  padding: '4px',
                  borderRadius: '6px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div
              style={{ overflowY: 'auto', flex: 1, padding: '16px 24px 24px' }}
            >
              {announcements.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 0',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <Bell
                    size={40}
                    style={{ opacity: 0.3, marginBottom: '12px' }}
                  />
                  <p style={{ margin: 0, fontSize: '15px' }}>
                    No notifications yet
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '13px',
                      opacity: 0.7,
                    }}
                  >
                    Check back later for updates
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {announcements.map((a) => {
                    const s = getTypeStyles(a.type);
                    const date = new Date(a.$createdAt);
                    const formattedDate = date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const formattedTime = date.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={a.$id}
                        style={{
                          background: s.bg,
                          border: `1px solid ${s.border}`,
                          borderLeft: `4px solid ${s.color}`,
                          borderRadius: '12px',
                          padding: '16px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            marginBottom: '8px',
                          }}
                        >
                          <span
                            style={{
                              color: s.color,
                              marginTop: '1px',
                              flexShrink: 0,
                            }}
                          >
                            {getTypeIcon(a.type)}
                          </span>
                          <div style={{ flex: 1 }}>
                            <h4
                              style={{
                                margin: '0 0 4px',
                                fontSize: '15px',
                                fontWeight: '600',
                                color: 'var(--color-text-primary)',
                              }}
                            >
                              {a.title}
                            </h4>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '14px',
                                color: 'var(--color-text-secondary)',
                                lineHeight: '1.5',
                              }}
                            >
                              {a.message}
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: s.color,
                              background: `${s.color}18`,
                              padding: '2px 8px',
                              borderRadius: '999px',
                            }}
                          >
                            {a.type}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--color-text-tertiary)',
                              marginLeft: 'auto',
                            }}
                          >
                            {formattedDate} · {formattedTime}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Main Topbar ───────────────────────────────────────────
const Topbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={toggleSidebar}>
        <FaBars />
      </button>
      <div
        className="topbar-right"
        style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
      >
        {ANNOUNCEMENTS_TABLE && user && <NotificationBell userId={user.$id} />}
        <span className="username">Hey, {firstName}</span>
        <div className="avatar">{firstName.charAt(0).toUpperCase()}</div>
      </div>
    </header>
  );
};

export default Topbar;
