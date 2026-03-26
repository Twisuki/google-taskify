import "dotenv/config"
import { Taskify, TaskListQuery, TaskQuery } from "../src/index.js"

async function main() {
	const taskify = new Taskify({
		refreshToken: process.env.GOOGLE_TASK_REFRESH_TOKEN!,
		clientId: process.env.GOOGLE_TASK_CLIENT_ID!,
		clientSecret: process.env.GOOGLE_TASK_CLIENT_SECRET!,
	})

	await taskify.login()

	const lists = await taskify.loadTaskLists()
	const workList = new TaskListQuery(lists).title("工作").first()

	if (workList) {
		const tasks = await taskify.loadTasks(workList.id)
		console.log("Tasks: ", tasks.map(t => t.title))

		const tasks1 = new TaskQuery(tasks).titleLike("i").all()
		const tasks2 = new TaskQuery(tasks).titleLike("e").all()
		const tasks3 = new TaskQuery(tasks).or(
			q => q.titleLike("i"),
			q => q.titleLike("e"),
		).all()

		console.log("1: ", tasks1.map(t => t.title))
		console.log("2: ", tasks2.map(t => t.title))
		console.log("3: ", tasks3.map(t => t.title))
	}
	else {
		console.log("无对应列表")
	}
}

main().catch(err => {
	console.error(err)
	process.exit(1)
})
