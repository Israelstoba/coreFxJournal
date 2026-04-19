// src/components/admin/ProtectedAdminRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { account, databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

// ── Separate session key for admin ────────────────────────
// Completely independent from the user session key (cfx_user_session_active).
// This means logging in/out as a regular user has ZERO effect on admin access,
// and vice versa.
const ADMIN_SESSION_KEY = 'cfx_admin_session_active';

const ProtectedAdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Step 1: Check if admin session flag exists in sessionStorage.
      // If the browser/tab was closed, sessionStorage is cleared and
      // the admin must log in again — even if Appwrite still has a session.
      const adminSessionActive = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (!adminSessionActive) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Step 2: Verify the Appwrite session is still valid
      const user = await account.get();
      if (!user) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Step 3: Verify admin privileges
      const hasAccess = await verifyAdminAccess(user);
      if (!hasAccess) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
      setIsAdmin(hasAccess);
    } catch (error) {
      console.error('Admin access check failed:', error);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      setIsAdmin(false);
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

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-large"></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  // Not admin → send to admin login, NOT user auth
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Export the session key so AdminLogin can set it on successful login
export { ADMIN_SESSION_KEY };
export default ProtectedAdminRoute;
