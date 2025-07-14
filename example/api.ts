import { IndexedDbClient } from '@azarov-serge/indexed-db-client';

import { db, StorageName, StorageIndexName } from './db';
import { Id } from './types';

export abstract class Api {
  private readonly db: IndexedDbClient<StorageName, StorageIndexName>;
  protected userId: Id = -1;

  constructor() {
    this.db = db;
  }

  public getDb = async () => {
    if (!this.db.isInited) {
      await this.db.init();
    }

    return this.db;
  };

  public delay = (ms: number) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
}
