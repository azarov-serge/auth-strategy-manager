import { StrategyHelper } from '../helpers';
import { Strategy } from '../types';

export class EmptyStrategy extends StrategyHelper implements Strategy {
  readonly name = 'empty';

  checkAuth = async (): Promise<boolean> => {
    return false;
  };

  signIn = async <T>(): Promise<T> => {
    return false as T;
  };

  signUp = async <T>(): Promise<T> => {
    return false as T;
  };

  signOut = async (): Promise<void> => {
    this.clearStorage();
  };

  refreshToken = async (): Promise<void> => {};

  getUserProfile = async <T>(): Promise<T> => {
    return undefined as T;
  };
}
