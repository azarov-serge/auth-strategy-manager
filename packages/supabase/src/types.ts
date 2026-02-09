import type { SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';

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

