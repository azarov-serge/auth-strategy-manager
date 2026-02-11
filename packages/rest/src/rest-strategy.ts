import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Strategy, StrategyHelper } from '@auth-strategy-manager/core';
import { AccessTokenConfig, Config, RefreshTokenConfig, StorageType, UrlName } from './types';

const DEFAULT_NAME = 'rest';
const DEFAULT_ACCESS_KEY = 'access';
const DEFAULT_ACCESS_STORAGE: StorageType = 'sessionStorage';

export class RestStrategy implements Strategy {
  public readonly name: string;
  public readonly axiosInstance: AxiosInstance;
  public readonly urls: Partial<Record<UrlName, any>>;
  signInUrl?: string;

  private readonly accessToken: AccessTokenConfig;
  private readonly refreshTokenConfig?: RefreshTokenConfig;
  private readonly helper: StrategyHelper;
  private currentRefresh: Promise<void> | null = null;

  constructor(config: Config) {
    const { name, accessToken, refreshToken, signInUrl: loginUrl, ...urls } = config;

    this.helper = new StrategyHelper();
    this.name = name || DEFAULT_NAME;
    this.accessToken = accessToken ?? {
      key: DEFAULT_ACCESS_KEY,
      storage: DEFAULT_ACCESS_STORAGE,
    };
    this.refreshTokenConfig = refreshToken;
    this.signInUrl = loginUrl;
    this.urls = urls;

    this.axiosInstance = config.axiosInstance ?? axios.create();
  }

  private getStorage(type: StorageType): Storage {
    return window[type];
  }

  get startUrl(): string | undefined {
    return this.helper.startUrl;
  }

  set startUrl(url: string) {
    this.helper.startUrl = url;
  }

  get token(): string | undefined {
    return this.getStorage(this.accessToken.storage).getItem(this.accessToken.key) ?? undefined;
  }

  set token(token: string) {
    this.getStorage(this.accessToken.storage).setItem(this.accessToken.key, token);
  }

  get isAuthenticated(): boolean {
    return this.helper.isAuthenticated;
  }

  public checkAuth = async (): Promise<boolean> => {
    if (!this.token) {
      return false;
    }

    if (!this.urls.checkAuth) {
      throw new Error('Check URL is not defined');
    }

    const { url, method } = this.urls.checkAuth;
    const response = await this.axiosInstance(url, { method });

    const token = this.extractToken(response, url);
    const isAuthenticated = Boolean(token);

    if (isAuthenticated) {
      this.helper.activeStrategyName = this.name;
      this.setAuthParams(token, this.extractRefreshToken(response, url));
    }

    return isAuthenticated;
  };

  public signIn = async <T = unknown, D = undefined>(config?: D): Promise<T> => {
    if (!this.urls.signIn) {
      throw new Error('Sign in URL is not defined');
    }
    const { url, method } = this.urls.signIn;
    let axiosConfig: AxiosRequestConfig = {};
    if (config && typeof config === 'object') {
      axiosConfig = config as AxiosRequestConfig;
    }
    const response = await this.axiosInstance(url, { ...axiosConfig, method });
    const token = this.extractToken(response, url);
    if (token) {
      this.setAuthParams(token, this.extractRefreshToken(response, url));
    }
    return response as T;
  };

  public signUp = async <T = unknown, D = undefined>(config?: D): Promise<T> => {
    if (!this.urls.signUp) {
      throw new Error('Sign up URL is not defined');
    }
    const { url, method } = this.urls.signUp;
    let axiosConfig: AxiosRequestConfig = {};
    if (config && typeof config === 'object') {
      axiosConfig = config as AxiosRequestConfig;
    }
    const response = await this.axiosInstance(url, { ...axiosConfig, method });
    const token = this.extractToken(response, url);
    if (token) {
      this.setAuthParams(token, this.extractRefreshToken(response, url));
    }
    return response as T;
  };

  public signOut = async (): Promise<void> => {
    if (!this.urls.signOut) {
      throw new Error('Sign out URL is not defined');
    }

    const { url, method } = this.urls.signOut;
    if (!url) {
      this.clear();
      return;
    }

    await this.axiosInstance(url, { method });
    this.clear();
  };

  public refreshToken = async (): Promise<void> => {
    if (!this.urls.refresh) {
      throw new Error('Refresh token URL is not defined');
    }

    const { url, method } = this.urls.refresh;
    if (!url) {
      return;
    }

    if (this.currentRefresh) {
      return await this.currentRefresh;
    }

    let resolver: () => void = () => {};
    this.currentRefresh = new Promise<void>((resolve) => {
      resolver = resolve;
    });

    const response = await this.axiosInstance(url, { method });
    const token = this.extractToken(response, url);

    if (token) {
      this.setAuthParams(token, this.extractRefreshToken(response, url));
    }

    resolver();
    this.currentRefresh = null;
  };

  public clear = (): void => {
    this.getStorage(this.accessToken.storage).removeItem(this.accessToken.key);
    if (this.refreshTokenConfig) {
      this.getStorage(this.refreshTokenConfig.storage).removeItem(this.refreshTokenConfig.key);
    }
    this.helper.reset();
  };

  private extractToken = (response: unknown, url?: string): string => {
    if (typeof response === 'string') {
      return response;
    }

    const getter = this.accessToken.getToken;
    return getter ? getter(response, url) : '';
  };

  private extractRefreshToken = (response: unknown, url?: string): string | undefined => {
    const getter = this.refreshTokenConfig?.getToken;
    if (!getter) return undefined;
    const value = getter(response, url);
    return value || undefined;
  };

  private setAuthParams = (token: string, refreshTokenValue?: string): void => {
    const accessStorage = this.getStorage(this.accessToken.storage);
    accessStorage.setItem(this.accessToken.key, token);
    if (this.refreshTokenConfig && refreshTokenValue) {
      const refreshStorage = this.getStorage(this.refreshTokenConfig.storage);
      refreshStorage.setItem(this.refreshTokenConfig.key, refreshTokenValue);
    }
    this.helper.activeStrategyName = this.name;
    this.helper.isAuthenticated = true;
  };
}
