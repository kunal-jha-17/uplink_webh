import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface User {
  id: string;
  handle: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (handle: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Stub implementations — swap these for Supabase calls ────────────────────
// When Kunal deploys backend:
//   import { supabase } from '@/lib/supabase'
//   Replace stub bodies with: const { data, error } = await supabase.auth.signInWithPassword(...)

const MOCK_USERS: Record<string, { password: string; user: User }> = {};

async function stubLogin(email: string, password: string): Promise<User> {
  await new Promise((r) => setTimeout(r, 900));
  const record = MOCK_USERS[email];
  if (!record || record.password !== password) {
    throw new Error("ERR_401: Invalid credentials. Try again.");
  }
  return record.user;
}

async function stubSignup(handle: string, email: string, password: string): Promise<User> {
  await new Promise((r) => setTimeout(r, 1100));
  if (MOCK_USERS[email]) throw new Error("ERR_409: Handle already registered.");
  if (password.length < 6) throw new Error("ERR_422: Passkey must be 6+ characters.");
  const user: User = {
    id: `usr_${Date.now()}`,
    handle,
    email,
    createdAt: new Date().toISOString(),
  };
  MOCK_USERS[email] = { password, user };
  return user;
}

async function stubLogout(): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
}
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null,
  });

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const user = await stubLogin(email, password);
      setState({ user, loading: false, error: null });
    } catch (e: unknown) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
      throw e;
    }
  }, []);

  const signup = useCallback(async (handle: string, email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const user = await stubSignup(handle, email, password);
      setState({ user, loading: false, error: null });
    } catch (e: unknown) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    await stubLogout();
    setState({ user: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
