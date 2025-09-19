import type { AuthUser } from "@/context/authUtils";
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

type UseAuthReturn = {
  user: any;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useAuth(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
