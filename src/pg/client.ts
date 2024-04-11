import { drizzle } from 'drizzle-orm/node-postgres';

import { envConfig } from '../env';
import { ClientOpts, CreateDbFn } from '../types';
import { makeDbString } from '../utils';

export const createPgDbString = () =>
  makeDbString({
    dbType: 'pg',
    option: {
      user: envConfig.PG_DB_USER,
      password: envConfig.PG_DB_PASSWORD,
      host: envConfig.PG_DB_HOST,
      port: envConfig.PG_DB_PORT,
      database: envConfig.PG_DB_NAME,
    },
  });

export function createPgClient(
  createDb: CreateDbFn,
  options: ClientOpts = {},
  dbString: string = createPgDbString()
) {
  options.verbose && console.log(`Create Postgres client: ${dbString}`);
  const connection = createDb(dbString);
  return drizzle(connection);
}

export type PgClient = ReturnType<typeof createPgClient>;
