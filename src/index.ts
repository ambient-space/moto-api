import Elysia from "elysia"
import { assetRoutes } from "./routes/asset"
import { authRoutes } from "./routes/auth"
import { communityRoutes } from "./routes/community"
import { messageRoutes } from "./routes/message"
import { tripRoutes } from "./routes/trip"
import { userRoutes } from "./routes/user"

const app = new Elysia()
	.use(authRoutes)
	.use(userRoutes)
	.use(tripRoutes)
	.use(communityRoutes)
	.use(messageRoutes)
	.use(assetRoutes)
	.get("/", () => ({ data: { status: "ok" }, error: null }))
	.listen(3000)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
