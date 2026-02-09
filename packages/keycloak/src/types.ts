import type { KeycloakInitOptions } from 'keycloak-js';

export type Config = {
  keycloak: {
    realm: string;
    url: string;
    clientId: string;
  };

  init?: KeycloakInitOptions;

  loginUrl?: string;
  name?: string;
  only?: boolean;
};
