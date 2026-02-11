# Auth Strategy Manager

[![npm version](https://badge.fury.io/js/auth-strategy-manager.svg)](https://badge.fury.io/js/auth-strategy-manager)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A flexible library for managing authentication with support for multiple strategies. Allows easy integration of various authentication methods (Keycloak, REST API, Supabase, custom) into a unified interface.

## 🌍 Documentation in Other Languages

- [🇷🇺 Русский (Russian)](README_RU.md)
- [🇺🇸 English (Current)](README.md)

## 📦 Packages

This repository contains the following packages:

- **[@auth-strategy-manager/core](https://www.npmjs.com/package/@auth-strategy-manager/core)** - Core authentication strategy manager: provides the main classes and interfaces for managing authentication strategies, including `AuthStrategyManager`, `Strategy`, `StrategyHelper`, error classes, and constants.
- **[@auth-strategy-manager/keycloak](https://www.npmjs.com/package/@auth-strategy-manager/keycloak)** - Keycloak strategy
- **[@auth-strategy-manager/rest](https://www.npmjs.com/package/@auth-strategy-manager/rest)** - REST API strategy
- **[@auth-strategy-manager/supabase](https://www.npmjs.com/package/@auth-strategy-manager/supabase)** - Supabase strategy

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
  
  public checkAuth = async (): Promise<boolean> => {
    // Your authentication logic
    return true;
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
  
  public refreshToken = async <T>(args?: T): Promise<void> => {
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

- `checkAuth(): Promise<boolean>` - Check authentication status across all strategies. Returns true if any strategy is authenticated.
- `setStrategies(strategies: Strategy[]): Promise<void>` - Replace all strategies with new ones
- `use(strategyName: string): void` - Set the active strategy by name (only needed when using multiple strategies)
- `clear(): void` - Clear authentication state and reset all strategies

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

### Using Keycloak Strategy

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { KeycloakStrategy } from '@auth-strategy-manager/keycloak';

const keycloakStrategy = new KeycloakStrategy({
  keycloak: {
    realm: 'my-realm',
    url: 'https://keycloak.example.com',
    clientId: 'my-client'
  }
});

const authManager = new AuthStrategyManager([keycloakStrategy]);
```

### Using REST Strategy

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { RestStrategy } from '@auth-strategy-manager/rest';

const restStrategy = new RestStrategy({
  accessToken: { key: 'access', storage: 'sessionStorage' },
  checkAuth: { url: '/api/auth/check-auth', method: 'GET' },
  signIn: { url: '/api/auth/sign-in', method: 'POST' },
  signUp: { url: '/api/auth/sign-up', method: 'POST' },
  signOut: { url: '/api/auth/sign-out', method: 'POST' },
  refresh: { url: '/api/auth/refresh', method: 'POST' },
});

const authManager = new AuthStrategyManager([restStrategy]);

// Check authentication
const isAuthenticated = await restStrategy.checkAuth();

// Sign out
await restStrategy.signOut();

// Clear state
restStrategy.clear();
```

### Using Supabase Strategy

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { SupabaseStrategy, SupabaseConfig } from '@auth-strategy-manager/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const supabaseStrategy = new SupabaseStrategy({
  supabaseClient: supabase,
  name: 'supabase',
  signInUrl: 'https://myapp.com/login',
} satisfies SupabaseConfig);

const authManager = new AuthStrategyManager([supabaseStrategy]);
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
  accessToken: { key: 'access', storage: 'sessionStorage' },
  checkAuth: { url: '/api/auth/check-auth', method: 'GET' },
  signIn: { url: '/api/auth/sign-in', method: 'POST' },
  signUp: { url: '/api/auth/sign-up', method: 'POST' },
  signOut: { url: '/api/auth/sign-out', method: 'POST' },
  refresh: { url: '/api/auth/refresh', method: 'POST' },
});

const authManager = new AuthStrategyManager([keycloakStrategy, restStrategy]);

// Check authentication (will try both strategies)
const isAuthenticated = await authManager.checkAuth();
```

## 🏗️ Architecture

### Core Package (@auth-strategy-manager/core)

Contains the main classes and interfaces:

- `AuthStrategyManager` - Main manager class
- `Strategy` - Interface for all strategies
- `StrategyHelper` - Helper class for state management
- Error classes and constants

### Keycloak Package (@auth-strategy-manager/keycloak)

Provides Keycloak integration:

- `KeycloakStrategy` - Keycloak authentication strategy
- Keycloak-specific configuration types

### REST Package (@auth-strategy-manager/rest)

Provides REST API integration:

- `RestStrategy` - REST API authentication strategy
- REST-specific configuration types

### Supabase Package (@auth-strategy-manager/supabase)

Provides Supabase integration:

- `SupabaseStrategy` - Supabase authentication strategy
- Supabase-specific configuration types

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
interface Strategy {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  signInUrl?: string;
  
  checkAuth(): Promise<boolean>;
  signIn<T = unknown, D = undefined>(config?: D): Promise<T>;
  signUp<T = unknown, D = undefined>(config?: D): Promise<T>;
  signOut(): Promise<void>;
  refreshToken<T>(args?: T): Promise<void>;
}
``` 
