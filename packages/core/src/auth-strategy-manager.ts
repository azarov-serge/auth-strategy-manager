import { CertError, NetworkError, Timeout3rdPartyError } from './errors';
import { CERT_ERROR_CODE, NETWORK_ERROR_CODE, TIMEOUT_3RD_PARTY_ERROR_CODE } from './constants';
import { AuthStorage, AuthStorageManager, type StorageType } from './helpers';

import {
  AuthStrategyManagerStrategies,
  AuthStrategyManagerInterface,
  Strategy,
  AuthManagerData,
} from './types';

const protocol = window.location.protocol;
const [baseUrl] = window.location.href.replace(`${protocol}//`, '').split('/');

const startUrl = `${protocol}//${baseUrl}`;

export class AuthStrategyManager implements AuthStrategyManagerInterface {
  public strategiesCount: number;
  readonly storageManager: AuthStorageManager;

  private strategies: AuthStrategyManagerStrategies;

  constructor(strategies: Strategy[], storageManager?: AuthStorageManager) {
    this.storageManager =
      storageManager ??
      new AuthStorageManager({
        accessToken: new AuthStorage('accessToken', 'sessionStorage'),
        startUrl: new AuthStorage('startUrl'),
      });

    this.storageManager.startUrl?.setValue(startUrl);

    this.strategiesCount = strategies?.length ?? 0;
    this.strategies =
      strategies?.reduce<AuthStrategyManagerStrategies>((acc, strategy) => {
        acc[strategy.name] = strategy;

        return acc;
      }, {}) ?? {};

    if (this.strategiesCount === 1) {
      this.storageManager.strategyName.setValue(Object.keys(this.strategies)[0]);
    }
  }

  get strategyName(): string {
    return this.storageManager.strategyName.getValue() ?? '';
  }

  get token(): string | undefined {
    return this.storageManager.accessToken?.getValue() ?? undefined;
  }

  get isAuthenticated(): boolean | undefined {
    return this.storageManager.isAuthenticated.getValue() === 'true';
  }

  get strategy(): Strategy {
    const strategy = this.resolveActiveStrategy();

    if (!strategy) {
      throw new Error(
        'No active auth strategy found. Please add at least one strategy to handle authentication.'
      );
    }

    return strategy;
  }

  get startUrl(): string | undefined {
    return this.storageManager.startUrl?.getValue() ?? undefined;
  }

  set startUrl(url: string) {
    this.storageManager.startUrl?.setValue(url);
  }

  public getRefreshToken = (): string | undefined => {
    return this.storageManager.refreshToken?.getValue() ?? undefined;
  };

  public setRefreshToken = (token: string): void => {
    this.storageManager.refreshToken?.setValue(token);
  };

  public checkAuth = async (): Promise<AuthManagerData> => {
    const strategyNames = Object.keys(this.strategies);
    const strategyName = strategyNames[0];

    const authManagerData: AuthManagerData = {
      isAuthenticated: false,
      strategyName: '',
      accessToken: '',
      refreshToken: undefined,
    };

    if (strategyNames.length === 1) {
      const only = this.strategies[strategyName];
      if (!this.shouldInvokeCheckAuth(only)) {
        this.syncStorage(authManagerData);
        return authManagerData;
      }

      const data = await only.checkAuth();
      this.applyAuthData(authManagerData, data);

      this.syncStorage(authManagerData);

      return authManagerData;
    }

    const namesToProbe = strategyNames.filter((name) =>
      this.shouldInvokeCheckAuth(this.strategies[name])
    );

    if (namesToProbe.length === 0) {
      this.syncStorage(authManagerData);
      return authManagerData;
    }

    const actives = await Promise.allSettled(
      namesToProbe.map((name) => this.strategies[name].checkAuth())
    );

    for (let index = 0; index < actives.length; index++) {
      const active = actives[index];

      if (active.status === 'fulfilled' && active.value.isAuthenticated) {
        this.applyAuthData(authManagerData, active.value);

        break;
      }

      if (
        active.status === 'rejected' &&
        (active.reason?.code ?? active?.reason?.message) === NETWORK_ERROR_CODE
      ) {
        throw new NetworkError(active?.reason?.message);
      }

      if (
        active.status === 'rejected' &&
        (active.reason?.code ?? active?.reason?.message) === TIMEOUT_3RD_PARTY_ERROR_CODE
      ) {
        throw new Timeout3rdPartyError(active?.reason?.message);
      }

      if (active.status === 'rejected' && active.reason?.code === CERT_ERROR_CODE) {
        throw new CertError();
      }
    }

    this.syncStorage(authManagerData);
    return authManagerData;
  };

  public signIn = async <T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T> => {
    const authManagerData: AuthManagerData = {
      isAuthenticated: false,
      strategyName: '',
      accessToken: '',
      refreshToken: undefined,
    };

    const data = await this.strategy.signIn<T & AuthManagerData, D>(config);
    this.applyAuthData(authManagerData, data);
    this.syncStorage(authManagerData);

    return { ...data, ...authManagerData };
  };

