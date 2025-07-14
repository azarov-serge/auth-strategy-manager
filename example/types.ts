export type Id = number;

export type AuthItem = {
  id: Id;
  createdAt: Date;
  userId: Id;
  refreshMs: number;
  accessMs: number;
};

export type User = {
  id: Id;
  createdAt: Date;
  login: string;
  password: string;
};
