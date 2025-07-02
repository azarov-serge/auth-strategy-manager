import { CertError, NetworkError } from './errors';
import { CERT_ERROR_CODE, networkErrors } from './constants';
import { strategyHelper, StrategyHelper } from './helpers';
import { EmptyStrategy, KeycloakStrategy } from './strategies';

import { AuthorizerStrategy, AuthorizerStrategies } from './types';

const emptyStrategy = new EmptyStrategy();
const protocol = window.location.protocol;
const [baseUrl] = window.location.href.replace(`${protocol}//`, '').split('/');

const startUrl = `${protocol}//${baseUrl}`;

export class Authorizer extends StrategyHelper {
  public readonly strategiesCount: number;

  private readonly strategies: AuthorizerStrategies;
  private readonly helper: StrategyHelper;

  constructor(strategies: AuthorizerStrategy[]) {
    super();

    this.helper = strategyHelper;
    this.strategiesCount = strategies.length;
    this.strategies = strategies.reduce<AuthorizerStrategies>((acc, strategy) => {
      acc[strategy.name] = strategy;

      return acc;
    }, {});
  }

  get strategy(): AuthorizerStrategy {
    if (!this.activeStrategyName || !this.strategies) {
      return emptyStrategy;
    }

    return this.strategies[this.activeStrategyName] ?? emptyStrategy;
  }

  get isKeycloak(): boolean {
    return this.strategy instanceof KeycloakStrategy;
  }

  check = async (): Promise<boolean> => {
    const strategyNames = Object.keys(this.strategies);
    const strategyName = strategyNames[0];

    if (strategyNames.length === 1 && this.strategies[strategyName] instanceof KeycloakStrategy) {
      const isAuthenticated = await this.strategies[strategyName].check();

      await this.strategies[strategyName].signIn();

      return isAuthenticated;
    }

    const actives = await Promise.allSettled(
      strategyNames.map((strategyName) => this.strategies[strategyName].check())
    );

    let isAuthenticated = false;

    for (let index = 0; index < actives.length; index++) {
      const active = actives[index];

      if (active.status === 'fulfilled' && active.value === true) {
        this.activeStrategyName = strategyNames[index];

        isAuthenticated = true;

        break;
      }

      if (
        active.status === 'rejected' &&
        networkErrors.includes(active.reason?.code ?? active?.reason?.message)
      ) {
        throw new NetworkError(active?.reason?.message);
      }

      if (active.status === 'rejected' && active.reason?.code === CERT_ERROR_CODE) {
        throw new CertError();
      }
    }

    return isAuthenticated;
  };

  get startUrl(): string | undefined {
    return this.helper.startUrl;
  }

  set startUrl(url: string) {
    this.helper.startUrl = url;
  }

  use = (strategyName: string): void => {
    this.activeStrategyName = strategyName;
  };

  clear = () => {
    this.activeStrategyName = emptyStrategy.name;
    this.startUrl = startUrl;
  };
}
