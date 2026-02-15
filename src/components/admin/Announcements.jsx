import React, { useState, useEffect } from 'react';
import { databases } from '../../lib/appwrite';
import { ID } from 'appwrite';
import { Send, Trash2, Edit, Plus } from 'lucide-react';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
      // Check if announcements table exists, if not show setup message
      if (!ANNOUNCEMENTS_TABLE_ID) {
        setLoading(false);
        return;
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        ANNOUNCEMENTS_TABLE_ID
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
          ...formData,
          createdAt: new Date().toISOString(),
          sentBy: 'admin',
        }
      );

      setFormData({
        title: '',
        message: '',
        targetAudience: 'all',
        type: 'info',
      });
      setShowForm(false);
      loadAnnouncements();
      alert('Announcement sent successfully!');
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Failed to send announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;

    try {
      await databases.deleteDocument(DATABASE_ID, ANNOUNCEMENTS_TABLE_ID, id);
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement');
    }
  };

  if (!ANNOUNCEMENTS_TABLE_ID) {
    return (
      <div className="announcements-setup">
        <h2>📢 Announcements System</h2>
        <div className="setup-instructions">
          <h3>Setup Required</h3>
          <p>
            Create an 'announcements' collection in Appwrite with the following
            attributes:
          </p>
          <ul>
            <li>
              <strong>title</strong> - String (required)
            </li>
            <li>
              <strong>message</strong> - String (required)
            </li>
            <li>
              <strong>targetAudience</strong> - String (all, free, pro)
            </li>
            <li>
              <strong>type</strong> - String (info, warning, success, promotion)
            </li>
            <li>
              <strong>createdAt</strong> - String (ISO date)
            </li>
            <li>
              <strong>sentBy</strong> - String
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
        <h2>Announcements</h2>
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
          <h3>Create Announcement</h3>
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
                  <option value="all">All Users</option>
                  <option value="free">Free Users Only</option>
                  <option value="pro">Pro Users Only</option>
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
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="send-btn">
                <Send size={16} />
                Send Announcement
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="announcements-list">
        {loading ? (
          <div className="loading-state">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <p>No announcements yet. Create your first one!</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.$id}
              className={`announcement-card ${announcement.type}`}
            >
              <div className="announcement-header">
                <h4>{announcement.title}</h4>
                <div className="announcement-actions">
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(announcement.$id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="announcement-message">{announcement.message}</p>
              <div className="announcement-meta">
                <span className="audience-badge">
                  {announcement.targetAudience}
                </span>
                <span className="date">
                  {new Date(announcement.createdAt).toLocaleDateString()}
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
