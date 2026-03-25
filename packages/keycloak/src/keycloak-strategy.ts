import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import type { AuthManagerData } from '@auth-strategy-manager/core';
import { Config } from './types';

const DEFAULT_NAME = 'keycloak';
const MIN_VALIDITY_SECONDS = 5;

/** Compatible with `Strategy` from `@auth-strategy-manager/core` v2 (returns core `AuthManagerData`). */
export class KeycloakStrategy {
  readonly name: string;
  readonly keycloak: Keycloak;
  readonly only: boolean;
  readonly init?: KeycloakInitOptions;

  signInUrl?: string;

  private startUrlValue?: string;

  constructor(config: Config) {
    const { name, keycloak, signInUrl, init } = config;

    this.name = name || DEFAULT_NAME;
    this.signInUrl = signInUrl;
    this.only = config?.only ?? false;
    this.init = init;

    this.keycloak = new Keycloak(keycloak);
  }

  get startUrl(): string | undefined {
    return this.startUrlValue;
  }

  set startUrl(url: string) {
    this.startUrlValue = url;
  }

  get token(): string | undefined {
    return this.keycloak.token;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.keycloak.authenticated && this.keycloak.token);
  }

  private toAuthManagerData(): AuthManagerData {
    const kc = this.keycloak as Keycloak & { refreshToken?: string };

    return {
      isAuthenticated: Boolean(this.keycloak.authenticated && this.keycloak.token),
      strategyName: this.name,
      accessToken: this.keycloak.token ?? '',
      refreshToken: kc.refreshToken,
    };
  }

  public checkAuth = async (): Promise<AuthManagerData> => {
    if (this.keycloak.authenticated && this.keycloak.token) {
      return this.toAuthManagerData();
    }

    await this.keycloak.init(
      this.init ?? {
        flow: 'standard',
        onLoad: 'check-sso',
      }
    );

    return this.toAuthManagerData();
  };

  public signIn = async <T = unknown & AuthManagerData, D = undefined>(_config?: D): Promise<T> => {
    if (this.keycloak.authenticated && this.keycloak.token) {
      return this.toAuthManagerData() as T;
    }

    try {
      await this.keycloak.login({ redirectUri: this.startUrl });
    } catch {
      await this.keycloak.init({
        onLoad: 'login-required',
        redirectUri: this.startUrl,
      });
    }

    return this.toAuthManagerData() as T;
  };

  public signUp = async <T = unknown & AuthManagerData, D = undefined>(_config?: D): Promise<T> => {
    return {
      isAuthenticated: false,
      strategyName: this.name,
      accessToken: '',
      refreshToken: undefined,
    } as T;
  };

  public signOut = async (): Promise<void> => {
    await this.keycloak.logout({
      redirectUri: this.only ? undefined : this.signInUrl,
    });
  };

  /**
   * @param sec - minValiditySeconds: if the token expires within this many seconds, it is refreshed.
   * Default minimum validity is 5 seconds when `sec` is not a number.
   */
  public refreshToken = async <T>(sec?: T): Promise<AuthManagerData> => {
    const minValiditySeconds = typeof sec === 'number' ? sec : MIN_VALIDITY_SECONDS;

    try {
      await this.keycloak.updateToken(minValiditySeconds);
    } catch {
      return {
        isAuthenticated: false,
        strategyName: this.name,
        accessToken: '',
        refreshToken: undefined,
      };
    }

    return this.toAuthManagerData();
  };
}
