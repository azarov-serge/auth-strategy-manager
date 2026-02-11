import { AxiosRequestConfig } from 'axios';

export type UrlConfig = {
  url: string;
  method?: AxiosRequestConfig['method'];
};

export type UrlName = 'checkAuth' | 'signIn' | 'signUp' | 'signOut' | 'refresh';

export type StorageType = 'sessionStorage' | 'localStorage';

export type TokenConfig = {
  key: string;
  storage: StorageType;
  /** Extract access / refresh token from API response */
  getToken?: (response: unknown, url?: string) => string;
};

export type AccessTokenConfig = TokenConfig;

export type RefreshTokenConfig = TokenConfig;

export type Config = Record<UrlName, UrlConfig> & {
  name?: string;
  /** Where and how to store the access token. Default: { key: 'access', storage: 'sessionStorage' } */
  accessToken?: AccessTokenConfig;
  /** Optional: where and how to store the refresh token (e.g. access in sessionStorage, refresh in localStorage) */
  refreshToken?: RefreshTokenConfig;
  /** URL for redirecting to the authorization page */
  signInUrl?: string;
  axiosInstance?: any;
};
