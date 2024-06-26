// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type CreateDbFn = (dbString: string) => any;
export type ClientOpts = {
	verbose?: boolean;
};

export type PaginationOpts = { limit?: number; offset?: number };
export type SortOrder = "asc" | "desc";
export type OrderOpts = {
	order?: SortOrder;
	limit?: number;
};

export enum Time {
	Now = 0,
}

export type FieldOptions = {
	nullable?: boolean;
	unique?: boolean;
};

export type FieldKeyType = "int" | "str";
export type BoolOpts = { default: boolean };
export type TimeOpts = {
	default?: Time;
	nullable?: boolean;
};
export type TimeStampOpts = NullableOpts;
export type IntOpts = NullableOpts;
export type NullableOpts = {
	nullable?: boolean;
};
