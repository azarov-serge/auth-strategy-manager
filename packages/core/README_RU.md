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
import type { AuthManagerData, Strategy } from '@auth-strategy-manager/core';
import { AuthStrategyManager } from '@auth-strategy-manager/core';

class CustomStrategy implements Strategy {
  readonly name = 'custom';

  public checkAuth = async (): Promise<AuthManagerData> => {
    return {
      isAuthenticated: true,
      strategyName: this.name,
      accessToken: '',
      refreshToken: undefined,
    };
  };

  public signIn = async <T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T> => {
    return {} as T;
  };

  public signUp = async <T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T> => {
    return {} as T;
  };

  public signOut = async (): Promise<void> => {};

  public refreshToken = async <T>(_args?: T): Promise<AuthManagerData> => {
    return {
      isAuthenticated: false,
      strategyName: this.name,
      accessToken: '',
      refreshToken: undefined,
    };
  };
}

const authManager = new AuthStrategyManager([new CustomStrategy()]);
const state = await authManager.checkAuth();
await authManager.signOut();
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

- `checkAuth(): Promise<AuthManagerData>` - Проверяет статус аутентификации по всем стратегиям и возвращает нормализованное состояние. Стратегии, у которых у конструктора в рантайме имя `RestStrategy`, пропускают `checkAuth`, если и `accessToken`, и `refreshToken` в `AuthStorageManager` используют только `localStorage`/`sessionStorage` и оба пусты (лишний HTTP не уходит). Остальные стратегии всегда участвуют в проверке. Слоты с `HTTP_ONLY_COOKIE` или `RAM` не считаются «доказательством отсутствия сессии», чтобы cookie-only REST по-прежнему вызывал `checkAuth`. Сильная минификация имён классов может сломать проверку по имени `RestStrategy`.
- `signIn<T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T>` - Проксирует вызов `signIn` активной стратегии.
- `signUp<T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T>` - Проксирует вызов `signUp` активной стратегии.
- `signOut(): Promise<void>` - Проксирует вызов `signOut` активной стратегии.
- `refreshToken<T>(args?: T): Promise<AuthManagerData>` - Проксирует вызов `refreshToken` активной стратегии и возвращает нормализованное состояние.
- `setStrategies(strategies: Strategy[]): Promise<void>` - Заменяет все стратегии новыми
- `use(strategyName: string): void` - Устанавливает активную стратегию по имени (нужен только при нескольких стратегиях)
- `clear(): void` - Очищает состояние аутентификации и сбрасывает все стратегии

`AuthStrategyManager` реализует интерфейс `Strategy` и может использоваться как фасад над активной стратегией в коде приложения.

#### Имя стратегии, `refreshToken` и потеря sessionStorage

Если имя активной стратегии хранится в `sessionStorage`, а access-токен истёк, ключ с именем может пропасть раньше refresh-токена (cookie / другое хранилище). Тогда `refreshToken()` не знал, какую стратегию вызывать.

- **Одна стратегия в приложении:** менеджер выбирает её без сохранённого имени — refresh снова работает после правки логики резолва.
- **Несколько стратегий:** без сохранённого имени однозначно выбрать стратегию нельзя — храните имя в **долговечном** хранилище (`localStorage` или согласованный с бэкендом вариант).

По умолчанию для имени используется класс **`StrategyNameStorage`**: ключ `authStrategyName` в `localStorage` (раньше в примерах мог встречаться ключ `strategyName` — при обновлении пакета перенесите значение или выполните повторный вход).

### AuthStorageManager: значения по умолчанию

`new AuthStorageManager(config)` — поля в `config` необязательны (можно `new AuthStorageManager()` или `{}`). Если значение не передали, подставляется дефолт:

