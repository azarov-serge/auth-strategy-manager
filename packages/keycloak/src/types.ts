import type { KeycloakInitOptions } from 'keycloak-js';

/** Same shape as `AuthManagerData` from `@auth-strategy-manager/core` v2. */
export type AuthManagerData = {
  isAuthenticated: boolean;
  strategyName: string;
  accessToken: string;
  refreshToken?: string;
};

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
};
