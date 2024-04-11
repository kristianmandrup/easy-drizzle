import { relations, sql } from 'drizzle-orm';
import type {
  IndexBuilderOn,
  IndexColumn,
  SQLiteColumn,
  SQLiteTableWithColumns,
} from 'drizzle-orm/sqlite-core';
import { index, integer, text } from 'drizzle-orm/sqlite-core';

import { BaseSchemaBuilder } from '../base/schema';

export enum Time {
  Now,
}

const defaults: Record<Time, unknown> = {
  [Time.Now]: sql`CURRENT_TIMESTAMP`,
};

export interface TimeOpts {
  default?: Time;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Table = SQLiteTableWithColumns<any>;

export interface TableConfig {
  name: string;
  schema: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: Record<string, SQLiteColumn<any, object>>;
  dialect: string;
}

export class SQLiteSchemaBuilder extends BaseSchemaBuilder {
  primary() {
    return integer('id').primaryKey().notNull();
  }

  str(name: string) {
    return text(name);
  }

  relation(table: Table) {
    const field = integer(`${this.tableName}_id`);

    if (table.id) {
      field.references(() => table.id!, {
        onDelete: 'cascade',
      });
    }
    return field;
  }

  timeDate(name: string, opts: TimeOpts = {}) {
    const ts = text(name);

    if (opts.default) {
      const td = defaults[opts.default];
      ts.default(td);
    }
    return ts;
  }

  indexFor(...names: string[]) {
    return (table: Record<string, IndexColumn>) =>
      names.reduce((acc: Record<string, object>, name) => {
        const indexName = `${name}Idx`;
        const idx: IndexBuilderOn = index(`${this.tableName}_${name}_idx`);
        if (table[name]) {
          const column = table[name]!;
          idx.on(column);
        }
        acc[indexName] = idx;
        return acc;
      }, {});
  }

  oneToMany(parentTable: Table, childTable: Table) {
    relations(childTable, ({ one }) => ({
      user: one(parentTable, {
        fields: [childTable.userId],

        references: [parentTable.id],
      }),
    }));
  }
}
