import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setAuthToken, setUnauthorizedHandler } from "../lib/api";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  permissions: string[];
}

interface StoredSession {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: string) => boolean;
}

const STORAGE_KEY = "gift360_admin_session";
const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => loadSession());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthToken(session?.token ?? null);
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  useEffect(() => {
    setUnauthorizedHandler(() => setSession(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (!session) {
      setReady(true);
      return;
    }
    api
      .get<AuthUser>("/auth/me")
      .then((user) => setSession((prev) => (prev ? { ...prev, user } : prev)))
      .catch(() => setSession(null))
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(username: string, password: string) {
    const result = await api.post<{ token: string; user: AuthUser }>("/auth/login", { username, password });
    setSession({ token: result.token, user: result.user });
  }

  function logout() {
    api.post("/auth/logout").catch(() => {});
    setSession(null);
  }

  function can(permission: string): boolean {
    return !!session?.user.permissions.includes(permission);
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, token: session?.token ?? null, ready, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
