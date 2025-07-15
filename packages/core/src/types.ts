export type AuthStrategyManagerStrategies = Record<string, Strategy>;

export type Strategy = {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  signInUrl?: string;
  check: () => Promise<boolean>;
  signIn: <T = unknown, D = undefined>(config?: D) => Promise<T>;
  signUp: <T = unknown, D = undefined>(config?: D) => Promise<T>;
  signOut: () => Promise<void>;
  refreshToken: <T>(args?: T) => Promise<void>;
};

export type AuthStrategyManagerInterface = {
  strategiesCount: number;
  strategy: Strategy;
  startUrl: string | undefined;

  check: () => Promise<boolean>;
  setStrategies: (strategies: Strategy[]) => Promise<void>;
  use: (strategyName: string) => void;
  clear: () => void;
};
