import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import { Strategy, StrategyHelper } from '@auth-strategy-manager/core';
import { AccessTokenConfig, Config, StorageType } from './types';

const DEFAULT_NAME = 'keycloak';
const DEFAULT_ACCESS_KEY = 'access';
const DEFAULT_ACCESS_STORAGE: StorageType = 'sessionStorage';
const MIN_VALIDITY_SECONDS = 5;

export class KeycloakStrategy implements Strategy {
  readonly name: string;
  readonly keycloak: Keycloak;
  readonly only: boolean;
  readonly init?: KeycloakInitOptions;

  signInUrl?: string;

  private readonly helper: StrategyHelper;
  private readonly accessTokenConfig: AccessTokenConfig;

  constructor(config: Config) {
    const { name, keycloak, signInUrl, init, accessToken } = config;

    this.helper = new StrategyHelper();
    this.name = name || DEFAULT_NAME;
    this.signInUrl = signInUrl;
    this.only = config?.only ?? false;
    this.init = init;

    this.keycloak = new Keycloak(keycloak);

    this.accessTokenConfig = {
      key: accessToken?.key ?? DEFAULT_ACCESS_KEY,
      storageType: accessToken?.storageType ?? DEFAULT_ACCESS_STORAGE,
      storage: accessToken?.storage,
      getToken: accessToken?.getToken,
    };
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

  set token(token: string | undefined) {
    const accessStorage = this.getAccessStorage();

    if (token && accessStorage) {
      accessStorage.setItem(this.accessTokenConfig.key, token);
    }
  }

  get isAuthenticated(): boolean {
    return this.helper.isAuthenticated;
  }

  public checkAuth = async (): Promise<boolean> => {
    if (this.helper.isAuthenticated) {
      return true;
    }

    const isAuthenticated = await this.keycloak.init(
      this.init || {
        flow: 'standard',
        onLoad: 'check-sso',
      }
    );

    this.token = this.keycloak.token;
    this.helper.isAuthenticated = isAuthenticated;

    if (isAuthenticated) {
      this.helper.activeStrategyName = this.name;
      await this.signIn();
    }

    return isAuthenticated;
  };

  public signIn = async <T>(): Promise<T> => {
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
      this.token = this.keycloak.token;
      this.helper.isAuthenticated = true;
    }

    return undefined as T;
  };

  public signUp = async <T>(): Promise<T> => {
    return undefined as T;
  };

  public signOut = async (): Promise<void> => {
    await this.keycloak.logout({
      redirectUri: this.only ? undefined : this.signInUrl,
    });

    this.helper.reset();
    const accessStorage = this.getAccessStorage();

    accessStorage?.removeItem(this.accessTokenConfig.key);
  };

  /**
   * @param sec - minValiditySeconds: number | undefined - if the token expires within a few seconds, it is refreshed.
   * If iframe session status is enabled, session status is also checked.
   * If not specified, the value 5 is used.
   */
  public refreshToken = async <T>(sec?: T): Promise<void> => {
    const minValiditySeconds = typeof sec === 'number' ? sec : MIN_VALIDITY_SECONDS;

    try {
      await this.keycloak.updateToken(minValiditySeconds);
    } catch (error) {}
  };

  protected getStorage = (type: StorageType): Storage => {
    return window[type];
  };

  protected getAccessStorage = (): Storage => {
    return this.accessTokenConfig?.storage ?? this.getStorage(this.accessTokenConfig.storageType);
  };
}
