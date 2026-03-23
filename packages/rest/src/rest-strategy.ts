import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Strategy, StrategyHelper } from '@auth-strategy-manager/core';
import {
  AccessTokenConfig,
  Config,
  RefreshTokenConfig,
  StorageType,
  UrlConfig,
  UrlName,
} from './types';

const DEFAULT_NAME = 'rest';
const DEFAULT_ACCESS_KEY = 'access';
const DEFAULT_ACCESS_STORAGE: StorageType = 'sessionStorage';
const DEFAULT_REFRESH_STORAGE: StorageType = 'sessionStorage';

export class RestStrategy implements Strategy {
  public readonly name: string;
  public readonly axiosInstance: AxiosInstance;
  public readonly urls: Partial<Record<UrlName, UrlConfig>>;
  signInUrl?: string;

  private readonly accessTokenConfig: AccessTokenConfig;
  private readonly refreshTokenConfig?: RefreshTokenConfig;
  private readonly helper: StrategyHelper;
  private currentRefresh: Promise<void> | null = null;

  constructor(config: Config) {
    const { name, accessToken, refreshToken, signInUrl, ...urls } = config;

    this.helper = new StrategyHelper();
    this.name = name || DEFAULT_NAME;
    this.accessTokenConfig = {
      key: accessToken?.key ?? DEFAULT_ACCESS_KEY,
      storageType: accessToken?.storageType ?? DEFAULT_ACCESS_STORAGE,
      storage: accessToken?.storage,
      getToken: accessToken?.getToken,
    };

    this.refreshTokenConfig = {
      key: refreshToken?.key ?? DEFAULT_ACCESS_KEY,
      storageType: refreshToken?.storageType ?? DEFAULT_ACCESS_STORAGE,
      storage: refreshToken?.storage,
      getToken: refreshToken?.getToken,
    };

    this.signInUrl = signInUrl;
    this.urls = urls;

    this.axiosInstance = config.axiosInstance ?? axios.create();
  }

  get startUrl(): string | undefined {
    return this.helper.startUrl;
  }

  set startUrl(url: string) {
    this.helper.startUrl = url;
  }

  get token(): string | undefined {
    const accessStorage = this.getAccessStorage();
    return accessStorage.getItem(this.accessTokenConfig.key) ?? undefined;
  }

  set token(token: string) {
    const accessStorage = this.getAccessStorage();
    accessStorage.setItem(this.accessTokenConfig.key, token);
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
    const accessStorage = this.getAccessStorage();
    accessStorage.removeItem(this.accessTokenConfig.key);
    if (this.refreshTokenConfig) {
      const refreshStorage = this.getRefreshStorage();
      refreshStorage.removeItem(this.refreshTokenConfig.key);
    }
    this.helper.reset();
  };

  protected getStorage(type: StorageType): Storage {
    return window[type];
  }

  protected getAccessStorage(): Storage {
    return this.accessTokenConfig?.storage ?? this.getStorage(this.accessTokenConfig.storageType);
  }

  protected getRefreshStorage(): Storage {
    return (
      this.refreshTokenConfig?.storage ??
      this.getStorage(this.refreshTokenConfig?.storageType ?? DEFAULT_REFRESH_STORAGE)
    );
  }

  protected extractToken = (response: unknown, url?: string): string => {
    if (typeof response === 'string') {
      return response;
    }

    const getter = this.accessTokenConfig.getToken;
    return getter ? getter(response, url) : '';
  };

  protected extractRefreshToken = (response: unknown, url?: string): string | undefined => {
    const getter = this.refreshTokenConfig?.getToken;
    if (!getter) return undefined;
    const value = getter(response, url);
    return value || undefined;
  };

  protected setAuthParams = (token: string, refreshTokenValue?: string): void => {
    const accessStorage = this.getAccessStorage();
    accessStorage.setItem(this.accessTokenConfig.key, token);
    if (this.refreshTokenConfig && refreshTokenValue) {
      const refreshStorage = this.getRefreshStorage();
      refreshStorage.setItem(this.refreshTokenConfig.key, refreshTokenValue);
    }
    this.helper.activeStrategyName = this.name;
    this.helper.isAuthenticated = true;
  };
}
