import { lucia } from "@lib/auth/lucia"
import Elysia from "elysia"

export const authMiddleware = new Elysia().derive(
	{ as: "global" },
	async context => {
		// CSRF check
		// if (context.request.method !== "GET") {
		// 	const originHeader = context.request.headers.get("Origin")
		// 	// NOTE: You may need to use `X-Forwarded-Host` instead
		// 	const hostHeader = context.request.headers.get("Host")
		// 	if (
		// 		!originHeader ||
		// 		!hostHeader ||
		// 		!verifyRequestOrigin(originHeader, [hostHeader])
		// 	) {
		// 		return {
		// 			user: null,
		// 			session: null,
		// 		}
		// 	}
		// }

		// use headers instead of Cookie API to prevent type coercion
		const sessionHeader = context.request.headers.get("Authorization") ?? ""
		const sessionId = lucia.readBearerToken(sessionHeader)
		if (!sessionId) {
			return {
				user: null,
				session: null,
			}
		}

		const { session, user } = await lucia.validateSession(sessionId)
		if (session?.fresh) {
		}
		return {
			user,
			session,
		}
	},
)
