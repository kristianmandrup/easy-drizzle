import { join } from 'path';

// import path from 'path';
// import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export type DbCommonOption = {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
};

export type PgOption = DbCommonOption & {
  schema?: string;
};

export type MysqlOption = DbCommonOption;

export type SqliteOption = {
  database: string;
  url?: string;
};

export type MakeDbString<TDbType extends 'pg' | 'mysql' | 'sqlite'> = {
  dbType: TDbType;
  option: TDbType extends 'pg' ? PgOption : TDbType extends 'mysql' ? MysqlOption : SqliteOption;
};

export function makeDbString<TDbType extends 'pg' | 'mysql' | 'sqlite'>({
  dbType,
  option
}: MakeDbString<TDbType>) {
  if (dbType === 'pg') {
    const { user, password, host, port, database, schema } = option as PgOption;
    const schemaString = schema ? `?schema=${schema}` : '';
    return `postgresql://${user}:${password}@${host}:${port}/${database}${schemaString}`;
  }

  if (dbType === 'mysql') {
    const { user, password, host, port, database } = option as MysqlOption;
    return `mysql://${user}:${password}@${host}:${port}/${database}`;
  }

  if (dbType === 'sqlite') {
    const { database, url } = option as SqliteOption;
    const databasePath = join(__dirname, '../../../databases/sqlite');

    if (url) return url;
    return `${databasePath}/${database}.db`;
  }

  throw new Error('Unknown db type');
}
