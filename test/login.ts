import "dotenv/config"
import { Taskify } from "../src/index.js"

async function main() {
	const taskify = new Taskify({
		refreshToken: process.env.GOOGLE_TASK_REFRESH_TOKEN!,
		clientId: process.env.GOOGLE_TASK_CLIENT_ID!,
		clientSecret: process.env.GOOGLE_TASK_CLIENT_SECRET!,
	})

	await taskify.login()

	const lists = await taskify.loadTaskLists()

	console.log(lists)
}

main().catch(err => {
	console.error(err)
	process.exit(1)
})

