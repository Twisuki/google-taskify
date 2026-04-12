# Google Taskify

## 使用示例

### 导入

```ts
import { Taskify } from "@twisuki/google-taskify"
import type { Task, TaskList } from "@twisuki/google-taskify"
```

### 初始化

```ts
const taskify = new Taskify({
	refreshToken: process.env.GOOGLE_TASK_REFRESH_TOKEN,
})

await taskify.login()
```

### 加载任务

```ts
// 加载所有任务列表和指定任务列表
const lists = await taskify.loadTaskLists()
const list = await taskify.loadTaskList(listId)

// 通过任务列表 id 加载任务
const tasks1 = await taskify.loadTasks(listId1, listId2)
const task1 = await taskify.loadTask(listId, taskId)
```

### 获取任务

```ts
const lists1 = taskify.getTaskList()
console.log(list1) // 初次使用 null, 需要调用 load 方法加载任务

const lists2 = await taskify.loadTaskList()
const lists3 = taskify.getTaskList()
console.log(list2, list3) // 已加载任务列表中的任务
```

### 筛选任务

```ts
// 通过字段和值筛选, 并转化为数组
const lists = new Query(taskify.getTaskLists()).like("title", key).order("title", "ASC").limit(num).arr()

// 通过字段和特殊属性筛选, 并提取为对象
const task = new TaskQuery(taskify.getTasks(listId)).like("notes", key).done().order("title", "DESC").offset(num).first()

// 通过多个条件筛选, 并转化为数组
const tasks = new Query(taskify.getTasks(listId)).or(q => q.like("title", key1, key2), q => q.like("notes", key3)).arr()
```

### 创建任务

```ts
// 直接创建
const list1 = await taskify.createTaskList(title)
const task1 = await taskify.createTask(listId, title, note)

// 分步创建并保存
const list2 = taskify.buildTaskList(title)
const task2 = taskify.buildTask(listId, title, notes)
await taskify.commit()
```

### 更新任务

```ts
// 直接全量更新
await taskify.updateTask(listId, taskId, newTask)
await taskify.updateTask(listId, taskId, t => ({...t, title: newTitle}))

// 直接精确更新
await taskify.updateTask(listId, taskId, "title", newTitle)

// 分步修改并保存
taskify.editTask(listId, taskId, newTask)
taskify.editTask(listId, taskId, t => ({...t, title: newTitle}))
taskify.editTask(listId, taskId, "title", newTitle)
await taskify.commit()
```

### 删除任务

```ts
// 直接删除
await taskify.deleteTask(listId, taskId)

// 分步删除并保存
taskify.removeTask(listId, taskId)
taskify.restoreTask(listId, taskId) // 恢复删除的任务
await taskify.commit()
```

## Taskify API

### Status

- "new " - 新建, 还未保存到服务器
- "edited" - 已修改, 但还未保存到服务器
- "removed" - 已删除, 但还未保存到服务器
- "saved" - 已保存到服务器

### RawTaskList

- kind: string - 仅限输出, 固定值 "tasks#taskList"
- id: string
- etag: string
- title: string
- updated: string - 仅限输出
- selfLink: string - 仅限输出

### TaskList

- id: string
- title: string
- status: Status

### RawTask

- kind: string - 仅限输出, 固定值 "tasks#task"
- id: string
- etag: string
- title: string
- updated: string - 仅限输出
- selfLink: string - 仅限输出
- parent: string - 仅限输出
- position: string - 仅限输出
- notes: string
- status: "needsAction" | "completed"
- due: string
- completed: string
- deleted: boolean
- hidden: boolean
- links: Object[] - 仅限输出
- webViewLink: string - 仅限输出
- assignmentInfo: Object - 仅限输出

### Task

- id: string
- title: string
- notes: string
- done: boolean
- status: Status

### Taskify

#### InitOption

- refreshToken: string
- httpsProxy?: string

#### 对象属性

- tasks: Task[]
- lists: TaskList[]

#### 构造函数

- new Taskify(option: InitOption): Taskify - 构造函数, 接收初始化选项

#### 同步方法

- getTaskLists(): TaskList[] - 获取已加载的任务列表
- getTasks(listId: string): Task[] - 获取已加载的任务列表中的任务
- buildTaskList(title: string): TaskList - 构建一个新的任务列表对象, 并分配一个临时 id
- buildTask(listId: string, title: string, notes?: string): Task - 构建一个新的任务对象, 并分配一个临时 id
- editTaskList(listId: string, newList: TaskList): void - 修改一个任务列表对象
- editTaskList(listId: string, updater: (l: TaskList) => TaskList): void - 通过一个函数修改一个任务列表对象
- editTaskList(listId: string, key: keyof TaskList, value: TaskList[keyof TaskList]): void - 修改一个任务列表对象的指定字段
- editTask(listId: string, taskId: string, newTask: Task): void - 修改一个任务对象
- editTask(listId: string, taskId: string, updater: (t: Task) => Task): void - 通过一个函数修改一个任务对象
- editTask(listId: string, taskId: string, key: keyof Task, value: Task[keyof Task]): void - 修改一个任务对象的指定字段
- removeTaskList(listId: string): void - 删除一个任务列表对象
- removeTask(listId: string, taskId: string): void - 删除一个任务对象
- restoreTaskList(listId: string): void - 恢复一个已删除的任务列表对象
- restoreTask(listId: string, taskId: string): void - 恢复一个已删除的任务对象

