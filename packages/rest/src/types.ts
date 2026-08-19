export type UrlConfig = {
  url: string;
  method?: HttpMethod;
};

export type UrlName = 'checkAuth' | 'signIn' | 'signUp' | 'signOut' | 'refresh';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD'
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'options'
  | 'head';

export type RequestConfig = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | null | undefined>;
  body?: BodyInit | null;
  data?: unknown;
  credentials?: RequestCredentials;
  withCredentials?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type RestResponse = {
  data: unknown;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  url: string;
  raw: Response;
};

export type RequestAdapter = (url: string, config?: RequestConfig) => Promise<unknown>;

/** All URL endpoints are optional — pass only what you use (e.g. omit `signOut` for local-only logout via sessionStorage/localStorage). */
export type Config = Partial<Record<UrlName, UrlConfig>> & {
  name?: string;
  /** URL for redirecting to the authorization page */
  signInUrl?: string;
  /** Optional custom HTTP adapter (fetch is used by default). */
  request?: RequestAdapter;
  /** Extract access / refresh token from API response */
  getToken?: (response: unknown, options?: { url?: string; type: 'access' | 'refresh' }) => string;
  /**
   * Optional auth state extractor (cookie-only / BFF).
   * Use when your backend session is stored in HTTP-only cookies and API responses intentionally contain no tokens.
   */
  getIsAuthenticated?: (response: unknown, options?: { url?: string }) => boolean;
};
