import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);
const TOKEN_KEY = 'smt-token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true); // true only during the initial silent-login check

  const applySession = useCallback((sessionUser, accessToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    setUser(sessionUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // Persistent login: on first load, try the httpOnly refresh cookie
  // before deciding the user is logged out.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await authService.refresh();
        applySession(data.user, data.accessToken);
      } catch {
        clearSession();
      } finally {
        setInitializing(false);
      }
    };
    restoreSession();
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await authService.login({ email, password });
      applySession(data.user, data.accessToken);
      return data.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await authService.register(payload);
      applySession(data.user, data.accessToken);
      return data.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => ({ ...prev, ...updatedUserData }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, initializing, isAuthenticated: !!user, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