#### 异步方法

- login(): Promise<void> - 登录 Google 账号并获取访问令牌
- loadTaskLists(): Promise<TaskList[]> - 从服务器加载所有任务列表
- loadTaskList(listId: string): Promise<TaskList> - 从服务器加载一个任务列表
- loadTasks(listId: string, ...otherListId: string[]): Promise<Task[]> - 从服务器加载一个或多个任务列表中的任务
- loadTask(listId: string, taskId: string): Promise<Task> - 从服务器加载一个任务
- createTaskList(title: string): Promise<TaskList> - 创建一个新的任务列表并保存到服务器
- createTask(listId: string, title: string, notes?: string): Promise<Task> - 创建一个新的任务并保存到服务器
- updateTaskList(listId: string, newList: TaskList): Promise<TaskList> - 更新一个任务列表并保存到服务器
- updateTaskList(listId: string, updater: (l: TaskList) => TaskList): Promise<TaskList> - 通过一个函数更新一个任务列表并保存到服务器
- updateTaskList(listId: string, key: keyof TaskList, value: TaskList[keyof TaskList]): Promise<TaskList> - 更新一个任务列表的指定字段并保存到服务器
- updateTask(listId: string, taskId: string, newTask: Task): Promise<Task> - 更新一个任务并保存到服务器
- updateTask(listId: string, taskId: string, updater: (t: Task) => Task): Promise<Task> - 通过一个函数更新一个任务并保存到服务器
- updateTask(listId: string, taskId: string, key: keyof Task, value: Task[keyof Task]): Promise<Task> - 更新一个任务的指定字段并保存到服务器
- deleteTaskList(listId: string): Promise<void> - 删除一个任务列表
- deleteTask(listId: string, taskId: string): Promise<void> - 删除一个任务
- commit(): Promise<void> - 将所有未保存的修改保存到服务器
- refresh(): Promise<void> - 移除所有未保存的修改并从服务器重新加载数据

### Qurey<T>

使用方法如下:

```ts
const result = new Query<Item>(arr).like("field1", "A").limit(10).or(q => q.like("field2", "B").offest(2), q => q.like("field3", "C")).order("field4", "DESC").limit(5).arr()
// 上述代码意为:
//   先对 field1 进行 A 模糊匹配, 限制 10 条, 之后进入分支:
//     - 分支1: 对 field2 进行 B 模糊匹配, 跳过前 2 条
//     - 分支2: 对 field3 进行 C 模糊匹配
//   之后将两个分支结果合并, 按 field4 降序排序, 最后限制 5 条并转化为数组
```

- Query.or[...callback: ((q: this) => this]()): this - 支持多个条件的或关系
- Query.like<K extends keyof T>(field: K ...values: string[]): this - 对指定字段的字符串模糊匹配
- Query.filter<K extends keyof T>(field: K, ...values: [T[K]]()): this - 对指定字段的值进行精确匹配
- Query.order<K extends keyof T>(field: K, direction: "ASC" | "DESC" = "ASC"): this - 按指定字段排序
- Query.offset(num: number): this - 跳过前 num 条数据
- Query.limit(num: number): this - 限制返回 num 条数据
- Query.first(): T | null - 返回第一条数据, 如果没有数据则返回 null
- Query.arr(): T[] - 返回所有数据组成的数组

### TaskListQuery extends Query<TaskList>

- TaskListQuery.title(...key: string[]): this
- TaskListQuery.titleLike(...key: string[]): this

### TaskQuery extends Query<Task>

- TaskQuery.done(isDone: boolean = true): this
- TaskQuery.title(...key: string[]): this
- TaskQuery.titleLike(...key: string[]): this
- TaskQuery.notes(...key: string[]): this
- TaskQuery.notesLike(...key: string[]): this

## Google Task API v1

### TaskList

- kind: string - 仅限输出, 固定值 "tasks#taskList"
- id: string
- etag: string
- title: string
- updated: string - 仅限输出
- selfLink: string - 仅限输出

#### DELETE /v1/users/@me/lists/{tasklist}

删除列表

- req: 空
- res: 空

#### GET /v1/users/@me/lists/{tasklist}

获取列表

- req: 空
- res: TaskList

#### POST /v1/users/@me/lists

创建列表

- req: TaskList
- res: TaskList

#### GET /v1/users/@me/lists

获取所有列表

- req: 空
- res
    - kind: string - 固定值 "tasks#taskLists"
    - etag: string
    - nextPageToken: string
    - items: TaskList[]

#### PATCH /v1/users/@me/lists/{tasklist}

修补式更新列表

- req: TaskList
- res: TaskList

#### PUT /v1/users/@me/lists/{tasklist}

更新列表

- req: TaskList
- res: TaskList

### Task

