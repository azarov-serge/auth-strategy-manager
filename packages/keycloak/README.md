# @auth-strategy-manager/keycloak

Keycloak strategy for auth-strategy-manager.

## 🌍 Documentation in Other Languages

- [🇷🇺 Русский (Russian)](README_RU.md)
- [🇺🇸 English (Current)](README.md)

## Installation

```bash
npm install @auth-strategy-manager/keycloak @auth-strategy-manager/core keycloak-js
```

or via meta-package:

```bash
npm install auth-strategy-manager @auth-strategy-manager/keycloak keycloak-js
```

> The meta-package will automatically install `@auth-strategy-manager/core` for you.

## Usage

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { KeycloakStrategy } from '@auth-strategy-manager/keycloak';

// Create Keycloak strategy
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

// Use with strategy manager
const authManager = new AuthStrategyManager([keycloakStrategy]);

// Check authentication
const isAuthenticated = await authManager.check();

// Sign in
await keycloakStrategy.signIn();

// Sign out
await keycloakStrategy.signOut();

// Refresh token
await keycloakStrategy.refreshToken(30); // 30 seconds minimum validity
```

## Configuration

### KeycloakConfig

```typescript
type KeycloakConfig = {
  keycloak: {
    realm: string;
    url: string;
    clientId: string;
  };
  loginUrl?: string;
  name?: string;
  only?: boolean;
};
```

### Parameters

- `keycloak.realm` - Keycloak realm name
- `keycloak.url` - Keycloak server URL
- `keycloak.clientId` - Keycloak client ID
- `loginUrl` - URL for redirect after logout
- `name` - Strategy name (default: 'keycloak')
- `only` - If true, only this strategy is available

## API

### KeycloakStrategy

#### Constructor

```typescript
constructor(config: KeycloakConfig)
```

#### Methods

- `check(): Promise<boolean>` - Check authentication
- `signIn<T>(): Promise<T>` - Sign in user
- `signUp<T>(): Promise<T>` - Sign up user (not implemented)
- `signOut(): Promise<void>` - Sign out user
- `refreshToken<T>(sec?: T): Promise<void>` - Refresh token

#### Properties

- `name: string` - Strategy name
- `keycloak: Keycloak` - Keycloak instance
- `token?: string` - Current token
- `isAuthenticated: boolean` - Authentication status

## License

ISC 
