import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Profile } from '@/lib/types';
import { authLogin, authRegister, authMe, updateProfile as apiUpdateProfile } from '@/lib/api';
import { getToken, setToken, removeToken } from '@/lib/apiClient';

interface AuthContextValue {
  session: { user: { id: string; email: string } } | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (updates: { name?: string; phone?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ user: { id: string; email: string } } | null>(null);

  const loadProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await authMe();
      setProfile(me);
      setSession({ user: { id: me.id, email: me.email } });
    } catch {
      removeToken();
      setProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await authLogin(email, password);
      setToken(res.token);
      setProfile(res.user);
      setSession({ user: { id: res.user.id, email: res.user.email } });
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Login failed' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      const res = await authRegister(email, password, fullName, phone);
      setToken(res.token);
      setProfile(res.user);
      setSession({ user: { id: res.user.id, email: res.user.email } });
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Registration failed' };
    }
  };

  const signOut = () => {
    removeToken();
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const updateUserProfile = async (updates: { name?: string; phone?: string }) => {
    const updated = await apiUpdateProfile(profile!.id, updates);
    setProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
