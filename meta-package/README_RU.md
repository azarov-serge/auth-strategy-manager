# Auth Strategy Manager

[![npm version](https://badge.fury.io/js/auth-strategy-manager.svg)](https://badge.fury.io/js/auth-strategy-manager)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Гибкая библиотека для управления аутентификацией с поддержкой множественных стратегий. Позволяет легко интегрировать различные методы аутентификации (Keycloak, REST API, Supabase, кастомные) в единый интерфейс.

## 🌍 Документация на других языках

- [🇺🇸 English (Английский)](README.md)
- [🇷🇺 Русский (Текущий)](README_RU.md)

## 📦 Пакеты

Этот репозиторий содержит следующие пакеты:

- **[@auth-strategy-manager/core](https://www.npmjs.com/package/@auth-strategy-manager/core)**  — основной менеджер стратегий аутентификации: содержит главные классы и интерфейсы для управления стратегиями аутентификации, включая `AuthStrategyManager`, `Strategy`, `StrategyHelper`, классы ошибок и константы.
- **[@auth-strategy-manager/keycloak](https://www.npmjs.com/package/@auth-strategy-manager/keycloak)**  — стратегия Keycloak
- **[@auth-strategy-manager/rest](https://www.npmjs.com/package/@auth-strategy-manager/rest)**  — стратегия REST API
- **[@auth-strategy-manager/supabase](https://www.npmjs.com/package/@auth-strategy-manager/supabase)** — стратегия Supabase

## 🚀 Быстрый старт

### Установка основного пакета

```bash
npm install @auth-strategy-manager/core
```

### Установка с Keycloak стратегией

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/keycloak keycloak-js
```

### Установка с REST стратегией

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/rest axios
```

### Установка с Supabase стратегией

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/supabase @supabase/supabase-js
```

### Установка всех пакетов

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/keycloak @auth-strategy-manager/rest @auth-strategy-manager/supabase keycloak-js axios @supabase/supabase-js
```

## 🔧 Использование

### Базовое использование только с core

```typescript
import { AuthStrategyManager, Strategy } from '@auth-strategy-manager/core';

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

  public clear = (): void => {
    // Ваша логика очистки
  };
}

// Использование с менеджером стратегий
const authManager = new AuthStrategyManager([new CustomStrategy()]);
```

### AuthStrategyManager API

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

`AuthStrategyManager` реализует интерфейс `Strategy` и может использоваться как фасад над активной стратегией.

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
}
```

### Использование Keycloak стратегии

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

### Использование REST стратегии

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

// Проверка аутентификации
const isAuthenticated = await restStrategy.checkAuth();

// Выход из системы
await restStrategy.signOut();

// Очистка состояния
restStrategy.clear();
```

### Использование Supabase стратегии

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

### Использование множественных стратегий

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

// Проверка аутентификации (попробует обе стратегии)
const isAuthenticated = await authManager.checkAuth();
```

## 🏗️ Архитектура

### Основной пакет (@auth-strategy-manager/core)

Содержит основные классы и интерфейсы:

- `AuthStrategyManager` — главный класс менеджера
- `Strategy` — интерфейс для всех стратегий
- `StrategyHelper` — вспомогательный класс для управления состоянием
- Классы ошибок и константы

### Пакет Keycloak (@auth-strategy-manager/keycloak)

Предоставляет интеграцию с Keycloak:

- `KeycloakStrategy` — стратегия аутентификации Keycloak
- Типы конфигурации для Keycloak

### Пакет REST (@auth-strategy-manager/rest)

Предоставляет интеграцию с REST API:

- `RestStrategy` — стратегия аутентификации REST API
- Типы конфигурации для REST

### Пакет Supabase (@auth-strategy-manager/supabase)

Предоставляет интеграцию с Supabase:

- `SupabaseStrategy` — стратегия аутентификации Supabase
- Типы конфигурации для Supabase

## 📖 Документация

- [Документация основного пакета](https://www.npmjs.com/package/@auth-strategy-manager/core)
- [Документация Keycloak стратегии](https://www.npmjs.com/package/@auth-strategy-manager/keycloak)
- [Документация REST стратегии](https://www.npmjs.com/package/@auth-strategy-manager/rest)
- [Документация Supabase стратегии](https://www.npmjs.com/package/@auth-strategy-manager/supabase)

## 🧪 Разработка

### Настройка

```bash
# Установка зависимостей
npm install

# Сборка всех пакетов
npm run build

# Сборка конкретного пакета
npm run build --workspace=@auth-strategy-manager/core
```

### Публикация

```bash
# Публикация всех пакетов
npm run publish:all

# Публикация конкретного пакета
npm run publish:core
npm run publish:keycloak
npm run publish:rest
npm run publish:supabase
```

## 📝 Лицензия

ISC License

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📞 Поддержка

Если у вас есть вопросы или проблемы, создайте issue в GitHub репозитории.

---

**Auth Strategy Manager** - сделайте аутентификацию простой и гибкой! 🔐 
