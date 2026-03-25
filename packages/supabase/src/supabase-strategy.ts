import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { AuthManagerData, AuthResponse, Config, SessionInfo } from './types';

const DEFAULT_NAME = 'supabase';

/** Compatible with `Strategy` from `@auth-strategy-manager/core` v2. Use `AuthStrategyManager` for storage sync. */
export class SupabaseStrategy {
  public readonly name: string;
  public readonly supabase: SupabaseClient;
  public signInUrl?: string;

  private tokenInternal?: string;
  private startUrlValue?: string;

  constructor(config: Config) {
    const { name, supabase, signInUrl } = config;

    this.name = name || DEFAULT_NAME;
    this.supabase = supabase;
    this.signInUrl = signInUrl;
  }

  get startUrl(): string | undefined {
    return this.startUrlValue;
  }

  set startUrl(url: string | undefined) {
    this.startUrlValue = url;
  }

  get token(): string | undefined {
    return this.tokenInternal;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.tokenInternal);
  }

  private sessionToAuthManagerData(session: Session | null): AuthManagerData {
    if (!session?.access_token) {
      return {
        isAuthenticated: false,
        strategyName: this.name,
        accessToken: '',
        refreshToken: undefined,
      };
    }

    return {
      isAuthenticated: true,
      strategyName: this.name,
      accessToken: session.access_token,
      refreshToken: session.refresh_token ?? undefined,
    };
  }

  public checkAuth = async (): Promise<AuthManagerData> => {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error || !data.session) {
        this.tokenInternal = undefined;
        return this.sessionToAuthManagerData(null);
      }

      this.tokenInternal = data.session.access_token;
      return this.sessionToAuthManagerData(data.session);
    } catch {
      this.tokenInternal = undefined;
      return this.sessionToAuthManagerData(null);
    }
  };

  public signIn = async <T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T> => {
    const { email, password } = (config as { email: string; password: string }) || {};

    if (!email || !password) {
      throw new Error('Email and password are required for sign in');
    }

    const { response, session } = await this.signInInternal(email, password);
    const authData = this.sessionToAuthManagerData(session);

    return { ...(response as object), ...authData } as T;
  };

  public signUp = async <T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T> => {
    const { email, password, username } =
      (config as {
        email: string;
        password: string;
        username: string;
      }) || {};

    if (!email || !password || !username) {
      throw new Error('Email, password and username are required for sign up');
    }

    const { response, session } = await this.signUpInternal(email, password, username);
    const authData = this.sessionToAuthManagerData(session);

    return { ...(response as object), ...authData } as T;
  };

  public signOut = async (): Promise<void> => {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw error;
    }

    this.clear();
  };

  public refreshToken = async <T>(_args?: T): Promise<AuthManagerData> => {
    try {
      await this.refreshSession();
      const { data } = await this.supabase.auth.getSession();
      return this.sessionToAuthManagerData(data.session ?? null);
    } catch {
      this.tokenInternal = undefined;
      return {
        isAuthenticated: false,
        strategyName: this.name,
        accessToken: '',
        refreshToken: undefined,
      };
    }
  };

  public clear = (): void => {
    this.tokenInternal = undefined;
  };

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
    } catch {
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
    this.tokenInternal = data.session?.access_token;
  }

  private async signInInternal(
    email: string,
    password: string
  ): Promise<{ response: AuthResponse; session: Session | null }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
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

    return { response, session: data.session };
  }

  private async signUpInternal(
    email: string,
    password: string,
    username: string
  ): Promise<{ response: AuthResponse; session: Session | null }> {
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

    const session = data.session ?? null;
    const response: AuthResponse = {
      access_token: session?.access_token ?? '',
      refresh_token: session?.refresh_token ?? '',
      user: data.user ?? null,
    };

    if (session?.access_token) {
      this.tokenInternal = session.access_token;
    }

    return { response, session };
  }
}
