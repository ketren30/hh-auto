import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserSession } from '../../types';

const TOKEN_KEY = 'hh-auto:access_token';
const REFRESH_KEY = 'hh-auto:refresh_token';
const EXPIRES_KEY = 'hh-auto:expires_at';

function readSession(): UserSession {
  const accessToken = sessionStorage.getItem(TOKEN_KEY);
  const refreshToken = sessionStorage.getItem(REFRESH_KEY);
  const expiresAt = sessionStorage.getItem(EXPIRES_KEY);
  return {
    accessToken,
    refreshToken,
    expiresAt,
    authenticated: Boolean(accessToken),
  };
}

interface AuthContextValue {
  session: UserSession;
  setTokens: (t: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession>(() => readSession());

  const setTokens = useCallback((t: { access_token: string; refresh_token?: string; expires_in?: number }) => {
    sessionStorage.setItem(TOKEN_KEY, t.access_token);
    if (t.refresh_token) sessionStorage.setItem(REFRESH_KEY, t.refresh_token);
    else sessionStorage.removeItem(REFRESH_KEY);
    let expiresAt: string | null = null;
    if (typeof t.expires_in === 'number') {
      expiresAt = new Date(Date.now() + t.expires_in * 1000).toISOString();
      sessionStorage.setItem(EXPIRES_KEY, expiresAt);
    } else sessionStorage.removeItem(EXPIRES_KEY);
    setSession({
      accessToken: t.access_token,
      refreshToken: t.refresh_token ?? null,
      expiresAt,
      authenticated: true,
    });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(EXPIRES_KEY);
    setSession({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      authenticated: false,
    });
  }, []);

  const value = useMemo(
    () => ({
      session,
      setTokens,
      logout,
    }),
    [session, setTokens, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth вне AuthProvider');
  return ctx;
}
