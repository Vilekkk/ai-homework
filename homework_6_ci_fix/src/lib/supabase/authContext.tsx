import { createContext } from "react";

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

export const AuthContext = createContext<AuthContextValue | null>(null);
