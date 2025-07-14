# Auth Strategy Manager

[![npm version](https://badge.fury.io/js/auth-strategy-manager.svg)](https://badge.fury.io/js/auth-strategy-manager)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Гибкая библиотека для управления аутентификацией с поддержкой множественных стратегий. Позволяет легко интегрировать различные методы аутентификации (Keycloak, REST API, кастомные) в единый интерфейс.

## 🌍 Документация на других языках

- [🇺🇸 English (Английский)](README.md)
- [🇷🇺 Русский (Текущий)](README_RU.md)

## 📦 Пакеты

Этот репозиторий содержит следующие пакеты:

- **[@auth-strategy-manager/core](https://www.npmjs.com/package/@auth-strategy-manager/core)** - Основной менеджер стратегий аутентификации
- **[@auth-strategy-manager/keycloak](https://www.npmjs.com/package/@auth-strategy-manager/keycloak)** - Стратегия Keycloak
- **[@auth-strategy-manager/rest](https://www.npmjs.com/package/@auth-strategy-manager/rest)** - Стратегия REST API

## 🚀 Быстрый старт

### Установка основного пакета

```bash
npm install auth-strategy-manager
```

> Этот meta-package автоматически установит `@auth-strategy-manager/core`.

### Установка с Keycloak стратегией

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/keycloak keycloak-js
```

### Установка с REST стратегией

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/rest axios
```

### Установка всех пакетов

```bash
npm install @auth-strategy-manager/core @auth-strategy-manager/keycloak @auth-strategy-manager/rest keycloak-js axios
```

## 🔧 Использование

### Базовое использование только с core

```typescript
import { AuthStrategyManager, Strategy, StrategyHelper } from '@auth-strategy-manager/core';

// Создание кастомной стратегии
class CustomStrategy extends StrategyHelper implements Strategy {
  readonly name = 'custom';
  
  check = async (): Promise<boolean> => {
    // Ваша логика аутентификации
    return true;
  };
  
  signIn = async <D, T>(config?: any): Promise<T> => {
    // Ваша логика входа
    return {} as T;
  };
  
  signUp = async <D, T>(config?: any): Promise<T> => {
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

// Использование с менеджером стратегий
const authManager = new AuthStrategyManager([new CustomStrategy()]);
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
  check: { url: '/api/auth/check', method: 'GET' },
  signIn: { url: '/api/auth/login', method: 'POST' },
  signOut: { url: '/api/auth/logout', method: 'POST' },
  refresh: { url: '/api/auth/refresh', method: 'POST' }
});

const authManager = new AuthStrategyManager([restStrategy]);
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
  check: { url: '/api/auth/check', method: 'GET' },
  signIn: { url: '/api/auth/login', method: 'POST' },
  signOut: { url: '/api/auth/logout', method: 'POST' },
  refresh: { url: '/api/auth/refresh', method: 'POST' }
});

const authManager = new AuthStrategyManager([keycloakStrategy, restStrategy]);

// Проверка аутентификации (попробует обе стратегии)
const isAuthenticated = await authManager.check();
```

## 🏗️ Архитектура

### Основной пакет (@auth-strategy-manager/core)

Содержит основные классы и интерфейсы:

- `AuthStrategyManager` - Главный класс менеджера
- `Strategy` - Интерфейс для всех стратегий
- `StrategyHelper` - Вспомогательный класс для управления состоянием
- Классы ошибок и константы

### Пакет Keycloak (@auth-strategy-manager/keycloak)

Предоставляет интеграцию с Keycloak:

- `KeycloakStrategy` - Стратегия аутентификации Keycloak
- Типы конфигурации для Keycloak

### Пакет REST (@auth-strategy-manager/rest)

Предоставляет интеграцию с REST API:

- `RestStrategy` - Стратегия аутентификации REST API
- Типы конфигурации для REST

## 📖 Документация

- [Документация основного пакета](https://www.npmjs.com/package/@auth-strategy-manager/core)
- [Документация Keycloak стратегии](https://www.npmjs.com/package/@auth-strategy-manager/keycloak)
- [Документация REST стратегии](https://www.npmjs.com/package/@auth-strategy-manager/rest)

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
