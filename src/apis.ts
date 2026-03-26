import { Request } from "./request.js";

const request = new Request();

/**
 * Sets the token getter used to inject the access token into each request.
 * Call this before using any API functions.
 * @param tokenGetter - A function that returns the current access token.
 */
export const initRequest = (tokenGetter: () => string | undefined) => {
	request.setTokenGetter(tokenGetter);
};

export interface RawTaskList {
	kind: "tasks#taskList";
	id: string;
	etag: string;
	title: string;
	updated: string;
	selfLink: string;
}

export interface RawTask {
	kind: "tasks#task";
	id: string;
	etag: string;
	title: string;
	updated: string;
	selfLink: string;
	parent?: string;
	position: string;
	notes?: string;
	status: "needsAction" | "completed";
	due?: string;
	completed?: string;
	deleted?: boolean;
	hidden?: boolean;
	links?: {
		type: string;
		description: string;
		link: string;
	}[];
}

/**
 * Response from GET /v1/users/@me/lists
 * @see https://developers.google.cn/workspace/tasks/reference/rest/v1/tasklists/get
 */
export interface GetTaskListsData {
	kind: "tasks#taskLists";
	etag: string;
	nextPageToken?: string;
	items: RawTaskList[];
}

/**
 * Response from GET /v1/lists/{tasklist}/tasks
 * @see https://developers.google.cn/workspace/tasks/reference/rest/v1/tasks/get
 */
export interface GetTasksData {
	kind: "tasks#tasks";
	etag: string;
	nextPageToken?: string;
	items: RawTask[];
}

const BASE_URL = "https://tasks.googleapis.com/tasks/v1";

// #region TaskList
/**
 * Deletes a task list.
 * @param tasklist - The ID of the task list to delete.
 * @returns An empty promise.
 */
export const deleteTaskList = (tasklist: string) => {
	return request.delete<void>(`${BASE_URL}/users/@me/lists/${tasklist}`);
};

/**
 * Retrieves a specific task list.
 * @param tasklist - The ID of the task list to retrieve.
 * @returns The task list object.
 */
export const getTaskList = (tasklist: string) => {
	return request.get<RawTaskList>(`${BASE_URL}/users/@me/lists/${tasklist}`);
};

/**
 * Creates a new task list.
 * @param data - The task list to create.
 * @returns The created task list.
 */
export const createTaskList = (data: Partial<RawTaskList>) => {
	return request.post<RawTaskList>(`${BASE_URL}/users/@me/lists`, data);
};

/**
 * Retrieves all task lists.
 * @returns A list of task lists.
 */
export const getTaskLists = () => {
	return request.get<GetTaskListsData>(`${BASE_URL}/users/@me/lists`);
};

/**
 * Updates a task list using PATCH.
 * @param tasklist - The ID of the task list to update.
 * @param data - The fields to update in the task list.
 * @returns The updated task list.
 */
export const patchTaskList = (tasklist: string, data: Partial<RawTaskList>) => {
	return request.patch<RawTaskList>(`${BASE_URL}/users/@me/lists/${tasklist}`, data);
};

/**
 * Updates a task list using PUT.
 * @param tasklist - The ID of the task list to update.
 * @param data - The fields to update in the task list.
 * @returns The updated task list.
 */
export const updateTaskList = (tasklist: string, data: Partial<RawTaskList>) => {
	return request.put<RawTaskList>(`${BASE_URL}/users/@me/lists/${tasklist}`, data);
};
// #endregion

// #region Task
/**
 * Deletes a task.
 * @param tasklist - The ID of the task list.
 * @param task - The ID of the task to delete.
 * @returns An empty promise.
 */
export const deleteTask = (tasklist: string, task: string) => {
	return request.delete<void>(`${BASE_URL}/lists/${tasklist}/tasks/${task}`);
};

/**
 * Retrieves a specific task.
 * @param tasklist - The ID of the task list.
 * @param task - The ID of the task to retrieve.
 * @returns The task object.
 */
export const getTask = (tasklist: string, task: string) => {
	return request.get<RawTask>(`${BASE_URL}/lists/${tasklist}/tasks/${task}`);
};

/**
 * Creates a new task.
 * @param tasklist - The ID of the task list.
 * @param data - The task to create.
 * @returns The created task.
 */
export const createTask = (tasklist: string, data: Partial<RawTask>) => {
	return request.post<RawTask>(`${BASE_URL}/lists/${tasklist}/tasks`, data);
};

/**
 * Retrieves all tasks in a task list.
 * @param tasklist - The ID of the task list.
 * @returns A list of tasks.
 */
export const getTasks = (tasklist: string) => {
	return request.get<GetTasksData>(`${BASE_URL}/lists/${tasklist}/tasks`);
};

/**
 * Moves a task to a different position.
 * @param tasklist - The ID of the task list.
 * @param task - The ID of the task to move.
 * @returns The moved task.
 */
export const moveTask = (tasklist: string, task: string) => {
	return request.post<RawTask>(`${BASE_URL}/lists/${tasklist}/tasks/${task}/move`);
};

/**
 * Updates a task using PATCH.
 * @param tasklist - The ID of the task list.
 * @param task - The ID of the task to update.
 * @param data - The fields to update in the task.
 * @returns The updated task.
 */
export const patchTask = (tasklist: string, task: string, data: Partial<RawTask>) => {
	return request.patch<RawTask>(`${BASE_URL}/lists/${tasklist}/tasks/${task}`, data);
};

/**
 * Updates a task using PUT.
 * @param tasklist - The ID of the task list.
 * @param task - The ID of the task to update.
 * @param data - The fields to update in the task.
 * @returns The updated task.
 */
export const updateTask = (tasklist: string, task: string, data: Partial<RawTask>) => {
	return request.put<RawTask>(`${BASE_URL}/lists/${tasklist}/tasks/${task}`, data);
};
// #endregion
