# Easy Drizzle

A utility pack to make drizzle more convenient to use and configure:

- Table schema builder to build basic schemas consistently for each database driver
- Services to expose common table operations and use across multiple tables
- Client builders to create database clients for each database supported

This pack currently supports the following databases:

- Sqlite
- Postgres
- Mysql

## Installation

```bash
npm install easy-drizzle
```

See the [examples](./examples/) folder and the sample project at [poc-drizzle-sqlite-pg-mysql](https://github.com/kristianmandrup/poc-drizzle-sqlite-pg-mysql)

## Clients

Sqlite client

```ts
import Database from "better-sqlite3";
const createDb = (dbString: string) => new Database(dbString);
createSqliteClient(createDb, { verbose: true });
```

MySQL client

```ts
import mysql from "mysql2/promise";
const createDb = (dbString: string) => mysql.createPool(dbString);
createMysqlClient(createDb, { verbose: true });
```

Postgres client

```ts
import pg from "pg";
const createDb = (dbString: string) =>
  new pg.Pool({
    connectionString: dbString,
  });

createPostgresClient(createDb, { verbose: true });
```

## Building schemas

Sqlite sample using schema builer

```ts
import { relations } from "drizzle-orm";
import { sqliteTable } from "drizzle-orm/sqlite-core";

import { SQLiteSchemaBuilder, Time } from "easy-drizzle/sqlite";

const builder = new SQLiteSchemaBuilder("user");

export const usersTable = sqliteTable(
  "users",
  {
    id: builder.primary(),
    firstName: builder.str("first_name"),
    lastName: builder.str("last_name"),
    email: builder.str("email"),
    createdAt: builder.timeDate("created_at", { default: Time.Now }),
  },
  builder.indexFor("first_name", "last_name", "email")
);

export type User = typeof usersTable.$inferSelect;
export type CreateUser = typeof usersTable.$inferInsert;

export const usersRelations = relations(usersTable, ({ many }) => ({
  posts: many(postsTable),
}));

export const postsTable = sqliteTable(
  "posts",
  {
    id: builder.primary(),
    userId: builder.relation(usersTable),
    title: builder.str("title"),
    content: builder.str("content"),
    createdAt: builder.timeDate("created_at", { default: Time.Now }),
  },
  builder.indexFor("id", "user_id", "title", "content")
);

export type Post = typeof postsTable.$inferSelect;
export type CreatePost = typeof postsTable.$inferInsert;

export const postsRelations = builder.oneToMany(usersTable, postsTable);
```

## Services

Each service comes with the following methods:

Data query methods

```ts
  async getAll()
  async getOrdered(columns: any, opts: OrderOpts = {})
  async getPage(opts: PaginationOpts)
  async getById({ id }: { id: number })
  async whereMatching(column: any, match: any)
  async whereGreater(column: any, criteria: number)
  async whereLess(column: any, criteria: number)
  async whereGte(column: any, criteria: number)
  async whereLte(column: any, criteria: number)
```

Data mutation methods

```ts
  async insert({ values }: { values: SQLiteInsertValue<TTable> })
  async insertMany({ values }: { values: SQLiteInsertValue<TTable>[] })
  async updateById({ id, values }: { id: number; values: SQLiteUpdateSetSource<TTable> })
  async deleteById({ id }: { id: number })
  async deleteMany({ ids }: { ids: number[] })
  async deleteAll() {
```

Sample Sqlite service from [examples](./examples/) folder

```ts
import { desc, eq, gt, gte, inArray, lt, lte } from "drizzle-orm";
import type {
  SQLiteInsertValue,
  SQLiteUpdateSetSource,
} from "drizzle-orm/sqlite-core";

import { envConfig } from "easy-drizzle/env";
import type { OrderOpts, PaginationOpts } from "easy-drizzle/types";

import type { SqliteClient } from "easy-drizzle/sqlite";
import type { SqliteTable } from "./sqlite-schema";

export class SqliteService<TTable extends SqliteTable> {
  public dbClient: SqliteClient;
  public table: TTable;

  constructor({ dbClient, table }: { dbClient: SqliteClient; table: TTable }) {
    this.dbClient = dbClient;
    this.table = table;
  }

  private all() {
    return this.dbClient.select().from(this.table);
  }

  async getAll() {
    const records = await this.all();
    return records;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOrdered(columns: any, opts: OrderOpts = {}) {
    const ordered =
      opts.order !== "desc"
        ? this.all().orderBy(columns)
        : this.all().orderBy(desc(columns));
    if (opts.limit) ordered.limit(opts.limit);
    const records = await ordered;
    return records;
  }

  async getPage(opts: PaginationOpts) {
    const all = this.dbClient.select().from(this.table);
    if (opts.limit) {
      all.limit(opts.limit);
    }
    if (opts.offset) {
      all.offset(opts.offset);
    }
    const records = await all;
    return records;
  }

  async getById({ id }: { id: number }) {
    const records = await this.all().where(eq(this.table.id, id));
    return records;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async whereMatching(column: any, match: any) {
    const records = await this.all().where(eq(column, match));
    return records;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async whereGreater(column: any, criteria: number) {
    const records = await this.all().where(gt(column, criteria));
    return records;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async whereLess(column: any, criteria: number) {
    const records = await this.all().where(lt(column, criteria));
    return records;
  }

  async whereLte(column: any, criteria: number) {
    const records = await this.all().where(lte(column, criteria));
    return records;
  }

  async whereGte(column: any, criteria: number) {
    const records = await this.all().where(gte(column, criteria));
    return records;
  }

  async insert({ values }: { values: SQLiteInsertValue<TTable> }) {
    const records = await this.dbClient.insert(this.table).values(values);
    return records;
  }

  async insertMany({ values }: { values: SQLiteInsertValue<TTable>[] }) {
    const records = await this.dbClient.insert(this.table).values(values);
    return records;
  }

  async updateById({
    id,
    values,
  }: {
    id: number;
    values: SQLiteUpdateSetSource<TTable>;
  }) {
    const records = await this.dbClient
      .update(this.table)
      .set(values)
      .where(eq(this.table.id, id));
    return records;
  }

  async deleteById({ id }: { id: number }) {
    const records = await this.dbClient
      .delete(this.table)
      .where(eq(this.table.id, id));
    return records;
  }

  async deleteMany({ ids }: { ids: number[] }) {
    const records = await this.dbClient
      .delete(this.table)
      .where(inArray(this.table.id, ids));
    return records;
  }

  async deleteAll() {
    if (envConfig.STAGE !== "test" || envConfig.SQLITE_DB_NAME !== "test") {
      throw new Error("Delete all records is only allowed in test environment");
    }

    await this.dbClient.delete(this.table);
  }
}
```

Note that the service is required to reference the table type from the schema file.

The service methods return results as per the drizzle documentation for the particular DB.

An Sqlite service for the `Posts` table can be created simply by extending the generic `SqliteService` and passing a reference to the table, such as `sqlitePostsTable`

```ts
export class SqlitePostService extends SqliteService<typeof sqlitePostsTable> {
  constructor({ dbClient }: { dbClient: SqliteClient }) {
    super({
      dbClient,
      table: sqlitePostsTable,
    });
  }
}

export const sqlitePostService = new SqlitePostService({
  dbClient: sqliteClient,
});
```

Service usage example for `Users` table

````ts
// create 10 fake users
for (let i = 0; i < 10; i++) {
    const user = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email()
    }
    await sqliteUserService.insert(user)
}

