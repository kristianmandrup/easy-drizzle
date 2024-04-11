import { relations, sql } from "drizzle-orm";
import type {
	IndexBuilderOn,
	IndexColumn,
	SQLiteColumn,
	SQLiteTableWithColumns,
} from "drizzle-orm/sqlite-core";
import { index, integer, text } from "drizzle-orm/sqlite-core";

import { BaseSchemaBuilder } from "../base/schema";
import { type FieldOptions, Time } from "../types";

const defaults: Record<Time, unknown> = {
	[Time.Now]: sql`CURRENT_TIMESTAMP`,
};

type StrFieldOptions = FieldOptions & {
	mode?: "text" | "json";
	length?: number;
	enum?: readonly string[] | string[];
};

export type StrOpts = number | StrFieldOptions;

export type TimeOpts = {
	default?: Time;
	nullable?: boolean;
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Table = SQLiteTableWithColumns<any>;

export interface TableConfig {
	name: string;
	schema: string | undefined;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	columns: Record<string, SQLiteColumn<any, object>>;
	dialect: string;
}

export class SqliteSchemaBuilder extends BaseSchemaBuilder {
	primary() {
		return integer("id").primaryKey().notNull();
	}

	str(name: string, opts: StrOpts = {}) {
		const strOpts: StrOpts = typeof opts === "number" ? { length: opts } : opts;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const $opts: any = {
			mode: strOpts.mode,
			enum: strOpts.enum,
			length: strOpts.length,
		};
		const s = text(name, $opts);
		if (!strOpts.nullable) {
			s.notNull();
		}
		if (strOpts.unique) {
			s.unique();
		}

		return s;
	}

	relation(table: Table) {
		const field = integer(`${this.tableName}_id`);

		if (table.id) {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			field.references(() => table.id!, {
				onDelete: "cascade",
			});
		}
		return field;
	}

	timeDate(name: string, opts: TimeOpts = {}) {
		const ts = text(name);
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
			names.reduce((acc: Record<string, object>, name) => {
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
