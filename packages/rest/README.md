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
  tokenKey: 'access_token',
  signInUrl: 'https://myapp.com/login',
  axiosInstance,
  
  // URL endpoints
  check: { url: '/auth/check', method: 'GET' },
  signIn: { url: '/auth/login', method: 'POST' },
  signUp: { url: '/auth/register', method: 'POST' },
  signOut: { url: '/auth/logout', method: 'POST' },
  refresh: { url: '/auth/refresh', method: 'POST' },
  
  // Custom token extraction function
  getToken: (response: unknown) => (response as any).data?.access_token || (response as any).access_token
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
```

## Configuration

### RestConfig

```typescript
type RestConfig = {
  check: UrlConfig;
  signIn: UrlConfig;
  signUp: UrlConfig;
  signOut: UrlConfig;
  refresh: UrlConfig;
  name?: string;
  tokenKey?: string;
  signInUrl?: string;
  axiosInstance?: AxiosInstance;
  getToken?: (response: unknown, url?: string) => string;
};

type UrlConfig = {
  url: string;
  method?: string;
};
```

### Parameters

- `check` - Endpoint for checking authentication
- `signIn` - Endpoint for user sign in
- `signUp` - Endpoint for user registration
- `signOut` - Endpoint for user sign out
- `refresh` - Endpoint for token refresh
- `name` - Strategy name (default: 'rest')
- `tokenKey` - Storage key for token (default: 'access')
- `signInUrl` - URL for redirect after logout
- `axiosInstance` - Custom axios instance
- `getToken` - Custom function for extracting token from response

## API

### RestStrategy

#### Constructor

```typescript
constructor(config: RestConfig)
```

#### Methods

- `check(): Promise<boolean>` - Check authentication
- `signIn<T = unknown, D = undefined>(config?: D): Promise<T>` - Sign in user
- `signUp<T = unknown, D = undefined>(config?: D): Promise<T>` - Sign up user
- `signOut(): Promise<void>` - Sign out user
- `refreshToken(): Promise<void>` - Refresh token

#### Properties

- `name: string` - Strategy name
- `axiosInstance: AxiosInstance` - Axios instance
- `token?: string` - Current token
- `isAuthenticated: boolean` - Authentication status

## Token Storage

Tokens are stored in `sessionStorage` with the configured `tokenKey`.

## License

ISC
