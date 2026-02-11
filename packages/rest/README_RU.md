# @auth-strategy-manager/rest

Стратегия REST API для auth-strategy-manager.

## 🌍 Документация на других языках

- [🇺🇸 English (Английский)](README.md)
- [🇷🇺 Русский (Текущий)](README_RU.md)

## Установка

```bash
npm install @auth-strategy-manager/rest @auth-strategy-manager/core axios
```

## Использование

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { RestStrategy } from '@auth-strategy-manager/rest';
import axios from 'axios';

// Создание кастомного axios инстанса
const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

// Создание REST стратегии
const restStrategy = new RestStrategy({
  name: 'my-rest',
  signInUrl: 'https://myapp.com/sign-in',
  axiosInstance,
  accessToken: {
    key: 'access_token',
    storage: 'sessionStorage',
    getToken: (response: unknown) => (response as any).data?.access_token || (response as any).access_token,
  },
  checkAuth: { url: '/auth/check-auth', method: 'GET' },
  signIn: { url: '/auth/sign-in', method: 'POST' },
  signUp: { url: '/auth/sign-up', method: 'POST' },
  signOut: { url: '/auth/sign-out', method: 'POST' },
  refresh: { url: '/auth/refresh', method: 'POST' },
});

// Использование с менеджером стратегий
const authManager = new AuthStrategyManager([restStrategy]);

// Вход с кастомными данными
const loginResult = await restStrategy.signIn<unknown, AxiosRequestConfig>({
  data: {
    username: 'user@example.com',
    password: 'password123'
  }
});

// Проверка аутентификации
const isAuthenticated = await restStrategy.checkAuth();

// Выход из системы
await restStrategy.signOut();

// Очистка состояния
restStrategy.clear();
```

## Конфигурация

### RestConfig

```typescript
type RestConfig = {
  checkAuth: UrlConfig;
  signIn: UrlConfig;
  signUp: UrlConfig;
  signOut: UrlConfig;
  refresh: UrlConfig;
  name?: string;
  accessToken: AccessTokenConfig;
  refreshToken?: RefreshTokenConfig;
  signInUrl?: string;
  axiosInstance?: AxiosInstance;
};

type AccessTokenConfig = {
  key: string;
  storage: 'sessionStorage' | 'localStorage';
  getToken?: (response: unknown, url?: string) => string;
};

type RefreshTokenConfig = {
  key: string;
  storage: 'sessionStorage' | 'localStorage';
  getToken?: (response: unknown, url?: string) => string;
};

type UrlConfig = { url: string; method?: string };
```

### Параметры

- `checkAuth` - Endpoint для проверки аутентификации
- `signIn` - Endpoint для входа пользователя
- `signUp` - Endpoint для регистрации пользователя
- `signOut` - Endpoint для выхода пользователя
- `refresh` - Endpoint для обновления токена
- `name` - Имя стратегии (по умолчанию: 'rest')
- `accessToken` - Хранение и извлечение access токена (обязательно)
- `refreshToken` - Опционально: хранение и извлечение refresh токена (например, access в sessionStorage, refresh в localStorage)
- `signInUrl` - URL для перенаправления после выхода
- `axiosInstance` - Кастомный axios инстанс

## API

### RestStrategy

#### Конструктор

```typescript
constructor(config: RestConfig)
```

#### Методы

- `checkAuth(): Promise<boolean>` - Проверка аутентификации
- `signIn<T = unknown, D = undefined>(config?: D): Promise<T>` - Вход пользователя
- `signUp<T = unknown, D = undefined>(config?: D): Promise<T>` - Регистрация пользователя
- `signOut(): Promise<void>` - Выход пользователя
- `refreshToken(): Promise<void>` - Обновление токена
- `clear(): void` - Очистка состояния аутентификации

#### Свойства

- `name: string` - Имя стратегии
- `axiosInstance: AxiosInstance` - Axios инстанс
- `token?: string` - Текущий токен
- `isAuthenticated: boolean` - Статус аутентификации

## Хранение токенов

Access токен (и при необходимости refresh токен) хранятся согласно `accessToken` и `refreshToken`. Для каждого можно задать `sessionStorage` или `localStorage` отдельно.

## Лицензия

ISC 