- **`strategyName`** — `config.strategyName ?? new StrategyNameStorage()` (ключ `authStrategyName`, `localStorage`). Нужен другой ключ — передайте свой `StrategyNameStorage` (или подкласс).
- **`accessToken`** — `config.accessToken ?? new AuthStorage('accessToken', 'HTTP_ONLY_COOKIE')`.
- **`refreshToken`** — `config.refreshToken ?? new AuthStorage('refreshToken', 'HTTP_ONLY_COOKIE')`.
- **`startUrl`** — `config.startUrl ?? new AuthStorage('startUrl', 'localStorage')`.
- **`isAuthenticated`** — `config.isAuthenticated ?? new AuthStorage('isAuthenticated', 'RAM')`.

Рекомендованная конфигурация заложена в дефолты; если не подходит — задайте свои экземпляры `AuthStorage` в `config`.

### Политика хранения токенов в AuthManager (Best Practice)

`AuthStrategyManager` — единая точка управления состоянием аутентификации, активной стратегией и политикой хранения токенов.

Политика по умолчанию ("security-first", рекомендуемая на сегодня):

- `accessToken`: `HTTP_ONLY_COOKIE`
- `refreshToken`: `HTTP_ONLY_COOKIE`

При необходимости это можно переопределить (`sessionStorage` / `localStorage`), но для критичных сценариев лучше задавать конфигурацию явно.

#### Рекомендуемые паттерны

1) `access: HTTPOnly cookie` + `refresh: HTTPOnly cookie` (по умолчанию)

- Частый вариант в security-first командах и BFF/server-session архитектурах.
- Плюсы: минимальная XSS-поверхность для токенов.
- Минусы: нужна аккуратная настройка CORS/CSRF и дисциплина на backend.

2) `access: sessionStorage` + `refresh: HTTPOnly cookie` (частый компромисс для SPA)

- Access токен доступен в JS для Bearer-сценариев.
- Refresh токен скрыт от JS.
- Хороший баланс UX и безопасности.

#### Пример 1: access + refresh в HTTPOnly cookie (по умолчанию)

`strategyName` и `isAuthenticated` можно не указывать — возьмутся дефолты менеджера.

```typescript
import { AuthStorage, AuthStorageManager } from '@auth-strategy-manager/core';

const storageManager = new AuthStorageManager({
  accessToken: new AuthStorage('accessToken', 'HTTP_ONLY_COOKIE'),
  refreshToken: new AuthStorage('refreshToken', 'HTTP_ONLY_COOKIE'),
});
```

#### Пример 2: access в sessionStorage + refresh в HTTPOnly cookie

```typescript
import { AuthStorage, AuthStorageManager } from '@auth-strategy-manager/core';

const storageManager = new AuthStorageManager({
  accessToken: new AuthStorage('accessToken', 'sessionStorage'),
  refreshToken: new AuthStorage('refreshToken', 'HTTP_ONLY_COOKIE'),
});
```

#### Пример 3: своё хранилище имени стратегии

```typescript
import { AuthStorage, AuthStorageManager } from '@auth-strategy-manager/core';

const storageManager = new AuthStorageManager({
  strategyName: new AuthStorage('myStrategyKey', 'sessionStorage'),
  accessToken: new AuthStorage('accessToken', 'sessionStorage'),
  refreshToken: new AuthStorage('refreshToken', 'HTTP_ONLY_COOKIE'),
});
```

#### Какие паттерны обычно не рекомендуются

3) `access: sessionStorage` + `refresh: sessionStorage`

- Иногда допустимо для внутренних low-risk приложений.
- Минус: оба токена доступны JS (выше XSS-риск).

4) `access: sessionStorage` + `refresh: localStorage`

- Редкий и спорный вариант.
- Выбирают ради переживания перезапуска браузера, но безопасность хуже из-за долгоживущего refresh в `localStorage`.

5) `access: localStorage` + `refresh: localStorage`

- Исторически популярный, но сейчас обычно считается anti-pattern для публичных приложений.
- Максимальная XSS-поверхность среди перечисленных схем.

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

## Лицензия

ISC 
