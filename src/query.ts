import { Task, TaskList } from "./taskify";

// #region Types
/** A fuzzy (contains) match operation on a string field. */
interface LikeOp<T> {
	type: "like";
	field: keyof T;
	values: string[];
}

/** An exact match operation on any field. */
interface FilterOp<T> {
	type: "filter";
	field: keyof T;
	values: T[keyof T][];
}

/** A sort operation on any field. */
interface OrderOp<T> {
	type: "order";
	field: keyof T;
	direction: "ASC" | "DESC";
}

/** An offset operation to skip N items. */
interface OffsetOp {
	type: "offset";
	num: number;
}

/** A limit operation to restrict to N items. */
interface LimitOp {
	type: "limit";
	num: number;
}

/** All operation types collected in the pipeline. */
type Op<T> = LikeOp<T> | FilterOp<T> | OrderOp<T> | OffsetOp | LimitOp;
// #endregion

// #region Query
/**
 * A lazy query builder for filtering, sorting, and transforming collections.
 * Conditions are collected during chaining and only executed once
 * when {@link all} or {@link first} is called.
 * @param <T> - The type of items in the collection.
 */
export class Query<T> {
	private readonly source: T[];
	private ops: Op<T>[] = [];

	constructor(data: T[]) {
		this.source = [...data];
	}

	/**
	 * Combines multiple filter conditions with OR logic.
	 * First executes the current operations, then executes each branch
	 * from the original source, merges all results, and resets operations.
	 * @param callbacks - One or more callback functions, each collecting a branch's conditions.
	 * @returns The query instance for chaining.
	 */
	public or(...callbacks: ((q: this) => this)[]): this {
		if (!callbacks.length) return this;

		const merged = [...this.execute()];

		for (const cb of callbacks) {
			const sibling = new (this.constructor as new (items: T[]) => this)(this.source);
			cb(sibling);
			merged.push(...sibling.execute());
		}

		this.source.splice(0, this.source.length, ...merged);
		this.ops = [];
		return this;
	}

	/**
	 * Executes all collected operations against the source data.
	 * @returns An array of items after all operations have been applied.
	 */
	public execute(): T[] {
		let data = [...this.source];
		for (const op of this.ops) {
			switch (op.type) {
				case "like":
					data = data.filter(item => {
						const val = item[op.field];
						return typeof val === "string" && op.values.some(v => val.includes(v));
					});
					break;
				case "filter":
					data = data.filter(item => op.values.includes(item[op.field]));
					break;
				case "order": {
					const dir = op.direction === "DESC" ? -1 : 1;
					data.sort((a, b) => {
						const av = a[op.field] as string | number | boolean | null | undefined;
						const bv = b[op.field] as string | number | boolean | null | undefined;
						if (av === bv) return 0;
						if (av === undefined || av === null) return 1;
						if (bv === undefined || bv === null) return -1;
						return av < bv ? -1 * dir : 1 * dir;
					});
					break;
				}
				case "offset":
					data = data.slice(op.num);
					break;
				case "limit":
					data = data.slice(0, op.num);
					break;
			}
		}
		return data;
	}

	/**
	 * Collects a fuzzy (contains) match condition on a string field.
	 * @param field - The field name to match against.
	 * @param values - One or more string values to search for within the field.
	 * @returns The query instance for chaining.
	 */
	public like<K extends keyof T>(field: K, ...values: string[]): this {
		if (!values.length) return this;
		this.ops.push({ type: "like", field, values } as LikeOp<T>);
		return this;
	}

	/**
	 * Collects an exact match condition on a field.
	 * @param field - The field name to match against.
	 * @param values - One or more values to match exactly.
	 * @returns The query instance for chaining.
	 */
	public filter<K extends keyof T>(field: K, ...values: T[K][]): this {
		if (!values.length) return this;
		this.ops.push({ type: "filter", field, values } as FilterOp<T>);
		return this;
	}

	/**
	 * Collects a sort condition on a field.
	 * @param field - The field name to sort by.
	 * @param direction - The sort direction, either "ASC" (ascending) or "DESC" (descending). Defaults to "ASC".
	 * @returns The query instance for chaining.
	 */
	public order<K extends keyof T>(field: K, direction: "ASC" | "DESC" = "ASC"): this {
		this.ops.push({ type: "order", field, direction } as OrderOp<T>);
		return this;
	}

	/**
	 * Skips the first N items.
	 * @param num - The number of items to skip.
	 * @returns The query instance for chaining.
	 */
	public offset(num: number): this {
		this.ops.push({ type: "offset", num });
		return this;
	}

	/**
	 * Limits the number of items to return.
	 * @param num - The maximum number of items to return.
	 * @returns The query instance for chaining.
	 */
	public limit(num: number): this {
		this.ops.push({ type: "limit", num });
		return this;
	}

	/**
	 * Returns the first item in the collection, or null if the collection is empty.
	 * @returns The first item, or null.
	 */
	public first(): T | null {
		return this.execute()[0] ?? null;
	}

	/**
	 * Returns all items as an array.
	 * @returns An array containing all matching items.
	 */
	public all(): T[] {
		return this.execute();
	}
}
// #endregion

// #region TaskListQuery
/**
 * A specialized query builder for TaskList collections.
 * Provides additional methods for filtering by title.
 */
export class TaskListQuery extends Query<TaskList> {
	/**
	 * Filters task lists by performing an exact match on the title field.
	 * @param keys - One or more title values to match exactly.
	 * @returns The query instance for chaining.
	 */
	public title(...keys: string[]): this {
		return this.filter("title", ...keys);
	}

	/**
	 * Filters task lists by performing a fuzzy (contains) match on the title field.
	 * @param keys - One or more string values to search for within the title.
	 * @returns The query instance for chaining.
	 */
	public titleLike(...keys: string[]): this {
		return this.like("title", ...keys);
	}
}
// #endregion

// #region TaskQuery
/**
 * A specialized query builder for Task collections.
 * Provides additional methods for filtering by title, notes, and completion status.
 */
export class TaskQuery extends Query<Task> {
	/**
	 * Filters tasks by their completion status.
	 * @param isDone - Whether to filter for completed tasks. Defaults to true.
	 * @returns The query instance for chaining.
	 */
	public done(isDone: boolean = true): this {
		return this.filter("done", isDone);
	}

	/**
	 * Filters tasks by performing an exact match on the title field.
	 * @param keys - One or more title values to match exactly.
	 * @returns The query instance for chaining.
	 */
	public title(...keys: string[]): this {
		return this.filter("title", ...keys);
	}

	/**
	 * Filters tasks by performing a fuzzy (contains) match on the title field.
	 * @param keys - One or more string values to search for within the title.
	 * @returns The query instance for chaining.
	 */
	public titleLike(...keys: string[]): this {
		return this.like("title", ...keys);
	}

	/**
	 * Filters tasks by performing an exact match on the notes field.
	 * @param keys - One or more notes values to match exactly.
	 * @returns The query instance for chaining.
	 */
	public notes(...keys: string[]): this {
		return this.filter("notes", ...keys);
	}

	/**
	 * Filters tasks by performing a fuzzy (contains) match on the notes field.
	 * @param keys - One or more string values to search for within the notes.
	 * @returns The query instance for chaining.
	 */
	public notesLike(...keys: string[]): this {
		return this.like("notes", ...keys);
	}
}
// #endregion
