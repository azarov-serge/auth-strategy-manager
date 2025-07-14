# Auth Strategy Manager

[![npm version](https://badge.fury.io/js/auth-strategy-manager.svg)](https://badge.fury.io/js/auth-strategy-manager)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A flexible library for managing authentication with support for multiple strategies. Allows easy integration of various authentication methods (Keycloak, REST API, custom) into a unified interface.

> 🇷🇺 [Читать на русском языке](README_RU.md)

## 📋 Table of Contents

- [🚀 Features](#-features)
- [📦 Installation](#-installation)
- [🏗️ Architecture](#️-architecture)
- [🔧 Usage](#-usage)
- [🔒 Security](#-security)
- [🧪 Testing](#-testing)
- [📝 License](#-license)
- [🤝 Contributing](#-contributing)
- [📞 Support](#-support)


## 🚀 Features

- **Multiple Strategies**: Support for Keycloak, REST API, and custom strategies
- **Automatic Detection**: Automatic selection of active strategy
- **TypeScript**: Full TypeScript support with types
- **Flexibility**: Easy addition of new authentication strategies
- **Security**: Extended error handling for network, certificate, and timeout errors
- **Compatibility**: Works in browser and Node.js

## 📦 Installation

```bash
npm install auth-strategy-manager
```

## 🏗️ Architecture

### Core Components

1. **AuthStrategyManager** - main class for managing strategies
2. **Strategy** - interface for all authentication strategies
3. **StrategyHelper** - helper class for state management
4. **Built-in Strategies**:
   - `KeycloakStrategy` - for Keycloak integration
   - `RestStrategy` - for REST API authentication
   - `EmptyStrategy` - default empty strategy

### Project Structure

```
src/
├── auth-strategy-manager.ts    # Main manager class
├── types.ts                    # TypeScript types
├── errors.ts                   # Error classes
├── constants.ts                # Constants
├── helpers/
│   └── strategy-helper.ts      # Helper class
└── strategies/
    ├── keycloak-strategy.ts    # Keycloak strategy
    ├── rest-strategy.ts        # REST API strategy
    ├── empty-strategy.ts       # Empty strategy
    └── types.ts                # Strategy types
```

## 📖 API Documentation

### AuthStrategyManager

Main class for managing authentication strategies.

#### Constructor

```typescript
constructor(strategies: Strategy[])
```

**Parameters:**
- `strategies` - array of authentication strategies

#### Properties

- `strategiesCount: number` - number of registered strategies
- `strategy: Strategy` - current active strategy
- `isKeycloak: boolean` - check if active strategy is Keycloak
- `startUrl: string | undefined` - URL for redirect after authentication

#### Methods

##### `check(): Promise<boolean>`
Checks user authentication. Automatically selects appropriate strategy.

**Returns:** `Promise<boolean>` - authentication check result

**Features:**
- Automatically performs login if only one Keycloak strategy is available
- Checks all strategies and selects the first successful one for multiple strategies
- Handles various error types with appropriate exceptions

##### `setStrategies(strategies: Strategy[]): Promise<void>`
Updates the list of available strategies.

**Parameters:**
- `strategies` - new array of strategies

##### `use(strategyName: string): void`
Sets active strategy by name.

**Parameters:**
- `strategyName` - strategy name

##### `clear(): void`
Clears authentication state and resets active strategy.

### Strategy Interface

Interface for all authentication strategies.

```typescript
interface Strategy {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  signInUrl?: string;
  
  check(): Promise<boolean>;
  signIn<D, T>(config?: AxiosRequestConfig<D>): Promise<T>;
  signUp<D, T>(config?: AxiosRequestConfig<D>): Promise<T>;
  signOut(): Promise<void>;
  refreshToken<T>(args?: T): Promise<void>;
}
```

## 🔧 Usage

### Complete Integration Example

```typescript
import { 
  AuthStrategyManager,
  KeycloakStrategy,
  RestStrategy,
  isObject,
  isString 
} from 'auth-strategy-manager';

// Active strategies configuration
const activeStrategies = ['keycloak', 'rest'];

// Determine application base URL
const protocol = window.location.protocol;
const [baseUrl] = window.location.href.replace(`${protocol}//`, '').split('/');
const URL = `${protocol}//${baseUrl}`;
const signInUrl = `${URL}/sign-in`;

// Create Keycloak strategy
const keycloakStrategy = new KeycloakStrategy({
  keycloak: { 
    realm: 'Example', 
    url: 'https://keycloak.example/auth', 
    clientId: 'CLIENT_ID' 
  },
  signInUrl: signInUrl,
  // Set only flag if only one strategy is available
  only: activeStrategies.length === 1 && activeStrategies.includes('keycloak'),
});

// Create REST strategy
const restStrategy = new RestStrategy({
  signInUrl: signInUrl,
  // Endpoints for various authentication operations
  check: {
    url: `${URL}/token/v1/refresh`,
    method: 'POST',
  },
  signIn: {
    url: `${URL}/auth/v1/sign-in`,
    method: 'POST',
  },
  signUp: {
    url: `${URL}/auth/v1/sign-up`,
    method: 'POST',
  },
  signOut: { 
    url: `${URL}/auth/v1/signout`, 
    method: 'POST' 
  },
  refresh: {
    url: `${URL}/token/v1/refresh`,
    method: 'POST',
  },
  // Custom function for extracting token from response
  getToken: (response: unknown): string => {
    // If response is a string, return it as token
    if (isString(response)) {
      return response;
    }

    // If response is an object with access field, return its value
    if (
      isObject(response) &&
      'access' in response &&
      isString(response.access)
    ) {
      return response.access;
    }

    // If token not found, return empty string
    return '';
  },
});

// Create array of all available strategies
const allStrategies = [keycloakStrategy, restStrategy];

// Filter strategies based on configuration
const strategies = activeStrategies.length
  ? allStrategies
      .filter((strategy) => activeStrategies.includes(strategy.name))
      .sort((a, b) => activeStrategies.indexOf(a.name) - activeStrategies.indexOf(b.name))
  : allStrategies;

// Create strategy manager
const authManager = new AuthStrategyManager(strategies);

// Export for use in application
export { restStrategy, keycloakStrategy, authManager };
```

### Basic Usage

```typescript
import { AuthStrategyManager, KeycloakStrategy, RestStrategy } from 'auth-strategy-manager';

// Create strategies
const keycloakStrategy = new KeycloakStrategy({
  keycloak: {
    realm: 'my-realm',
    url: 'https://keycloak.example.com',
    clientId: 'my-client'
  }
});

const restStrategy = new RestStrategy({
  check: { url: '/api/auth/check', method: 'GET' },
  signIn: { url: '/api/auth/login', method: 'POST' },
  signOut: { url: '/api/auth/logout', method: 'POST' },
  refresh: { url: '/api/auth/refresh', method: 'POST' }
});

// Create manager
const authManager = new AuthStrategyManager([keycloakStrategy, restStrategy]);

// Check authentication
const isAuthenticated = await authManager.check();
```

### Keycloak Strategy

```typescript
import { KeycloakStrategy } from 'auth-strategy-manager';

const keycloakStrategy = new KeycloakStrategy({
  keycloak: {
    realm: 'my-realm',
    url: 'https://keycloak.example.com',
    clientId: 'my-client'
  },
  loginUrl: 'https://myapp.com/login',
  name: 'my-keycloak',
  only: false
});

// Check authentication
const isAuthenticated = await keycloakStrategy.check();

// Sign in
await keycloakStrategy.signIn();

// Sign out
await keycloakStrategy.signOut();

// Refresh token
await keycloakStrategy.refreshToken(30); // 30 seconds minimum validity
```

### REST Strategy

```typescript
import { RestStrategy } from 'auth-strategy-manager';
import axios from 'axios';

// Create custom axios instance
const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

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
  getToken: (response: any) => response.data?.access_token || response.access_token
});

// Sign in with custom data
const loginResult = await restStrategy.signIn({
  data: {
    username: 'user@example.com',
    password: 'password123'
  }
});
```

### Error Handling

```typescript
import { 
  AuthStrategyManager, 
  NetworkError, 
  CertError, 
  Timeout3rdPartyError 
} from 'auth-strategy-manager';

try {
  const isAuthenticated = await authManager.check();
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
    // Handle network errors
  } else if (error instanceof CertError) {
    console.error('Certificate error:', error.message);
    // Handle SSL/TLS certificate errors
  } else if (error instanceof Timeout3rdPartyError) {
    console.error('Third-party timeout:', error.message);
    // Handle iframe check timeouts
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Creating Custom Strategy

```typescript
import { Strategy, StrategyHelper } from 'auth-strategy-manager';

class CustomStrategy extends StrategyHelper implements Strategy {
  readonly name = 'custom';
  
  check = async (): Promise<boolean> => {
    // Your authentication check logic
    return true;
  };
  
  signIn = async <D, T>(config?: AxiosRequestConfig<D>): Promise<T> => {
    // Your sign in logic
    return {} as T;
  };
  
  signUp = async <D, T>(config?: AxiosRequestConfig<D>): Promise<T> => {
    // Your sign up logic
    return {} as T;
  };
  
  signOut = async (): Promise<void> => {
    // Your sign out logic
    this.clearStorage();
  };
  
  refreshToken = async <T>(args?: T): Promise<void> => {
    // Your token refresh logic
  };
}
```

## 🔒 Security

### Error Handling

The library provides specialized error classes:

- `NetworkError` - for network errors (`ERR_NETWORK`)
- `CertError` - for SSL/TLS certificate errors (`ERR_CERT_AUTHORITY_INVALID`)
- `Timeout3rdPartyError` - for third-party check timeouts (iframe)
- `ResponseError` - base class for HTTP errors

### Error Constants

```typescript
import { 
  CERT_ERROR_CODE, 
  NETWORK_ERROR_CODE, 
  TIMEOUT_3RD_PARTY_ERROR_CODE 
} from 'auth-strategy-manager';

// Available constants:
// CERT_ERROR_CODE = 'ERR_CERT_AUTHORITY_INVALID'
// NETWORK_ERROR_CODE = 'ERR_NETWORK'
// TIMEOUT_3RD_PARTY_ERROR_CODE = 'Timeout when waiting for 3rd party check iframe message.'
```

### Token Storage

- **Keycloak**: Tokens are managed by the Keycloak library
- **REST**: Tokens are stored in `sessionStorage` with configurable key
- **State**: Active strategy information is stored in `localStorage`

### Error Handling Logic

When checking authentication, the strategy manager:

1. **Checks all strategies in parallel** using `Promise.allSettled`
2. **Selects the first successful strategy** and sets it as active
3. **Handles specific errors**:
   - Network errors → `NetworkError`
   - Certificate errors → `CertError`
   - Iframe timeouts → `Timeout3rdPartyError`
4. **Special case for Keycloak**: If only one Keycloak strategy is available, automatically performs login

## 🧪 Testing

```bash
# Install dependencies
npm install

# Build project
npm run build

# Format code
npm run format
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
