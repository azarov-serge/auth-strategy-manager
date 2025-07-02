import { AxiosRequestConfig } from 'axios';
import { KeycloakStrategy, RestStrategy } from './strategies';

export type AuthorizerStrategy = Strategy | RestStrategy | KeycloakStrategy;
export type AuthorizerStrategies = Record<string, AuthorizerStrategy>;

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
  strategy: AuthorizerStrategy;
  isKeycloak: boolean;
  startUrl: string | undefined;

  check: () => Promise<boolean>;
  setStrategies: (strategies: AuthorizerStrategy[]) => Promise<void>;
  use: (strategyName: string) => void;
  clear: () => void;
};
