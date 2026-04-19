import React, { useState, useEffect } from 'react';
import { databases } from '../../lib/appwrite';
import { ID, Query } from 'appwrite';
import {
  Send,
  Trash2,
  Plus,
  Eye,
  Info,
  AlertTriangle,
  CheckCircle,
  Megaphone,
} from 'lucide-react';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    type: 'info',
  });

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const ANNOUNCEMENTS_TABLE_ID = import.meta.env
    .VITE_APPWRITE_ANNOUNCEMENTS_TABLE_ID;

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      if (!ANNOUNCEMENTS_TABLE_ID) {
        setLoading(false);
        return;
      }
      const response = await databases.listDocuments(
        DATABASE_ID,
        ANNOUNCEMENTS_TABLE_ID,
        [Query.orderDesc('$createdAt')],
      );
      setAnnouncements(response.documents);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await databases.createDocument(
        DATABASE_ID,
        ANNOUNCEMENTS_TABLE_ID,
        ID.unique(),
        {
          title: formData.title,
          message: formData.message,
          targetAudience: formData.targetAudience,
          type: formData.type,
          sentBy: 'admin',
        },
      );
      setFormData({
        title: '',
        message: '',
        targetAudience: 'all',
        type: 'info',
      });
      setShowForm(false);
      setPreviewMode(false);
      loadAnnouncements();
      alert('✅ Announcement sent! Users will see it in their dashboard.');
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Failed to send announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement? Users will no longer see it.'))
      return;
    try {
      await databases.deleteDocument(DATABASE_ID, ANNOUNCEMENTS_TABLE_ID, id);
      loadAnnouncements();
      alert('Announcement deleted successfully');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'success':
        return <CheckCircle size={20} />;
      case 'promotion':
        return <Megaphone size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'warning':
        return '#f59e0b';
      case 'success':
        return '#10b981';
      case 'promotion':
        return '#a855f7';
      default:
        return '#3b82f6';
    }
  };

  // Human-readable label for each audience value
  const audienceLabel = (value) => {
    switch (value) {
      case 'all':
        return '👥 Everyone';
      case 'free':
        return '🆓 Free users only (no special access)';
      case 'privileged':
        return '⭐ Privileged free users only';
      case 'free_all':
        return '🆓⭐ All free plan users (free + privileged)';
      case 'pro':
        return '👑 Pro users only';
      default:
        return value;
    }
  };

  if (!ANNOUNCEMENTS_TABLE_ID) {
    return (
      <div className="announcements-setup">
        <h2>📢 Announcements System</h2>
        <div className="setup-instructions">
          <h3>Setup Required</h3>
          <p>
            Create an 'announcements' collection in Appwrite with these
            attributes:
          </p>
          <ul>
            <li>
              <strong>title</strong> — String (required)
            </li>
            <li>
              <strong>message</strong> — String (required)
            </li>
            <li>
              <strong>targetAudience</strong> — String. Allowed values:
              <code> all, free, privileged, free_all, pro</code>
            </li>
            <li>
              <strong>type</strong> — String (info, warning, success, promotion)
            </li>
            <li>
              <strong>sentBy</strong> — String
            </li>
          </ul>
          <p>Then add the collection ID to your .env file:</p>
          <code>VITE_APPWRITE_ANNOUNCEMENTS_TABLE_ID=your_collection_id</code>
        </div>
      </div>
    );
  }

  return (
    <div className="announcements-management">
      <div className="announcements-header">
        <div>
          <h2>Announcements</h2>
          <p className="subtitle">Send notifications to your users</p>
        </div>
        <button
          className="create-announcement-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          New Announcement
        </button>
      </div>

      {showForm && (
        <div className="announcement-form-card">
          <div className="form-header">
            <h3>Create Announcement</h3>
            <button
              type="button"
              className="preview-btn"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye size={16} />
              {previewMode ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>

          {previewMode && formData.title && formData.message && (
            <div className="announcement-preview">
              <h4>📺 User View Preview:</h4>
              <div className={`preview-banner ${formData.type}`}>
                <div
                  className="preview-icon"
                  style={{ color: getTypeColor(formData.type) }}
                >
                  {getIcon(formData.type)}
                </div>
                <div className="preview-content">
                  <h5>{formData.title}</h5>
                  <p>{formData.message}</p>
                </div>
                <div className="preview-dismiss">×</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="New Feature Launch!"
                required
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="We're excited to announce..."
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Target Audience</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAudience: e.target.value })
                  }
                >
                  <option value="all">👥 Everyone</option>
                  <option value="free">
                    🆓 Free users only (no special access)
                  </option>
                  <option value="privileged">
                    ⭐ Privileged free users only
                  </option>
                  <option value="free_all">
                    🆓⭐ All free plan users (free + privileged)
                  </option>
                  <option value="pro">👑 Pro users only</option>
                </select>
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="info">ℹ️ Info (Blue)</option>
                  <option value="warning">⚠️ Warning (Yellow)</option>
                  <option value="success">✅ Success (Green)</option>
                  <option value="promotion">📢 Promotion (Purple)</option>
                </select>
              </div>
            </div>

            {/* Audience description hint */}
            <div
              style={{
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#3b82f6',
                marginBottom: '16px',
              }}
            >
              {formData.targetAudience === 'all' &&
                '📣 This will be shown to ALL users regardless of plan.'}
              {formData.targetAudience === 'free' &&
                '🆓 Only shown to free users who have NOT been granted any special feature access.'}
              {formData.targetAudience === 'privileged' &&
                '⭐ Only shown to free users who have been granted at least one pro feature by an admin.'}
              {formData.targetAudience === 'free_all' &&
                '🆓⭐ Shown to all users on the free plan — both regular free and privileged free users. Pro users will NOT see this.'}
              {formData.targetAudience === 'pro' &&
                '👑 Only shown to users on the full Pro plan. Privileged free users will NOT see this.'}
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="send-btn">
                <Send size={16} />
                Send to{' '}
                {audienceLabel(formData.targetAudience).replace(/^.{2}/, '')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="announcements-stats">
        <div className="stat-card">
          <h4>Total Sent</h4>
          <p className="stat-number">{announcements.length}</p>
        </div>
        <div className="stat-card">
          <h4>Active (last 7 days)</h4>
          <p className="stat-number">
            {
              announcements.filter((a) => {
                const daysSince =
                  (Date.now() - new Date(a.$createdAt)) / (1000 * 60 * 60 * 24);
                return daysSince < 7;
              }).length
            }
          </p>
        </div>
      </div>

      <div className="announcements-list">
        {loading ? (
          <div className="loading-state">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <Megaphone size={48} style={{ opacity: 0.3 }} />
            <p>No announcements yet. Create your first one!</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.$id}
              className={`announcement-card ${announcement.type}`}
            >
              <div className="announcement-header">
                <div className="announcement-title-section">
                  <div
                    className="announcement-type-icon"
                    style={{ color: getTypeColor(announcement.type) }}
                  >
                    {getIcon(announcement.type)}
                  </div>
                  <h4>{announcement.title}</h4>
                </div>
                <div className="announcement-actions">
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(announcement.$id)}
                    title="Delete announcement"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="announcement-message">{announcement.message}</p>
              <div className="announcement-meta">
                <span
                  className={`audience-badge ${announcement.targetAudience}`}
                >
                  {audienceLabel(announcement.targetAudience)}
                </span>
                <span className={`type-badge ${announcement.type}`}>
                  {announcement.type}
                </span>
                <span className="date">
                  📅 {new Date(announcement.$createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;