- kind: string - 仅限输出, 固定值 "tasks#task"
- id: string
- etag: string
- title: string
- updated: string - 仅限输出
- selfLink: string - 仅限输出
- parent: string - 仅限输出
- position: string - 仅限输出
- notes: string
- status: "needsAction" | "completed"
- due: string
- completed: string
- deleted: boolean
- hidden: boolean
- links: Object[] - 仅限输出
- webViewLink: string - 仅限输出
- assignmentInfo: Object - 仅限输出

#### DELETE /v1/lists/{tasklist}/tasks/{task}

删除任务

- req: 空
- res: 空

#### GET /v1/lists/{tasklist}/tasks/{task}

获取任务

- req: 空
- res: Task

#### POST /v1/lists/{tasklist}/tasks

创建任务

- req: Task
- res: Task

#### GET /v1/lists/{tasklist}/tasks

获取任务列表中的所有任务

- req: 空
- res
    - kind: string - 固定值 "tasks#tasks"
    - etag: string
    - nextPageToken: string
    - items: Task[]

#### POST /v1/lists/{tasklist}/tasks/{task}/move

移动任务

- req: 空
- res: Task

#### PATCH /v1/lists/{tasklist}/tasks/{task}

修补式更新任务

- req: Task
- res: Task

#### PUT /v1/lists/{tasklist}/tasks/{task}

更新任务

- req: Task
- res: Task

## neo-filter 适配

自己编写 Query 比较复杂, 因此 2.0 版本准备使用 `@twisuki/neo-filter` 提供查询功能. `neo-filter` 的 `README` 如下:

```md
# neo-filter

A lightweight, chainable, synchronous array filter utility with multi-field sorting, pagination, and OR-branch support.

## Install

```bash
pnpm install @twisuki/neo-filter
```

## Quick Start

```ts
import { Filter } from "@twisuki/neo-filter";

const results = new Filter<DataItem>(rawData)
  .filter((item) => item.active)
  .sorter("createdAt", "DESC")
  .offset(0)
  .limit(10)
  .all();
```

## API

### `filter(predicate)`

Adds a filter predicate to the operation chain. Multiple `filter()` calls compose with **AND** logic — an item must satisfy every predicate.

```ts
new Filter(students)
  .filter((s) => s.subject1 >= 60)
  .filter((s) => s.subject2 >= 60)
  .all();
```

### `sorter(key, direction)`

Adds a sort rule. Rules are appended in insertion order as comparison priority. When two items are equal under the highest-priority rule, the next rule breaks the tie.

Repeating the same key updates only its direction, preserving its original priority position.

```ts
// Primary: role ASC, tie-break: name ASC
new Filter(users)
  .sorter("role", "ASC")
  .sorter("name", "ASC")
  .all();

// Repeating the same key keeps its original priority
new Filter(data)
  .sorter("name", "ASC")
  .sorter("name", "DESC") // updates direction only, priority stays first
  .all();
```

### `offset(n)` / `limit(n)`

`offset` skips `n` items from the start. Multiple calls are **cumulative** (added together).

`limit` caps the result size. Multiple calls take the **minimum** value.

```ts
// Page 2 with 10 items per page
new Filter(data)
  .offset(10)
  .limit(10)
  .all();
```

### `or(...branches)`

Merges multiple OR branches into the pipeline. Each branch is a function that receives a `Filter` instance and returns it with its own predicates applied.

Branches are combined with OR logic against the existing predicates on `this`.

```ts
new Filter(students)
  .filter((s) => s.classId === 1)
  .or(
    (f) => f.filter((s) => s.isClassMonitor),
    (f) => f.filter((s) => s.isStudyCommissar),
    (f) => f.filter((s) => s.isLifeCommissar),
  )
  .all();
```

### `execute()`

Runs the pipeline: **filter → sort → slice**, resets intermediate state, and returns `this` for further chaining.

If there are no pending operations, it is a no-op.

### `all()`

Terminal method. Executes the pipeline and returns all matching items.

### `first()`

Terminal method. Executes the pipeline and returns the first matching item, or `null` if empty.

### `map(...keys)`

Terminal method. Executes the pipeline and returns a projected array containing only the specified keys from each item.

```ts
new Filter(users)
  .filter((u) => u.active)
  .map("id", "name");
// Returns: Array<Pick<User, "id" | "name">>
```

## Extending

Subclass `Filter` to add reusable domain-specific methods:

```ts
class StudentFilter extends Filter<Student> {
  public isPassed(subject: Student.Subjects): this {
    return this.filter((s) => s[subject] && s[subject] >= 60);
  }
}

new StudentFilter(students)
  .isPassed("subject1")
  .isPassed("subject2")
  .all();
```

## Architecture

`execute()` processes data in three stages:

1. **Filter** — iterate `_data`, retain items satisfying every `_operations` predicate
2. **Sort** — apply `Array.sort` with a multi-field comparator via `_sorter` Map (insertion order = priority order)
3. **Slice** — apply `_offset` and `_limit` via `Array.slice`

State is reset after each execution so the instance can be reused.

## License

MIT

```
