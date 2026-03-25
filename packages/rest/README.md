# @auth-strategy-manager/rest

REST API strategy for [auth-strategy-manager](https://github.com/azarov-serge/auth-strategy-manager). **v2** aligns with `@auth-strategy-manager/core` **^2.0.0**.

## Documentation in other languages

- [Russian (Русский)](README_RU.md)
- English (this file)

## Installation

```bash
npm install @auth-strategy-manager/rest @auth-strategy-manager/core axios
```

Use **core 2.x** with **rest 2.x**.

## Usage

`RestStrategy` performs HTTP calls and builds `AuthManagerData` from responses using `getToken`. **Persisting** tokens and strategy name is done by `AuthStrategyManager` + `AuthStorageManager` from `@auth-strategy-manager/core` — not by this class.

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { RestStrategy } from '@auth-strategy-manager/rest';
import axios, { type AxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

const restStrategy = new RestStrategy({
  name: 'my-rest',
  signInUrl: '/login',
  axiosInstance,
  getToken: (response, options) => {
    const data = (response as { data?: { access?: string; refresh?: string } }).data;
    if (options?.type === 'refresh') return data?.refresh ?? '';
    return data?.access ?? '';
  },
  checkAuth: { url: '/auth/me', method: 'GET' },
  signIn: { url: '/auth/login', method: 'POST' },
  signUp: { url: '/auth/register', method: 'POST' },
  refresh: { url: '/auth/refresh', method: 'POST' },
  // signOut omitted → RestStrategy.signOut() is a no-op; AuthStrategyManager still clears storage
});

const authManager = new AuthStrategyManager([restStrategy]);

await restStrategy.signIn<unknown, AxiosRequestConfig>({
  data: { email: 'user@example.com', password: 'secret' },
});

const state = await authManager.checkAuth();
await authManager.signOut();
```

With a server **sign-out** endpoint:

```typescript
const restStrategy = new RestStrategy({
  // ...same as above
  signOut: { url: '/auth/logout', method: 'POST' },
});
```

## Configuration

### `RestConfig` (`Config`)

Exported as `RestConfig` from this package.

```typescript
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

type UrlName = 'checkAuth' | 'signIn' | 'signUp' | 'signOut' | 'refresh';

type UrlConfig = {
  url: string;
  method?: AxiosRequestConfig['method'];
};

type RestConfig = Partial<Record<UrlName, UrlConfig>> & {
  name?: string;
  /** Redirect target for the sign-in page (app use) */
  signInUrl?: string;
  axiosInstance?: AxiosInstance;
  /** Map API responses to access / refresh strings */
  getToken?: (
    response: unknown,
    options?: { url?: string; type: 'access' | 'refresh' },
  ) => string;
  /**
   * Optional auth state extractor (cookie-only / BFF).
   * Use when your backend session is stored in HTTP-only cookies and API responses intentionally contain no tokens.
   */
  getIsAuthenticated?: (response: unknown, options?: { url?: string }) => boolean;
};
```

All **URL entries are optional** in the type — pass only what you call. Runtime methods still **throw** if a required URL for that operation is missing (e.g. `signIn` without `signIn` in config).

### Parameters

| Field | Description |
|--------|-------------|
| `checkAuth` | Request used by `checkAuth()`. |
| `signIn` | Request used by `signIn()`. |
| `signUp` | Request used by `signUp()`. |
| `signOut` | **Optional.** If omitted (or empty `url`), `signOut()` does not call the network; use `AuthStrategyManager.signOut()` to clear storage. |
| `refresh` | Request used by `refreshToken()`. |
| `name` | Strategy id (default: `'rest'`). |
| `signInUrl` | Optional app URL for the login screen. |
| `axiosInstance` | Optional axios instance (default: `axios.create()`). |
| `getToken` | Optional extractor; if missing, tokens in `AuthManagerData` stay empty unless you merge them yourself. |
| `getIsAuthenticated` | Optional cookie-only extractor: return `true` for authenticated responses even when tokens are empty. |

## API

### `RestStrategy`

#### Constructor

```ts
constructor(config: RestConfig)
```

#### Methods

- `checkAuth(): Promise<AuthManagerData>` — requires `checkAuth` URL.
- `signIn<T, D>(config?: D): Promise<T>` — requires `signIn` URL; merges response with `AuthManagerData`.
- `signUp<T, D>(config?: D): Promise<T>` — if `signUp` URL is missing in config, returns an unauthenticated `AuthManagerData` placeholder (no-op); otherwise merges response with `AuthManagerData`.
- `signOut(): Promise<void>` — calls `signOut` URL when configured; otherwise no-op.
- `refreshToken(): Promise<AuthManagerData>` — requires `refresh` in config; coalesces concurrent refresh calls.

#### Properties

- `name: string`
- `axiosInstance: AxiosInstance`
- `urls: Partial<Record<UrlName, UrlConfig>>`
- `getToken?` — same as config
- `signInUrl?: string`
- `startUrl` — get/set string (in-memory on the instance)

### `AuthManagerData` shape

Matches `@auth-strategy-manager/core` (returned from `checkAuth` / `refreshToken` / merged into `signIn` / `signUp` results):

```ts
type AuthManagerData = {
  isAuthenticated: boolean;
  strategyName: string;
  accessToken: string;
  refreshToken?: string;
};
```

## Token persistence

`RestStrategy` does **not** read or write `localStorage` / `sessionStorage`. Configure `AuthStorageManager` on `AuthStrategyManager` in **core** so tokens and flags match your app.

## License

ISC
