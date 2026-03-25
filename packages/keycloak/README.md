# @auth-strategy-manager/keycloak

Keycloak strategy for [auth-strategy-manager](https://github.com/azarov-serge/auth-strategy-manager). **v2** targets `@auth-strategy-manager/core` **^2.0.0**.

## Documentation in other languages

- [Russian (Русский)](README_RU.md)
- English (this file)

## Installation

```bash
npm install @auth-strategy-manager/keycloak @auth-strategy-manager/core keycloak-js
```

## Usage

Use `AuthStrategyManager` from **core** for persistence (`AuthStorageManager`, strategy name, tokens). `KeycloakStrategy` talks to Keycloak JS and returns `AuthManagerData` from `checkAuth`, `signIn`, and `refreshToken`.

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
  name: 'my-keycloak',
  only: false,
  init: {
    flow: 'standard',
    onLoad: 'check-sso',
  },
});

const authManager = new AuthStrategyManager([keycloakStrategy]);

// Optional: align redirect base with the manager (used by keycloak.login / logout redirects)
keycloakStrategy.startUrl = authManager.startUrl ?? window.location.origin;

const state = await authManager.checkAuth();
await authManager.signIn();
await authManager.refreshToken(30);
await authManager.signOut();
```

### Before you test (integration checklist)

- Install **`@auth-strategy-manager/core@^2.0.0`** together with **`@auth-strategy-manager/keycloak@^2.0.0`** (peer dependency).
- Prefer **`authManager.checkAuth()` / `signIn()` / `refreshToken()` / `signOut()`** so `AuthStorageManager` stays in sync with `AuthManagerData`. Calling only `keycloakStrategy.*` skips manager persistence.
- **`keycloak.login()`** often triggers a **full redirect**; when the app loads again, run **`authManager.checkAuth()`** (or your bootstrap flow) so tokens from Keycloak JS are written through the manager.
- Set **`keycloakStrategy.startUrl`** (and **`signInUrl`** in config when needed) to URLs Keycloak is allowed to redirect to (must match Keycloak client settings).
- With **multiple strategies**, call **`authManager.use('my-keycloak')`** (same string as `name` in config, default is `'keycloak'`).
- There is **no** `KeycloakStrategy.clear()` — use **`authManager.clear()`**; tokens are not mirrored into Storage by this package.

## Breaking changes from v1

- **`checkAuth`** returns `Promise<AuthManagerData>` (not `boolean`). Prefer `authManager.checkAuth()` so storage stays in sync.
- **`refreshToken`** returns `Promise<AuthManagerData>` (not `void`).
- Strategy name and session flags are owned by **core** `AuthStrategyManager` / `AuthStorageManager`.
- **`startUrl`** is stored on the strategy instance only (not mirrored via `localStorage` from this package).
- **`accessToken` storage config removed** — use **core** `AuthStorageManager` only; no duplicate mirror in `sessionStorage` / `localStorage` from this package.
- **Peer dependency**: install `@auth-strategy-manager/core` **^2.0.0** yourself.

## Configuration

### KeycloakConfig

```typescript
import type { KeycloakInitOptions } from 'keycloak-js';

type KeycloakConfig = {
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
```

### Parameters

- `keycloak.*` — Keycloak client settings passed to `keycloak-js`.
- `init` — Options for `keycloak.init` (default: `{ flow: 'standard', onLoad: 'check-sso' }`).
- `signInUrl` — Redirect URI for login / logout when `only` is false.
- `name` — Strategy id (default: `'keycloak'`).
- `only` — If `true`, `logout` uses no `redirectUri`.

Token storage is **not** configured on this strategy: use `AuthStorageManager` on `AuthStrategyManager` from **core** (Keycloak keeps tokens in memory on the JS client; `checkAuth` / `refreshToken` / `signIn` expose them via `AuthManagerData` for the manager to persist).

## API

### KeycloakStrategy

#### Constructor

```typescript
constructor(config: KeycloakConfig)
```

#### Methods

- `checkAuth(): Promise<AuthManagerData>`
- `signIn<T, D>(config?: D): Promise<T>` — merges Keycloak session into `AuthManagerData` shape in the return value when no full page redirect occurs.
- `signUp<T, D>(config?: D): Promise<T>` — returns an unauthenticated `AuthManagerData` placeholder (no Keycloak registration flow here).
- `signOut(): Promise<void>` — `keycloak.logout`.
- `refreshToken<T>(sec?: T): Promise<AuthManagerData>` — `updateToken`; `sec` as a number sets `minValiditySeconds` (default **5**).

#### Properties

- `name`, `keycloak`, `only`, `init`, `signInUrl`
- `token` (read-only) / `isAuthenticated` — from the Keycloak JS client
- `startUrl` — get/set in-memory redirect base

## License

ISC
