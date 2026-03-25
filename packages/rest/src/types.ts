import { AxiosInstance, AxiosRequestConfig } from 'axios';

export type UrlConfig = {
  url: string;
  method?: AxiosRequestConfig['method'];
};

export type UrlName = 'checkAuth' | 'signIn' | 'signUp' | 'signOut' | 'refresh';

/** All URL endpoints are optional — pass only what you use (e.g. omit `signOut` for local-only logout via sessionStorage/localStorage). */
export type Config = Partial<Record<UrlName, UrlConfig>> & {
  name?: string;
  /** URL for redirecting to the authorization page */
  signInUrl?: string;
  axiosInstance?: AxiosInstance;
  /** Extract access / refresh token from API response */
  getToken?: (response: unknown, options?: { url?: string; type: 'access' | 'refresh' }) => string;
};
