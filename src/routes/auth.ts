import { db } from "@db/connect"
import { authUser } from "@db/schema/auth"
import { lucia } from "@lib/auth/lucia"
import { isValidEmail } from "@lib/shared"
import { eq } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { generateIdFromEntropySize } from "lucia"

export const authRoutes = new Elysia({ prefix: "/auth" })

authRoutes
	.post(
		"/register",
		async ({ body, set }) => {
			const { username, email, password } = body

			try {
				if (!email || typeof email !== "string" || !isValidEmail(email)) {
					return new Response("Invalid email", {
						status: 400,
					})
				}
				if (!password || typeof password !== "string" || password.length < 6) {
					return new Response("Invalid password", {
						status: 400,
					})
				}
				if (!username || typeof username !== "string" || username.length < 3) {
					return new Response("Invalid username", {
						status: 400,
					})
				}
				const hashedPassword = await Bun.password.hash(password)
				const id = generateIdFromEntropySize(16)
				await db
					.insert(authUser)
					.values({
						id,
						username,
						email,
						hashedPassword,
					})
					.execute()

				const session = await lucia.createSession(id, {})

				return {
					data: {
						session: session.id,
					},
					error: null,
				}
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			} catch (e: any) {
				set.status = 400
				return { data: null, error: { message: e.message } }
			}
		},
		{
			body: t.Object({
				username: t.String(),
				email: t.String(),
				password: t.String(),
			}),
		},
	)
	.post(
		"/login",
		async ({ body, set }) => {
			const { email, password } = body

			try {
				if (!email || typeof email !== "string") {
					return new Response("Invalid email", {
						status: 400,
					})
				}
				if (!password || typeof password !== "string") {
					return new Response(null, {
						status: 400,
					})
				}

				const user = await db
					.select()
					.from(authUser)
					.where(eq(authUser.email, email))
					.execute()

				if (!user || user.length === 0 || !user[0].hashedPassword) {
					return new Response("Invalid email or password", {
						status: 400,
					})
				}

				const validPassword = await Bun.password.verify(
					password,
					user[0].hashedPassword,
				)

				if (!validPassword) {
					return new Response("Invalid email or password", {
						status: 400,
					})
				}

				const session = await lucia.createSession(user[0].id, {})

				return {
					data: {
						session: session.id,
					},
					error: null,
				}
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			} catch (e: any) {
				set.status = 400
				return { data: null, error: { message: e.message } }
			}
		},
		{
			body: t.Object({
				email: t.String(),
				password: t.String(),
			}),
		},
	)
