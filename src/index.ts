import Elysia from "elysia"
import { authRoutes } from "./routes/auth"
import { userRoutes } from "./routes/user"

const app = new Elysia()
	.use(authRoutes)
	.use(userRoutes)
	.get("/", () => "Hello Elysia")
	.listen(3000)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
