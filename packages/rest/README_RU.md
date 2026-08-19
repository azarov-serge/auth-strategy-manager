# @auth-strategy-manager/rest

Стратегия REST API для [auth-strategy-manager](https://github.com/azarov-serge/auth-strategy-manager). **v2** рассчитана на `@auth-strategy-manager/core` **^2.0.0**.

## Документация на других языках

- [English (Английский)](README.md)
- Русский (этот файл)

## Установка

```bash
npm install @auth-strategy-manager/rest @auth-strategy-manager/core
```

Используйте **core 2.x** вместе с **rest 2.x**.

## Использование

`RestStrategy` выполняет HTTP-запросы и собирает `AuthManagerData` из ответов через `getToken`. **Сохранение** токенов и имени стратегии делает `AuthStrategyManager` + `AuthStorageManager` из `@auth-strategy-manager/core` — не этот класс.

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { RestStrategy } from '@auth-strategy-manager/rest';
import type { RequestConfig, RestResponse } from '@auth-strategy-manager/rest';

const restStrategy = new RestStrategy({
  name: 'my-rest',
  signInUrl: '/login',
  getToken: (response, options) => {
    const data = (response as RestResponse).data as { access?: string; refresh?: string } | undefined;
    if (options?.type === 'refresh') return data?.refresh ?? '';
    return data?.access ?? '';
  },
  checkAuth: { url: '/auth/me', method: 'GET' },
  signIn: { url: '/auth/login', method: 'POST' },
  signUp: { url: '/auth/register', method: 'POST' },
  refresh: { url: '/auth/refresh', method: 'POST' },
  // без signOut → RestStrategy.signOut() не ходит в сеть; хранилище чистит AuthStrategyManager
});

const authManager = new AuthStrategyManager([restStrategy]);

await restStrategy.signIn<unknown, RequestConfig>({
  data: { email: 'user@example.com', password: 'secret' },
});

const state = await authManager.checkAuth();
await authManager.signOut();
```

С серверным **выходом**:

```typescript
const restStrategy = new RestStrategy({
  // ...как выше
  signOut: { url: '/auth/logout', method: 'POST' },
});
```

## Конфигурация

### `RestConfig` (`Config`)

В пакете тип экспортируется как `RestConfig`.

```typescript
import type { RequestConfig } from '@auth-strategy-manager/rest';

type UrlName = 'checkAuth' | 'signIn' | 'signUp' | 'signOut' | 'refresh';

type UrlConfig = {
  url: string;
  method?: RequestConfig['method'];
};

type RestConfig = Partial<Record<UrlName, UrlConfig>> & {
  name?: string;
  /** URL страницы входа (для приложения) */
  signInUrl?: string;
  request?: (url: string, config?: RequestConfig) => Promise<unknown>;
  /** Достать access / refresh из ответа API */
  getToken?: (
    response: unknown,
    options?: { url?: string; type: 'access' | 'refresh' },
  ) => string;
  /**
   * Опционально: извлечение факта аутентификации (cookie-only / BFF).
   * Используйте, когда сессия живёт в HTTP-only cookie и ответы API намеренно не содержат токены.
   */
  getIsAuthenticated?: (response: unknown, options?: { url?: string }) => boolean;
};
```

Все **URL-поля опциональны** в типе — передавайте только то, что вызываете. Сами методы в рантайме **бросают ошибку**, если для операции нет нужного URL (например `signIn` без `signIn` в конфиге).

### Параметры

| Поле | Описание |
|------|----------|
| `checkAuth` | Запрос для `checkAuth()`. |
| `signIn` | Запрос для `signIn()`. |
| `signUp` | Запрос для `signUp()`. |
| `signOut` | **Опционально.** Если не задать (или пустой `url`), `signOut()` не идёт в сеть; очистка — через `AuthStrategyManager.signOut()`. |
| `refresh` | Запрос для `refreshToken()`. |
| `name` | Идентификатор стратегии (по умолчанию `'rest'`). |
| `signInUrl` | Опциональный URL экрана логина. |
| `request` | Опциональный адаптер запросов. Если не передан, используется встроенный `fetch`. |
| `getToken` | Опционально; без неё поля токенов в `AuthManagerData` останутся пустыми, если вы не дополняете ответ сами. |
| `getIsAuthenticated` | Опционально для cookie-only: вернуть `true` для “аутентифицированных” ответов даже без токенов. |

## API

### `RestStrategy`

#### Конструктор

```ts
constructor(config: RestConfig)
```

#### Методы

- `checkAuth(): Promise<AuthManagerData>` — нужен URL `checkAuth`. С `AuthStrategyManager` вызов может быть пропущен, если имя класса остаётся `RestStrategy`, а слот `refreshToken` только в `localStorage`/`sessionStorage` и пуст (access в этом правиле не смотрят) — см. `checkAuth` в core.
- `signIn<T, D>(config?: D): Promise<T>` — нужен `signIn`; в результат мержится `AuthManagerData`.
- `signUp<T, D>(config?: D): Promise<T>` — если URL `signUp` не задан в конфиге, возвращает неаутентифицированный placeholder `AuthManagerData` (no-op); иначе мержит ответ с `AuthManagerData`.
- `signOut(): Promise<void>` — вызывает URL `signOut`, если задан; иначе no-op.
- `refreshToken(): Promise<AuthManagerData>` — нужен `refresh` в конфиге; параллельные refresh схлопываются в один запрос.

#### Свойства

- `name: string`
- `request: RequestAdapter`
- `urls: Partial<Record<UrlName, UrlConfig>>`
- `getToken?` — как в конфиге
- `signInUrl?: string`
- `startUrl` — get/set строка (только в памяти на инстансе)

### Вид `AuthManagerData`

Совпадает с `@auth-strategy-manager/core` (возвращается из `checkAuth` / `refreshToken` и мержится в `signIn` / `signUp`):

```ts
type AuthManagerData = {
  isAuthenticated: boolean;
  strategyName: string;
  accessToken: string;
  refreshToken?: string;
};
```

## Хранение токенов

`RestStrategy` **не** пишет и **не** читает `localStorage` / `sessionStorage`. Настройте `AuthStorageManager` у `AuthStrategyManager` в **core** под вашу политику.

## Лицензия

ISC
