export type AuthStrategyManagerStrategies = Record<string, Strategy>;

export type AuthManagerData = {
  isAuthenticated: boolean;
  strategyName: string;
  accessToken: string;
  refreshToken?: string;
};

export type Strategy = {
  name: string;
  token?: string;
  isAuthenticated?: boolean;
  startUrl?: string;
  signInUrl?: string;
  checkAuth: () => Promise<AuthManagerData>;
  signIn: <T = unknown & AuthManagerData, D = undefined>(config?: D) => Promise<T>;
  signUp: <T = unknown & AuthManagerData, D = undefined>(config?: D) => Promise<T>;
  signOut: () => Promise<void>;
  refreshToken: <T = unknown>(args?: T) => Promise<AuthManagerData>;
  clear?: () => void;
};

export type AuthStrategyManagerInterface = Omit<Strategy, 'name' | 'signInUrl'> & {
  strategiesCount: number;
  strategy: Strategy;
  setStrategies: (strategies: Strategy[]) => Promise<void>;
  use: (strategyName: string) => void;
};
