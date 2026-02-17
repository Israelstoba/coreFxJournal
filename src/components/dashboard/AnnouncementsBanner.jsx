import React, { useState, useEffect } from 'react';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { X, Info, AlertTriangle, CheckCircle, Megaphone } from 'lucide-react';

const AnnouncementsBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const ANNOUNCEMENTS_TABLE_ID = import.meta.env
    .VITE_APPWRITE_ANNOUNCEMENTS_TABLE_ID;

  useEffect(() => {
    loadAnnouncements();

    // Load dismissed announcements from localStorage
    const dismissedIds = JSON.parse(
      localStorage.getItem('dismissed-announcements') || '[]'
    );
    setDismissed(dismissedIds);
  }, []);

  const loadAnnouncements = async () => {
    if (!ANNOUNCEMENTS_TABLE_ID) return;

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        ANNOUNCEMENTS_TABLE_ID,
        [Query.orderDesc('$createdAt'), Query.limit(5)]
      );

      setAnnouncements(response.documents);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const handleDismiss = (announcementId) => {
    const newDismissed = [...dismissed, announcementId];
    setDismissed(newDismissed);
    localStorage.setItem(
      'dismissed-announcements',
      JSON.stringify(newDismissed)
    );
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

  const visibleAnnouncements = announcements.filter(
    (announcement) => !dismissed.includes(announcement.$id)
  );

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="announcements-banner-container">
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.$id}
          className={`announcement-banner ${announcement.type || 'info'}`}
        >
          <div className="announcement-icon">{getIcon(announcement.type)}</div>
          <div className="announcement-content">
            <h4>{announcement.title}</h4>
            <p>{announcement.message}</p>
          </div>
          <button
            onClick={() => handleDismiss(announcement.$id)}
            className="announcement-dismiss"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementsBanner;
