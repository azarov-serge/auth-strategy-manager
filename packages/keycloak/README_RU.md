# @auth-strategy-manager/keycloak

Стратегия Keycloak для [auth-strategy-manager](https://github.com/azarov-serge/auth-strategy-manager). **v2** рассчитана на `@auth-strategy-manager/core` **^2.0.0**.

## Документация на других языках

- [English (Английский)](README.md)
- Русский (этот файл)

## Установка

```bash
npm install @auth-strategy-manager/keycloak @auth-strategy-manager/core keycloak-js
```

## Использование

Состояние и токены в **core** держит `AuthStrategyManager` + `AuthStorageManager`. `KeycloakStrategy` вызывает Keycloak JS и отдаёт `AuthManagerData` из `checkAuth`, `signIn`, `refreshToken`.

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
  name: 'my-keycloak',
  only: false,
  init: {
    flow: 'standard',
    onLoad: 'check-sso',
  },
});

const authManager = new AuthStrategyManager([keycloakStrategy]);

// По желанию: база для redirect URI (login/logout в Keycloak)
keycloakStrategy.startUrl = authManager.startUrl ?? window.location.origin;

const state = await authManager.checkAuth();
await authManager.signIn();
await authManager.refreshToken(30);
await authManager.signOut();
```

### Перед тестом на проекте (чеклист)

- Ставьте **`@auth-strategy-manager/core@^2.0.0`** вместе с **`@auth-strategy-manager/keycloak@^2.0.0`** (peer dependency).
- Вызывайте **`authManager.checkAuth()` / `signIn()` / `refreshToken()` / `signOut()`**, чтобы `AuthStorageManager` синхронизировался с `AuthManagerData`. Только `keycloakStrategy.*` без менеджера — хранилище не обновится.
- **`keycloak.login()`** часто делает **полный редирект**; после возврата в приложение снова выполните **`authManager.checkAuth()`** (или свой bootstrap).
- Задайте **`keycloakStrategy.startUrl`** и при необходимости **`signInUrl`** в конфиге — URL должны совпадать с допустимыми redirect URI в клиенте Keycloak.
- При **нескольких стратегиях** вызовите **`authManager.use('my-keycloak')`** (как в поле `name`, по умолчанию `'keycloak'`).
- У **`KeycloakStrategy` нет `clear()`** — используйте **`authManager.clear()`**; пакет не дублирует токены в Storage.

## Изменения относительно v1

- **`checkAuth`** возвращает `Promise<AuthManagerData>`, а не `boolean`. Удобнее вызывать `authManager.checkAuth()`, чтобы синхронизировать хранилище.
- **`refreshToken`** возвращает `Promise<AuthManagerData>`, а не `void`.
- Имя стратегии и флаги сессии ведёт **core** (`AuthStrategyManager` / `AuthStorageManager`).
- **`startUrl`** только на инстансе стратегии (без зеркалирования в `localStorage` из этого пакета).
- Убрана настройка **`accessToken`** / зеркала в Storage — только **core** `AuthStorageManager`.
- **Peer dependency**: `@auth-strategy-manager/core` **^2.0.0** нужно установить явно.

## Конфигурация

### KeycloakConfig

```typescript
import type { KeycloakInitOptions } from 'keycloak-js';

type KeycloakConfig = {
  keycloak: {
    realm: string;
    url: string;
    clientId: string;
  };
  init?: KeycloakInitOptions;
  signInUrl?: string;
  name?: string;
  only?: boolean;
};
```

### Параметры

- `keycloak.*` — настройки клиента для `keycloak-js`.
- `init` — опции `keycloak.init` (по умолчанию `{ flow: 'standard', onLoad: 'check-sso' }`).
- `signInUrl` — редирект для входа/выхода, если `only === false`.
- `name` — имя стратегии (по умолчанию `'keycloak'`).
- `only` — при `true` у `logout` не передаётся `redirectUri`.

Хранение токенов в **этой** стратегии не настраивается: используйте `AuthStorageManager` у `AuthStrategyManager` из **core** (токены живут в памяти у Keycloak JS; `checkAuth` / `refreshToken` / `signIn` отдают их через `AuthManagerData` для синхронизации менеджером).

## API

### KeycloakStrategy

#### Конструктор

```typescript
constructor(config: KeycloakConfig)
```

#### Методы

- `checkAuth(): Promise<AuthManagerData>`
- `signIn<T, D>(config?: D): Promise<T>` — при отсутствии полного редиректа возвращает данные в форме `AuthManagerData`.
- `signUp<T, D>(config?: D): Promise<T>` — заглушка с неаутентифицированным `AuthManagerData`.
- `signOut(): Promise<void>` — `keycloak.logout`.
- `refreshToken<T>(sec?: T): Promise<AuthManagerData>` — `updateToken`; число в `sec` задаёт `minValiditySeconds` (по умолчанию **5**).

#### Свойства

- `name`, `keycloak`, `only`, `init`, `signInUrl`
- `token` (только чтение) / `isAuthenticated` — из клиента Keycloak JS
- `startUrl` — get/set в памяти

## Лицензия

ISC
