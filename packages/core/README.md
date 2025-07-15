# @auth-strategy-manager/core

Core authentication strategy manager - the foundation for all authentication strategies.

## 🌍 Documentation in Other Languages

- [🇷🇺 Русский (Russian)](README_RU.md)
- [🇺🇸 English (Current)](README.md)

## Installation

```bash
npm install @auth-strategy-manager/core
```

## Usage

```typescript
import { AuthStrategyManager, Strategy, StrategyHelper } from '@auth-strategy-manager/core';

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

  public reset = (): void => {
    // Your reset logic
  };
}

// Using REST Strategy
const restStrategy = new RestStrategy({
  // ...
});
const authManager = new AuthStrategyManager([restStrategy]);

// Check authentication
const isAuthenticated = await restStrategy.checkAuth();

// Sign out
await restStrategy.signOut();

// Clear state
restStrategy.clear();
```

## API

### AuthStrategyManager

Main class for managing authentication strategies.

#### Constructor

```typescript
constructor(strategies: Strategy[])
```

Creates a new AuthStrategyManager instance with the provided strategies.

#### Properties

- `strategiesCount: number` - Total number of registered strategies
- `strategy: Strategy` - Currently active strategy
- `startUrl: string | undefined` - URL to redirect after authentication

#### Methods

- `checkAuth(): Promise<boolean>` - Check authentication status across all strategies. Returns true if any strategy is authenticated.
- `setStrategies(strategies: Strategy[]): Promise<void>` - Replace all strategies with new ones
- `use(strategyName: string): void` - Set the active strategy by name
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
  clear?(): void;
}
```

### StrategyHelper

Helper class for managing authentication state.

#### Methods

- `clearStorage(): void` - Clear local storage
- `reset(): void` - Reset authentication state

## License

ISC
