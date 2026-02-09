# @auth-strategy-manager/supabase

Стратегия Supabase для auth-strategy-manager.

## 🌍 Документация на других языках

- [🇺🇸 English (Английский)](README.md)
- [🇷🇺 Русский (Текущий)](README_RU.md)

## Установка

```bash
npm install @auth-strategy-manager/supabase @auth-strategy-manager/core @supabase/supabase-js
```

## Использование

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { SupabaseStrategy, SupabaseConfig } from '@auth-strategy-manager/supabase';
import { createClient } from '@supabase/supabase-js';

// Создание Supabase клиента
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Создание Supabase стратегии
const supabaseStrategy = new SupabaseStrategy({
  supabase,
  name: 'supabase',
  signInUrl: 'https://myapp.com/login',
} satisfies SupabaseConfig);

// Использование с менеджером стратегий
const authManager = new AuthStrategyManager([supabaseStrategy]);

// Проверка аутентификации
const isAuthenticated = await supabaseStrategy.checkAuth();

// Вход в систему
const signInResult = await supabaseStrategy.signIn({
  email: 'user@example.com',
  password: 'password123',
});

// Регистрация пользователя
const signUpResult = await supabaseStrategy.signUp({
  email: 'user@example.com',
  password: 'password123',
  username: 'user',
});

// Выход из системы
await supabaseStrategy.signOut();

// Обновление токена
await supabaseStrategy.refreshToken();
```

## Конфигурация

### SupabaseConfig

```typescript
type SupabaseConfig = {
  supabase: SupabaseClient;
  name?: string;
  /** URL для редиректа на страницу авторизации */
  signInUrl?: string;
};
```

### Параметры

- `supabase` - Экземпляр Supabase клиента
- `name` - Имя стратегии (по умолчанию: 'supabase')
- `signInUrl` - URL для редиректа после выхода

## API

### SupabaseStrategy

#### Конструктор

```typescript
constructor(config: SupabaseConfig)
```

#### Методы

- `checkAuth(): Promise<boolean>` - Проверка аутентификации
- `signIn<T = unknown, D = undefined>(config?: D): Promise<T>` - Вход пользователя (ожидает `{ email, password }`)
- `signUp<T = unknown, D = undefined>(config?: D): Promise<T>` - Регистрация пользователя (ожидает `{ email, password, username }`)
- `signOut(): Promise<void>` - Выход пользователя
- `refreshToken<T>(args?: T): Promise<void>` - Обновление токена
- `clear(): void` - Очистка состояния аутентификации
- `getCurrentUserId(): Promise<string | null>` - Получить текущий user id из сессии
- `getSessionInfo(): Promise<SessionInfo>` - Получить информацию о сессии (isAuthenticated, userId)

#### Свойства

- `name: string` - Имя стратегии
- `supabase: SupabaseClient` - Экземпляр Supabase клиента
- `token?: string` - Текущий access токен
- `isAuthenticated: boolean` - Статус аутентификации

## Работа с токенами

Токены хранятся в памяти внутри экземпляра стратегии (`token` свойство), а также в сессии Supabase. Стратегия использует Supabase SDK для управления сессией и токенами.

## Лицензия

ISC

