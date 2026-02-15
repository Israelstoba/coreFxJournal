import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { account, databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

const ProtectedAdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check if user is logged in
      const user = await account.get();

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Verify admin access
      const hasAccess = await verifyAdminAccess(user);
      setIsAdmin(hasAccess);
    } catch (error) {
      console.error('Admin access check failed:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const verifyAdminAccess = async (user) => {
    // Method 1: Check against environment variable whitelist
    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];
    if (adminEmails.includes(user.email)) {
      return true;
    }

    // Method 2: Check user document for admin role
    try {
      const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

      const userDoc = await databases.listDocuments(
        DATABASE_ID,
        USERS_TABLE_ID,
        [Query.equal('email', user.email)]
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

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
