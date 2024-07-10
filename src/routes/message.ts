import Elysia, { t } from "elysia"
import { authMiddleware } from "../middleware/auth"

export const messageRoutes = new Elysia({ prefix: "/message" })
	.use(authMiddleware)
	.ws("/", {
		body: t.Object({
			message: t.String(),
		}),
		open(ws) {
			ws.subscribe("message")
		},
		message(ws, body) {
			console.log(body)
			ws.publish("message", JSON.stringify(body.message))
		},
	})
