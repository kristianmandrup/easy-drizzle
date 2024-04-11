export type CreateDbFn = (dbString: string) => any;
export type ClientOpts = {
  verbose?: boolean;
};

export type PaginationOpts = { limit?: number; offset?: number };
export type SortOrder = 'asc' | 'desc';
export type OrderOpts = {
  order?: SortOrder;
  limit?: number;
};
