import { ErrorManagerModel } from './error-manager-model';
import { Id, User } from '../types';

const MIN_PASSWORD_LENGTH = 4;

type ValidateField = Extract<keyof User, 'login' | 'password'>;

class Validator {
  constructor(private user: User) {}

  errors = new ErrorManagerModel<ValidateField>();

  public validate = (): typeof this.errors => {
    if (!this.user.login) {
      this.errors.data.login = 'Login is required.';
    }

    if (!this.user.password || this.user.password.length < MIN_PASSWORD_LENGTH) {
      this.errors.data.password = `Password is required and must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
    }

    return this.errors;
  };

  public reset = (): void => {
    this.errors.clear();
  };

  public getError = (): string => {
    return Object.values(this.errors).join('');
  };
}

export class UserModel {
  id: Id = -1;
  createdAt: Date = new Date();
  login: string = '';
  password: string = '';

  validator = new Validator(this);

  constructor(user?: Partial<User>) {
    this.id = user?.id ?? this.id;
    this.createdAt = user?.createdAt ?? this.createdAt;
    this.login = user?.login ?? this.login;
    this.password = user?.password ?? this.password;
  }

  public cloneWith = (user?: Partial<User>): UserModel => {
    return new UserModel({ ...this, ...(user ?? {}) });
  };

  public toJson = (): User => {
    return {
      id: this.id,
      createdAt: this.createdAt,
      login: this.login,
      password: this.password,
    };
  };

  static fromJson = (user: Partial<User>): UserModel => {
    return new UserModel(user);
  };
}
