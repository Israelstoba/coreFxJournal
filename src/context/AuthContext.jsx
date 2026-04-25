// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { account, databases } from '../lib/appwrite';
import { ID } from 'appwrite';

const AuthContext = createContext();

const SESSION_KEY = 'cfx_user_session_active';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
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
      const sessionActive = localStorage.getItem(SESSION_KEY);
      if (!sessionActive) {
        try {
          await account.deleteSession('current');
        } catch (_) {}
        setUser(null);
        setLoading(false);
        return;
      }
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      if (error.code === 401) {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────
  // No auto-send of verification email — user clicks "Send" on /verify-email
  const register = async (email, password, name) => {
    try {
      try {
        await account.deleteSession('current');
      } catch (_) {}

      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();

      localStorage.setItem(SESSION_KEY, 'true');
      setUser(currentUser);

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
        } catch (dbError) {
          retries--;
          if (retries === 0) {
            console.error(
              '❌ Failed to create user document after all retries',
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
      try {
        const existingUser = await account.get();
        if (existingUser) {
          localStorage.setItem(SESSION_KEY, 'true');
          setUser(existingUser);
          return;
        }
      } catch (_) {}

      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      localStorage.setItem(SESSION_KEY, 'true');
      setUser(currentUser);

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
    localStorage.removeItem(SESSION_KEY);
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

  // ── Send / resend verification email ─────────────────────
  const resendVerification = async () => {
    await account.createVerification(`${window.location.origin}/verify-email`);
    return { success: true };
  };

  // ── Refresh user from Appwrite ────────────────────────────
  const refreshUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      throw error;
    }
  };

  const isEmailVerified = user?.emailVerification ?? false;

  const value = {
    user,
    loading,
    isEmailVerified,
    register,
    login,
    logout,
    updatePassword,
    sendPasswordRecovery,
    completePasswordRecovery,
    updateUserName,
    resendVerification,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
