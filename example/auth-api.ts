import { ResponseError } from '../src';
import { UserModel } from './models/user-model';
import { userApi } from './user-api';
import { AuthItem, User } from './types';
import { Api } from './api';

const DEFAULT_REFRESH_MS = 1_000 * 60 * 5; // 5 minutes
const DEFAULT_ACCESS_MS = 1_000 * 60 * 1; // 1 minute

export class AuthApi extends Api {
  private readonly userApi = userApi;
  private readonly salt = '1234567890';

  public checkAuth = async (): Promise<boolean> => {
    const db = await this.getDb();
    await this.delay(500);
    const [authItem] = await db
      .from('auth')
      .select<AuthItem>({ key: 'authUserId', value: this.userId });

    if (!authItem) {
      throw new ResponseError({
        status: 401,
        message: 'Token is expired',
      });
    }

    const isExpired = Number(authItem.createdAt) + Number(authItem.accessMs) < Number(new Date());

    if (isExpired) {
      throw new ResponseError({
        status: 401,
        message: 'Token is expired',
      });
    }

    await this.refreshToken();

    return true;
  };

  public signIn = async (data: {
    login: string;
    password: string;
  }): Promise<Omit<User, 'password'>> => {
    const db = await this.getDb();
    await this.delay(500);
    const { login, password } = data;
    const [user] = await db.from('users').select<User>({ key: 'usersLogin', value: login });

    if (!user) {
      throw new ResponseError({
        status: 401,
        message: 'User not found',
      });
    }

    if (user.password !== this.createPasswordHash(password)) {
      throw new ResponseError({
        status: 401,
        message: 'Invalid password',
      });
    }

    await db.from('auth').insert({
      createdAt: new Date(),
      userId: user.id,
      refreshMs: DEFAULT_REFRESH_MS,
      accessMs: DEFAULT_ACCESS_MS,
    });

    const result = { ...user };

    delete (result as Record<string, unknown>).password;

    return result;
  };

  public signUp = async (data: {
    login: string;
    password: string;
  }): Promise<Omit<User, 'password'>> => {
    const db = await this.getDb();
    await this.delay(500);
    const { login, password } = data;

    let user = new UserModel({ login, password: this.createPasswordHash(password) });

    user.validator.validate();

    const users = await db.from('users').select<User>({ key: 'usersLogin', value: login });

    if (users.length > 0) {
      throw new Error('User already exists');
    }

    const newUser = await this.userApi.create(user.toJson());

    if (!newUser) {
      throw new ResponseError({ status: 500, message: 'Failed to create user' });
    }

    user = user.cloneWith(newUser);

    await db.from('auth').insert({
      createdAt: new Date(),
      userId: user.id,
      refreshMs: DEFAULT_REFRESH_MS,
      accessMs: DEFAULT_ACCESS_MS,
    });

    const result = user.toJson();

    delete (result as Record<string, unknown>).password;

    return result;
  };

  public signOut = async (): Promise<boolean> => {
    const db = await this.getDb();
    await this.delay(500);
    await db.from('auth').delete({ key: 'authUserId', value: this.userId });

    return true;
  };

  public refreshToken = async (): Promise<void> => {
    const db = await this.getDb();
    await this.delay(100);
    const [authItem] = await db
      .from('auth')
      .select<AuthItem>({ key: 'authUserId', value: this.userId });

    if (!authItem) {
      throw new ResponseError({
        status: 401,
        message: 'Token is expired',
      });
    }

    await db.from('auth').update({ ...authItem, createdAt: new Date() });
  };

  private createPasswordHash = (password: string): string => {
    return password.split('').reverse().join('') + this.salt;
  };
}

export const authApi = new AuthApi();
