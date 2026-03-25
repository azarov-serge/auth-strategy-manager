export type StorageType = 'localStorage' | 'sessionStorage' | 'HTTP_ONLY_COOKIE' | 'RAM';

export class AuthStorage {
  private value: null | string = null;
  constructor(
    public key: string,
    readonly type: StorageType = 'localStorage'
  ) {}

  public getValue = (): string | null => {
    if (this.type === 'HTTP_ONLY_COOKIE') {
      return null;
    }

    if (this.type === 'RAM') {
      return this.value;
    }

    return this.getStorage().getItem(this.key);
  };

  public setValue = (value: string): void => {
    if (this.type === 'HTTP_ONLY_COOKIE') {
      return;
    }

    if (this.type === 'RAM') {
      this.value = value;
      return;
    }

    this.getStorage().setItem(this.key, value);
  };

  public removeValue = (): void => {
    if (this.type === 'HTTP_ONLY_COOKIE') {
      return;
    }

    if (this.type === 'RAM') {
      this.value = null;
      return;
    }

    this.getStorage().removeItem(this.key);
  };

  private getStorage = (): Storage => {
    return window[this.type];
  };
}

/** Default localStorage key for {@link StrategyNameStorage}. */
export const DEFAULT_STRATEGY_NAME_STORAGE_KEY = 'authStrategyName';

/**
 * Active strategy name in localStorage (default key {@link DEFAULT_STRATEGY_NAME_STORAGE_KEY}).
 * Prefer over sessionStorage: when access expires or the tab is reset, the strategy name survives
 * so refresh can target the right strategy (with multiple strategies the name must stay persisted).
 */
export class StrategyNameStorage extends AuthStorage {
  constructor(key: string = DEFAULT_STRATEGY_NAME_STORAGE_KEY) {
    super(key, 'localStorage');
  }
}

export type AuthStorageManagerConfig = {
  /** Defaults to {@link StrategyNameStorage} (`authStrategyName`, localStorage). */
  strategyName?: StrategyNameStorage;
  accessToken?: AuthStorage;
  refreshToken?: AuthStorage;
  startUrl?: AuthStorage;
  /** Defaults to `new AuthStorage('isAuthenticated', 'RAM')`. */
  isAuthenticated?: AuthStorage;
};

/**
 * Storage slots for {@link AuthStrategyManager}. Omitted fields get sensible defaults;
 * override `strategyName` with your own {@link StrategyNameStorage}, `isAuthenticated` with {@link AuthStorage}.
 */
export class AuthStorageManager {
  readonly strategyName: StrategyNameStorage;
  readonly accessToken: AuthStorage;
  readonly refreshToken?: AuthStorage;
  readonly startUrl?: AuthStorage;
  readonly isAuthenticated: AuthStorage;

  constructor(config: AuthStorageManagerConfig = {}) {
    this.strategyName = config.strategyName ?? new StrategyNameStorage();
    this.accessToken = config.accessToken ?? new AuthStorage('accessToken', 'HTTP_ONLY_COOKIE');
    this.refreshToken = config.refreshToken ?? new AuthStorage('refreshToken', 'HTTP_ONLY_COOKIE');
    this.startUrl = config.startUrl ?? new AuthStorage('startUrl', 'localStorage');
    this.isAuthenticated = config.isAuthenticated ?? new AuthStorage('isAuthenticated', 'RAM');
  }

  public clear = (): void => {
    this.strategyName.removeValue();
    this.accessToken.removeValue();
    this.refreshToken?.removeValue();
    this.startUrl?.removeValue();
    this.isAuthenticated.removeValue();
  };
}
