## Auth Strategy Manager
Authorization utility based on strategies. Strategy implements the Strategy type.

```typescript
export type Strategy = {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  signInUrl?: string;
  check: () => Promise<boolean>;
  signIn: <D, T>(config?: AxiosRequestConfig<D>) => Promise<T>;
  signUp: <D, T>(config?: AxiosRequestConfig<D>) => Promise<T>;
  signOut: () => Promise<void>;
  refreshToken: <T>(args?: T) => Promise<void>;
};

export type AuthorizerInterface = {
  strategiesCount: number;
  strategy: Strategy;
  isKeycloak: boolean;
  startUrl: string | undefined;

  check: () => Promise<boolean>;
  setStrategies: (strategies: Strategy[]) => Promise<void>;
  use: (strategyName: string) => void;
  clear: () => void;
};
```

2 strategies are implemented:
- `rest` - authorization by signIn and password (`RestStrategy`). `access token` is stored in `Session storage`.
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
} from 'auth-strategy-manager';


const BASE_URL = 'https://localhost:3001'


const activeStrategies = window.envConfig.AUTH_STRATEGIES ?? [];

const protocol = window.location.protocol;
const [baseUrl] = window.location.href.replace(`${protocol}//`, '').split('/');

const signInUrl = `${protocol}//${baseUrl}/signIn`;

const {
  KEYCLOAK_REALM: realm,
  KEYCLOAK_URL: keycloakUrl,
  KEYCLOAK_CLIENT_ID: clientId,
} = window.envConfig ?? {};

const keycloakStrategy = new KeycloakStrategy({
  keycloak: { realm, url: keycloakUrl, clientId },
  signInUrl: signInUrl,
  only: activeStrategies.length === 1 && activeStrategies.includes('sso'),
});

const restStrategy = new restStrategy({
  signInUrl: signInUrl,
  check: {
    url: `${BASE_URL}/token/refresh`,
    method: 'POST',
  },
  signIn: {
    url: `${BASE_URL}/auth/sign-in`,
    method: 'POST',
  },
  signUp: {
    url: `${BASE_URL}/auth/sign-up`,
    method: 'POST',
  },
  signOut: { url: `${BASE_URL}/auth/sign-out`, method: 'POST' },
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
