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
class CustomStrategy extends StrategyHelper implements Strategy {
  readonly name = 'custom';
  
  check = async (): Promise<boolean> => {
    // Your authentication logic
    return true;
  };
  
  signIn = async <D, T>(config?: any): Promise<T> => {
    // Your sign in logic
    return {} as T;
  };
  
  signUp = async <D, T>(config?: any): Promise<T> => {
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

## API

### AuthStrategyManager

Main class for managing authentication strategies.

#### Constructor

```typescript
constructor(strategies: Strategy[])
```

#### Methods

- `check(): Promise<boolean>` - Check authentication
- `setStrategies(strategies: Strategy[]): Promise<void>` - Update strategies
- `use(strategyName: string): void` - Set active strategy
- `clear(): void` - Clear authentication state

### Strategy Interface

```typescript
interface Strategy {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  signInUrl?: string;
  
  check(): Promise<boolean>;
  signIn<D, T>(config?: any): Promise<T>;
  signUp<D, T>(config?: any): Promise<T>;
  signOut(): Promise<void>;
  refreshToken<T>(args?: T): Promise<void>;
}
```

### StrategyHelper

Helper class for managing authentication state.

#### Methods

- `clearStorage(): void` - Clear local storage
- `reset(): void` - Reset authentication state

## License

ISC 
