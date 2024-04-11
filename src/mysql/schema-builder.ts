import { relations, sql } from "drizzle-orm";
import type {
	IndexBuilderOn,
	IndexColumn,
	MySqlDatetimeConfig,
	MySqlTableWithColumns,
	MySqlTimestampConfig,
} from "drizzle-orm/mysql-core";
import {
	boolean,
	datetime,
	index,
	int,
	text,
	timestamp,
} from "drizzle-orm/mysql-core";

import { BaseSchemaBuilder } from "../base/schema";
import {
	type FieldOptions,
	Time,
	type FieldKeyType,
	type IntOpts,
	type BoolOpts,
} from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Table = MySqlTableWithColumns<any>;

export type DateTimeOpts = MySqlDatetimeConfig &
	FieldOptions & {
		default?: Time;
		nullable?: boolean;
	};

export type TimeStampOpts = MySqlTimestampConfig &
	FieldOptions & {
		default?: Time;
		nullable?: boolean;
	};

const timeDefaults: Record<Time, unknown> = {
	[Time.Now]: sql`CURRENT_TIMESTAMP(6)`,
};

export class MySqlSchemaBuilder extends BaseSchemaBuilder {
	primary(type: FieldKeyType = "int") {
		const pr = type === "int" ? int("id").autoincrement() : text("id");
		pr.primaryKey().notNull();
		return pr;
	}

	str(name: string, opts: FieldOptions = {}) {
		const s = text(name);
		if (!opts.nullable) {
			s.notNull();
		}
		if (opts.unique) {
			s.unique();
		}
		return s;
	}

	text(name: string, opts: FieldOptions = {}) {
		return this.str(name, opts);
	}

	int(name: string, opts: IntOpts = {}) {
		const num = int(name);
		if (!opts.nullable) {
			num.notNull();
		}
		return num;
	}

	bool(name: string, opts: BoolOpts) {
		const defaultVal = opts === undefined ? false : opts.default;
		return boolean(name).notNull().default(defaultVal);
	}

	timestamp(name: string, opts: TimeStampOpts = { fsp: 6 }) {
		const ts = timestamp(name, opts);
		if (!opts.nullable) {
			ts.notNull();
		}
		if (opts.default) {
			const td = timeDefaults[opts.default];
			ts.default(td);
		}
		return ts;
	}

	dateTime(name: string, opts: DateTimeOpts = { fsp: 6 }) {
		const ts = datetime(name, opts);
		if (!opts.nullable) {
			ts.notNull();
		}
		if (opts.default) {
			const td = timeDefaults[opts.default];
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

	relation(table: Table) {
		const field = int(`${this.tableName}_id`);
		if (table.id) {
			field.references(() => table.id, {
				onDelete: "cascade",
			});
		}
		return field;
	}

	oneToMany(parentTable: Table, childTable: Table, foreignKeyName: string) {
		relations(childTable, ({ one }) => ({
			user: one(parentTable, {
				fields: [childTable[foreignKeyName]],

				references: [parentTable.id],
			}),
		}));
	}
}
