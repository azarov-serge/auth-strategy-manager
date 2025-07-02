import { AxiosRequestConfig } from 'axios';

export type AuthorizerStrategies = Record<string, Strategy>;

export type Strategy = {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  signInUrl?: string;
  check: () => Promise<boolean>;
  signIn: <D, T>(config?: AxiosRequestConfig<D>) => Promise<T>;
  signUp: <D, T>(config?: AxiosRequestConfig<D>) => Promise<T>;
  signOut: () => Promise<void>;
  refreshToken: <T>(args?: T) => Promise<void>;
};

export type AuthorizerInterface = {
  strategiesCount: number;
  strategy: Strategy;
  isKeycloak: boolean;
  startUrl: string | undefined;

  check: () => Promise<boolean>;
  setStrategies: (strategies: Strategy[]) => Promise<void>;
  use: (strategyName: string) => void;
  clear: () => void;
};
