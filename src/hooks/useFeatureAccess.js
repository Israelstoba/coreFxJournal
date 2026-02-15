// import { useState, useEffect } from 'react';
// import { account, databases } from '../lib/appwrite';
// import { Query } from 'appwrite';

// export const useFeatureAccess = () => {
//   const [user, setUser] = useState(null);
//   const [userDoc, setUserDoc] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
//   const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

//   useEffect(() => {
//     checkAccess();
//   }, []);

//   const checkAccess = async () => {
//     try {
//       // Get current authenticated user
//       const currentUser = await account.get();
//       setUser(currentUser);

//       // Get user document with feature flags
//       const response = await databases.listDocuments(
//         DATABASE_ID,
//         USERS_TABLE_ID,
//         [Query.equal('email', currentUser.email)]
//       );

//       if (response.documents.length > 0) {
//         setUserDoc(response.documents[0]);
//       }
//     } catch (error) {
//       console.error('Error checking feature access:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const hasAccess = (feature) => {
//     if (!userDoc) return false;

//     // Check if user is suspended
//     if (userDoc.status === 'suspended') {
//       return false;
//     }

//     // Map feature names to database fields
//     const featureMap = {
//       journal: 'hasJournalAccess',
//       analytics: 'hasAnalyticsAccess',
//       strategies: 'hasStrategiesAccess',
//       bots: 'hasBotAccess',
//     };

//     const featureFlag = featureMap[feature];

//     // Check feature flag override first
//     if (userDoc[featureFlag] === true) {
//       return true;
//     }

//     // Check plan-based access
//     if (userDoc.plan === 'pro') {
//       // Pro users get access to all features by default
//       return true;
//     }

//     // Free users only get specific features
//     if (userDoc.plan === 'free' || !userDoc.plan) {
//       // Free users get calculator access by default
//       // Everything else requires explicit flag
//       return userDoc[featureFlag] === true;
//     }

//     return false;
//   };

//   const isPro = () => {
//     return userDoc?.plan === 'pro';
//   };

//   const isSuspended = () => {
//     return userDoc?.status === 'suspended';
//   };

//   return {
//     user,
//     userDoc,
//     loading,
//     hasAccess,
//     isPro,
//     isSuspended,
//     refresh: checkAccess,
//   };
// };

import { useState, useEffect } from 'react';
import { account, databases } from '../lib/appwrite';
import { Query } from 'appwrite';

export const useFeatureAccess = () => {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // Get current authenticated user
      const currentUser = await account.get();
      setUser(currentUser);

      // Get user document with feature flags
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_TABLE_ID,
        [Query.equal('email', currentUser.email)]
      );

      if (response.documents.length > 0) {
        setUserDoc(response.documents[0]);
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (feature) => {
    if (!userDoc) return false;

    // Check if user is suspended
    if (userDoc.status === 'suspended') {
      return false;
    }

    // Map feature names to database fields
    const featureMap = {
      journal: 'hasJournalAccess',
      analytics: 'hasAnalyticsAccess',
      strategies: 'hasStrategiesAccess',
      bots: 'hasBotAccess',
    };

    const featureFlag = featureMap[feature];

    // Check feature flag override FIRST (this is the admin toggle)
    if (userDoc[featureFlag] === true) {
      return true; // Admin granted access
    }

    // Check plan-based access
    if (userDoc.plan === 'pro') {
      // Pro users get access to all features by default
      return true;
    }

    // Free users need explicit flag to access premium features
    return false;
  };

  const isPro = () => {
    return userDoc?.plan === 'pro';
  };

  const isSuspended = () => {
    return userDoc?.status === 'suspended';
  };

  return {
    user,
    userDoc,
    loading,
    hasAccess,
    isPro,
    isSuspended,
    refresh: checkAccess,
  };
};
