# Auth Strategy Manager

[![npm version](https://badge.fury.io/js/auth-strategy-manager.svg)](https://badge.fury.io/js/auth-strategy-manager)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Гибкая библиотека для управления аутентификацией с поддержкой множественных стратегий. Позволяет легко интегрировать различные методы аутентификации (Keycloak, REST API, кастомные) в единый интерфейс.

> 🇺🇸 [Read in English](README.md)

## 📋 Содержание

- [🚀 Особенности](#-особенности)
- [📦 Установка](#-установка)
- [🏗️ Архитектура](#️-архитектура)
- [🔧 Использование](#-использование)
- [🔒 Безопасность](#-безопасность)
- [🧪 Тестирование](#-тестирование)
- [📝 Лицензия](#-лицензия)
- [🤝 Вклад в проект](#-вклад-в-проект)
- [📞 Поддержка](#-поддержка)

## 🚀 Особенности

- **Множественные стратегии**: Поддержка Keycloak, REST API и кастомных стратегий
- **Автоматическое определение**: Автоматический выбор активной стратегии
- **TypeScript**: Полная поддержка TypeScript с типами
- **Гибкость**: Легкое добавление новых стратегий аутентификации
- **Безопасность**: Расширенная обработка ошибок сети, сертификатов и таймаутов
- **Совместимость**: Работает в браузере и Node.js

## 📦 Установка

```bash
npm install auth-strategy-manager
```

## 🏗️ Архитектура

### Основные компоненты

1. **AuthStrategyManager** - главный класс для управления стратегиями
2. **Strategy** - интерфейс для всех стратегий аутентификации
3. **StrategyHelper** - вспомогательный класс для управления состоянием
4. **Встроенные стратегии**:
   - `KeycloakStrategy` - для интеграции с Keycloak
   - `RestStrategy` - для REST API аутентификации
   - `EmptyStrategy` - пустая стратегия по умолчанию

### Структура проекта

```
src/
├── auth-strategy-manager.ts    # Основной класс менеджера
├── types.ts                    # TypeScript типы
├── errors.ts                   # Классы ошибок
├── constants.ts                # Константы
├── helpers/
│   └── strategy-helper.ts      # Вспомогательный класс
└── strategies/
    ├── keycloak-strategy.ts    # Стратегия Keycloak
    ├── rest-strategy.ts        # Стратегия REST API
    ├── empty-strategy.ts       # Пустая стратегия
    └── types.ts                # Типы стратегий
```

## 📖 API Документация

### AuthStrategyManager

Главный класс для управления стратегиями аутентификации.

#### Конструктор

```typescript
constructor(strategies: Strategy[])
```

**Параметры:**
- `strategies` - массив стратегий аутентификации

#### Свойства

- `strategiesCount: number` - количество зарегистрированных стратегий
- `strategy: Strategy` - текущая активная стратегия
- `isKeycloak: boolean` - проверка, является ли активная стратегия Keycloak
- `startUrl: string | undefined` - URL для перенаправления после аутентификации

#### Методы

##### `check(): Promise<boolean>`
Проверяет аутентификацию пользователя. Автоматически выбирает подходящую стратегию.

**Возвращает:** `Promise<boolean>` - результат проверки аутентификации

**Особенности:**
- При наличии только одной Keycloak стратегии автоматически выполняет вход
- При множественных стратегиях проверяет все и выбирает первую успешную
- Обрабатывает различные типы ошибок с соответствующими исключениями

##### `setStrategies(strategies: Strategy[]): Promise<void>`
Обновляет список доступных стратегий.

**Параметры:**
- `strategies` - новый массив стратегий

##### `use(strategyName: string): void`
Устанавливает активную стратегию по имени.

**Параметры:**
- `strategyName` - имя стратегии

##### `clear(): void`
Очищает состояние аутентификации и сбрасывает активную стратегию.

### Strategy Interface

Интерфейс для всех стратегий аутентификации.

```typescript
interface Strategy {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  signInUrl?: string;
  
  check(): Promise<boolean>;
  signIn<D, T>(config?: AxiosRequestConfig<D>): Promise<T>;
  signUp<D, T>(config?: AxiosRequestConfig<D>): Promise<T>;
  signOut(): Promise<void>;
  refreshToken<T>(args?: T): Promise<void>;
}
```

## 🔧 Использование

### Полный пример интеграции

```typescript
import { 
  AuthStrategyManager,
  KeycloakStrategy,
  RestStrategy,
  isObject,
  isString 
} from 'auth-strategy-manager';

// Конфигурация активных стратегий
const activeStrategies = ['keycloak', 'rest'];

// Определение базового URL приложения
const protocol = window.location.protocol;
const [baseUrl] = window.location.href.replace(`${protocol}//`, '').split('/');
const URL = `${protocol}//${baseUrl}`;
const signInUrl = `${URL}/sign-in`;

// Создание Keycloak стратегии
const keycloakStrategy = new KeycloakStrategy({
  keycloak: { 
    realm: 'Example', 
    url: 'https://keycloak.example/auth', 
    clientId: 'CLIENT_ID' 
  },
  signInUrl: signInUrl,
  // Если доступна только одна стратегия, устанавливаем флаг only
  only: activeStrategies.length === 1 && activeStrategies.includes('keycloak'),
});

// Создание REST стратегии
const restStrategy = new RestStrategy({
  signInUrl: signInUrl,
  // Endpoints для различных операций аутентификации
  check: {
    url: `${URL}/token/v1/refresh`,
    method: 'POST',
  },
  signIn: {
    url: `${URL}/auth/v1/sign-in`,
    method: 'POST',
  },
  signUp: {
    url: `${URL}/auth/v1/sign-up`,
    method: 'POST',
  },
  signOut: { 
    url: `${URL}/auth/v1/signout`, 
    method: 'POST' 
  },
  refresh: {
    url: `${URL}/token/v1/refresh`,
    method: 'POST',
  },
  // Кастомная функция для извлечения токена из ответа
  getToken: (response: unknown): string => {
    // Если ответ - строка, возвращаем её как токен
    if (isString(response)) {
      return response;
    }

    // Если ответ - объект с полем access, возвращаем его значение
    if (
      isObject(response) &&
      'access' in response &&
      isString(response.access)
    ) {
      return response.access;
    }

    // Если токен не найден, возвращаем пустую строку
    return '';
  },
});

// Создание массива всех доступных стратегий
const allStrategies = [keycloakStrategy, restStrategy];

// Фильтрация стратегий на основе конфигурации
const strategies = activeStrategies.length
  ? allStrategies
      .filter((strategy) => activeStrategies.includes(strategy.name))
      .sort((a, b) => activeStrategies.indexOf(a.name) - activeStrategies.indexOf(b.name))
  : allStrategies;

// Создание менеджера стратегий
const authManager = new AuthStrategyManager(strategies);

// Экспорт для использования в приложении
export { restStrategy, keycloakStrategy, authManager };
```

### Базовое использование

```typescript
import { AuthStrategyManager, KeycloakStrategy, RestStrategy } from 'auth-strategy-manager';

// Создание стратегий
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

// Создание менеджера
const authManager = new AuthStrategyManager([keycloakStrategy, restStrategy]);

// Проверка аутентификации
const isAuthenticated = await authManager.check();
```

### Keycloak Strategy

```typescript
import { KeycloakStrategy } from 'auth-strategy-manager';

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

// Проверка аутентификации
const isAuthenticated = await keycloakStrategy.check();

// Вход в систему
await keycloakStrategy.signIn();

// Выход из системы
await keycloakStrategy.signOut();

// Обновление токена
await keycloakStrategy.refreshToken(30); // 30 секунд минимальной валидности
```

### REST Strategy

```typescript
import { RestStrategy } from 'auth-strategy-manager';
import axios from 'axios';

// Создание кастомного axios инстанса
const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

const restStrategy = new RestStrategy({
  name: 'my-rest',
  tokenKey: 'access_token',
  signInUrl: 'https://myapp.com/login',
  axiosInstance,
  
  // URL endpoints
  check: { url: '/auth/check', method: 'GET' },
  signIn: { url: '/auth/login', method: 'POST' },
  signUp: { url: '/auth/register', method: 'POST' },
  signOut: { url: '/auth/logout', method: 'POST' },
  refresh: { url: '/auth/refresh', method: 'POST' },
  
  // Кастомная функция извлечения токена
  getToken: (response: any) => response.data?.access_token || response.access_token
});

// Вход с кастомными данными
const loginResult = await restStrategy.signIn({
  data: {
    username: 'user@example.com',
    password: 'password123'
  }
});
```

### Обработка ошибок

```typescript
import { 
  AuthStrategyManager, 
  NetworkError, 
  CertError, 
  Timeout3rdPartyError 
} from 'auth-strategy-manager';

try {
  const isAuthenticated = await authManager.check();
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Ошибка сети:', error.message);
    // Обработка сетевых ошибок
  } else if (error instanceof CertError) {
    console.error('Ошибка сертификата:', error.message);
    // Обработка ошибок SSL/TLS сертификатов
  } else if (error instanceof Timeout3rdPartyError) {
    console.error('Таймаут сторонней проверки:', error.message);
    // Обработка таймаутов при проверке через iframe
  } else {
    console.error('Неизвестная ошибка:', error);
  }
}
```

### Создание кастомной стратегии

```typescript
import { Strategy, StrategyHelper } from 'auth-strategy-manager';

class CustomStrategy extends StrategyHelper implements Strategy {
  readonly name = 'custom';
  
  check = async (): Promise<boolean> => {
    // Ваша логика проверки аутентификации
    return true;
  };
  
  signIn = async <D, T>(config?: AxiosRequestConfig<D>): Promise<T> => {
    // Ваша логика входа
    return {} as T;
  };
  
  signUp = async <D, T>(config?: AxiosRequestConfig<D>): Promise<T> => {
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
```

## 🔒 Безопасность

### Обработка ошибок

Библиотека предоставляет специализированные классы ошибок:

- `NetworkError` - для сетевых ошибок (`ERR_NETWORK`)
- `CertError` - для ошибок SSL/TLS сертификатов (`ERR_CERT_AUTHORITY_INVALID`)
- `Timeout3rdPartyError` - для таймаутов сторонних проверок (iframe)
- `ResponseError` - базовый класс для HTTP ошибок

### Константы ошибок

```typescript
import { 
  CERT_ERROR_CODE, 
  NETWORK_ERROR_CODE, 
  TIMEOUT_3RD_PARTY_ERROR_CODE 
} from 'auth-strategy-manager';

// Доступные константы:
// CERT_ERROR_CODE = 'ERR_CERT_AUTHORITY_INVALID'
// NETWORK_ERROR_CODE = 'ERR_NETWORK'
// TIMEOUT_3RD_PARTY_ERROR_CODE = 'Timeout when waiting for 3rd party check iframe message.'
```

### Хранение токенов

- **Keycloak**: Токены управляются библиотекой Keycloak
- **REST**: Токены хранятся в `sessionStorage` с настраиваемым ключом
- **Состояние**: Информация об активной стратегии хранится в `localStorage`

### Логика обработки ошибок

При проверке аутентификации менеджер стратегий:

1. **Проверяет все стратегии параллельно** с помощью `Promise.allSettled`
2. **Выбирает первую успешную стратегию** и устанавливает её как активную
3. **Обрабатывает специфические ошибки**:
   - Сетевые ошибки → `NetworkError`
   - Ошибки сертификатов → `CertError`
   - Таймауты iframe → `Timeout3rdPartyError`
4. **Особый случай для Keycloak**: Если доступна только одна Keycloak стратегия, автоматически выполняет вход

## 🧪 Тестирование

```bash
# Установка зависимостей
npm install

# Сборка проекта
npm run build

# Форматирование кода
npm run format
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
