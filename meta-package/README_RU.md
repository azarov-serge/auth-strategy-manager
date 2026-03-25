# Auth Strategy Manager

[![npm version](https://badge.fury.io/js/auth-strategy-manager.svg)](https://badge.fury.io/js/auth-strategy-manager)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Гибкая библиотека для управления аутентификацией с поддержкой множественных стратегий. Позволяет легко интегрировать различные методы аутентификации (Keycloak, REST API, Supabase, кастомные) в единый интерфейс.

## 🌍 Документация на других языках

- [🇺🇸 English (Английский)](README.md)
- [🇷🇺 Русский (Текущий)](README_RU.md)

## 📦 Пакеты

Этот репозиторий содержит следующие пакеты:

- **[@auth-strategy-manager/core](https://www.npmjs.com/package/@auth-strategy-manager/core)** — `AuthStrategyManager`, `Strategy`, `AuthStorageManager`, `StrategyNameStorage`, классы ошибок и константы.
- **[@auth-strategy-manager/keycloak](https://www.npmjs.com/package/@auth-strategy-manager/keycloak)**  — стратегия Keycloak
- **[@auth-strategy-manager/rest](https://www.npmjs.com/package/@auth-strategy-manager/rest)**  — стратегия REST API
- **[@auth-strategy-manager/supabase](https://www.npmjs.com/package/@auth-strategy-manager/supabase)** — стратегия Supabase (**v2**, peer **core ^2.0.0**)

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

- `checkAuth(): Promise<AuthManagerData>` - Проверяет статус аутентификации по всем стратегиям и возвращает нормализованное состояние.
- `signIn<T = unknown, D = undefined>(config?: D): Promise<T>` - Проксирует вызов `signIn` активной стратегии.
- `signUp<T = unknown, D = undefined>(config?: D): Promise<T>` - Проксирует вызов `signUp` активной стратегии.
- `signOut(): Promise<void>` - Проксирует вызов `signOut` активной стратегии.
- `refreshToken<T>(args?: T): Promise<AuthManagerData>` - Проксирует вызов `refreshToken` активной стратегии (если активная стратегия есть).
- `setStrategies(strategies: Strategy[]): Promise<void>` - Заменяет все стратегии новыми
- `use(strategyName: string): void` - Устанавливает активную стратегию по имени (нужен только при нескольких стратегиях)
- `clear(): void` - Очищает состояние аутентификации и сбрасывает все стратегии

`AuthStrategyManager` реализует интерфейс `Strategy` и может использоваться как фасад над активной стратегией.

#### Примеры использования

```typescript
// Создание менеджера со стратегиями
const authManager = new AuthStrategyManager([strategy1, strategy2]);

const authState = await authManager.checkAuth();

// Переключение на конкретную стратегию
authManager.use('keycloak');

// Получение текущей активной стратегии
const currentStrategy = authManager.strategy;

// Очистка всех данных аутентификации
authManager.clear();
```

### Использование Keycloak стратегии (v2)

Нужны **core ^2.0.0** и **@auth-strategy-manager/keycloak ^2.0.0**. Чеклист: [README Keycloak](../packages/keycloak/README_RU.md).

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { KeycloakStrategy } from '@auth-strategy-manager/keycloak';

const keycloakStrategy = new KeycloakStrategy({
  keycloak: {
    realm: 'my-realm',
    url: 'https://keycloak.example.com',
    clientId: 'my-client',
  },
  signInUrl: 'https://myapp.com/login',
  name: 'keycloak',
  init: { flow: 'standard', onLoad: 'check-sso' },
});

const authManager = new AuthStrategyManager([keycloakStrategy]);
keycloakStrategy.startUrl = authManager.startUrl ?? window.location.origin;

await authManager.checkAuth();
await authManager.signIn();
await authManager.signOut();
```

### Использование REST стратегии (v2)

Хранилище токенов — у **`AuthStrategyManager`** / **`AuthStorageManager`**.

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { RestStrategy } from '@auth-strategy-manager/rest';

const restStrategy = new RestStrategy({
  name: 'rest',
  getToken: (response, options) => {
    const data = (response as { data?: { access?: string } }).data;
    return options?.type === 'refresh' ? '' : data?.access ?? '';
  },
  checkAuth: { url: '/api/auth/me', method: 'GET' },
  signIn: { url: '/api/auth/sign-in', method: 'POST' },
  signUp: { url: '/api/auth/sign-up', method: 'POST' },
  refresh: { url: '/api/auth/refresh', method: 'POST' },
});

const authManager = new AuthStrategyManager([restStrategy]);

await authManager.checkAuth();
await authManager.signOut();
```

### Использование Supabase стратегии (v2)

Нужны **core ^2.0.0** и **@auth-strategy-manager/supabase ^2.0.0**. В конфиге поле **`supabase`** (клиент). Чеклист: [README Supabase](../packages/supabase/README_RU.md).

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { SupabaseStrategy, SupabaseConfig } from '@auth-strategy-manager/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const supabaseStrategy = new SupabaseStrategy({
  supabase,
  name: 'supabase',
  signInUrl: 'https://myapp.com/login',
} satisfies SupabaseConfig);

const authManager = new AuthStrategyManager([supabaseStrategy]);

await authManager.checkAuth();
await authManager.signIn({ email: 'user@example.com', password: 'password123' });
await authManager.refreshToken();
await authManager.signOut();
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
  name: 'rest',
  getToken: (response) =>
    (response as { data?: { access?: string } }).data?.access ?? '',
  checkAuth: { url: '/api/auth/me', method: 'GET' },
  signIn: { url: '/api/auth/sign-in', method: 'POST' },
  signUp: { url: '/api/auth/sign-up', method: 'POST' },
  refresh: { url: '/api/auth/refresh', method: 'POST' },
});

const authManager = new AuthStrategyManager([keycloakStrategy, restStrategy]);
authManager.use('keycloak');

await authManager.checkAuth();
```

## 🏗️ Архитектура

### Основной пакет (@auth-strategy-manager/core)

Содержит основные классы и интерфейсы:

- `AuthStrategyManager` — главный класс менеджера
- `Strategy` — интерфейс для всех стратегий
- `AuthStorageManager`, `StrategyNameStorage`, `AuthStorage` — модель хранения v2
- Классы ошибок и константы

### Пакет Keycloak (@auth-strategy-manager/keycloak)

- **v2** — `AuthManagerData` + **core ^2.0.0**; [README_RU](../packages/keycloak/README_RU.md)

### Пакет REST (@auth-strategy-manager/rest)

Предоставляет интеграцию с REST API:

- `RestStrategy` — стратегия аутентификации REST API
- Типы конфигурации для REST

### Пакет Supabase (@auth-strategy-manager/supabase)

- **v2** — `AuthManagerData` из `checkAuth` / `signIn` / `signUp` / `refreshToken`; peer **core ^2.0.0**
- [README_RU](../packages/supabase/README_RU.md)

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

### Интерфейс Strategy

```typescript
type AuthManagerData = {
  isAuthenticated: boolean;
  strategyName: string;
  accessToken: string;
  refreshToken?: string;
};

interface Strategy {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  signInUrl?: string;

  checkAuth(): Promise<AuthManagerData>;
  signIn<T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T>;
  signUp<T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T>;
  signOut(): Promise<void>;
  refreshToken<T>(args?: T): Promise<AuthManagerData>;
  clear?(): void;
}
```
