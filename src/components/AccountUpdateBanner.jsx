import React, { useState, useEffect } from 'react';
import { databases } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
// import './_accountUpdateBanner.scss';

const AccountUpdateBanner = () => {
  const { user } = useAuth();
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

  useEffect(() => {
    checkIfUpdateNeeded();
  }, [user]);

  const checkIfUpdateNeeded = async () => {
    if (!user) return;

    // Check if dismissed in this session
    const dismissedKey = `update-dismissed-${user.$id}`;
    if (sessionStorage.getItem(dismissedKey)) {
      setDismissed(true);
      return;
    }

    try {
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        USERS_TABLE_ID,
        user.$id
      );

      // Check if user is missing newly added required fields
      // Add your new required fields here (phone, dateOfBirth, address, etc.)
      const missingNewFields =
        !userDoc.phoneNumber || !userDoc.dateOfBirth || !userDoc.address;

      // Also check for old missing fields (feature flags, plan, status)
      const missingOldFields =
        userDoc.hasJournalAccess === undefined ||
        userDoc.hasStrategiesAccess === undefined ||
        userDoc.hasBotAccess === undefined ||
        !userDoc.plan ||
        !userDoc.status;

      setNeedsUpdate(missingNewFields || missingOldFields);
    } catch (error) {
      console.error('Error checking update status:', error);
      // If user document doesn't exist at all, they need update
      if (error.code === 404) {
        setNeedsUpdate(true);
      }
    }
  };

  const handleUpdate = async () => {
    // Redirect to profile/settings page where user can fill in missing info
    window.location.href = '/dashboard/profile';
  };
  const handleDismiss = () => {
    const dismissedKey = `update-dismissed-${user.$id}`;
    sessionStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
  };

  if (!needsUpdate || dismissed) return null;

  return (
    <div className="account-update-banner">
      <div className="banner-content">
        <div className="banner-icon">
          <AlertCircle size={24} />
        </div>
        <div className="banner-text">
          <h4>Account Update Required</h4>
          <p>
            We've added new fields to improve your experience. Please update
            your account with your phone number, date of birth, and address.
          </p>
        </div>
        <div className="banner-actions">
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="btn-update"
          >
            <RefreshCw size={18} />
            {updating ? 'Updating...' : 'Update Now'}
          </button>
          <button onClick={handleDismiss} className="btn-dismiss">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountUpdateBanner;
