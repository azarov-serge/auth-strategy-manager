import type { AuthManagerData } from '@auth-strategy-manager/core';
import { Config, RequestConfig, RequestAdapter, RestResponse, UrlConfig, UrlName } from './types';

const DEFAULT_NAME = 'rest';

export class RestStrategy {
  public readonly name: string;
  public readonly request: RequestAdapter;
  public readonly urls: Partial<Record<UrlName, UrlConfig>>;
  public readonly getToken?: Config['getToken'];
  public readonly getIsAuthenticated?: Config['getIsAuthenticated'];
  public signInUrl?: string;

  private currentRefresh: Promise<AuthManagerData> | null = null;
  private startUrlValue?: string;

  constructor(config: Config) {
    const { name, signInUrl, request, getToken, getIsAuthenticated, ...urls } = config;

    this.name = name || DEFAULT_NAME;
    this.signInUrl = signInUrl;
    this.urls = urls;
    this.request = request ?? this.defaultRequest;
    this.getToken = getToken;
    this.getIsAuthenticated = getIsAuthenticated;
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
    const response = await this.callRequest(url, { method });

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

    await this.callRequest(url, { method });
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
      const response = await this.callRequest(url, { method });
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

    let requestConfig: RequestConfig = {};
    if (config && typeof config === 'object') {
      requestConfig = config as RequestConfig;
    }

    return await this.callRequest(url, { ...requestConfig, method });
  };

  private toAuthManagerData = (response: unknown, url?: string): AuthManagerData => {
    const accessToken = this.extractToken(response, { url, type: 'access' });
    const refreshToken = this.extractToken(response, { url, type: 'refresh' }) || undefined;
    const isAuthenticated = this.getIsAuthenticated
      ? this.getIsAuthenticated(response, { url })
      : Boolean(accessToken || refreshToken);

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

  private callRequest = async (url: string, config?: RequestConfig): Promise<unknown> => {
    try {
      return await this.request(url, config);
    } catch (error) {
      throw this.normalizeRequestError(error);
    }
  };

  private normalizeRequestError = (error: unknown): unknown => {
    if (!(error instanceof Error)) {
      return error;
    }
    const err = error as Error & { code?: unknown };
    if (typeof err.code === 'string' && err.code) {
      return err;
    }
    const message = String(err.message ?? '');
    const lower = message.toLowerCase();
    const code =
      lower.includes('timeout') || lower.includes('timed out') || lower.includes('aborted')
        ? 'ETIMEDOUT'
        : 'ERR_NETWORK';

    err.code = code;
    return err;
  };

  private defaultRequest: RequestAdapter = async (url, config = {}) => {
    const finalUrl = this.withQuery(url, config.params);
    const { signal, timeoutMs } = config;
    const controller = timeoutMs ? new AbortController() : null;
    const timeoutId =
      controller && timeoutMs
        ? setTimeout(() => controller.abort(new Error('Request timeout')), timeoutMs)
        : null;

    if (signal && controller && !signal.aborted) {
      signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
    }

    const body = this.toBody(config);
    const headers = { ...(config.headers ?? {}) };
    if (body && typeof body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(finalUrl, {
        method: config.method,
        headers,
        body,
        credentials: config.credentials ?? (config.withCredentials ? 'include' : 'same-origin'),
        signal: controller?.signal ?? signal,
      });

      const data = await this.parseResponseData(response);
      const restResponse: RestResponse = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: this.headersToRecord(response.headers),
        url: response.url,
        raw: response,
      };
      return restResponse;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  private toBody(config: RequestConfig): BodyInit | null | undefined {
    if (config.body !== undefined) {
      return config.body;
    }
    if (config.data === undefined || config.data === null) {
      return undefined;
    }
    if (typeof config.data === 'string' || config.data instanceof FormData || config.data instanceof URLSearchParams) {
      return config.data;
    }
    return JSON.stringify(config.data);
  }

  private withQuery(
    url: string,
    params?: Record<string, string | number | boolean | null | undefined>
  ): string {
    if (!params) {
      return url;
    }
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }
      query.set(key, String(value));
    }
    const queryString = query.toString();
    if (!queryString) {
      return url;
    }
    return url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
  }

  private async parseResponseData(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (response.status === 204 || response.status === 205) {
      return null;
    }
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  }

  private headersToRecord(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}
