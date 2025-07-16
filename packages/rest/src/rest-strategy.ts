import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Strategy, StrategyHelper } from '@auth-strategy-manager/core';
import { Config, UrlName } from './types';

const DEFAULT_NAME = 'rest';
const DEFAULT_TOKEN_KEY = 'access';

export class RestStrategy implements Strategy {
  public readonly name: string;
  public readonly axiosInstance: AxiosInstance;
  public readonly urls: Partial<Record<UrlName, any>>;
  signInUrl?: string;

  private readonly tokenKey: string;
  private readonly getToken?: Config['getToken'];
  private readonly helper: StrategyHelper;
  private currentRefresh: Promise<void> | null = null;

  constructor(config: Config) {
    const { name, tokenKey, getToken, signInUrl: loginUrl, ...urls } = config;

    this.helper = new StrategyHelper();
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
      this.setAuthParams(token);
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
      this.setAuthParams(token);
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
      this.setAuthParams(token);
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
      this.setAuthParams(token);
    }

    resolver();
    this.currentRefresh = null;
  };

  public clear = () => {
    window.sessionStorage.clear();
    this.helper.reset();
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
}
