import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authService from "@/services/authService";

const AuthContext = createContext(null);

async function syncUserData(user) {
  if (!user?.id) return;
  try {
    const { syncDocumentsFromServer } = await import("@/services/documentService");
    await syncDocumentsFromServer(user.id);
  } catch (error) {
    console.error("Supabase user data sync failed", error);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await authService.loadCurrentUser();
      await syncUserData(currentUser);
      setUser(currentUser);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      setUser(null);
      setAuthError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const runAuth = async action => {
    setAuthError(null);
    try {
      const nextUser = await action();
      await syncUserData(nextUser);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  };

  const login = (email, password) => runAuth(() => authService.login(email, password));
  const registerUser = data => runAuth(() => authService.registerUser(data));
  const registerLawyer = data => runAuth(() => authService.registerLawyer(data));
  const loginAsDemo = role => runAuth(() => authService.loginAsDemo(role));
  const updateUser = updates => runAuth(() => authService.updateCurrentUser(updates));
  const logout = async () => {
    try { await authService.logout(); }
    finally { setUser(null); setAuthError(null); }
  };

  return <AuthContext.Provider value={{
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    loading: isLoading,
    isLoadingAuth: isLoading,
    authChecked: !isLoading,
    authError,
    isLawyer: user?.role === "lawyer",
    login,
    registerUser,
    registerLawyer,
    loginAsDemo,
    logout,
    updateUser,
    refreshUser,
    checkUserAuth: refreshUser,
    checkAppState: refreshUser,
    navigateToLogin: () => {},
    isLoadingPublicSettings: false,
    appPublicSettings: { public_settings: {} },
  }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
