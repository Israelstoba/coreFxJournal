// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { account } from '../lib/appwrite';
import { ID } from 'appwrite';

const AuthContext = createContext();

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

  // Check if user is logged in on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (email, password, name) => {
    try {
      // First, check if there's an active session and delete it
      try {
        await account.deleteSession('current');
      } catch (error) {
        // No active session, continue
      }

      // Create new account
      await account.create(ID.unique(), email, password, name);

      // Create session (login)
      await account.createEmailPasswordSession(email, password);

      // Get user data
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      throw error;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      // Check if there's already an active session
      try {
        const existingUser = await account.get();
        if (existingUser) {
          // Already logged in, just set the user
          setUser(existingUser);
          return;
        }
      } catch (error) {
        // No active session, continue with login
      }

      // Create new session
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
