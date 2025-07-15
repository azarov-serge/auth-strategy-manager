# Auth Strategy Manager

[![npm version](https://badge.fury.io/js/auth-strategy-manager.svg)](https://badge.fury.io/js/auth-strategy-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A flexible library for managing authentication with support for multiple strategies. Allows easy integration of various authentication methods (Keycloak, REST API, custom) into a unified interface.

## 🌍 Documentation in Other Languages

- [🇷🇺 Русский (Russian)](README_RU.md)
- [🇺🇸 English (Current)](README.md)

## 📦 Packages

This repository contains the following packages:

- **[auth-strategy-manager](https://www.npmjs.com/package/auth-strategy-manager)** (v1.0.9) - Meta package that automatically installs core
- **[@auth-strategy-manager/core](https://www.npmjs.com/package/@auth-strategy-manager/core)** (v1.0.4) - Core authentication strategy manager: provides the main classes and interfaces for managing authentication strategies, including `AuthStrategyManager`, `Strategy`, `StrategyHelper`, error classes, and constants.
- **[@auth-strategy-manager/keycloak](https://www.npmjs.com/package/@auth-strategy-manager/keycloak)** (v1.0.0) - Keycloak strategy
- **[@auth-strategy-manager/rest](https://www.npmjs.com/package/@auth-strategy-manager/rest)** (v1.0.0) - REST API strategy

## 🚀 Quick Start

### Option 1: Install via Meta Package (Recommended)

```bash
npm install auth-strategy-manager
```

### Option 2: Install Core Package Directly

```bash
npm install @auth-strategy-manager/core
```

> Both options provide the same functionality. The meta-package automatically installs `@auth-strategy-manager/core`.

### Install with Keycloak Strategy

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/keycloak keycloak-js
```

### Install with REST Strategy

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/rest axios
```

### Install All Packages

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/keycloak @auth-strategy-manager/rest keycloak-js axios
```

## 🔧 Usage

### Basic Usage with Core Only

```typescript
import { AuthStrategyManager, Strategy, StrategyHelper } from 'auth-strategy-manager';
// or
import { AuthStrategyManager, Strategy, StrategyHelper } from '@auth-strategy-manager/core';

// Create custom strategy
class CustomStrategy extends StrategyHelper implements Strategy {
  readonly name = 'custom';
  
  check = async (): Promise<boolean> => {
    // Your authentication logic
    return true;
  };
  
  signIn = async <T>(config?: unknown): Promise<T> => {
    // Your sign in logic
    return {} as T;
  };
  
  signUp = async <T>(config?: unknown): Promise<T> => {
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

// Use with strategy manager
const authManager = new AuthStrategyManager([new CustomStrategy()]);
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
  check: { url: '/api/auth/check', method: 'GET' },
  signIn: { url: '/api/auth/login', method: 'POST' },
  signOut: { url: '/api/auth/logout', method: 'POST' },
  refresh: { url: '/api/auth/refresh', method: 'POST' }
});

const authManager = new AuthStrategyManager([restStrategy]);
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
  check: { url: '/api/auth/check', method: 'GET' },
  signIn: { url: '/api/auth/login', method: 'POST' },
  signOut: { url: '/api/auth/logout', method: 'POST' },
  refresh: { url: '/api/auth/refresh', method: 'POST' }
});

const authManager = new AuthStrategyManager([keycloakStrategy, restStrategy]);

// Check authentication (will try both strategies)
const isAuthenticated = await authManager.check();
```

## 🏗️ Architecture

### Meta Package (auth-strategy-manager)

Convenient entry point that automatically installs core:

- Re-exports all types and classes from core
- Provides TypeScript support out of the box
- Simplifies installation and usage

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

## 📖 Documentation

- [Meta Package Documentation](https://www.npmjs.com/package/auth-strategy-manager)
- [Core Package Documentation](https://www.npmjs.com/package/@auth-strategy-manager/core)
- [Keycloak Strategy Documentation](https://www.npmjs.com/package/@auth-strategy-manager/keycloak)
- [REST Strategy Documentation](https://www.npmjs.com/package/@auth-strategy-manager/rest)

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
```

## 📝 License

MIT License

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
