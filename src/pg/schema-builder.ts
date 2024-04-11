import { relations, sql } from "drizzle-orm";
import type {
	IndexColumn,
	PgTableExtraConfig,
	PgTableWithColumns,
} from "drizzle-orm/pg-core";
import type { IndexBuilderOn, PgTimestampConfig } from "drizzle-orm/pg-core";
import {
	boolean,
	index,
	integer,
	serial,
	timestamp,
	varchar,
	text,
} from "drizzle-orm/pg-core";

import { BaseSchemaBuilder } from "../base/schema";
import {
	type FieldOptions,
	Time,
	type IntOpts,
	type TimeStampOpts,
	type BoolOpts,
} from "../types";

type StrFieldOptions = FieldOptions & {
	length: number;
};

export type StrOpts = number | StrFieldOptions;

export type DateTimeOpts = PgTimestampConfig & {
	default?: Time;
	nullable?: boolean;
};

const timeDefaults: Record<Time, unknown> = {
	[Time.Now]: sql`NOW()`,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Table = PgTableWithColumns<any>;

export class PgSchemaBuilder extends BaseSchemaBuilder {
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

	text(name: string) {
		return text(name);
	}

	int(name: string, opts: IntOpts = {}) {
		const num = integer(name);
		if (!opts.nullable) {
			num.notNull();
		}
		return num;
	}

	bool(name: string, opts: BoolOpts) {
		const defaultVal = opts === undefined ? false : opts.default;
		return boolean(name).notNull().default(defaultVal);
	}

	timestamp(name: string, opts: TimeStampOpts) {
		const options = this.createTimeOpts(opts, { withTimezone: false });
		return this.dateTime(name, options);
	}

	dateTime(name: string, opts: DateTimeOpts = {}) {
		const options = this.createTimeOpts(opts);
		const ts = timestamp(name, options);
		if (!opts.nullable) {
			ts.notNull();
		}
		if (opts.default) {
			const td = timeDefaults[opts.default];
			ts.default(td);
		}
		return ts;
	}

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

	oneToMany(parentTable: Table, childTable: Table, foreignKeyName: string) {
		relations(childTable, ({ one }) => ({
			user: one(parentTable, {
				fields: [childTable[foreignKeyName]],

				references: [parentTable.id],
			}),
		}));
	}

	protected createTimeOpts(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		opts: any,
		defaults: { precision?: number; withTimezone?: boolean } = {
			precision: 6,
			withTimezone: true,
		},
	) {
		const timeOpts = {
			precision: opts.precision,
			withTimezone: opts.withTimezone,
		};
		return {
			...defaults,
			...timeOpts,
		};
	}
}
