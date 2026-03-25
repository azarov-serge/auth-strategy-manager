# @auth-strategy-manager/core

Core authentication strategy manager - the foundation for all authentication strategies.

## 🌍 Documentation in Other Languages

- [🇷🇺 Русский (Russian)](README_RU.md)
- [🇺🇸 English (Current)](README.md)

## Installation

```bash
npm install @auth-strategy-manager/core
```

## Usage

```typescript
import type { AuthManagerData, Strategy } from '@auth-strategy-manager/core';
import { AuthStrategyManager } from '@auth-strategy-manager/core';

class CustomStrategy implements Strategy {
  readonly name = 'custom';

  public checkAuth = async (): Promise<AuthManagerData> => {
    return {
      isAuthenticated: true,
      strategyName: this.name,
      accessToken: '',
      refreshToken: undefined,
    };
  };

  public signIn = async <T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T> => {
    return {} as T;
  };

  public signUp = async <T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T> => {
    return {} as T;
  };

  public signOut = async (): Promise<void> => {};

  public refreshToken = async <T>(_args?: T): Promise<AuthManagerData> => {
    return {
      isAuthenticated: false,
      strategyName: this.name,
      accessToken: '',
      refreshToken: undefined,
    };
  };
}

const authManager = new AuthStrategyManager([new CustomStrategy()]);
const state = await authManager.checkAuth();
await authManager.signOut();
```

## API

### AuthStrategyManager

Main class for managing authentication strategies.

#### Constructor

```typescript
constructor(strategies: Strategy[])
```

Creates a new AuthStrategyManager instance with the provided strategies.

#### Properties

- `strategiesCount: number` - Total number of registered strategies
- `strategy: Strategy` - Currently active strategy. When only one strategy is provided, it is used by default (no need to call `use()`).
- `startUrl: string | undefined` - URL to redirect after authentication

#### Methods

- `checkAuth(): Promise<AuthManagerData>` - Check authentication status across all strategies and return normalized auth state. Strategies whose runtime constructor name is `RestStrategy` skip `checkAuth` when both `accessToken` and `refreshToken` in `AuthStorageManager` use only `localStorage`/`sessionStorage` and are empty (no redundant HTTP probe). Other strategies are always probed. Slots using `HTTP_ONLY_COOKIE` or `RAM` are never treated as “empty proof” so cookie-only REST still runs `checkAuth`. Aggressive class-name minification can break the `RestStrategy` name check.
- `signIn<T = unknown, D = undefined>(config?: D): Promise<T>` - Proxy to the active strategy `signIn`.
- `signUp<T = unknown, D = undefined>(config?: D): Promise<T>` - Proxy to the active strategy `signUp`.
- `signOut(): Promise<void>` - Proxy to the active strategy `signOut`.
- `refreshToken<T>(args?: T): Promise<AuthManagerData>` - Proxy to the active strategy `refreshToken` and return normalized auth state.
- `setStrategies(strategies: Strategy[]): Promise<void>` - Replace all strategies with new ones
- `use(strategyName: string): void` - Set the active strategy by name (only needed when using multiple strategies)
- `clear(): void` - Clear authentication state and reset all strategies

AuthStrategyManager implements the `Strategy` interface and can be used as a facade over the active strategy in your application code.

### AuthStorageManager: defaults

`new AuthStorageManager(config)` — every field in `config` is optional (you can use `new AuthStorageManager()` or `{}`). When omitted, the constructor applies:

- **`strategyName`** — `config.strategyName ?? new StrategyNameStorage()` (`authStrategyName` in `localStorage`). Pass your own instance if you need another key or storage type.
- **`accessToken`** — `config.accessToken ?? new AuthStorage('accessToken', 'HTTP_ONLY_COOKIE')`.
- **`refreshToken`** — `config.refreshToken ?? new AuthStorage('refreshToken', 'HTTP_ONLY_COOKIE')`.
- **`startUrl`** — `config.startUrl ?? new AuthStorage('startUrl', 'localStorage')`.
- **`isAuthenticated`** — `config.isAuthenticated ?? new AuthStorage('isAuthenticated', 'RAM')`.

