# @auth-strategy-manager/rest

REST API strategy for auth-strategy-manager.

## 🌍 Documentation in Other Languages

- [🇷🇺 Русский (Russian)](README_RU.md)
- [🇺🇸 English (Current)](README.md)

## Installation

```bash
npm install @auth-strategy-manager/rest @auth-strategy-manager/core axios
```

## Usage

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { RestStrategy } from '@auth-strategy-manager/rest';
import axios from 'axios';

// Create custom axios instance
const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

// Create REST strategy
const restStrategy = new RestStrategy({
  name: 'my-rest',
  signInUrl: 'https://myapp.com/sign-in',
  axiosInstance,
  accessToken: {
    key: 'access_token',
    storage: 'sessionStorage',
    getToken: (response: unknown) => (response as any).data?.access_token || (response as any).access_token,
  },
  checkAuth: { url: '/auth/check-auth', method: 'GET' },
  signIn: { url: '/auth/sign-in', method: 'POST' },
  signUp: { url: '/auth/sign-up', method: 'POST' },
  signOut: { url: '/auth/sign-out', method: 'POST' },
  refresh: { url: '/auth/refresh', method: 'POST' },
});

// Use with strategy manager
const authManager = new AuthStrategyManager([restStrategy]);

// Sign in with custom data
const loginResult = await restStrategy.signIn<unknown, AxiosRequestConfig>({
  data: {
    username: 'user@example.com',
    password: 'password123'
  }
});

// Check authentication
const isAuthenticated = await restStrategy.checkAuth();

// Sign out
await restStrategy.signOut();

// Clear state
restStrategy.clear();
```

## Configuration

### RestConfig

```typescript
type RestConfig = {
  checkAuth: UrlConfig;
  signIn: UrlConfig;
  signUp: UrlConfig;
  signOut: UrlConfig;
  refresh: UrlConfig;
  name?: string;
  accessToken?: AccessTokenConfig;
  refreshToken?: RefreshTokenConfig;
  signInUrl?: string;
  axiosInstance?: AxiosInstance;
};

type AccessTokenConfig = {
  /** Storage key used for access token */
  key: string;
  /** Built-in storage type used by default implementation */
  storageType: 'sessionStorage' | 'localStorage';
  /** Optional custom Storage implementation (e.g. in-memory, namespaced) */
  storage?: Storage;
  /** Extract access token from API response */
  getToken?: (response: unknown, url?: string) => string;
};

type RefreshTokenConfig = {
  /** Storage key used for refresh token */
  key: string;
  /** Built-in storage type used by default implementation */
  storageType: 'sessionStorage' | 'localStorage';
  /** Optional custom Storage implementation (e.g. in-memory, namespaced) */
  storage?: Storage;
  /** Extract refresh token from API response */
  getToken?: (response: unknown, url?: string) => string;
};

type UrlConfig = { url: string; method?: string };
```

### Parameters

- `checkAuth` - Endpoint for checking authentication
- `signIn` - Endpoint for user sign in
- `signUp` - Endpoint for user registration
- `signOut` - Endpoint for user sign out
- `refresh` - Endpoint for token refresh
- `name` - Strategy name (default: 'rest')
- `accessToken` - Access token config: `key`, `storageType` (`'sessionStorage' | 'localStorage'`), optional `storage` (any custom implementation of the `Storage` interface, e.g. in-memory, namespaced, or the built-in storages), and `getToken`. If omitted, `{ key: 'access', storageType: 'sessionStorage' }` is used by default.
- `refreshToken` - Optional refresh token config: `key`, `storageType`, optional `storage` (any custom `Storage` implementation), and `getToken` (e.g. access in sessionStorage, refresh in localStorage)
- `signInUrl` - URL for redirect after logout
- `axiosInstance` - Custom axios instance

## API

### RestStrategy

#### Constructor

```typescript
constructor(config: RestConfig)
```

#### Methods

- `checkAuth(): Promise<boolean>` - Check authentication
- `signIn<T = unknown, D = undefined>(config?: D): Promise<T>` - Sign in user
- `signUp<T = unknown, D = undefined>(config?: D): Promise<T>` - Sign up user
- `signOut(): Promise<void>` - Sign out user
- `refreshToken(): Promise<void>` - Refresh token
- `clear(): void` - Clear authentication state

#### Properties

- `name: string` - Strategy name
- `axiosInstance: AxiosInstance` - Axios instance
- `token?: string` - Current token
- `isAuthenticated: boolean` - Authentication status

## Token storage

Access token (and optionally refresh token) are stored using the configured `accessToken` and `refreshToken` configs. Each can use `sessionStorage` or `localStorage` independently.

## License

ISC
