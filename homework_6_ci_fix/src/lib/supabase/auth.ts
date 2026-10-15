import { SupabaseApiError } from "./operations";
import { getSupabaseClient } from "./client";

/**
 * Signs up a new user with email and password.
 *
 * @param email - User email address.
 * @param password - User password (min 6 characters).
 * @param fullName - Optional display name.
 * @throws SupabaseApiError on failure.
 */
export async function signUp(
  email: string,
  password: string,
  fullName?: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName ?? "" },
    },
  });
  if (error) {
    throw new SupabaseApiError(`signUp: ${error.message}`);
  }
}

/**
 * Signs in an existing user with email and password.
 *
 * @param email - User email address.
 * @param password - User password.
 * @throws SupabaseApiError on failure.
 */
export async function signIn(email: string, password: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw new SupabaseApiError(`signIn: ${error.message}`);
  }
}

/**
 * Signs out the current user and clears the session.
 *
 * @throws SupabaseApiError on failure.
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new SupabaseApiError(`signOut: ${error.message}`);
  }
}