  public signUp = async <T = unknown & AuthManagerData, D = undefined>(config?: D): Promise<T> => {
    const authManagerData: AuthManagerData = {
      isAuthenticated: false,
      strategyName: '',
      accessToken: '',
      refreshToken: undefined,
    };

    const data = await this.strategy.signUp<T & AuthManagerData, D>(config);
    this.applyAuthData(authManagerData, data);
    this.syncStorage(authManagerData);

    return { ...data, ...authManagerData };
  };

  public signOut = async (): Promise<void> => {
    await this.strategy.signOut();
    this.storageManager.clear();
  };

  public refreshToken = async <T>(args?: T): Promise<AuthManagerData> => {
    const authManagerData: AuthManagerData = {
      isAuthenticated: false,
      strategyName: '',
      accessToken: '',
      refreshToken: undefined,
    };

    const strategy = this.resolveActiveStrategy();

    if (!strategy) {
      return authManagerData;
    }

    const refreshed = await strategy.refreshToken(args);
    this.applyAuthData(authManagerData, refreshed);

    this.syncStorage(authManagerData);

    return authManagerData;
  };

  public setStrategies = async (strategies: Strategy[]): Promise<void> => {
    this.strategiesCount = strategies.length;
    this.strategies = strategies.reduce<AuthStrategyManagerStrategies>((acc, strategy) => {
      acc[strategy.name] = strategy;

      return acc;
    }, {});

    if (this.strategiesCount === 1) {
      this.storageManager.strategyName.setValue(Object.keys(this.strategies)[0]);
    }
  };

  public use = (strategyName: string): void => {
    this.storageManager.strategyName.setValue(strategyName);
  };

  public clear = () => {
    this.strategy.clear?.();
    this.storageManager.clear();
  };

  /** Same resolution as `strategy` getter: with a single strategy, no persisted name is required (e.g. after losing sessionStorage). */
  private shouldInvokeCheckAuth(strategy: Strategy): boolean {
    if (strategy.constructor?.name !== 'RestStrategy') {
      return true;
    }
    return !this.hasNoClientPersistedRefreshToken();
  }

  /**
   * True when refresh is only in localStorage/sessionStorage and is empty.
   * Access token is ignored: it may live in sessionStorage and disappear when the tab closes while refresh
   * remains in localStorage and can restore the session via `checkAuth` / refresh.
   * False if refresh uses HTTP_ONLY_COOKIE or RAM — session may still exist without a readable refresh.
   */
  private hasNoClientPersistedRefreshToken(): boolean {
    const { refreshToken } = this.storageManager;

    if (!refreshToken) {
      return false;
    }

    if (!this.isClientPersistedStorage(refreshToken.type)) {
      return false;
    }

    return !this.getTrimmedStorageValue(refreshToken);
  }

  private isClientPersistedStorage(type: StorageType): boolean {
    return type === 'localStorage' || type === 'sessionStorage';
  }

  private getTrimmedStorageValue(storage: AuthStorage): string | null {
    const raw = storage.getValue();
    if (raw == null) {
      return null;
    }
    const trimmed = raw.trim();
    return trimmed === '' ? null : trimmed;
  }

  private resolveActiveStrategy(): Strategy | undefined {
    const names = Object.keys(this.strategies);

    if (names.length === 1) {
      return this.strategies[names[0]];
    }

    const name = this.strategyName;
    return name ? this.strategies[name] : undefined;
  }

  private syncStorage = (authManagerData: AuthManagerData): void => {
    if (!authManagerData.strategyName) {
      this.storageManager.strategyName.removeValue();
      this.storageManager.accessToken.removeValue();
      this.storageManager.refreshToken?.removeValue();
      this.storageManager.isAuthenticated.setValue('false');
      return;
    }

    this.storageManager.strategyName.setValue(authManagerData.strategyName);

    if (authManagerData.accessToken) {
      this.storageManager.accessToken.setValue(authManagerData.accessToken);
    } else {
      this.storageManager.accessToken.removeValue();
    }

    if (authManagerData.refreshToken) {
      this.storageManager.refreshToken?.setValue(authManagerData.refreshToken);
    } else {
      this.storageManager.refreshToken?.removeValue();
    }

    if (authManagerData.isAuthenticated) {
      this.storageManager.isAuthenticated.setValue('true');
      return;
    }

    this.storageManager.isAuthenticated.setValue('false');
  };

  private applyAuthData = (target: AuthManagerData, source: AuthManagerData): void => {
    target.isAuthenticated = source.isAuthenticated;
    target.strategyName = source.strategyName;
    target.accessToken = source.accessToken;
    target.refreshToken = source.refreshToken;
  };
}
