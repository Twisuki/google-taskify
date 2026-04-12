import "dotenv/config"
import { Taskify, TaskListFilter, TaskFilter } from "../src/index.js"

async function main() {
	const taskify = new Taskify({
		refreshToken: process.env.GOOGLE_TASK_REFRESH_TOKEN!,
		clientId: process.env.GOOGLE_TASK_CLIENT_ID!,
		clientSecret: process.env.GOOGLE_TASK_CLIENT_SECRET!,
	})

	await taskify.login()

	const lists = await taskify.loadTaskLists()
	const list = new TaskListFilter(lists).titleLike("测试").first()

	if (list) {
		const tasks = await taskify.loadTasks(list.id)
		const task = new TaskFilter(tasks).titleLike("测试").first()

		if (task) {
			taskify.editTask(list.id, task.id, t => ({
				...t,
				title: "修改后的测试任务",
			}))
		}
	}

	await taskify.commit()
}

main().catch(err => {
	console.error(err)
	process.exit(1)
})
