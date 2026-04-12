# Google Taskify

A lightweight wrapper for the Google Tasks API, supporting task list retrieval, task management, and flexible filtering and sorting.

[中文](./README.md) | [API Documentation](./API_DOC.md)

## Installation

```bash
pnpm install @twisuki/google-taskify
```

## Prerequisites

Before using this library, you need to complete Google Cloud OAuth configuration and obtain three credentials: **Client ID**, **Client Secret**, and **Refresh Token**.

### 1. Create a Project and Enable Google Tasks API

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Click **APIs & Services** > **Library** in the left menu
4. Search for "Google Tasks API" and enable it

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select user type (**External** is suitable for most scenarios)
3. Fill in basic app information (name, email, etc.)
4. On the **Scopes** page, click **Add or Remove Scopes**, select **Google Task API**, and add the following scope:
   - `https://www.googleapis.com/auth/tasks`
5. Add test users (if you selected External type with publish status as "Testing")

### 3. Create Web Application Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select application type as **Web application**
4. Configure authorized redirect URIs, add `https://developers.google.com/oauthplayground`
5. After creation, you will get **Client ID** and **Client Secret**, copy them for later use

### 4. Get refresh_token from OAuth2 Playground

1. Visit [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon in the upper right corner, check **Use your own OAuth credentials**
3. Fill in the **Client ID** and **Client Secret** obtained earlier
4. Find **Google Tasks API v1** in the left list and check `https://www.googleapis.com/auth/tasks`
5. Click **Authorize APIs**
6. Log in with your test Google account and authorize
7. Click **Exchange authorization code for tokens**
8. Find `refresh_token` in **OAuth 2.0 Scopes** and copy its value

## Usage

### Initialization and Login

```typescript
import { Taskify } from "@twisuki/google-taskify";

const taskify = new Taskify({
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  refreshToken: "your-refresh-token",
});

// Login to get access token
await taskify.login();
```

> [!WARNING]
> Be sure to use `.env` to store sensitive information!

### Get Task Lists and Tasks

```typescript
// Load all task lists
await taskify.loadTaskLists();

// Get all lists
const lists = taskify.getTaskLists();
console.log(lists);

// Load tasks from a specific list
await taskify.loadTasks(listId);

// Get all tasks from a specific list
const tasks = taskify.getTasks(listId);
console.log(tasks);
```

### Using Filters

This library provides a powerful `Filter` system, built on top of `neo-filter`, supporting chained calls and multiple filter conditions.

```typescript
import { TaskFilter, TaskListFilter } from "@twisuki/google-taskify";

// Create a task list filter
const listFilter = new TaskListFilter(lists);

// Exact title match
listFilter.title("My Task List").all();

// Fuzzy title match
listFilter.titleLike("work", "important").all();

// Create a task filter
const taskFilter = new TaskFilter(tasks);

// Filter by completion status (defaults to completed tasks)
taskFilter.done(true).all();   // completed
taskFilter.done(false).all();  // incomplete

// Exact title match
taskFilter.title("Buy groceries").all();

// Fuzzy title match
taskFilter.titleLike("meeting", "weekly report").all();

// Fuzzy notes match
taskFilter.notesLike("https://").all();

// Sort (ascending by default)
taskFilter.sorter("title", "ASC").all();
taskFilter.sorter("title", "DESC").all();  // descending

// Pagination
taskFilter.offset(10).limit(5).all();

// Combine conditions
taskFilter
  .done(false)              // incomplete
  .titleLike("project")    // title contains "project"
  .sorter("title", "ASC")
  .limit(20)
  .all();
```

### Creating and Editing Tasks or Lists

This library supports two editing modes: **Local Mode** and **Sync Mode**.

#### Sync Mode (Direct Server Requests)

```typescript
// Create a task list
const newList = await taskify.createTaskList("New List");

// Create a task in a specific list
const newTask = await taskify.createTask(listId, "New Task", "This is notes");

// Update task list title
await taskify.updateTaskList(listId, "Updated Title");

// Update task
await taskify.updateTask(listId, taskId, "Updated Title");

// Mark task as completed/incomplete
await taskify.updateTask(listId, taskId, "done", true);

// Delete task list
await taskify.deleteTaskList(listId);

// Delete task
await taskify.deleteTask(listId, taskId);
```

#### Local Mode (Offline Editing + Batch Commit)

Local mode allows you to make multiple edits locally first, then commit to the server in one batch.

```typescript
// Create a task list locally (no immediate server request)
const localList = taskify.buildTaskList("Local New List");

// Create a task locally
const localTask = taskify.buildTask(listId, "Local New Task", "Notes");

// Edit local task list
taskify.editTaskList(listId, "New Title");
// Or use functional style
taskify.editTaskList(listId, (l) => ({ ...l, title: "New Title" }));

// Edit local task
taskify.editTask(listId, taskId, "New Title");
// Or use functional style
taskify.editTask(listId, taskId, (t) => ({ ...t, done: true }));

// Mark for deletion (local only)
taskify.removeTask(listId, taskId);
taskify.removeTaskList(listId);

// Restore items marked for deletion
taskify.restoreTask(listId, taskId);
taskify.restoreTaskList(listId);

// Commit all local changes to server in one batch
await taskify.commit();

// Discard all local changes and reload from server
await taskify.refresh();
```

## Other

### Proxy Configuration

This project uses [undici](https://github.com/nodejs/undici) for HTTP requests. To configure a proxy, set the global undici dispatcher before importing this library:

```typescript
import { setGlobalDispatcher, ProxyAgent } from "undici";
import { Taskify } from "@twisuki/google-taskify";

// Configure proxy before importing this library
setGlobalDispatcher(new ProxyAgent("http://your-proxy-url:port"));

const taskify = new Taskify({
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  refreshToken: "your-refresh-token",
});

await taskify.login();
```
