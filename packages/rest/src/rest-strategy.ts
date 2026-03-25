import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Config, UrlConfig, UrlName } from './types';

const DEFAULT_NAME = 'rest';

type AuthManagerData = {
  isAuthenticated: boolean;
  strategyName: string;
  accessToken: string;
  refreshToken?: string;
};

export class RestStrategy {
  public readonly name: string;
  public readonly axiosInstance: AxiosInstance;
  public readonly urls: Partial<Record<UrlName, UrlConfig>>;
  public readonly getToken?: Config['getToken'];
  public signInUrl?: string;

  private currentRefresh: Promise<AuthManagerData> | null = null;
  private startUrlValue?: string;

  constructor(config: Config) {
    const { name, signInUrl, axiosInstance, getToken, ...urls } = config;

    this.name = name || DEFAULT_NAME;
    this.signInUrl = signInUrl;
    this.urls = urls;
    this.axiosInstance = axiosInstance ?? axios.create();
    this.getToken = getToken;
  }

  get startUrl(): string | undefined {
    return this.startUrlValue;
  }

  set startUrl(url: string) {
    this.startUrlValue = url;
  }

  public checkAuth = async (): Promise<AuthManagerData> => {
    if (!this.urls.checkAuth) {
      throw new Error('Check URL is not defined');
    }

    const { url, method } = this.urls.checkAuth;
    const response = await this.axiosInstance(url, { method });

    return this.toAuthManagerData(response, url);
  };

  public signIn = async <T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T> => {
    if (!this.urls.signIn) {
      throw new Error('Sign in URL is not defined');
    }

    const response = await this.sendRequest(this.urls.signIn, config);
    const authData = this.toAuthManagerData(response, this.urls.signIn.url);

    return { ...(response as object), ...authData } as T;
  };

  public signUp = async <T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T> => {
    // For some integrations (e.g. ActiveDirectory) registration flow may be absent.
    // In that case we treat `signUp` as a no-op and return an unauthenticated placeholder.
    if (!this.urls.signUp) {
      return {
        isAuthenticated: false,
        strategyName: this.name,
        accessToken: '',
        refreshToken: undefined,
      } as T;
    }

    const response = await this.sendRequest(this.urls.signUp, config);
    const authData = this.toAuthManagerData(response, this.urls.signUp.url);

    return { ...(response as object), ...authData } as T;
  };

  /** If `signOut` is omitted from config, no-op (e.g. logout is storage-only via AuthStrategyManager). */
  public signOut = async (): Promise<void> => {
    if (!this.urls.signOut) {
      return;
    }

    const { url, method } = this.urls.signOut;
    if (!url) {
      return;
    }

    await this.axiosInstance(url, { method });
  };

  public refreshToken = async (): Promise<AuthManagerData> => {
    if (!this.urls.refresh) {
      throw new Error('Refresh token URL is not defined');
    }

    const { url, method } = this.urls.refresh;
    if (!url) {
      return {
        isAuthenticated: false,
        strategyName: this.name,
        accessToken: '',
        refreshToken: undefined,
      };
    }

    if (this.currentRefresh) {
      return await this.currentRefresh;
    }

    this.currentRefresh = (async () => {
      const response = await this.axiosInstance(url, { method });
      return this.toAuthManagerData(response, url);
    })();

    try {
      return await this.currentRefresh;
    } finally {
      this.currentRefresh = null;
    }
  };

  private sendRequest = async <D>(urlConfig: UrlConfig, config?: D): Promise<unknown> => {
    const { url, method } = urlConfig;

    let axiosConfig: AxiosRequestConfig = {};
    if (config && typeof config === 'object') {
      axiosConfig = config as AxiosRequestConfig;
    }

    return await this.axiosInstance(url, { ...axiosConfig, method });
  };

  private toAuthManagerData = (response: unknown, url?: string): AuthManagerData => {
    const accessToken = this.extractToken(response, { url, type: 'access' });
    const refreshToken = this.extractToken(response, { url, type: 'refresh' }) || undefined;
    const isAuthenticated = Boolean(accessToken || refreshToken);

    return {
      isAuthenticated,
      strategyName: this.name,
      accessToken: accessToken ?? '',
      refreshToken,
    };
  };

  private extractToken = (
    response: unknown,
    options: { url?: string; type: 'access' | 'refresh' }
  ): string => {
    if (!this.getToken) {
      return '';
    }

    return this.getToken(response, options) || '';
  };
}
