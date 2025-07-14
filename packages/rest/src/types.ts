import { AxiosRequestConfig } from 'axios';

export type UrlConfig = {
  url: string;
  method?: AxiosRequestConfig['method'];
};

export type UrlName = 'check' | 'signIn' | 'signUp' | 'signOut' | 'refresh';

export type Config = Record<UrlName, UrlConfig> & {
  name?: string;
  tokenKey?: string;
  /** URL for redirecting to the authorization page */
  signInUrl?: string;
  axiosInstance?: any;
  getToken?: (response: unknown, url?: string) => string;
};
