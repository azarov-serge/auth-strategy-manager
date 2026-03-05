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
class CustomStrategy implements Strategy {
  readonly name = 'custom';
  
  public checkAuth = async (): Promise<boolean> => {
    // Ваша логика аутентификации
    return true;
  };
  
  public signIn = async <T = unknown, D = undefined>(config?: D): Promise<T> => {
    // Ваша логика входа
    return {} as T;
  };
  
  public signUp = async <T = unknown, D = undefined>(config?: D): Promise<T> => {
    // Ваша логика регистрации
    return {} as T;
  };
  
  public signOut = async (): Promise<void> => {
    // Ваша логика выхода
    this.clearStorage();
  };
  
  public refreshToken = async <T>(args?: T): Promise<void> => {
    // Ваша логика обновления токена
  };

  public reset = (): void => {
    // Ваша логика сброса
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

Создает новый экземпляр AuthStrategyManager с предоставленными стратегиями.

#### Свойства

- `strategiesCount: number` - Общее количество зарегистрированных стратегий
- `strategy: Strategy` - Текущая активная стратегия. Если передана только одна стратегия, она используется по умолчанию (вызов `use()` не нужен).
- `startUrl: string | undefined` - URL для перенаправления после аутентификации

#### Методы

- `checkAuth(): Promise<boolean>` - Проверяет статус аутентификации по всем стратегиям. Возвращает true, если любая стратегия аутентифицирована.
- `signIn<T = unknown, D = undefined>(config?: D): Promise<T>` - Проксирует вызов `signIn` активной стратегии.
- `signUp<T = unknown, D = undefined>(config?: D): Promise<T>` - Проксирует вызов `signUp` активной стратегии.
- `signOut(): Promise<void>` - Проксирует вызов `signOut` активной стратегии.
- `refreshToken<T>(args?: T): Promise<void>` - Проксирует вызов `refreshToken` активной стратегии (если активная стратегия есть).
- `setStrategies(strategies: Strategy[]): Promise<void>` - Заменяет все стратегии новыми
- `use(strategyName: string): void` - Устанавливает активную стратегию по имени (нужен только при нескольких стратегиях)
- `clear(): void` - Очищает состояние аутентификации и сбрасывает все стратегии

`AuthStrategyManager` реализует интерфейс `Strategy` и может использоваться как фасад над активной стратегией в коде приложения.

#### Примеры использования

```typescript
// Создание менеджера со стратегиями
const authManager = new AuthStrategyManager([strategy1, strategy2]);

// Проверка аутентификации пользователя
const isAuthenticated = await authManager.checkAuth();

// Переключение на конкретную стратегию
authManager.use('keycloak');

// Получение текущей активной стратегии
const currentStrategy = authManager.strategy;

// Очистка всех данных аутентификации
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

Вспомогательный класс для управления состоянием аутентификации.

#### Методы

- `clearStorage(): void` - Очистка локального хранилища
- `reset(): void` - Сброс состояния аутентификации

## Лицензия

ISC 
