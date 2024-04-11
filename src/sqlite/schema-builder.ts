import { relations, sql } from "drizzle-orm";
import type {
	IndexBuilderOn,
	IndexColumn,
	SQLiteColumn,
	SQLiteTableWithColumns,
} from "drizzle-orm/sqlite-core";
import { index, int, integer, text } from "drizzle-orm/sqlite-core";

import { BaseSchemaBuilder } from "../base/schema";
import {
	type FieldOptions,
	Time,
	type TimeStampOpts,
	type IntOpts,
	type FieldKeyType,
} from "../types";

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
	primary(type: FieldKeyType = "int") {
		const pr = type === "int" ? integer("id", { mode: "number" }) : text("id");
		pr.primaryKey({ autoIncrement: true }).notNull();
		return pr;
	}

	int(name: string, opts: IntOpts = {}) {
		const num = int(name, { mode: "number" });
		if (!opts.nullable) {
			num.notNull();
		}
		return num;
	}

	timestamp(name: string, opts: TimeStampOpts = {}) {
		const ts = int(name, { mode: "timestamp" });
		if (!opts.nullable) {
			ts.notNull();
		}
		return ts;
	}

	timestampMs(name: string, opts: TimeStampOpts = {}) {
		const ts = int(name, { mode: "timestamp_ms" });
		if (!opts.nullable) {
			ts.notNull();
		}
		return ts;
	}

	bool(name: string, opts: { default: boolean } = { default: false }) {
		return int(name, { mode: "boolean" }).notNull().default(opts.default);
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

	relation(table: Table, type: FieldKeyType = "int") {
		const name = `${this.tableName}_id`;
		const field =
			type === "int" ? integer(name, { mode: "number" }) : text(name);

		if (table.id) {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			field.references(() => table.id!, {
				onDelete: "cascade",
			});
		}
		return field;
	}

	dateTime(name: string, opts: TimeOpts = {}) {
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
