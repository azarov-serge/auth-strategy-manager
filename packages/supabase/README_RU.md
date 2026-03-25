# @auth-strategy-manager/supabase

Стратегия Supabase для [auth-strategy-manager](https://github.com/azarov-serge/auth-strategy-manager). **v2** рассчитана на `@auth-strategy-manager/core` **^2.0.0**.

## Документация на других языках

- [English (Английский)](README.md)
- Русский (этот файл)

## Установка

```bash
npm install @auth-strategy-manager/supabase @auth-strategy-manager/core @supabase/supabase-js
```

## Использование

Используйте `AuthStrategyManager` из **core** для персистентности (`AuthStorageManager`, имя стратегии, токены). `SupabaseStrategy` работает через клиент Supabase и возвращает `AuthManagerData` из `checkAuth`, `signIn`, `signUp` и `refreshToken`.

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { SupabaseStrategy } from '@auth-strategy-manager/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const supabaseStrategy = new SupabaseStrategy({
  supabase,
  name: 'supabase',
  signInUrl: 'https://myapp.com/login',
});

const authManager = new AuthStrategyManager([supabaseStrategy]);

const state = await authManager.checkAuth();
await authManager.signIn({ email: 'user@example.com', password: 'password123' });
await authManager.signUp({ email: 'user@example.com', password: 'password123', username: 'user' });
await authManager.refreshToken();
await authManager.signOut();
```

### Перед интеграцией (чеклист)

- Установите **`@auth-strategy-manager/core@^2.0.0`** вместе с **`@auth-strategy-manager/supabase@^2.0.0`** (peer dependency).
- Предпочитайте **`authManager.checkAuth()` / `signIn()` / `signUp()` / `refreshToken()` / `signOut()`**, чтобы `AuthStorageManager` оставался согласован с `AuthManagerData`. Вызовы только `supabaseStrategy.*` обходят персистентность менеджера.
- Имя активной стратегии и токены ведёт **core** `AuthStrategyManager` / `AuthStorageManager`.
- При **нескольких стратегиях** вызывайте **`authManager.use('supabase')`** (та же строка, что `name` в конфиге, по умолчанию `'supabase'`).

## Изменения (breaking) относительно v1

- **`checkAuth`** возвращает `Promise<AuthManagerData>`, а не `boolean`. Предпочтительно `authManager.checkAuth()` для синхронизации хранилища.
- **`refreshToken`** возвращает `Promise<AuthManagerData>`, а не `void`.
- **`signIn` / `signUp`** дополняют ответ полями **`AuthManagerData`** (данные Supabase плюс `isAuthenticated`, `strategyName`, `accessToken`, `refreshToken`).
- В этом пакете нет дублирования флагов активной стратегии — персистентность через **core**.
- **Peer dependency**: установите `@auth-strategy-manager/core` **^2.0.0** отдельно; прямой зависимости этого пакета на core больше нет.

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

- `supabase` — экземпляр клиента Supabase
- `name` — имя стратегии (по умолчанию: `'supabase'`)
- `signInUrl` — URL редиректа после выхода / кастомные сценарии

Персистентность токенов настраивается в **core** через `AuthStrategyManager` и `AuthStorageManager`, а не в этой стратегии.

## API

### SupabaseStrategy

#### Конструктор

```typescript
constructor(config: SupabaseConfig)
```

#### Методы

- `checkAuth(): Promise<AuthManagerData>`
- `signIn<T, D>(config?: D): Promise<T>` — ожидает `{ email, password }`; в возвращаемом объекте объединены `AuthResponse` и `AuthManagerData`
- `signUp<T, D>(config?: D): Promise<T>` — ожидает `{ email, password, username }`; то же объединение (сессия может отсутствовать до подтверждения email)
- `signOut(): Promise<void>`
- `refreshToken<T>(args?: T): Promise<AuthManagerData>`
- `clear(): void` — сбрасывает зеркало токена в памяти стратегии; для полной синхронизации с хранилищем предпочтительнее `authManager.clear()`
- `getCurrentUserId(): Promise<string | null>`
- `getSessionInfo(): Promise<SessionInfo>`

#### Свойства

- `name`, `supabase`, `signInUrl`
- `token` (только чтение) / `isAuthenticated` — отражают последнюю известную сессию после операций Supabase (могут устареть, если сессия Supabase меняется вне стратегии; вызовите `authManager.checkAuth()` / `supabaseStrategy.checkAuth()` для синхронизации)
- `startUrl` — get/set база редиректа в памяти (для согласования с менеджером)

## Лицензия

ISC
