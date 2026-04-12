import { Filter } from "@twisuki/neo-filter";
import type { Task, TaskList } from "./taskify.js";

// #region Predicate Helpers
/**
 * Creates a fuzzy (contains) match predicate for a given field.
 * Returns true if the field value contains any of the provided strings.
 */
function likePredicate<T>(
	field: keyof T,
	values: string[],
): (item: T) => boolean {
	return (item) => {
		const val = item[field];
		if (typeof val !== "string") return false;
		return values.some((v) => val.includes(v));
	};
}

/**
 * Creates an exact match predicate for a given field.
 * Returns true if the field value equals any of the provided values.
 */
function matchPredicate<T>(
	field: keyof T,
	values: T[keyof T][],
): (item: T) => boolean {
	return (item) => values.includes(item[field]);
}
// #endregion

// #region TaskListFilter
/**
 * A specialized filter for `TaskList` collections.
 *
 * Extends `neo-filter`'s `Filter` with domain-specific convenience methods
 * for title matching and the generic {@link like} / {@link match} operators.
 *
 * @example
 * ```ts
 * const results = new TaskListFilter(lists)
 *   .like("title", "work")
 *   .match("id", "abc123")
 *   .all()
 * ```
 */
export class TaskListFilter extends Filter<TaskList> {
	/**
	 * Adds a fuzzy (contains) match predicate on a string field.
	 *
	 * Multiple values are combined with **OR** logic — an item is retained
	 * if its field value contains **any** of the given strings.
	 *
	 * @param field - The string field name to match against.
	 * @param values - One or more string values. The item's field must
	 *                 **contain** (not necessarily equal) at least one.
	 * @returns The filter instance for chaining.
	 */
	public like<K extends keyof TaskList>(field: K, ...values: string[]): this {
		if (!values.length) return this;
		return this.filter(likePredicate(field, values) as (item: TaskList) => boolean);
	}

	/**
	 * Adds an exact match predicate on a field.
	 *
	 * Multiple values are combined with **OR** logic — an item is retained
	 * if its field value equals **any** of the given values.
	 *
	 * @param field - The field name to match against.
	 * @param values - One or more values. The item's field must **equal**
	 *                 at least one.
	 * @returns The filter instance for chaining.
	 */
	public match<K extends keyof TaskList>(field: K, ...values: TaskList[K][]): this {
		if (!values.length) return this;
		return this.filter(matchPredicate(field, values) as (item: TaskList) => boolean);
	}

	/**
	 * Adds a fuzzy match on the `title` field.
	 *
	 * Shorthand for `this.like("title", ...keys)`.
	 *
	 * @param keys - One or more strings. The title must contain at least one.
	 * @returns The filter instance for chaining.
	 */
	public titleLike(...keys: string[]): this {
		return this.like("title", ...keys);
	}

	/**
	 * Adds an exact match on the `title` field.
	 *
	 * Shorthand for `this.match("title", ...keys)`.
	 *
	 * @param keys - One or more title strings to match exactly.
	 * @returns The filter instance for chaining.
	 */
	public title(...keys: string[]): this {
		return this.match("title", ...keys);
	}
}
// #endregion

// #region TaskFilter
/**
 * A specialized filter for `Task` collections.
 *
 * Extends `neo-filter`'s `Filter` with domain-specific convenience methods
 * for filtering by completion status, title, notes, and the generic
 * {@link like} / {@link match} operators.
 *
 * @example
 * ```ts
 * const results = new TaskFilter(tasks)
 *   .done()
 *   .like("title", "report")
 *   .notesLike("meeting")
 *   .all()
 * ```
 */
export class TaskFilter extends Filter<Task> {
	/**
	 * Adds a fuzzy (contains) match predicate on a string field.
	 *
	 * Multiple values are combined with **OR** logic — an item is retained
	 * if its field value contains **any** of the given strings.
	 *
	 * @param field - The string field name to match against.
	 * @param values - One or more string values. The item's field must
	 *                 **contain** (not necessarily equal) at least one.
	 * @returns The filter instance for chaining.
	 */
	public like<K extends keyof Task>(field: K, ...values: string[]): this {
		if (!values.length) return this;
		return this.filter(likePredicate(field, values) as (item: Task) => boolean);
	}

	/**
	 * Adds an exact match predicate on a field.
	 *
	 * Multiple values are combined with **OR** logic — an item is retained
	 * if its field value equals **any** of the given values.
	 *
	 * @param field - The field name to match against.
	 * @param values - One or more values. The item's field must **equal**
	 *                 at least one.
	 * @returns The filter instance for chaining.
	 */
	public match<K extends keyof Task>(field: K, ...values: Task[K][]): this {
		if (!values.length) return this;
		return this.filter(matchPredicate(field, values) as (item: Task) => boolean);
	}

	/**
	 * Filters tasks by completion status.
	 *
	 * @param isDone - `true` (default) to retain completed tasks,
	 *                 `false` to retain incomplete ones.
	 * @returns The filter instance for chaining.
	 */
	public done(isDone: boolean = true): this {
		return this.match("done", isDone);
	}

	/**
	 * Adds a fuzzy match on the `title` field.
	 *
	 * Shorthand for `this.like("title", ...keys)`.
	 *
	 * @param keys - One or more strings. The title must contain at least one.
	 * @returns The filter instance for chaining.
	 */
	public titleLike(...keys: string[]): this {
		return this.like("title", ...keys);
	}

	/**
	 * Adds an exact match on the `title` field.
	 *
	 * Shorthand for `this.match("title", ...keys)`.
	 *
	 * @param keys - One or more title strings to match exactly.
	 * @returns The filter instance for chaining.
	 */
	public title(...keys: string[]): this {
		return this.match("title", ...keys);
	}

	/**
	 * Adds a fuzzy match on the `notes` field.
	 *
	 * Shorthand for `this.like("notes", ...keys)`.
	 *
	 * @param keys - One or more strings. The notes must contain at least one.
	 * @returns The filter instance for chaining.
	 */
	public notesLike(...keys: string[]): this {
		return this.like("notes", ...keys);
	}

	/**
	 * Adds an exact match on the `notes` field.
	 *
	 * Shorthand for `this.match("notes", ...keys)`.
	 *
	 * @param keys - One or more notes strings to match exactly.
	 * @returns The filter instance for chaining.
	 */
	public notes(...keys: string[]): this {
		return this.match("notes", ...keys);
	}
}
// #endregion
