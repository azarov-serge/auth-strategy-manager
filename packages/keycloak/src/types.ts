import type { KeycloakInitOptions } from 'keycloak-js';

export type { AuthManagerData } from '@auth-strategy-manager/core';

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
