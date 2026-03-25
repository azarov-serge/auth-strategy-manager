# Auth Strategy Manager

[![npm version](https://badge.fury.io/js/auth-strategy-manager.svg)](https://badge.fury.io/js/auth-strategy-manager)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A flexible library for managing authentication with support for multiple strategies. Allows easy integration of various authentication methods (Keycloak, REST API, Supabase, custom) into a unified interface.

## 🌍 Documentation in Other Languages

- [🇷🇺 Русский (Russian)](README_RU.md)
- [🇺🇸 English (Current)](README.md)

## 📦 Packages

This repository contains the following packages:

- **[@auth-strategy-manager/core](https://www.npmjs.com/package/@auth-strategy-manager/core)** - Core authentication strategy manager: `AuthStrategyManager`, `Strategy`, `AuthStorageManager`, `StrategyNameStorage`, errors, constants.
- **[@auth-strategy-manager/keycloak](https://www.npmjs.com/package/@auth-strategy-manager/keycloak)** - Keycloak strategy
- **[@auth-strategy-manager/rest](https://www.npmjs.com/package/@auth-strategy-manager/rest)** - REST API strategy
- **[@auth-strategy-manager/supabase](https://www.npmjs.com/package/@auth-strategy-manager/supabase)** - Supabase strategy (**v2**, peer **core ^2.0.0**)

## 🚀 Quick Start

### Install Core Package

```bash
npm install @auth-strategy-manager/core
```

### Install with Keycloak Strategy

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/keycloak keycloak-js
```

### Install with REST Strategy

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/rest axios
```

### Install with Supabase Strategy

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/supabase @supabase/supabase-js
```

### Install All Packages

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/keycloak @auth-strategy-manager/rest @auth-strategy-manager/supabase keycloak-js axios @supabase/supabase-js
```

## 🔧 Usage

### Basic Usage with Core Only

```typescript
import { AuthStrategyManager, Strategy } from '@auth-strategy-manager/core';

// Create custom strategy
class CustomStrategy implements Strategy {
  readonly name = 'custom';
  
  public checkAuth = async (): Promise<AuthManagerData> => {
    // Your authentication logic
    return { isAuthenticated: true, strategyName: this.name, accessToken: "", refreshToken: undefined };
  };
  
  public signIn = async <T = unknown, D = undefined>(config?: D): Promise<T> => {
    // Your sign in logic
    return {} as T;
  };
  
  public signUp = async <T = unknown, D = undefined>(config?: D): Promise<T> => {
    // Your sign up logic
    return {} as T;
  };
  
  public signOut = async (): Promise<void> => {
    // Your sign out logic
    this.clearStorage();
  };
  
  public refreshToken = async <T>(args?: T): Promise<AuthManagerData> => {
    // Your token refresh logic
  };

  public clear = (): void => {
    // Your clear logic
  };
}

// Use with strategy manager
const authManager = new AuthStrategyManager([new CustomStrategy()]);
```

### AuthStrategyManager API

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

`AuthStrategyManager` implements the `Strategy` interface and can be used as a facade over the active strategy.

### AuthManager Token Storage Policy (Best Practice)

`AuthStrategyManager` is the single place that controls auth state, active strategy selection, and token storage policy.

Default policy ("security-first", recommended today):

- `accessToken`: `HTTP_ONLY_COOKIE`
- `refreshToken`: `HTTP_ONLY_COOKIE`

You can override this behavior for specific app needs (`sessionStorage` / `localStorage`), but for critical flows prefer explicit configuration.

#### Recommended patterns

1) `access: HTTPOnly cookie` + `refresh: HTTPOnly cookie` (default)

- Most common in security-first teams and BFF/server-session architectures.
- Pros: minimal XSS exposure for tokens.
- Cons: requires careful CORS/CSRF handling and backend discipline.

2) `access: sessionStorage` + `refresh: HTTPOnly cookie` (common SPA compromise)

- Access token is available to JS for Bearer workflows.
- Refresh token stays protected from JS.
- Good balance between UX and security for many SPAs.

#### Example 1: access + refresh in HTTPOnly cookies (default)

```typescript
import { AuthStorage, AuthStorageManager, StrategyNameStorage } from '@auth-strategy-manager/core';

const storageManager = new AuthStorageManager({
  strategyName: new StrategyNameStorage(),
  accessToken: new AuthStorage('accessToken', 'HTTP_ONLY_COOKIE'),
  refreshToken: new AuthStorage('refreshToken', 'HTTP_ONLY_COOKIE'),
});
```

#### Example 2: access in sessionStorage + refresh in HTTPOnly cookie

```typescript
import { AuthStorage, AuthStorageManager, StrategyNameStorage } from '@auth-strategy-manager/core';

const storageManager = new AuthStorageManager({
  strategyName: new StrategyNameStorage(),
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
- Used for persistence across browser restarts, but security is weaker due to long-lived refresh in `localStorage`.

5) `access: localStorage` + `refresh: localStorage`

- Historically common, now generally treated as an anti-pattern for public apps.
- Highest XSS attack surface among these options.

#### Usage Examples

```typescript
// Create manager with strategies
const authManager = new AuthStrategyManager([strategy1, strategy2]);

// Normalized auth state (persisted via AuthStorageManager)
const authState = await authManager.checkAuth();

// Switch to specific strategy
authManager.use('keycloak');

// Get current active strategy
const currentStrategy = authManager.strategy;

// Clear all authentication data
authManager.clear();
```

### Using Keycloak Strategy (v2)

Requires **core ^2.0.0** and **@auth-strategy-manager/keycloak ^2.0.0**. See the [Keycloak package README](packages/keycloak/README.md) for the full checklist.

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { KeycloakStrategy } from '@auth-strategy-manager/keycloak';

const keycloakStrategy = new KeycloakStrategy({
  keycloak: {
    realm: 'my-realm',
    url: 'https://keycloak.example.com',
    clientId: 'my-client',
  },
  signInUrl: 'https://myapp.com/login',
  name: 'keycloak',
  init: { flow: 'standard', onLoad: 'check-sso' },
});

const authManager = new AuthStrategyManager([keycloakStrategy]);
keycloakStrategy.startUrl = authManager.startUrl ?? window.location.origin;

await authManager.checkAuth();
await authManager.signIn();
await authManager.signOut();
```

### Using REST Strategy (v2)

Token storage is configured on **`AuthStrategyManager`** via **`AuthStorageManager`**, not on `RestStrategy`. Only pass URL endpoints and `getToken` here.

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { RestStrategy } from '@auth-strategy-manager/rest';

const restStrategy = new RestStrategy({
  name: 'rest',
  getToken: (response, options) => {
    const data = (response as { data?: { access?: string } }).data;
    return options?.type === 'refresh' ? '' : data?.access ?? '';
  },
  checkAuth: { url: '/api/auth/me', method: 'GET' },
  signIn: { url: '/api/auth/sign-in', method: 'POST' },
  signUp: { url: '/api/auth/sign-up', method: 'POST' },
  refresh: { url: '/api/auth/refresh', method: 'POST' },
});

const authManager = new AuthStrategyManager([restStrategy]);

await authManager.checkAuth();
await authManager.signOut();
```

### Using Supabase Strategy (v2)

Requires **core ^2.0.0** and **@auth-strategy-manager/supabase ^2.0.0**. Config field is **`supabase`** (the Supabase client), not `supabaseClient`. See [Supabase package README](packages/supabase/README.md).

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { SupabaseStrategy, SupabaseConfig } from '@auth-strategy-manager/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const supabaseStrategy = new SupabaseStrategy({
  supabase,
  name: 'supabase',
  signInUrl: 'https://myapp.com/login',
} satisfies SupabaseConfig);

const authManager = new AuthStrategyManager([supabaseStrategy]);

const state = await authManager.checkAuth();
await authManager.signIn({ email: 'user@example.com', password: 'password123' });
await authManager.refreshToken();
await authManager.signOut();
```

### Using Multiple Strategies

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { KeycloakStrategy } from '@auth-strategy-manager/keycloak';
import { RestStrategy } from '@auth-strategy-manager/rest';

const keycloakStrategy = new KeycloakStrategy({
  keycloak: {
    realm: 'my-realm',
    url: 'https://keycloak.example.com',
    clientId: 'my-client'
  }
});

const restStrategy = new RestStrategy({
  name: 'rest',
  getToken: (response) =>
    (response as { data?: { access?: string } }).data?.access ?? '',
  checkAuth: { url: '/api/auth/me', method: 'GET' },
  signIn: { url: '/api/auth/sign-in', method: 'POST' },
  signUp: { url: '/api/auth/sign-up', method: 'POST' },
  refresh: { url: '/api/auth/refresh', method: 'POST' },
});

const authManager = new AuthStrategyManager([keycloakStrategy, restStrategy]);
authManager.use('keycloak');

await authManager.checkAuth();
```

## 🏗️ Architecture

### Core Package (@auth-strategy-manager/core)

Contains the main classes and interfaces:

- `AuthStrategyManager` - Main manager class
- `Strategy` - Interface for all strategies
- `AuthStorageManager`, `StrategyNameStorage`, `AuthStorage` - v2 storage model
- Error classes and constants

### Keycloak Package (@auth-strategy-manager/keycloak)

- **v2** — `KeycloakStrategy` returns `AuthManagerData`; pair with **core ^2.0.0**
- [README](packages/keycloak/README.md) — integration checklist before testing

### REST Package (@auth-strategy-manager/rest)

Provides REST API integration:

- `RestStrategy` - REST API authentication strategy
- REST-specific configuration types

### Supabase Package (@auth-strategy-manager/supabase)

- **v2** — `checkAuth` / `signIn` / `signUp` / `refreshToken` return or merge **`AuthManagerData`**; pair with **core ^2.0.0** (peer dependency)
- [README](packages/supabase/README.md) — integration checklist and breaking changes from v1

## 📖 Documentation

- [Core Package Documentation](https://www.npmjs.com/package/@auth-strategy-manager/core)
- [Keycloak Strategy Documentation](https://www.npmjs.com/package/@auth-strategy-manager/keycloak)
- [REST Strategy Documentation](https://www.npmjs.com/package/@auth-strategy-manager/rest)
- [Supabase Strategy Documentation](https://www.npmjs.com/package/@auth-strategy-manager/supabase)

## 🧪 Development

### Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build specific package
npm run build --workspace=@auth-strategy-manager/core
```

### Publishing

```bash
# Publish all packages
npm run publish:all

# Publish specific package
npm run publish:core
npm run publish:keycloak
npm run publish:rest
npm run publish:supabase
```

## 📝 License

ISC License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you have questions or issues, create an issue in the GitHub repository.

---

**Auth Strategy Manager** - make authentication simple and flexible! 🔐 

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
  signIn<T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T>;
  signUp<T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T>;
  signOut(): Promise<void>;
  refreshToken<T>(args?: T): Promise<AuthManagerData>;
  clear?(): void;
}
```
