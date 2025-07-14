import { Api } from './api';
import { User } from './types';

export class UserApi extends Api {
  public getList = async (): Promise<User[]> => {
    const db = await this.getDb();

    return db.from('users').select();
  };

  public create = async (user: User): Promise<User> => {
    const db = await this.getDb();
    delete (user as Record<string, unknown>).id;
    const id = await db.from('users').insert<Omit<User, 'id'>>(user);

    return {
      ...user,
      password: '',
      id,
    };
  };

  public update = async (user: User): Promise<User> => {
    const db = await this.getDb();
    await db.from('users').update(user);
    return user;
  };

  public delete = async (id: number): Promise<boolean> => {
    const db = await this.getDb();
    await db.from('users').delete({ key: 'id', value: id });

    return true;
  };
}

export const userApi = new UserApi();
