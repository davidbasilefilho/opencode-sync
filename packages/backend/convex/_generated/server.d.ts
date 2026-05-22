// Type stubs for Convex generated server module.
// Replaced at runtime by `npx convex dev`.

export declare const mutation: <Args extends Record<string, unknown>, Returns>(config: {
  args: Args;
  handler: (ctx: MutationCtx, args: Args) => Returns;
}) => MutationBuilder;

export declare const query: <Args extends Record<string, unknown>, Returns>(config: {
  args: Args;
  handler: (ctx: QueryCtx, args: Args) => Returns;
}) => QueryBuilder;

export declare const action: <Args extends Record<string, unknown>, Returns>(config: {
  args: Args;
  handler: (ctx: ActionCtx, args: Args) => Returns;
}) => ActionBuilder;

export declare const internalMutation: <Args extends Record<string, unknown>, Returns>(config: {
  args: Args;
  handler: (ctx: MutationCtx, args: Args) => Returns;
}) => MutationBuilder;

export declare const internalAction: <Args extends Record<string, unknown>, Returns>(config: {
  args: Args;
  handler: (ctx: ActionCtx, args: Args) => Returns;
}) => ActionBuilder;

export declare const httpAction: (
  handler: (ctx: ActionCtx, request: Request) => Response | Promise<Response>,
) => HttpActionBuilder;

interface MutationBuilder {
  _type: "mutation";
}
interface QueryBuilder {
  _type: "query";
}
interface ActionBuilder {
  _type: "action";
}
interface HttpActionBuilder {
  _type: "httpAction";
}

interface MutationCtx {
  db: Database;
  scheduler: Scheduler;
}

interface QueryCtx {
  db: Database;
}

interface ActionCtx {
  db: Database;
  scheduler: Scheduler;
  runMutation: (func: unknown, args: Record<string, unknown>) => Promise<unknown>;
  runQuery: (func: unknown, args: Record<string, unknown>) => Promise<unknown>;
  runAction: (func: unknown, args: Record<string, unknown>) => Promise<unknown>;
  storage: StorageStore;
}

interface Database {
  insert: (table: string, doc: Record<string, unknown>) => Promise<string>;
  get: (id: unknown) => Promise<Record<string, unknown> | null>;
  patch: (id: unknown, doc: Record<string, unknown>) => Promise<void>;
  delete: (id: unknown) => Promise<void>;
  query: (table: string) => TableQuery;
}

interface TableQuery {
  withIndex: (indexName: string, predicate?: (q: IndexQuery) => IndexQuery) => TableQuery;
  filter: (predicate: (q: FilterQuery) => FilterQuery) => TableQuery;
  order: (direction: "asc" | "desc") => TableQuery;
  collect: () => Promise<Array<Record<string, unknown>>>;
  first: () => Promise<Record<string, unknown> | null>;
  unique: () => Promise<Record<string, unknown> | null>;
}

interface IndexQuery {
  eq: (field: string, value: unknown) => IndexQuery;
}

interface FilterQuery {
  eq: (field: string, value: unknown) => FilterQuery;
  neq: (field: string, value: unknown) => FilterQuery;
  lt: (field: string, value: unknown) => FilterQuery;
  lte: (field: string, value: unknown) => FilterQuery;
  gt: (field: string, value: unknown) => FilterQuery;
  gte: (field: string, value: unknown) => FilterQuery;
  or: (...predicates: FilterQuery[]) => FilterQuery;
  and: (...predicates: FilterQuery[]) => FilterQuery;
  field: (field: string) => unknown;
}

interface StorageStore {
  store: (blob: Blob) => Promise<string>;
  get: (id: string) => Promise<Blob | null>;
  delete: (id: string) => Promise<void>;
  getUrl: (id: string) => Promise<string | null>;
}

interface Scheduler {
  runAfter: (delay: number, func: unknown, args: Record<string, unknown>) => Promise<void>;
}

interface QueryCtx {
  db: Database;
}

interface ActionCtx {
  db: Database;
  runMutation: (func: unknown, args: Record<string, unknown>) => Promise<unknown>;
  runQuery: (func: unknown, args: Record<string, unknown>) => Promise<unknown>;
  runAction: (func: unknown, args: Record<string, unknown>) => Promise<unknown>;
  storage: Storage;
}

interface Database {
  insert: (table: string, doc: Record<string, unknown>) => Promise<string>;
  get: (id: string) => Promise<Record<string, unknown> | null>;
  patch: (id: string, doc: Record<string, unknown>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  query: (table: string) => QueryBuilder;
}

interface QueryBuilder {
  withIndex: (indexName: string, predicate?: (q: IndexQuery) => IndexQuery) => QueryBuilder;
  filter: (predicate: (q: FilterQuery) => FilterQuery) => QueryBuilder;
  order: (direction: "asc" | "desc") => QueryBuilder;
  collect: () => Promise<Array<Record<string, unknown>>>;
  first: () => Promise<Record<string, unknown> | null>;
  unique: () => Promise<Record<string, unknown> | null>;
}

interface IndexQuery {
  eq: (field: string, value: unknown) => IndexQuery;
}

interface FilterQuery {
  eq: (field: string, value: unknown) => FilterQuery;
  neq: (field: string, value: unknown) => FilterQuery;
  lt: (field: string, value: unknown) => FilterQuery;
  lte: (field: string, value: unknown) => FilterQuery;
  gt: (field: string, value: unknown) => FilterQuery;
  gte: (field: string, value: unknown) => FilterQuery;
  or: (...predicates: FilterQuery[]) => FilterQuery;
  and: (...predicates: FilterQuery[]) => FilterQuery;
  field: (field: string) => unknown;
}

interface Storage {
  store: (blob: Blob) => Promise<string>;
  get: (id: string) => Promise<Blob | null>;
  delete: (id: string) => Promise<void>;
  getUrl: (id: string) => Promise<string | null>;
}
