import { drizzle } from 'drizzle-orm/mysql2';

import { envConfig } from '../env';
import { ClientOpts, CreateDbFn } from '../types';
import { makeDbString } from '../utils';

export const createMysqlDbString = () =>
  makeDbString({
    dbType: 'mysql',
    option: {
      user: envConfig.MYSQL_DB_USER,
      password: envConfig.MYSQL_DB_PASSWORD,
      host: envConfig.MYSQL_DB_HOST,
      port: envConfig.MYSQL_DB_PORT,
      database: envConfig.MYSQL_DB_NAME,
    },
  });

export function createMysqlClient(
  createDb: CreateDbFn,
  options: ClientOpts = {},
  dbString: string = createMysqlDbString()
) {
  options.verbose && console.log(`Create MySql client: ${dbString}`);
  const connection = createDb(dbString);
  return drizzle(connection);
}

export type MysqlClient = ReturnType<typeof createMysqlClient>;
