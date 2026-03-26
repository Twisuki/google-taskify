import "dotenv/config"
import { Taskify } from "../src/index.js"

async function main() {
	const taskify = new Taskify({
		refreshToken: process.env.GOOGLE_TASK_REFRESH_TOKEN!,
		clientId: process.env.GOOGLE_TASK_CLIENT_ID!,
		clientSecret: process.env.GOOGLE_TASK_CLIENT_SECRET!,
	})

	await taskify.login()

	const list = taskify.buildTaskList("测试列表")
	const task = taskify.buildTask(list.id, "测试任务", "我是描述")
	console.log({ ...list })

	await taskify.commit()

	console.log({ ...list })
}

main().catch(err => {
	console.error(err)
	process.exit(1)
})

