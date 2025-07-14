export type Config = {
  keycloak: {
    realm: string;
    url: string;
    clientId: string;
  };

  loginUrl?: string;
  name?: string;
  only?: boolean;
};
