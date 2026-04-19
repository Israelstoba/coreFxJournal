// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { account, databases } from '../lib/appwrite';
import { ID } from 'appwrite';

const AuthContext = createContext();

// ── Session persistence key ───────────────────────────────
// We store a flag in sessionStorage (NOT localStorage).
// sessionStorage is cleared automatically when the browser tab/window closes,
// so users must log in again each new browser session.
const SESSION_KEY = 'cfx_user_session_active';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // If no session flag in sessionStorage, treat as logged out
      // even if Appwrite still has a valid session cookie.
      const sessionActive = sessionStorage.getItem(SESSION_KEY);
      if (!sessionActive) {
        // Delete any lingering Appwrite session so it's truly clean
        try {
          await account.deleteSession('current');
        } catch (_) {}
        setUser(null);
        setLoading(false);
        return;
      }

      // Session flag exists — verify with Appwrite
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      // Appwrite session expired or invalid
      sessionStorage.removeItem(SESSION_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────
  const register = async (email, password, name) => {
    try {
      try {
        await account.deleteSession('current');
      } catch (_) {}

      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();

      // Mark session active for this browser tab
      sessionStorage.setItem(SESSION_KEY, 'true');
      setUser(currentUser);

      // Send verification email
      try {
        await account.createVerification(
          `${window.location.origin}/verify-email`,
        );
      } catch (error) {
        console.error('Failed to send verification email:', error);
      }

      // Create user document in DB
      const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

      let retries = 3;
      while (retries > 0) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            USERS_TABLE_ID,
            currentUser.$id,
            {
              userId: currentUser.$id,
              email,
              name: name || 'Unknown',
              plan: 'free',
              status: 'active',
              lastActive: new Date().toISOString(),
              hasJournalAccess: false,
              hasStrategiesAccess: false,
              hasBotAccess: false,
              hasAnalyticsAccess: false,
            },
          );
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error(
              '❌ Failed to create user document after all retries',
            );
            alert(
              '⚠️ Registration completed but profile setup failed. Please try logging in.',
            );
          } else {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }
    } catch (error) {
      throw error;
    }
  };

  // ── Login ─────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      // Check for existing Appwrite session
      try {
        const existingUser = await account.get();
        if (existingUser) {
          sessionStorage.setItem(SESSION_KEY, 'true');
          setUser(existingUser);
          return;
        }
      } catch (_) {}

      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();

      // Mark session active for this browser tab
      sessionStorage.setItem(SESSION_KEY, 'true');
      setUser(currentUser);

      // Upsert user document
      const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

      try {
        await databases.getDocument(
          DATABASE_ID,
          USERS_TABLE_ID,
          currentUser.$id,
        );
        await databases.updateDocument(
          DATABASE_ID,
          USERS_TABLE_ID,
          currentUser.$id,
          {
            lastActive: new Date().toISOString(),
          },
        );
      } catch (error) {
        if (error.code === 404) {
          let retries = 3;
          while (retries > 0) {
            try {
              await databases.createDocument(
                DATABASE_ID,
                USERS_TABLE_ID,
                currentUser.$id,
                {
                  userId: currentUser.$id,
                  email: currentUser.email,
                  name: currentUser.name || 'Unknown',
                  plan: 'free',
                  status: 'active',
                  lastActive: new Date().toISOString(),
                  hasJournalAccess: false,
                  hasStrategiesAccess: false,
                  hasBotAccess: false,
                  hasAnalyticsAccess: false,
                },
              );
              break;
            } catch (createError) {
              retries--;
              if (retries > 0) await new Promise((r) => setTimeout(r, 1000));
            }
          }
        }
      }
    } catch (error) {
      throw error;
    }
  };

  // ── Logout ────────────────────────────────────────────────
  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch (_) {}
    // Always clear the session flag regardless of Appwrite response
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  // ── Password helpers ──────────────────────────────────────
  const updatePassword = async (newPassword, oldPassword) => {
    await account.updatePassword(newPassword, oldPassword);
    return { success: true };
  };

  const sendPasswordRecovery = async (email) => {
    const resetUrl = `${window.location.origin}/reset-password`;
    await account.createRecovery(email, resetUrl);
    return { success: true };
  };

  const completePasswordRecovery = async (userId, secret, newPassword) => {
    await account.updateRecovery(userId, secret, newPassword);
    return { success: true };
  };

  const updateUserName = async (name) => {
    await account.updateName(name);
    const updatedUser = await account.get();
    setUser(updatedUser);
    return { success: true };
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updatePassword,
    sendPasswordRecovery,
    completePasswordRecovery,
    updateUserName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