The defaults match the recommended setup; override with your own `AuthStorage` instances in `config` when they do not fit.

### AuthManager Token Storage Policy (Best Practice)

`AuthStrategyManager` is the single place that controls auth state, active strategy, and token storage policy.

Default policy ("security-first", recommended today):

- `accessToken`: `HTTP_ONLY_COOKIE`
- `refreshToken`: `HTTP_ONLY_COOKIE`

You can override this behavior (`sessionStorage` / `localStorage`) when needed, but for critical flows prefer explicit configuration.

#### Recommended patterns

1) `access: HTTPOnly cookie` + `refresh: HTTPOnly cookie` (default)

- Common in security-first teams and BFF/server-session architectures.
- Pros: minimal XSS exposure for tokens.
- Cons: requires careful CORS/CSRF setup and backend discipline.

2) `access: sessionStorage` + `refresh: HTTPOnly cookie` (common SPA compromise)

- Access token is available to JS for Bearer flows.
- Refresh token stays protected from JS.
- Good balance between UX and security.

#### Example 1: access + refresh in HTTPOnly cookies (default)

You can omit `strategyName` and `isAuthenticated`; the manager supplies defaults.

```typescript
import { AuthStorage, AuthStorageManager } from '@auth-strategy-manager/core';

const storageManager = new AuthStorageManager({
  accessToken: new AuthStorage('accessToken', 'HTTP_ONLY_COOKIE'),
  refreshToken: new AuthStorage('refreshToken', 'HTTP_ONLY_COOKIE'),
});
```

#### Example 2: access in sessionStorage + refresh in HTTPOnly cookie

```typescript
import { AuthStorage, AuthStorageManager } from '@auth-strategy-manager/core';

const storageManager = new AuthStorageManager({
  accessToken: new AuthStorage('accessToken', 'sessionStorage'),
  refreshToken: new AuthStorage('refreshToken', 'HTTP_ONLY_COOKIE'),
});
```

#### Example 3: custom strategy name storage

```typescript
import { AuthStorage, AuthStorageManager } from '@auth-strategy-manager/core';

const storageManager = new AuthStorageManager({
  strategyName: new AuthStorage('myStrategyKey', 'sessionStorage'),
  accessToken: new AuthStorage('accessToken', 'sessionStorage'),
  refreshToken: new AuthStorage('refreshToken', 'HTTP_ONLY_COOKIE'),
});
```

#### Patterns that are usually not recommended

3) `access: sessionStorage` + `refresh: sessionStorage`

- Sometimes acceptable for low-risk internal apps.
- Downside: both tokens are JS-readable (higher XSS risk).

4) `access: sessionStorage` + `refresh: localStorage`

- Rare and controversial.
- Used for persistence across browser restarts, but weaker security due to long-lived refresh in `localStorage`.

5) `access: localStorage` + `refresh: localStorage`

- Historically common, now generally treated as an anti-pattern for public apps.
- Highest XSS attack surface among these options.

#### Usage Examples

```typescript
// Create manager with strategies
const authManager = new AuthStrategyManager([strategy1, strategy2]);

// Check if user is authenticated
const isAuthenticated = await authManager.checkAuth();

// Switch to specific strategy
authManager.use('keycloak');

// Get current active strategy
const currentStrategy = authManager.strategy;

// Clear all authentication data
authManager.clear();
```

### Strategy Interface

```typescript
type AuthManagerData = {
  isAuthenticated: boolean;
  strategyName: string;
  accessToken: string;
  refreshToken?: string;
};

interface Strategy {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  signInUrl?: string;

  checkAuth(): Promise<AuthManagerData>;
  signIn<T = unknown, D = undefined>(config?: D): Promise<T>;
  signUp<T = unknown, D = undefined>(config?: D): Promise<T>;
  signOut(): Promise<void>;
  refreshToken<T>(args?: T): Promise<AuthManagerData>;
  clear?(): void;
}
```

## License

ISC
