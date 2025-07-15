import { CertError, NetworkError, Timeout3rdPartyError } from './errors';
import { CERT_ERROR_CODE, NETWORK_ERROR_CODE, TIMEOUT_3RD_PARTY_ERROR_CODE } from './constants';
import { strategyHelper, StrategyHelper } from './helpers';
import { EmptyStrategy } from './strategies';

import { AuthStrategyManagerStrategies, AuthStrategyManagerInterface, Strategy } from './types';

const emptyStrategy = new EmptyStrategy();
const protocol = window.location.protocol;
const [baseUrl] = window.location.href.replace(`${protocol}//`, '').split('/');

const startUrl = `${protocol}//${baseUrl}`;

export class AuthStrategyManager implements AuthStrategyManagerInterface {
  public strategiesCount: number;

  private strategies: AuthStrategyManagerStrategies;
  private readonly helper: StrategyHelper;

  constructor(strategies?: Strategy[]) {
    this.helper = strategyHelper;
    this.strategiesCount = strategies?.length ?? 0;
    this.strategies =
      strategies?.reduce<AuthStrategyManagerStrategies>((acc, strategy) => {
        acc[strategy.name] = strategy;

        return acc;
      }, {}) ?? {};
  }

  get strategy(): Strategy {
    if (!this.helper.activeStrategyName || !this.strategies) {
      return emptyStrategy;
    }

    return this.strategies[this.helper.activeStrategyName] ?? emptyStrategy;
  }

  get startUrl(): string | undefined {
    return this.helper.startUrl;
  }

  set startUrl(url: string) {
    this.helper.startUrl = url;
  }

  public checkAuth = async (): Promise<boolean> => {
    const strategyNames = Object.keys(this.strategies);
    const strategyName = strategyNames[0];

    if (strategyNames.length === 1) {
      return await this.strategies[strategyName].checkAuth();
    }

    const actives = await Promise.allSettled(
      strategyNames.map((strategyName) => this.strategies[strategyName].checkAuth())
    );

    let isAuthenticated = false;

    for (let index = 0; index < actives.length; index++) {
      const active = actives[index];

      if (active.status === 'fulfilled' && active.value === true) {
        this.helper.activeStrategyName = strategyNames[index];

        isAuthenticated = true;

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

    return isAuthenticated;
  };

  public setStrategies = async (strategies: Strategy[]): Promise<void> => {
    this.strategiesCount = strategies.length;
    this.strategies = strategies.reduce<AuthStrategyManagerStrategies>((acc, strategy) => {
      acc[strategy.name] = strategy;

      return acc;
    }, {});
  };

  public use = (strategyName: string): void => {
    this.helper.activeStrategyName = strategyName;
  };

  public clear = () => {
    this.strategy.clear?.();
    this.helper.activeStrategyName = emptyStrategy.name;
    this.startUrl = startUrl;
  };
}
