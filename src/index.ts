import Elysia from "elysia"
import { authRoutes } from "./routes/auth"
import { communityRoutes } from "./routes/community"
import { tripRoutes } from "./routes/trip"
import { userRoutes } from "./routes/user"

const app = new Elysia()
	.use(authRoutes)
	.use(userRoutes)
	.use(tripRoutes)
	.use(communityRoutes)
	.get("/", () => ({ data: { status: "ok" }, error: null }))
	.listen(3000)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
