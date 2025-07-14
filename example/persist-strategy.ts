import { AxiosRequestConfig } from 'axios';
import { ResponseError, Strategy } from '../src';

import { authApi } from './auth-api';

export class PersistStrategy implements Strategy {
  name = 'persist';
  token = '';
  isAuthenticated?: boolean;
  signInUrl: string;
  private readonly authApi = authApi;

  constructor({ signInUrl }: { signInUrl: string }) {
    this.signInUrl = signInUrl;
  }

  public check = async (): Promise<boolean> => {
    const isChecked = await this.authApi.checkAuth();

    this.isAuthenticated = isChecked;

    return isChecked;
  };

  public signIn = async <D, T>(config?: AxiosRequestConfig<D>): Promise<T> => {
    if (!config) {
      throw new ResponseError({ status: 422, message: 'Config is required' });
    }

    const { data } = config;

    const user = await this.authApi.signIn(data as { login: string; password: string });

    return user as unknown as T;
  };

  public signUp = async <D, T>(config?: AxiosRequestConfig<D>): Promise<T> => {
    if (!config) {
      throw new ResponseError({ status: 422, message: 'Config is required' });
    }

    const { data } = config;

    const user = await this.authApi.signUp(data as { login: string; password: string });

    return user as unknown as T;
  };

  public signOut = async (): Promise<void> => {
    await this.authApi.signOut();
  };

  public refreshToken = async (): Promise<void> => {
    await this.authApi.refreshToken();
  };
}
