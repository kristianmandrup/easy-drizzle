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
	type BoolOpts,
} from "../types";
import { isObject } from "../utils/helpers";

const timeDefaults: Record<Time, unknown> = {
	[Time.Now]: sql`CURRENT_TIMESTAMP`,
};

type StrFieldOptions = FieldOptions & {
	mode?: "text" | "json";
	length?: number;
	enum?: readonly string[] | string[];
};

type TextFieldOptions = FieldOptions & {
	mode?: "text" | "json";
	length?: number;
};

type JsonFieldOptions = FieldOptions & {
	mode?: "json";
	length?: number;
};

export type StrOpts = number | StrFieldOptions;
export type TextOpts = number | TextFieldOptions;
export type JsonOpts = number | JsonFieldOptions;

export type DateTimeOpts = {
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

	bool(name: string, opts?: BoolOpts) {
		const defaultVal = opts === undefined ? false : opts.default;
		return int(name, { mode: "boolean" }).notNull().default(defaultVal);
	}

	str(name: string, opts?: StrOpts) {
		const strOpts = this.createStrOpts(opts);
		const s = opts === undefined ? text(name) : text(name, strOpts);
		if (!strOpts.nullable) {
			s.notNull();
		}
		if (strOpts.unique) {
			s.unique();
		}

		return s;
	}

	text(name: string, opts?: TextOpts) {
		const defaults: TextFieldOptions = { length: -1, nullable: true };
		if (opts === undefined) {
			return this.str(name, defaults);
		}
		if (isObject(opts)) {
			const options = {
				...defaults,
				...(opts as object),
			};
			options.mode = "text";
			return this.str(name, options);
		}
		return this.str(name, opts);
	}

	json(name: string, opts?: JsonOpts) {
		const defaults: JsonOpts = {
			length: -1,
			nullable: true,
			mode: "json",
		};
		if (opts === undefined) {
			return this.text(name, defaults);
		}
		if (isObject(opts)) {
			const options = {
				...defaults,
				...(opts as object),
			};
			options.mode = "json";
			return this.str(name, options);
		}
		return this.str(name, opts);
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

	dateTime(name: string, opts: DateTimeOpts = {}) {
		const ts = text(name);
		if (!opts.nullable) {
			ts.notNull();
		}
		if (opts.default) {
			const td = timeDefaults[opts.default];
			ts.default(td);
		}
		return ts;
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

	oneToMany(parentTable: Table, childTable: Table, foreignKeyName: string) {
		relations(childTable, ({ one }) => ({
			user: one(parentTable, {
				fields: [childTable[foreignKeyName]],

				references: [parentTable.id],
			}),
		}));
	}

	protected createStrOpts(opts: StrOpts = {}) {
		const strOpts: StrOpts = typeof opts === "number" ? { length: opts } : opts;
		const length = strOpts.length === -1 ? undefined : strOpts.length || 255;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const $opts: any = {
			mode: strOpts.mode,
			enum: strOpts.enum,
			length,
		};
		return $opts;
	}
}
