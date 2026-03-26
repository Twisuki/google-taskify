# Google Taskify

一个轻量级的 Google Tasks API 封装库, 支持获取任务列表, 任务管理以及灵活的筛选排序能力.

[English](./README_EN.md) | [API 文档](./API_DOC.md)

## 安装

```bash
pnpm install @twisuki/google-taskify
```

## 准备工作

在使用本库之前, 需要完成 Google Cloud 的 OAuth 配置并获取 **Client ID**, **Client Secret** 和 **Refresh Token** 三个凭证.

### 1. 创建项目并启用 Google Tasks API

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目(或选择已有项目)
3. 在左侧菜单中点击 **APIs & Services** > **Library**
4. 搜索 "Google Tasks API" 并启用它

### 2. 配置 OAuth 同意屏幕

1. 进入 **APIs & Services** > **OAuth consent screen**
2. 选择用户类型(**External** 适用于大多数场景)
3. 填写应用基本信息(名称、邮箱等)
4. 在 **Scopes** 页面, 点击 **Add or Remove Scopes**, 选择 **Google Task API**, 添加以下 scope:
   - `https://www.googleapis.com/auth/tasks`
5. 添加测试用户(如果你选择了 External 类型且发布状态为 "Testing")

### 3. 创建 Web Application 凭证

1. 进入 **APIs & Services** > **Credentials**
2. 点击 **Create Credentials** > **OAuth client ID**
3. 选择应用类型为 **Web application**
4. 配置已授权的重定向 URI, 添加 `https://developers.google.com/oauthplayground`
5. 创建后, 可以得到 **Client ID** 和 **Client Secret**, 复制备用

### 4. 在 OAuth2 Playground 获取 refresh_token

1. 访问 [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. 点击右上角齿轮图标, 勾选 **Use your own OAuth credentials**
3. 填入刚才获得的 **Client ID** 和 **Client Secret**
4. 在左侧列表找到 **Google Tasks API v1**, 并勾选 `https://www.googleapis.com/auth/tasks`
5. 点击 **Authorize APIs**
6. 使用测试 Google 账号登录并授权
7. 点击 **Exchange authorization code for tokens**
8. 在 **OAuth 2.0 Scopes** 中找到 `refresh_token`, 复制对应的值

## 使用方法

### 初始化和登录

```typescript
import { Taskify } from "@twisuki/google-taskify";

const taskify = new Taskify({
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  refreshToken: "your-refresh-token",
});

// 登录以获取 access token
await taskify.login();
```

> [!WARNING]
> 注意请务必使用 `.env` 存储敏感信息!

### 获取任务列表和任务

```typescript
// 加载所有任务列表
await taskify.loadTaskLists();

// 获取所有列表
const lists = taskify.getTaskLists();
console.log(lists);

// 加载指定列表中的任务
await taskify.loadTasks(listId);

// 获取指定列表中的所有任务
const tasks = taskify.getTasks(listId);
console.log(tasks);
```

### 筛选器使用

本库提供了强大的 `Query` 查询系统, 支持链式调用和多种筛选条件.

```typescript
import { TaskQuery, TaskListQuery } from "@twisuki/google-taskify";

// 创建任务列表查询
const listQuery = new TaskListQuery(lists);

// 按标题精确匹配
listQuery.title("我的任务列表").all();

// 按标题模糊匹配
listQuery.titleLike("工作", "重要").all();

// 创建任务查询
const taskQuery = new TaskQuery(tasks);

// 按完成状态筛选(默认筛选已完成的任务)
taskQuery.done(true).all();   // 已完成
taskQuery.done(false).all();  // 未完成

// 按标题精确匹配
taskQuery.title("买菜").all();

// 按标题模糊匹配
taskQuery.titleLike("会议", "周报").all();

// 按备注模糊匹配
taskQuery.notesLike("https://").all();

// 排序(默认升序)
taskQuery.order("title").all();
taskQuery.order("title", "DESC").all();  // 降序

// 分页
taskQuery.offset(10).limit(5).all();

// 组合使用
taskQuery
  .done(false)              // 未完成
  .titleLike("项目")        // 标题包含"项目"
  .order("title")
  .limit(20)
  .all();
```

### 创建和编辑任务或列表

本库支持两种编辑模式: **本地模式** 和 **同步模式**.

#### 同步模式(直接请求服务器)

```typescript
// 创建任务列表
const newList = await taskify.createTaskList("新列表");

// 在指定列表创建任务
const newTask = await taskify.createTask(listId, "新任务", "这是备注");

// 更新任务列表标题
await taskify.updateTaskList(listId, "更新后的标题");

// 更新任务
await taskify.updateTask(listId, taskId, "更新后的标题");

// 标记任务为已完成/未完成
await taskify.updateTask(listId, taskId, "done", true);

// 删除任务列表
await taskify.deleteTaskList(listId);

// 删除任务
await taskify.deleteTask(listId, taskId);
```

#### 本地模式(离线编辑 + 批量提交)

本地模式允许你先在本地进行多次编辑, 最后一次性提交到服务器.

```typescript
// 在本地创建任务列表(不会立即请求服务器)
const localList = taskify.buildTaskList("本地新列表");

// 在本地创建任务
const localTask = taskify.buildTask(listId, "本地新任务", "备注");

// 编辑本地任务列表
taskify.editTaskList(listId, "新的标题");
// 或者使用函数式写法
taskify.editTaskList(listId, (l) => ({ ...l, title: "新标题" }));

// 编辑本地任务
taskify.editTask(listId, taskId, "新的标题");
// 或者使用函数式写法
taskify.editTask(listId, taskId, (t) => ({ ...t, done: true }));

// 标记为删除(仅本地)
taskify.removeTask(listId, taskId);
taskify.removeTaskList(listId);

// 恢复被标记删除的项目
taskify.restoreTask(listId, taskId);
taskify.restoreTaskList(listId);

// 一次性提交所有本地更改到服务器
await taskify.commit();

// 放弃所有本地更改并重新从服务器加载
await taskify.refresh();
```


## 其他

### 代理配置

本项目使用 [undici](https://github.com/nodejs/undici) 处理 HTTP 请求. 若需配置代理, 请在引入本库之前配置全局的 undici 代理:

```typescript
import { setGlobalDispatcher, ProxyAgent } from "undici";
import { Taskify } from "@twisuki/google-taskify";

// 在引入本库之前配置代理
setGlobalDispatcher(new ProxyAgent("http://your-proxy-url:port"));

const taskify = new Taskify({
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  refreshToken: "your-refresh-token",
});

await taskify.login();
```
