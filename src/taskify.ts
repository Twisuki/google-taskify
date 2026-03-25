import * as apis from "./apis";

// #region Types
/**
 * The synchronization status of a Task or TaskList.
 * - "new"     - Created locally, not yet saved to the server.
 * - "edited"  - Modified locally, not yet saved to the server.
 * - "removed"  - Deleted locally, not yet saved to the server.
 * - "saved"    - Synced with the server.
 */
export type Status = "new" | "edited" | "removed" | "saved";

/**
 * Represents a task.
 */
export interface Task {
	id: string;
	title: string;
	notes: string | null;
	done: boolean;
	status: Status;
}

/**
 * Represents a task list.
 */
export interface TaskList {
	id: string;
	title: string;
	status: Status;
}

/**
 * Options for initializing a Taskify instance.
 */
// TODO 测试新的 OAuth 方法
export interface InitOption {
	/** The Google OAuth refresh token. */
	refreshToken: string;
	/** The Google OAuth client ID. */
	clientId: string;
	/** The Google OAuth client secret. */
	clientSecret: string;
	/** Optional custom fetch implementation. */
	fetchImpl?: typeof fetch;
}
// #endregion

// #region Taskify
/**
 * The main entry point for interacting with the Google Tasks API.
 */
export class Taskify {
	private readonly _lists: Map<string, TaskList> = new Map();
	private readonly _tasks: Map<string, Map<string, Task>> = new Map();
	private readonly _pending: Map<string, TaskList | Task> = new Map();

	/** All loaded task lists. */
	get lists(): TaskList[] {
		return [...this._lists.values()];
	}

	/** All loaded tasks across all lists. */
	get tasks(): Task[] {
		const result: Task[] = [];
		for (const listTasks of this._tasks.values()) {
			for (const task of listTasks.values()) {
				result.push(task);
			}
		}
		return result;
	}

	/**
	 * Creates a new Taskify instance.
	 * @param option - Initialization options.
	 */
	constructor(private readonly option: InitOption) {
		apis.initRequest(this.authenticatedFetch.bind(this));
	}

