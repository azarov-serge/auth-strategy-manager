import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { strategyHelper, StrategyHelper } from '../helpers';
import { Strategy } from '../types';
import { UrlConfig } from './types';

type UrlName = 'check' | 'signIn' | 'signUp' | 'signOut' | 'refresh';

type Config = Record<UrlName, UrlConfig> & {
  name?: string;
  tokenKey?: string;
  signInUrl?: string;
  axiosInstance?: AxiosInstance;
  getToken?: (response: unknown, url?: string) => string;
};

const DEFAULT_NAME = 'rest';
const DEFAULT_TOKEN_KEY = 'access';

export class RestStrategy implements Strategy {
  public readonly name: string;
  public readonly axiosInstance: AxiosInstance;
  public readonly urls: Record<UrlName, UrlConfig>;
  signInUrl?: string;

  private readonly tokenKey: string;
  private readonly getToken?: Config['getToken'];
  private readonly helper: StrategyHelper;
  private currentRefresh: Promise<void> | null = null;

  constructor(config: Config) {
    const { name, tokenKey, getToken, signInUrl: loginUrl, ...urls } = config;

    this.helper = strategyHelper;
    this.name = name || DEFAULT_NAME;
    this.tokenKey = tokenKey || DEFAULT_TOKEN_KEY;
    this.getToken = getToken;
    this.signInUrl = loginUrl;
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
    return window.sessionStorage.getItem(this.tokenKey) ?? undefined;
  }

  set token(token: string) {
    window.sessionStorage.setItem(this.tokenKey, token);
  }

  get isAuthenticated(): boolean {
    return this.helper.isAuthenticated;
  }

  check = async (): Promise<boolean> => {
    if (!this.token) {
      return false;
    }

    const { url, method } = this.urls.check;
    const response = await this.axiosInstance(url, { method });

    const token = this.extractToken(response, url);
    const isAuthenticated = Boolean(token);

    if (isAuthenticated) {
      this.helper.activeStrategyName = this.name;

      this.setAuthParams(token);
    }

    return isAuthenticated;
  };

  signIn = async <D, T>(config?: AxiosRequestConfig<D>): Promise<T> => {
    const { url, method } = this.urls.signIn;

    const response = await this.axiosInstance(url, { ...(config ?? {}), method });

    const token = this.extractToken(response, url);

    if (token) {
      this.setAuthParams(token);
    }

    return response as T;
  };

  signUp = async <D, T>(config?: AxiosRequestConfig<D>): Promise<T> => {
    const { url, method } = this.urls.signUp;

    const response = await this.axiosInstance(url, { ...(config ?? {}), method });

    const token = this.extractToken(response, url);

    if (token) {
      this.setAuthParams(token);
    }

    return response as T;
  };

  signOut = async (): Promise<void> => {
    const { url, method } = this.urls.signOut;
    if (!url) {
      this.clearAuthData();
      return;
    }

    await this.axiosInstance(url, {
      method,
    });

    this.clearAuthData();
  };

  refreshToken = async (): Promise<void> => {
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
      this.setAuthParams(token);
    }

    resolver();
    this.currentRefresh = null;
  };

  private extractToken = (response: unknown, url?: string): string => {
    if (typeof response === 'string') {
      return response;
    }

    return this.getToken ? this.getToken(response, url) : '';
  };

  private setAuthParams = (token: string): void => {
    window.sessionStorage.setItem(this.tokenKey, token);
    this.helper.activeStrategyName = this.name;
    this.helper.isAuthenticated = true;
  };

  private clearAuthData = () => {
    window.sessionStorage.clear();
    this.helper.reset();
  };
}
