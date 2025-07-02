import Keycloak from 'keycloak-js';

import { strategyHelper, StrategyHelper } from '../helpers';
import { Strategy } from '../types';

type Config = {
  keycloak: {
    realm: string;
    url: string;
    clientId: string;
  };

  loginUrl?: string;
  name?: string;
  only?: boolean;
};

const DEFAULT_NAME = 'keycloak';
const MIN_VALIDITY_SECONDS = 5;

export class KeycloakStrategy implements Strategy {
  readonly name: string;
  readonly keycloak: Keycloak;
  readonly only: boolean;

  signInUrl?: string;

  private readonly helper: StrategyHelper;

  constructor(config: Config) {
    const { name, keycloak, loginUrl } = config;

    this.helper = strategyHelper;
    this.name = name || DEFAULT_NAME;
    this.signInUrl = loginUrl;
    this.only = config?.only ?? false;

    this.keycloak = new Keycloak(keycloak);
  }

  get startUrl(): string | undefined {
    return this.helper.startUrl;
  }

  set startUrl(url: string) {
    this.helper.startUrl = url;
  }

  get token(): string | undefined {
    return this.keycloak.token;
  }

  get isAuthenticated(): boolean {
    return this.helper.isAuthenticated;
  }

  check = async (): Promise<boolean> => {
    if (this.helper.isAuthenticated) {
      return true;
    }

    const isAuthenticated = await this.keycloak.init({
      flow: 'standard',
      onLoad: 'check-sso',
    });

    this.helper.isAuthenticated = isAuthenticated;

    if (isAuthenticated) {
      this.helper.activeStrategyName = this.name;
    }

    return isAuthenticated;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signIn = async <_D, T>(): Promise<T> => {
    this.helper.activeStrategyName = this.name;

    if (this.helper.isAuthenticated) {
      return undefined as T;
    }

    try {
      await this.keycloak.login({ redirectUri: this.startUrl });
      this.helper.isAuthenticated = true;
    } catch (error) {
      await this.keycloak.init({
        onLoad: 'login-required',
        redirectUri: this.startUrl,
      });

      this.helper.isAuthenticated = true;
    }

    return undefined as T;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signUp = async <_D, T>(): Promise<T> => {
    return undefined as T;
  };

  signOut = async (): Promise<void> => {
    await this.keycloak.logout({
      redirectUri: this.only ? undefined : this.signInUrl,
    });

    this.helper.reset();
  };

  /**
   * @param sec - minValiditySeconds: number | undefined - if the token expires within a few seconds, it is refreshed.
   * If iframe session status is enabled, session status is also checked.
   * If not specified, the value 5 is used.
   */
  refreshToken = async <T>(sec?: T): Promise<void> => {
    const minValiditySeconds = typeof sec === 'number' ? sec : MIN_VALIDITY_SECONDS;

    try {
      await this.keycloak.updateToken(minValiditySeconds);
    } catch (error) {}
  };
}
