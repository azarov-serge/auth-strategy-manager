import type { KeycloakInitOptions } from 'keycloak-js';

export type StorageType = 'sessionStorage' | 'localStorage';

export type TokenConfig = {
  key: string;
  storageType: StorageType;
  storage?: Storage;
  /** Extract access / refresh token from API response */
  getToken?: (response: unknown, url?: string) => string;
};

export type AccessTokenConfig = TokenConfig;

export type Config = {
  keycloak: {
    realm: string;
    url: string;
    clientId: string;
  };
  init?: KeycloakInitOptions;
  signInUrl?: string;
  name?: string;
  only?: boolean;
  /** Where and how to store the access token. Default: { key: 'access', storage: 'sessionStorage' } */
  accessToken?: Partial<AccessTokenConfig>;
};
