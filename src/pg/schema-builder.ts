import { relations, sql } from "drizzle-orm";
import type {
	IndexColumn,
	PgTableExtraConfig,
	PgTableWithColumns,
} from "drizzle-orm/pg-core";
import type { IndexBuilderOn, PgTimestampConfig } from "drizzle-orm/pg-core";
import { index, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { BaseSchemaBuilder } from "../base/schema";
import { type FieldOptions, Time } from "../types";

type StrFieldOptions = FieldOptions & {
	length: number;
};

export type StrOpts = number | StrFieldOptions;

export type TimeOpts = PgTimestampConfig & {
	default?: Time;
	nullable?: boolean;
};

const defaults: Record<Time, unknown> = {
	[Time.Now]: sql`NOW()`,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Table = PgTableWithColumns<any>;

export class PgSchemaBuilder extends BaseSchemaBuilder {
	relation(table: Table) {
		const field = serial(`${this.tableName}_id`);
		if (table.id) {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			field.references(() => table.id!, {
				onDelete: "cascade",
			});
		}
		return field;
	}

	primary() {
		return serial("serial").primaryKey().notNull();
	}

	str(name: string, opts: StrOpts = 255) {
		const strOpts: StrOpts = typeof opts === "number" ? { length: opts } : opts;
		const s = varchar(name, strOpts);
		if (!strOpts.nullable) {
			s.notNull();
		}
		if (strOpts.unique) {
			s.unique();
		}
		return s;
	}

	timeDate(
		name: string,
		opts: TimeOpts = { precision: 6, withTimezone: true },
	) {
		const ts = timestamp(name, { precision: 6, withTimezone: true });
		if (!opts.nullable) {
			ts.notNull();
		}
		if (opts.default) {
			const td = defaults[opts.default];
			ts.default(td);
		}
		return ts;
	}

	indexFor(...names: string[]) {
		return (table: Record<string, IndexColumn>) =>
			names.reduce((acc: PgTableExtraConfig, name) => {
				const indexName = `${name}Idx`;
				const idx: IndexBuilderOn = index(`${this.tableName}_${name}_idx`);
				if (table[name]) {
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
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