const user = await sqlitePostService.getById(1)
console.log('User #1:', user)

// update last name of first record
await sqlitePostService.updateById(1, { lastName: 'unknown' })

// get the first 2 users
const user = await sqlitePostService.async getFirst(2)

// get the last 5 users
const user = await sqlitePostService.getLast(5)

// delete users
await sqlitePostService.deleteById(1)
await sqlitePostService.deleteAll()
```

## Contribution

![NPM](https://img.shields.io/npm/l/@gjuchault/typescript-library-starter)
![NPM](https://img.shields.io/npm/v/@gjuchault/typescript-library-starter)
![GitHub Workflow Status](https://github.com/gjuchault/typescript-library-starter/actions/workflows/typescript-library-starter.yml/badge.svg?branch=main)

Based on [typescript-library-starter](https://github.com/gjuchault/typescript-library-starter)

To enable deployment, you will need to:

1. Set up the `NPM_TOKEN` secret in GitHub Actions ([Settings > Secrets > Actions](https://github.com/gjuchault/typescript-library-starter/settings/secrets/actions))
2. Give `GITHUB_TOKEN` write permissions for GitHub releases ([Settings > Actions > General](https://github.com/gjuchault/typescript-library-starter/settings/actions) > Workflow permissions)

## Features

### Node.js, npm version

TypeScript Library Starter relies on [Volta](https://volta.sh/) to ensure the Node.js version is consistent across developers. It's also used in the GitHub workflow file.

### TypeScript

Leverages [esbuild](https://github.com/evanw/esbuild) for blazing-fast builds but keeps `tsc` to generate `.d.ts` files.
Generates a single ESM build.

Commands:

- `build`: runs type checking, then ESM and `d.ts` files in the `build/` directory
- `clean`: removes the `build/` directory
- `type:dts`: only generates `d.ts`
- `type:check`: only runs type checking
- `type:build`: only generates ESM

### Tests

TypeScript Library Starter uses [Node.js's native test runner](https://nodejs.org/api/test.html). Coverage is done using [c8](https://github.com/bcoe/c8) but will switch to Node.js's one once out.

Commands:

- `test`: runs test runner
- `test:watch`: runs test runner in watch mode
- `test:coverage`: runs test runner and generates coverage reports

### Format & lint

This template relies on [Biome](https://biomejs.dev/) to do both formatting & linting in no time.
It also uses [cspell](https://github.com/streetsidesoftware/cspell) to ensure correct spelling.

Commands:

- `format`: runs Prettier with automatic fixing
- `format:check`: runs Prettier without automatic fixing (used in CI)
- `lint`: runs Biome with automatic fixing
- `lint:check`: runs Biome without automatic fixing (used in CI)
- `spell:check`: runs spell checking

### Releasing

Under the hood, this library uses [semantic-release](https://github.com/semantic-release/semantic-release) and [Commitizen](https://github.com/commitizen/cz-cli).
The goal is to avoid manual release processes. Using `semantic-release` will automatically create a GitHub release (hence tags) as well as an npm release.
Based on your commit history, `semantic-release` will automatically create a patch, feature, or breaking release.

Commands:

- `cz`: interactive CLI that helps you generate a proper git commit message, using [Commitizen](https://github.com/commitizen/cz-cli)
- `semantic-release`: triggers a release (used in CI)
````
