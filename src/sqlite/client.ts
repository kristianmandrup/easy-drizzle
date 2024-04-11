import { drizzle } from 'drizzle-orm/better-sqlite3';

import { envConfig } from '../env';
import { ClientOpts, CreateDbFn } from '../types';
import { makeDbString } from '../utils';

export const DEFAULT_DB_STRING = {};

export const createSqliteDbString = () =>
  makeDbString({
    dbType: 'sqlite',
    option: { database: envConfig.PG_DB_NAME },
  });

export function createSqliteClient(
  createDb: CreateDbFn,
  options: ClientOpts = {},
  dbString: string = createSqliteDbString()
) {
  options.verbose && console.log(`Create SqLite client: ${dbString}`);
  const connection = createDb(dbString);
  return drizzle(connection);
}

export type SqliteClient = ReturnType<typeof createSqliteClient>;
