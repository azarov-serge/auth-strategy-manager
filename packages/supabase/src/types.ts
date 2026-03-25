import type { SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';

/** Same shape as `AuthManagerData` from `@auth-strategy-manager/core` v2. */
export type AuthManagerData = {
  isAuthenticated: boolean;
  strategyName: string;
  accessToken: string;
  refreshToken?: string;
};

export type SessionInfo = {
  isAuthenticated: boolean;
  userId: string | null;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: SupabaseAuthUser | null;
};

export type Config = {
  supabase: SupabaseClient;
  name?: string;
  /** URL for redirecting to the authorization page */
  signInUrl?: string;
};
