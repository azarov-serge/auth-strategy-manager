# @auth-strategy-manager/core

Основной менеджер стратегий аутентификации - основа для всех стратегий аутентификации.

## 🌍 Документация на других языках

- [🇺🇸 English (Английский)](README.md)
- [🇷🇺 Русский (Текущий)](README_RU.md)

## Установка

```bash
npm install @auth-strategy-manager/core
```

## Использование

```typescript
import { AuthStrategyManager, Strategy, StrategyHelper } from '@auth-strategy-manager/core';

// Создание кастомной стратегии
class CustomStrategy extends StrategyHelper implements Strategy {
  readonly name = 'custom';
  
  check = async (): Promise<boolean> => {
    // Ваша логика аутентификации
    return true;
  };
  
  signIn = async <T = unknown, D = undefined>(config?: D): Promise<T> => {
    // Ваша логика входа
    return {} as T;
  };
  
  signUp = async <T = unknown, D = undefined>(config?: D): Promise<T> => {
    // Ваша логика регистрации
    return {} as T;
  };
  
  signOut = async (): Promise<void> => {
    // Ваша логика выхода
    this.clearStorage();
  };
  
  refreshToken = async <T>(args?: T): Promise<void> => {
    // Ваша логика обновления токена
  };
}

// Использование REST стратегии
const restStrategy = new RestStrategy({
  // ...
});
const authManager = new AuthStrategyManager([restStrategy]);

// Проверка аутентификации
const isAuthenticated = await restStrategy.checkAuth();

// Выход из системы
await restStrategy.signOut();

// Очистка состояния
restStrategy.clear();
```

## API

### AuthStrategyManager

Главный класс для управления стратегиями аутентификации.

#### Конструктор

```typescript
constructor(strategies: Strategy[])
```

#### Методы

- `check(): Promise<boolean>` - Проверка аутентификации
- `setStrategies(strategies: Strategy[]): Promise<void>` - Обновление стратегий
- `use(strategyName: string): void` - Установка активной стратегии
- `clear(): void` - Очистка состояния аутентификации

### Strategy Interface

```typescript
interface Strategy {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  signInUrl?: string;
  
  check(): Promise<boolean>;
  signIn<T = unknown, D = undefined>(config?: D): Promise<T>;
  signUp<T = unknown, D = undefined>(config?: D): Promise<T>;
  signOut(): Promise<void>;
  refreshToken<T>(args?: T): Promise<void>;
}
```

### StrategyHelper

Вспомогательный класс для управления состоянием аутентификации.

#### Методы

- `clearStorage(): void` - Очистка локального хранилища
- `reset(): void` - Сброс состояния аутентификации

## Лицензия

ISC 
