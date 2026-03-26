# API Reference

## Table of Contents

- [initRequest](#initrequest)
- [Types](#types)
  - [Status](#status)
  - [Task](#task)
  - [TaskList](#tasklist)
  - [InitOption](#initoption)
  - [RawTask](#rawtask)
  - [RawTaskList](#rawtasklist)
  - [GetTaskListsData](#gettasklistsdata)
  - [GetTasksData](#gettasksdata)
- [Taskify Class](#taskify-class)
  - [Constructor](#constructor)
  - [Properties](#properties)
  - [Authentication](#authentication)
  - [Local Methods](#local-methods)
  - [Sync Methods](#sync-methods)
  - [Offline Batch Operations](#offline-batch-operations)
- [Query Class](#query-class)
  - [Common Methods](#common-methods)
  - [TaskListQuery](#tasklistquery)
  - [TaskQuery](#taskquery)
- [Low-level API](#low-level-api)
  - [TaskList Operations](#tasklist-operations)
  - [Task Operations](#task-operations)

---

## initRequest

Sets the access token getter function used to inject the token into every low-level API request. Must be called before using any low-level API functions.

```ts
function initRequest(tokenGetter: () => string | undefined): void
```

**Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tokenGetter` | `() => string \| undefined` | A function that returns the current access token |

---

## Types

### Status

Represents the synchronization status of a Task or TaskList.

```ts
type Status = "new" | "edited" | "removed" | "saved";
```

| Value | Description |
|-------|-------------|
| `"new"` | Created locally, not yet synced to the server |
| `"edited"` | Modified locally, not yet synced to the server |
| `"removed"` | Marked for deletion locally, not yet deleted from the server |
| `"saved"` | Synced with the server |

### Task

Represents a task.

```ts
interface Task {
  id: string;
  title: string;
  notes: string | null;
  done: boolean;
  status: Status;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Task ID |
| `title` | `string` | Task title |
| `notes` | `string \| null` | Task notes |
| `done` | `boolean` | Whether the task is completed |
| `status` | `Status` | Synchronization status |

### TaskList

Represents a task list.

```ts
interface TaskList {
  id: string;
  title: string;
  status: Status;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | List ID |
| `title` | `string` | List title |
| `status` | `Status` | Synchronization status |

### InitOption

Options for initializing a Taskify instance.

```ts
interface InitOption {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `refreshToken` | `string` | Google OAuth refresh token |
| `clientId` | `string` | Google OAuth client ID |
| `clientSecret` | `string` | Google OAuth client secret |

### RawTask

The raw task object returned by the Google Tasks API. Used by the low-level API.

```ts
interface RawTask {
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
```

### RawTaskList

The raw task list object returned by the Google Tasks API. Used by the low-level API.

```ts
interface RawTaskList {
  kind: "tasks#taskList";
  id: string;
  etag: string;
  title: string;
  updated: string;
  selfLink: string;
}
```

### GetTaskListsData

Response type for `getTaskLists` requests.

```ts
interface GetTaskListsData {
  kind: "tasks#taskLists";
  etag: string;
  nextPageToken?: string;
  items: RawTaskList[];
}
```

### GetTasksData

Response type for `getTasks` requests.

```ts
interface GetTasksData {
  kind: "tasks#tasks";
  etag: string;
  nextPageToken?: string;
  items: RawTask[];
}
```

---

## Taskify Class

The main entry point for interacting with the Google Tasks API. Provides high-level abstraction with support for local offline editing and batch commits.

### Constructor

```ts
new Taskify(option: InitOption): Taskify
```

### Properties

#### lists

Returns all loaded task lists.

```ts
get lists(): TaskList[]
```

#### tasks

Returns all loaded tasks (across all lists).

```ts
get tasks(): Task[]
```

### Authentication

#### login

Authenticates using the refresh token to obtain an access token.

```ts
async login(): Promise<void>
```

---

### Local Methods

Local methods modify data only locally without making immediate requests to the server. Use together with `commit`.

#### getTaskLists

Returns all loaded task lists.

```ts
getTaskLists(): TaskList[]
```

#### getTasks

Returns all loaded tasks in a specific list.

```ts
getTasks(listId: string): Task[]
```

#### buildTaskList

Creates a task list locally (no server request). Returns a list with a temporary ID.

```ts
buildTaskList(title: string): TaskList
```

#### buildTask

Creates a task locally (no server request). Returns a task with a temporary ID.

```ts
buildTask(listId: string, title: string, notes?: string): Task
```

#### editTaskList

Modifies a local task list. Supports three calling patterns:

```ts
// Pattern 1: Replace the entire list
editTaskList(listId: string, newList: TaskList): void

// Pattern 2: Using an updater function
editTaskList(listId: string, updater: (l: TaskList) => TaskList): void

// Pattern 3: Update a single field
editTaskList(listId: string, key: keyof TaskList, value: TaskList[keyof TaskList]): void
```

#### editTask

Modifies a local task. Supports three calling patterns:

```ts
// Pattern 1: Replace the entire task
editTask(listId: string, taskId: string, newTask: Task): void

// Pattern 2: Using an updater function
editTask(listId: string, taskId: string, updater: (t: Task) => Task): void

// Pattern 3: Update a single field
editTask(listId: string, taskId: string, key: keyof Task, value: Task[keyof Task]): void
```

#### removeTaskList

Marks a task list for deletion (local only).

```ts
removeTaskList(listId: string): void
```

#### removeTask

Marks a task for deletion (local only).

```ts
removeTask(listId: string, taskId: string): void
```

#### restoreTaskList

Restores a locally removed task list.

```ts
restoreTaskList(listId: string): void
```

#### restoreTask

Restores a locally removed task.

```ts
restoreTask(listId: string, taskId: string): void
```

---

### Sync Methods

Sync methods make direct requests to the server and take effect immediately.

#### loadTaskLists

Loads all task lists from the server.

```ts
async loadTaskLists(): Promise<TaskList[]>
```

#### loadTaskList

Loads a single task list from the server.

```ts
async loadTaskList(listId: string): Promise<TaskList>
```

#### loadTasks

Loads tasks from one or more task lists from the server.

```ts
async loadTasks(listId: string, ...otherListId: string[]): Promise<Task[]>
```

#### loadTask

Loads a single task from the server.

```ts
async loadTask(listId: string, taskId: string): Promise<Task>
```

#### createTaskList

Creates a task list on the server.

```ts
async createTaskList(title: string): Promise<TaskList>
```

#### createTask

Creates a task on the server.

```ts
async createTask(listId: string, title: string, notes?: string): Promise<Task>
```

#### updateTaskList

Updates a task list on the server. Supports three calling patterns:

```ts
// Pattern 1: Replace the entire list
async updateTaskList(listId: string, newList: TaskList): Promise<TaskList>

// Pattern 2: Using an updater function
async updateTaskList(listId: string, updater: (l: TaskList) => TaskList): Promise<TaskList>

// Pattern 3: Update a single field
async updateTaskList(listId: string, key: keyof TaskList, value: TaskList[keyof TaskList]): Promise<TaskList>
```

#### updateTask

Updates a task on the server. Supports three calling patterns:

```ts
// Pattern 1: Replace the entire task
async updateTask(listId: string, taskId: string, newTask: Task): Promise<Task>

// Pattern 2: Using an updater function
async updateTask(listId: string, taskId: string, updater: (t: Task) => Task): Promise<Task>

// Pattern 3: Update a single field
async updateTask(listId: string, taskId: string, key: keyof Task, value: Task[keyof Task]): Promise<Task>
```

#### deleteTaskList

Deletes a task list from the server.

```ts
async deleteTaskList(listId: string): Promise<void>
```

#### deleteTask

Deletes a task from the server.

```ts
async deleteTask(listId: string, taskId: string): Promise<void>
```

---

### Offline Batch Operations

#### commit

Commits all pending local changes to the server in one batch.

- Items with `"new"` status are created on the server
- Items with `"edited"` status are updated on the server
- Items with `"removed"` status are deleted from the server

```ts
async commit(): Promise<void>
```

#### refresh

Discards all local changes and reloads all data from the server.

```ts
async refresh(): Promise<void>
```

---

## Query Class

A lazy query builder for filtering, sorting, and transforming collections. Conditions are collected during chaining and only executed when `all` or `first` is called.

### Common Methods

The following methods are available in `Query`, `TaskListQuery`, and `TaskQuery`:

#### like

Performs a fuzzy (contains) match on a string field.

```ts
like<K extends keyof T>(field: K, ...values: string[]): this
```

#### filter

Performs an exact match on a field.

```ts
filter<K extends keyof T>(field: K, ...values: T[K][]): this
```

#### order

Sorts by a field.

```ts
order<K extends keyof T>(field: K, direction?: "ASC" | "DESC"): this
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `field` | `K` | - | Field name to sort by |
| `direction` | `"ASC" \| "DESC"` | `"ASC"` | Sort direction |

#### offset

Skips the first N items.

```ts
offset(num: number): this
```

#### limit

Limits the number of items returned.

```ts
limit(num: number): this
```

#### or

Combines multiple filter conditions with OR logic. Executes current operations first, then each branch, merges results with deduplication, and replaces the current data.

```ts
or(...callbacks: ((q: this) => this)[]): this
```

#### first

Returns the first item, or `null` if empty. Triggers pending operations.

```ts
first(): T | null
```

#### all

Returns all items. Triggers pending operations.

```ts
all(): T[]
```

---

### TaskListQuery

Extends `Query<TaskList>` with task list-specific filter methods.

#### title

Filters by exact title match.

```ts
title(...keys: string[]): this
```

#### titleLike

Filters by fuzzy title match.

```ts
titleLike(...keys: string[]): this
```

---

### TaskQuery

Extends `Query<Task>` with task-specific filter methods.

#### done

Filters by completion status.

```ts
done(isDone?: boolean): this
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `isDone` | `boolean` | `true` | Whether to filter completed tasks |

#### title

Filters by exact title match.

```ts
title(...keys: string[]): this
```

#### titleLike

Filters by fuzzy title match.

```ts
titleLike(...keys: string[]): this
```

#### notes

Filters by exact notes match.

```ts
notes(...keys: string[]): this
```

#### notesLike

Filters by fuzzy notes match.

```ts
notesLike(...keys: string[]): this
```

---

## Low-level API

Low-level API functions interact directly with the Google Tasks API and return raw data (`RawTask`, `RawTaskList`). You must call `initRequest` to set the token getter before using these functions.

### TaskList Operations

#### getTaskLists

Retrieves all task lists.

```ts
function getTaskLists(): Promise<GetTaskListsData>
```

#### getTaskList

Retrieves a specific task list.

```ts
function getTaskList(tasklist: string): Promise<RawTaskList>
```

#### createTaskList

Creates a task list.

```ts
function createTaskList(data: Partial<RawTaskList>): Promise<RawTaskList>
```

#### patchTaskList

Updates a task list using PATCH.

```ts
function patchTaskList(tasklist: string, data: Partial<RawTaskList>): Promise<RawTaskList>
```

#### updateTaskList

Updates a task list using PUT.

```ts
function updateTaskList(tasklist: string, data: Partial<RawTaskList>): Promise<RawTaskList>
```

#### deleteTaskList

Deletes a task list.

```ts
function deleteTaskList(tasklist: string): Promise<void>
```

---

### Task Operations

#### getTasks

Retrieves all tasks in a specific list.

```ts
function getTasks(tasklist: string): Promise<GetTasksData>
```

#### getTask

Retrieves a specific task.

```ts
function getTask(tasklist: string, task: string): Promise<RawTask>
```

#### createTask

Creates a task in a specific list.

```ts
function createTask(tasklist: string, data: Partial<RawTask>): Promise<RawTask>
```

#### patchTask

Updates a task using PATCH.

```ts
function patchTask(tasklist: string, task: string, data: Partial<RawTask>): Promise<RawTask>
```

#### updateTask

Updates a task using PUT.

```ts
function updateTask(tasklist: string, task: string, data: Partial<RawTask>): Promise<RawTask>
```

#### moveTask

Moves a task to a different position.

```ts
function moveTask(tasklist: string, task: string): Promise<RawTask>
```

#### deleteTask

Deletes a task.

```ts
function deleteTask(tasklist: string, task: string): Promise<void>
```
