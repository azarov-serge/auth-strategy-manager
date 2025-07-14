const TYPE_KEY = 'authStrategyName';
const START_URL_KEY = 'startUrl';

const protocol = window.location.protocol;
const [baseUrl] = window.location.href.replace(`${protocol}//`, '').split('/');

const startUrl = `${protocol}//${baseUrl}`;

export class StrategyHelper {
  isAuthenticated = false;

  get activeStrategyName(): string {
    return localStorage.getItem(TYPE_KEY) ?? '';
  }

  set activeStrategyName(name: string) {
    if (!name) {
      localStorage.removeItem(TYPE_KEY);
    } else {
      localStorage.setItem(TYPE_KEY, name);
    }
  }

  get startUrl(): string | undefined {
    return localStorage.getItem(START_URL_KEY) ?? startUrl;
  }

  set startUrl(url: string | undefined) {
    if (url) {
      localStorage.setItem(START_URL_KEY, url);
    } else {
      localStorage.removeItem(START_URL_KEY);
    }
  }

  public clearStorage = (): void => {
    localStorage.removeItem(TYPE_KEY);
  };

  public reset = () => {
    this.clearStorage();
    this.isAuthenticated = false;
  };
}

export const strategyHelper = new StrategyHelper();
