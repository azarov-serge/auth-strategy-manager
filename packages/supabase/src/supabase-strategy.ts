import type { SupabaseClient } from '@supabase/supabase-js';
import { Strategy, StrategyHelper } from '@auth-strategy-manager/core';
import type { AuthResponse, Config, SessionInfo } from './types';

const DEFAULT_NAME = 'supabase';

export class SupabaseStrategy implements Strategy {
  public readonly name: string;
  public readonly supabase: SupabaseClient;
  public signInUrl?: string;

  private readonly helper: StrategyHelper;
  private tokenInternal?: string;

  constructor(config: Config) {
    const { name, supabase, signInUrl } = config;

    this.helper = new StrategyHelper();
    this.name = name || DEFAULT_NAME;
    this.supabase = supabase;
    this.signInUrl = signInUrl;
  }

  get startUrl(): string | undefined {
    return this.helper.startUrl;
  }

  set startUrl(url: string | undefined) {
    this.helper.startUrl = url;
  }

  get token(): string | undefined {
    return this.tokenInternal;
  }

  get isAuthenticated(): boolean {
    return this.helper.isAuthenticated;
  }

  public async checkAuth(): Promise<boolean> {
    const hasSession = await this.hasSession();

    if (hasSession) {
      this.helper.activeStrategyName = this.name;
    }

    return hasSession;
  }

  public async signIn<T = unknown, D = undefined>(config?: D): Promise<T> {
    const { email, password } = (config as { email: string; password: string }) || {};

    if (!email || !password) {
      throw new Error('Email and password are required for sign in');
    }

    this.helper.activeStrategyName = this.name;

    const response = await this.signInInternal(email, password);
    return response as T;
  }

  public async signUp<T = unknown, D = undefined>(config?: D): Promise<T> {
    const { email, password, username } =
      (config as {
        email: string;
        password: string;
        username: string;
      }) || {};

    if (!email || !password || !username) {
      throw new Error('Email, password and username are required for sign up');
    }

    this.helper.activeStrategyName = this.name;

    const response = await this.signUpInternal(email, password, username);
    return response as T;
  }

  public async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw error;
    }

    this.clear();
  }

  public async refreshToken<T = void>(_args?: T): Promise<void> {
    await this.refreshSession();
  }

  public clear(): void {
    this.tokenInternal = undefined;
    this.helper.reset();
  }

  private async hasSession(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      const hasSession = !error && !!data.session;

      this.helper.isAuthenticated = hasSession;
      this.tokenInternal = data.session?.access_token;

      return hasSession;
    } catch {
      this.helper.isAuthenticated = false;
      this.tokenInternal = undefined;
      return false;
    }
  }

  public async getCurrentUserId(): Promise<string | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return user.id;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[SupabaseStrategy] Failed to get userId:', error);
      return null;
    }
  }

  public async getSessionInfo(): Promise<SessionInfo> {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error || !data.session) {
        return { isAuthenticated: false, userId: null };
      }

      return {
        isAuthenticated: true,
        userId: data.session.user?.id || null,
      };
    } catch {
      return { isAuthenticated: false, userId: null };
    }
  }

  private async refreshSession(): Promise<void> {
    const { error } = await this.supabase.auth.refreshSession();
    if (error) {
      throw error;
    }

    const { data } = await this.supabase.auth.getSession();
    if (data.session) {
      this.tokenInternal = data.session.access_token;
      this.helper.isAuthenticated = true;
    }
  }

  private async signInInternal(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase sign-in error:', error);
      throw error;
    }

    if (!data.user || !data.session) {
      throw new Error('Failed to get session data');
    }

    const response: AuthResponse = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    };

    this.tokenInternal = data.session.access_token;
    this.helper.isAuthenticated = true;

    return response;
  }

  private async signUpInternal(
    email: string,
    password: string,
    username: string,
  ): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      throw error;
    }

    const response: AuthResponse = {
      access_token: data.session?.access_token || '',
      refresh_token: data.session?.refresh_token || '',
      user: data.user ?? null,
    };

    if (data.session?.access_token) {
      this.tokenInternal = data.session.access_token;
      this.helper.isAuthenticated = true;
    }

    return response;
  }
}