	/**
	 * Authenticates with the Google Tasks API using the refresh token.
	 */
	async login(): Promise<void> {
		const tokenRes = await this.fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: this.option.refreshToken,
				client_id: this.option.clientId,
				client_secret: this.option.clientSecret,
			}),
		});

		const tokenData = (await tokenRes.json()) as { access_token: string };
		this._accessToken = tokenData.access_token;
	}

	private _accessToken: string = "";

	private async authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
		if (!this._accessToken) {
			throw new Error("Not logged in. Call login() first.");
		}

		const headers = new Headers(init?.headers);
		headers.set("Authorization", `Bearer ${this._accessToken}`);

		return this.fetch(input, {
			...init,
			headers,
		});
	}

	private fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
		const doFetch = (url: string, opts?: RequestInit) => {
			const impl = this.option.fetchImpl ?? globalThis.fetch;
			return impl(url, opts) as Promise<Response>;
		};

		const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
		return doFetch(url, init);
	}

	// #region Sync methods

	/**
	 * Returns all loaded task lists.
	 * @returns An array of task lists.
	 */
	getTaskLists(): TaskList[] {
		return [...this._lists.values()];
	}

	/**
	 * Returns all tasks in a specific task list.
	 * @param listId - The ID of the task list.
	 * @returns An array of tasks in the list.
	 */
	getTasks(listId: string): Task[] {
		const listTasks = this._tasks.get(listId);
		if (!listTasks) return [];
		return [...listTasks.values()];
	}

	/**
	 * Builds a new task list locally without saving to the server.
	 * @param title - The title of the task list.
	 * @returns The created task list with a temporary id.
	 */
	buildTaskList(title: string): TaskList {
		const list: TaskList = { id: crypto.randomUUID(), title, status: "new" };
		this._lists.set(list.id, list);
		this._pending.set(list.id, list);
		return list;
	}

	/**
	 * Builds a new task locally without saving to the server.
	 * @param listId - The ID of the task list.
	 * @param title - The title of the task.
	 * @param notes - Optional notes for the task.
	 * @returns The created task with a temporary id.
	 */
	buildTask(listId: string, title: string, notes?: string): Task {
		const task: Task = { id: crypto.randomUUID(), title, notes: notes ?? null, done: false, status: "new" };
		this.addTaskToList(listId, task);
		this._pending.set(task.id, task);
		return task;
	}

	/**
	 * Modifies a task list by replacing it with a new one.
	 * @param listId - The ID of the task list to modify.
	 * @param newList - The new task list object.
	 */
	editTaskList(listId: string, newList: TaskList): void;

	/**
	 * Modifies a task list using an updater function.
	 * @param listId - The ID of the task list to modify.
	 * @param updater - A function that receives the current list and returns the updated one.
	 */
	editTaskList(listId: string, updater: (l: TaskList) => TaskList): void;

	/**
	 * Modifies a specific field of a task list.
	 * @param listId - The ID of the task list to modify.
	 * @param key - The field name to update.
	 * @param value - The new value for the field.
	 */
	editTaskList(listId: string, key: keyof TaskList, value: TaskList[keyof TaskList]): void;

	editTaskList(listId: string, key: unknown, value?: unknown): void {
		const list = this._lists.get(listId);
		if (!list) return;

		let updated: TaskList;
		if (typeof key === "function") {
			updated = key(list);
		} else if (typeof key === "string") {
			updated = { ...list, [key]: value };
		} else {
			updated = key as TaskList;
		}

		this.applyTaskListUpdate(listId, updated);
	}

	/**
	 * Modifies a task by replacing it with a new one.
	 * @param listId - The ID of the task list.
	 * @param taskId - The ID of the task to modify.
	 * @param newTask - The new task object.
	 */
	editTask(listId: string, taskId: string, newTask: Task): void;

	/**
	 * Modifies a task using an updater function.
	 * @param listId - The ID of the task list.
	 * @param taskId - The ID of the task to modify.
	 * @param updater - A function that receives the current task and returns the updated one.
	 */
	editTask(listId: string, taskId: string, updater: (t: Task) => Task): void;

	/**
	 * Modifies a specific field of a task.
	 * @param listId - The ID of the task list.
	 * @param taskId - The ID of the task to modify.
	 * @param key - The field name to update.
	 * @param value - The new value for the field.
	 */
	editTask(listId: string, taskId: string, key: keyof Task, value: Task[keyof Task]): void;

	editTask(listId: string, taskId: string, key: unknown, value?: unknown): void {
		const task = this._tasks.get(listId)?.get(taskId);
		if (!task) return;

		let updated: Task;
		if (typeof key === "function") {
			updated = key(task);
		} else if (typeof key === "string") {
			updated = { ...task, [key]: value };
		} else {
			updated = key as Task;
		}

		this.applyTaskUpdate(listId, taskId, updated);
	}

	/**
	 * Marks a task list as removed locally without deleting from the server.
	 * @param listId - The ID of the task list to remove.
	 */
	removeTaskList(listId: string): void {
		const list = this._lists.get(listId);
		if (!list) return;
		list.status = "removed";
		this._pending.set(listId, list);
	}

	/**
	 * Marks a task as removed locally without deleting from the server.
	 * @param listId - The ID of the task list.
	 * @param taskId - The ID of the task to remove.
	 */
	removeTask(listId: string, taskId: string): void {
		const task = this._tasks.get(listId)?.get(taskId);
		if (!task) return;
		task.status = "removed";
		this._pending.set(taskId, task);
	}

	/**
	 * Restores a removed task list to its previous state.
	 * @param listId - The ID of the task list to restore.
	 */
	restoreTaskList(listId: string): void {
		const list = this._lists.get(listId);
		if (!list || list.status !== "removed") return;
		list.status = "saved";
		this._pending.delete(listId);
	}

	/**
	 * Restores a removed task to its previous state.
	 * @param listId - The ID of the task list.
	 * @param taskId - The ID of the task to restore.
	 */
	restoreTask(listId: string, taskId: string): void {
		const task = this._tasks.get(listId)?.get(taskId);
		if (!task || task.status !== "removed") return;
		task.status = "saved";
		this._pending.delete(taskId);
	}
	// #endregion

	// #region Async methods

	/**
	 * Loads all task lists from the server.
	 * @returns An array of task lists.
	 */
	async loadTaskLists(): Promise<TaskList[]> {
		const res = await apis.getTaskLists();
		const lists: TaskList[] = [];
		for (const raw of res.items ?? []) {
			const list = this.rawTaskListToTaskList(raw);
			this._lists.set(list.id, list);
			lists.push(list);
		}
		return lists;
	}

	/**
	 * Loads a single task list from the server.
	 * @param listId - The ID of the task list to load.
	 * @returns The loaded task list.
	 */
	async loadTaskList(listId: string): Promise<TaskList> {
		const raw = await apis.getTaskList(listId);
		const list = this.rawTaskListToTaskList(raw);
		this._lists.set(list.id, list);
		return list;
	}

	/**
	 * Loads tasks from one or more task lists from the server.
	 * @param listId - The first task list ID to load tasks from.
	 * @param otherListId - Additional task list IDs to load tasks from.
	 * @returns An array of tasks from all specified lists.
	 */
	async loadTasks(listId: string, ...otherListId: string[]): Promise<Task[]> {
		const allIds = [listId, ...otherListId];
		const results: Task[] = [];
		for (const id of allIds) {
			const res = await apis.getTasks(id);
			const tasks: Task[] = [];
			for (const raw of res.items ?? []) {
				const task = this.rawTaskToTask(raw, id);
				this.addTaskToList(id, task);
				tasks.push(task);
			}
			results.push(...tasks);
		}
		return results;
	}

	/**
	 * Loads a single task from the server.
	 * @param listId - The ID of the task list.
	 * @param taskId - The ID of the task to load.
	 * @returns The loaded task.
	 */
	async loadTask(listId: string, taskId: string): Promise<Task> {
		const raw = await apis.getTask(listId, taskId);
		const task = this.rawTaskToTask(raw, listId);
		this.addTaskToList(listId, task);
		return task;
	}

	/**
	 * Creates a new task list on the server.
	 * @param title - The title of the task list.
	 * @returns The created task list.
	 */
	async createTaskList(title: string): Promise<TaskList> {
		const raw = await apis.createTaskList({ title });
		const list = this.rawTaskListToTaskList(raw);
		this._lists.set(list.id, list);
		return list;
	}

	/**
	 * Creates a new task on the server.
	 * @param listId - The ID of the task list.
	 * @param title - The title of the task.
	 * @param notes - Optional notes for the task.
	 * @returns The created task.
	 */
	async createTask(listId: string, title: string, notes?: string): Promise<Task> {
		const raw = await apis.createTask(listId, { title, notes });
		const task = this.rawTaskToTask(raw, listId);
		this.addTaskToList(listId, task);
		return task;
	}

	/**
	 * Updates a task list on the server by replacing it.
	 * @param listId - The ID of the task list.
	 * @param newList - The new task list object.
	 * @returns The updated task list.
	 */
	async updateTaskList(listId: string, newList: TaskList): Promise<TaskList>;

	/**
	 * Updates a task list on the server using an updater function.
	 * @param listId - The ID of the task list.
	 * @param updater - A function that receives the current list and returns the updated one.
	 * @returns The updated task list.
	 */
	async updateTaskList(listId: string, updater: (l: TaskList) => TaskList): Promise<TaskList>;

	/**
	 * Updates a specific field of a task list on the server.
	 * @param listId - The ID of the task list.
	 * @param key - The field name to update.
	 * @param value - The new value for the field.
	 * @returns The updated task list.
	 */
	async updateTaskList(listId: string, key: keyof TaskList, value: TaskList[keyof TaskList]): Promise<TaskList>;

	async updateTaskList(listId: string, key: unknown, value?: unknown): Promise<TaskList> {
		let updated: TaskList;
		const current = this._lists.get(listId);
		if (!current) throw new Error(`TaskList ${listId} not found`);

		if (typeof key === "function") {
			updated = key(current);
		} else if (typeof key === "string") {
			updated = { ...current, [key]: value };
		} else {
			updated = key as TaskList;
		}

		const raw = await apis.updateTaskList(updated.id, { title: updated.title });
		const list = this.rawTaskListToTaskList(raw);
		this._lists.set(list.id, list);
		return list;
	}

	/**
	 * Updates a task on the server by replacing it.
	 * @param listId - The ID of the task list.
	 * @param taskId - The ID of the task.
	 * @param newTask - The new task object.
	 * @returns The updated task.
	 */
	async updateTask(listId: string, taskId: string, newTask: Task): Promise<Task>;

	/**
	 * Updates a task on the server using an updater function.
	 * @param listId - The ID of the task list.
	 * @param taskId - The ID of the task.
	 * @param updater - A function that receives the current task and returns the updated one.
	 * @returns The updated task.
	 */
	async updateTask(listId: string, taskId: string, updater: (t: Task) => Task): Promise<Task>;

	/**
	 * Updates a specific field of a task on the server.
	 * @param listId - The ID of the task list.
	 * @param taskId - The ID of the task.
	 * @param key - The field name to update.
	 * @param value - The new value for the field.
	 * @returns The updated task.
	 */
	async updateTask(listId: string, taskId: string, key: keyof Task, value: Task[keyof Task]): Promise<Task>;

	async updateTask(listId: string, taskId: string, key: unknown, value?: unknown): Promise<Task> {
		let updated: Task;
		const current = this._tasks.get(listId)?.get(taskId);
		if (!current) throw new Error(`Task ${taskId} not found`);

		if (typeof key === "function") {
			updated = key(current);
		} else if (typeof key === "string") {
			updated = { ...current, [key]: value };
		} else {
			updated = key as Task;
		}

		const status = updated.done ? "completed" : "needsAction";
		const raw = await apis.updateTask(listId, updated.id, {
			title: updated.title,
			notes: updated.notes ?? undefined,
			status,
		});
		const task = this.rawTaskToTask(raw, listId);
		this.addTaskToList(listId, task);
		return task;
	}

	/**
	 * Deletes a task list from the server.
	 * @param listId - The ID of the task list to delete.
	 */
	async deleteTaskList(listId: string): Promise<void> {
		await apis.deleteTaskList(listId);
		this._lists.delete(listId);
		this._tasks.delete(listId);
	}

	/**
	 * Deletes a task from the server.
	 * @param listId - The ID of the task list.
	 * @param taskId - The ID of the task to delete.
	 */
	async deleteTask(listId: string, taskId: string): Promise<void> {
		await apis.deleteTask(listId, taskId);
		this._tasks.get(listId)?.delete(taskId);
	}

	/**
	 * Commits all pending changes to the server.
	 * - "new"     items are created on the server
	 * - "edited"  items are updated on the server
	 * - "removed" items are deleted from the server
	 */
	async commit(): Promise<void> {
		const newLists: TaskList[] = [];
		const editedLists: TaskList[] = [];
		const removedLists: TaskList[] = [];
		const newTasks: Task[] = [];
		const editedTasks: Task[] = [];
		const removedTasks: { listId: string; taskId: string }[] = [];

		for (const item of this._pending.values()) {
			if ("title" in item && "status" in item && !("done" in item)) {
				const list = item as TaskList;
				if (list.status === "new") newLists.push(list);
				else if (list.status === "edited") editedLists.push(list);
				else if (list.status === "removed") removedLists.push(list);
			} else if ("done" in item) {
				const task = item as Task;
				const listId = this.findTaskListId(task.id);
				if (!listId) continue;
				if (task.status === "new") newTasks.push(task);
				else if (task.status === "edited") editedTasks.push(task);
				else if (task.status === "removed") removedTasks.push({ listId, taskId: task.id });
			}
		}

		for (const list of removedLists) {
			await apis.deleteTaskList(list.id);
			this._lists.delete(list.id);
			this._tasks.delete(list.id);
		}

		for (const task of removedTasks) {
			await apis.deleteTask(task.listId, task.taskId);
			this._tasks.get(task.listId)?.delete(task.taskId);
		}

		for (const list of editedLists) {
			const raw = await apis.patchTaskList(list.id, { title: list.title });
			const updated = this.rawTaskListToTaskList(raw);
			this._lists.set(updated.id, updated);
		}

		for (const task of editedTasks) {
			const listId = this.findTaskListId(task.id);
			if (!listId) continue;
			const status = task.done ? "completed" : "needsAction";
			const raw = await apis.patchTask(listId, task.id, {
				title: task.title,
				notes: task.notes ?? undefined,
				status,
			});
			const updated = this.rawTaskToTask(raw, listId);
			this.addTaskToList(listId, updated);
		}

		for (const list of newLists) {
			const raw = await apis.createTaskList({ title: list.title });
			const created = this.rawTaskListToTaskList(raw);
			this._lists.delete(list.id);
			this._lists.set(created.id, created);
		}

		for (const task of newTasks) {
			const listId = this.findTaskListId(task.id);
			if (!listId) continue;
			const raw = await apis.createTask(listId, { title: task.title, notes: task.notes ?? undefined });
			const created = this.rawTaskToTask(raw, listId);
			this._tasks.get(listId)?.delete(task.id);
			this.addTaskToList(listId, created);
		}

		this._pending.clear();
	}

	/**
	 * Discards all pending changes and reloads all data from the server.
	 */
	async refresh(): Promise<void> {
		this._pending.clear();
		await this.loadTaskLists();
		const listIds = [...this._lists.keys()];
		for (const listId of listIds) {
			await this.loadTasks(listId);
		}
	}
	// #endregion

	// #region Private helpers
	private rawTaskListToTaskList(raw: apis.RawTaskList): TaskList {
		return { id: raw.id, title: raw.title, status: "saved" };
	}

	private rawTaskToTask(raw: apis.RawTask, listId: string): Task {
		return {
			id: raw.id,
			title: raw.title,
			notes: raw.notes ?? null,
			done: raw.status === "completed",
			status: "saved",
		};
	}

	private addTaskToList(listId: string, task: Task): void {
		if (!this._tasks.has(listId)) {
			this._tasks.set(listId, new Map());
		}
		this._tasks.get(listId)!.set(task.id, task);
	}

	private applyTaskListUpdate(listId: string, updated: TaskList): void {
		if (updated.status === "new") {
			this._lists.set(listId, updated);
			this._pending.set(listId, updated);
		} else {
			updated.status = "edited";
			this._lists.set(listId, updated);
			this._pending.set(listId, updated);
		}
	}

	private applyTaskUpdate(listId: string, taskId: string, updated: Task): void {
		if (updated.status === "new") {
			this.addTaskToList(listId, updated);
			this._pending.set(taskId, updated);
		} else {
			updated.status = "edited";
			this.addTaskToList(listId, updated);
			this._pending.set(taskId, updated);
		}
	}

	private findTaskListId(taskId: string): string | null {
		for (const [listId, tasks] of this._tasks.entries()) {
			if (tasks.has(taskId)) return listId;
		}
		return null;
	}
	// #endregion
}
// #endregion
