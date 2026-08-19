import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authService from "@/services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refreshUser = useCallback(() => {
    setIsLoading(true);
    try {
      const currentUser = authService.getCurrentUser();
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

  const runAuth = (action) => {
    setAuthError(null);
    try {
      const nextUser = action();
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
  const logout = () => { authService.logout(); setUser(null); setAuthError(null); };

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
