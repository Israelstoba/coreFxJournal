// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { account, databases } from '../lib/appwrite';
import { ID } from 'appwrite';

const AuthContext = createContext();

// ── Use localStorage (not sessionStorage) so it survives navigation ──
// Appwrite itself stores its session token in localStorage, so our flag
// must use the same storage to stay in sync across page navigations.
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
      const sessionActive = localStorage.getItem(SESSION_KEY); // ← localStorage
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
      // Only wipe the session on a genuine auth failure (401)
      if (error.code === 401) {
        localStorage.removeItem(SESSION_KEY); // ← localStorage
        setUser(null);
      }
      // Network blips or other errors: don't wipe session
    } finally {
      setLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────
  const register = async (email, password, name) => {
    try {
      // Clean up any lingering session first
      try {
        await account.deleteSession('current');
      } catch (_) {}

      // 1. Create account
      await account.create(ID.unique(), email, password, name);

      // 2. Create session (log in)
      await account.createEmailPasswordSession(email, password);

      // 3. Get the user object
      const currentUser = await account.get();

      // 4. Mark session active in localStorage
      localStorage.setItem(SESSION_KEY, 'true'); // ← localStorage
      setUser(currentUser);

      // 5. Create user document in DB
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

      // 6. Send verification email LAST — after session + DB are fully ready
      //    Small delay ensures Appwrite session is fully established
      await new Promise((r) => setTimeout(r, 500));
      try {
        await account.createVerification(
          `${window.location.origin}/verify-email`,
        );
        console.log('✅ Verification email sent to', email);
      } catch (verifyError) {
        // Don't throw — user is registered and logged in.
        // They can resend from the verify page.
        console.error('❌ Failed to send verification email:', verifyError);
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
          localStorage.setItem(SESSION_KEY, 'true'); // ← localStorage
          setUser(existingUser);
          return;
        }
      } catch (_) {}

      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      localStorage.setItem(SESSION_KEY, 'true'); // ← localStorage
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
    localStorage.removeItem(SESSION_KEY); // ← localStorage
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

  // ── Resend verification email ─────────────────────────────
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

  // ── Derived: is email verified? ───────────────────────────
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
