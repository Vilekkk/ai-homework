import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
} from './auth';
import { getSupabaseClient } from './client';

/**
 * Shape of the auth context provided to the application.
 */
export interface AuthContextValue {
  /** Current user id or null when not authenticated. */
  userId: string | null;
  /** True while the initial session is being restored. */
  isLoading: boolean;
  /** True when the user exists but email is not yet confirmed. */
  isEmailUnconfirmed: boolean;
  /** Current error message or empty string. */
  error: string;
  /** Clears the error message. */
  clearError: () => void;
  /** Signs up with email/password. */
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  /** Signs in with email/password. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Signs out the current user. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * React hook to access the auth context.
 * @throws Error if used outside AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

/**
 * Provider that manages the Supabase auth session lifecycle.
 *
 * - On mount: restores session from localStorage (persisted by Supabase).
 * - While restoring: shows loading state.
 * - After restore: if no session and user exists with unconfirmed email,
 *   sets isEmailUnconfirmed flag.
 * - On sign out: clears userId and any pending tasks.
 */
export function AuthProvider({
  children,
  onSessionChanged,
}: {
  children: React.ReactNode;
  /**
   * Called whenever the session changes (logged in, logged out,
   * session expired). Use it to cancel pending task operations
   * so stale responses from a previous user don't leak into the new session.
   */
  onSessionChanged?: () => void;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);
  const [error, setError] = useState('');

  // Ref to track the session at the time of an async operation.
  // If the session changes before the operation resolves, the result is discarded.
  const sessionRef = useRef<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let authEventReceived = false;
    const showError = (e: unknown) => {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : 'Не удалось восстановить сессию');
        setIsLoading(false);
      }
    };
    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      if (params.has('error')) {
        setError('Ссылка подтверждения недействительна или истекла. Попробуйте войти или запросите новое письмо.');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      const supabase = getSupabaseClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        authEventReceived = true;
        const uid = session?.user?.id ?? null;
        sessionRef.current = uid;
        setUserId(uid);
        setIsEmailUnconfirmed(false);
        setIsLoading(false);
        onSessionChanged?.();
      });
      unsubscribe = () => subscription.unsubscribe();
      void supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
        if (cancelled || authEventReceived) return;
        if (sessionError) { showError(sessionError); return; }
        const uid = session?.user?.id ?? null;
        sessionRef.current = uid;
        setUserId(uid);
        setIsLoading(false);
        onSessionChanged?.();
      }).catch(showError);
    } catch (e) {
      showError(e);
    }
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [onSessionChanged]);

  const clearError = useCallback(() => { setError(''); setIsEmailUnconfirmed(false); }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      setError('');
      try {
        await apiSignUp(email, password, fullName);
        // signUp may not create a session if email confirmation is required
        // Check the current session
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          sessionRef.current = session.user.id;
          setUserId(session.user.id);
          setIsEmailUnconfirmed(false);
        } else {
          setIsEmailUnconfirmed(true);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Регистрация не удалась';
        setError(msg);
        throw e;
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setError('');
    try {
      await apiSignIn(email, password);
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        sessionRef.current = session.user.id;
        setUserId(session.user.id);
        setIsEmailUnconfirmed(false);
      } else {
        setIsEmailUnconfirmed(true);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Вход не выполнен';
      setError(msg);
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError('');
    try {
      await apiSignOut();
      sessionRef.current = null;
      setUserId(null);
      setIsEmailUnconfirmed(false);
      onSessionChanged?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Выход не выполнен';
      setError(msg);
      throw e;
    }
  }, [onSessionChanged]);

  const value = useMemo<AuthContextValue>(
    () => ({ userId, isLoading, isEmailUnconfirmed, error, clearError, signUp, signIn, signOut }),
    [userId, isLoading, isEmailUnconfirmed, error, clearError, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
