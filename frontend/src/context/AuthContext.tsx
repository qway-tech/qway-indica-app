/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.tsx

import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { persistLogin, persistLogout, loadAuthState } from './authUtils';
import type { AuthUser } from './authUtils';


export interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper para obter de forma segura o login do usuário (padroniza e remove '@' se houver)
export function getUserLogin(u: Partial<AuthUser> | null | undefined): string {
  const raw = (u?.login ?? u?.name ?? "").toString();
  return raw.replace(/^@/, "");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const { token: storedToken, user: storedUser } = loadAuthState();
    if (storedToken) setToken(storedToken);
    if (storedUser) setUser(storedUser);
  }, []);

  const login = (newToken: string, userData: AuthUser) => {
    setLoading(true);
    persistLogin(newToken, userData);
    setToken(newToken);
    setUser(userData);
    setLoading(false);
  };

  const logout = () => {
    persistLogout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, user, login, logout, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
}