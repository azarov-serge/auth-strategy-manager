## Authorizer
Authorization utility based on strategies. Strategy implements the Strategy type.

```typescript
export type Strategy = {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  loginUrl?: string;
  check: () => Promise<boolean>;
  logIn: <D, T>(config?: AxiosRequestConfig<D>) => Promise<T>;
  logOut: () => Promise<void>;
  refreshToken: <T>(args?: T) => Promise<void>;
};
```

2 strategies are implemented:
- `rest` - authorization by login and password (`RestStrategy`). `access token` is stored in `Session storage`.
- `keycloak` - authorization through Keycloak (`KeycloakStrategy`)

Example:

```typescript
import { 
  Authorizer,
  KeycloakStrategy,
  restStrategy,
  isObject,
  isString
  errorChecker 
} from 'mobx-tk';


const BASE_URL = 'https://localhost:3001'


const activeStrategies = window.envConfig.AUTH_STRATEGIES ?? [];

const protocol = window.location.protocol;
const [baseUrl] = window.location.href.replace(`${protocol}//`, '').split('/');

const logInUrl = `${protocol}//${baseUrl}/login`;

const {
  KEYCLOAK_REALM: realm,
  KEYCLOAK_URL: keycloakUrl,
  KEYCLOAK_CLIENT_ID: clientId,
} = window.envConfig ?? {};

const keycloakStrategy = new KeycloakStrategy({
  keycloak: { realm, url: keycloakUrl, clientId },
  loginUrl: logInUrl,
  only: activeStrategies.length === 1 && activeStrategies.includes('sso'),
});

const restStrategy = new restStrategy({
  loginUrl: logInUrl,
  check: {
    url: `${BASE_URL}/token/refresh`,
    method: 'POST',
  },
  logIn: {
    url: `${BASE_URL}/auth/login`,
    method: 'POST',
  },
  logOut: { url: `${BASE_URL}/auth/logout`, method: 'POST' },
  refresh: {
    url: `${BASE_URL}/token/refresh`,
    method: 'POST',
  },
  getToken: (response: unknown): string => {
    if (isString(response)) {
      return response;
    }

    if (
      isObject(response) &&
      'access' in response &&
      isString(response.access)
    ) {
      return response.access;
    }

    return '';
  },
});

const allStrategies = [keycloakStrategy, restStrategy];

const strategies = activeStrategies.length
  ? allStrategies
      .filter((strategy) => activeStrategies.includes(strategy.name))
      .sort((a, b) => activeStrategies.indexOf(a.name) - activeStrategies.indexOf(b.name))
  : allStrategies;

const authorizer = new Authorizer(strategies);

export { restStrategy, keycloakStrategy, authorizer };
```