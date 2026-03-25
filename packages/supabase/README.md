# @auth-strategy-manager/supabase

Supabase strategy for [auth-strategy-manager](https://github.com/azarov-serge/auth-strategy-manager). **v2** targets `@auth-strategy-manager/core` **^2.0.0**.

## Documentation in other languages

- [Russian (Русский)](README_RU.md)
- English (this file)

## Installation

```bash
npm install @auth-strategy-manager/supabase @auth-strategy-manager/core @supabase/supabase-js
```

## Usage

Use `AuthStrategyManager` from **core** for persistence (`AuthStorageManager`, strategy name, tokens). `SupabaseStrategy` uses the Supabase client and returns `AuthManagerData` from `checkAuth`, `signIn`, `signUp`, and `refreshToken`.

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { SupabaseStrategy } from '@auth-strategy-manager/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const supabaseStrategy = new SupabaseStrategy({
  supabase,
  name: 'supabase',
  signInUrl: 'https://myapp.com/login',
});

const authManager = new AuthStrategyManager([supabaseStrategy]);

const state = await authManager.checkAuth();
await authManager.signIn({ email: 'user@example.com', password: 'password123' });
await authManager.signUp({ email: 'user@example.com', password: 'password123', username: 'user' });
await authManager.refreshToken();
await authManager.signOut();
```

### Before you test (integration checklist)

- Install **`@auth-strategy-manager/core@^2.0.0`** together with **`@auth-strategy-manager/supabase@^2.0.0`** (peer dependency).
- Prefer **`authManager.checkAuth()` / `signIn()` / `signUp()` / `refreshToken()` / `signOut()`** so `AuthStorageManager` stays in sync with `AuthManagerData`. Calling only `supabaseStrategy.*` skips manager persistence.
- Strategy name and tokens are owned by **core** `AuthStrategyManager` / `AuthStorageManager`.
- With **multiple strategies**, call **`authManager.use('supabase')`** (same string as `name` in config, default is `'supabase'`).

## Breaking changes from v1

- **`checkAuth`** returns `Promise<AuthManagerData>` (not `boolean`). Prefer `authManager.checkAuth()` so storage stays in sync.
- **`refreshToken`** returns `Promise<AuthManagerData>` (not `void`).
- **`signIn` / `signUp`** merge **`AuthManagerData`** into the returned object (Supabase payload plus `isAuthenticated`, `strategyName`, `accessToken`, `refreshToken`).
- This package does not duplicate active-strategy or auth flags — use **core** for persistence.
- **Peer dependency**: install `@auth-strategy-manager/core` **^2.0.0** yourself; it is no longer a direct dependency of this package.

## Configuration

### SupabaseConfig

```typescript
type SupabaseConfig = {
  supabase: SupabaseClient;
  name?: string;
  /** URL for redirecting to the authorization page */
  signInUrl?: string;
};
```

### Parameters

- `supabase` — Supabase client instance
- `name` — Strategy name (default: `'supabase'`)
- `signInUrl` — URL for redirect after logout / custom flows

Token persistence is configured on **core** `AuthStrategyManager` via `AuthStorageManager`, not on this strategy.

## API

### SupabaseStrategy

#### Constructor

```typescript
constructor(config: SupabaseConfig)
```

#### Methods

- `checkAuth(): Promise<AuthManagerData>`
- `signIn<T, D>(config?: D): Promise<T>` — expects `{ email, password }`; return type merges `AuthResponse` with `AuthManagerData`
- `signUp<T, D>(config?: D): Promise<T>` — expects `{ email, password, username }`; same merge (session may be absent until email confirmation)
- `signOut(): Promise<void>`
- `refreshToken<T>(args?: T): Promise<AuthManagerData>`
- `clear(): void` — clears in-memory token mirror on the strategy; prefer `authManager.clear()` for full storage sync
- `getCurrentUserId(): Promise<string | null>`
- `getSessionInfo(): Promise<SessionInfo>`

#### Properties

- `name`, `supabase`, `signInUrl`
- `token` (read-only) / `isAuthenticated` — mirror of the last known session from Supabase operations (can be stale if the Supabase session changes outside of this strategy; call `authManager.checkAuth()` / `supabaseStrategy.checkAuth()` to re-sync)
- `startUrl` — get/set in-memory redirect base (for manager alignment)

## License

ISC
