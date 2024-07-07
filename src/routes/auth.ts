import { db } from "@db/connect"
import { authUser } from "@db/schema/auth"
import { lucia } from "@lib/auth/lucia"
import { eq } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { generateIdFromEntropySize } from "lucia"
import { z } from "zod"

export const authRoutes = new Elysia({ prefix: "/auth" })

const signupParams = z
	.object({
		username: z
			.string({ required_error: "Username is required" })
			.min(3, "Username must be at least 3 characters"),
		email: z.string().email("Invalid email address").toLowerCase(),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string(),
	})
	.superRefine((data, ctx) => {
		if (data.password !== data.confirmPassword)
			ctx.addIssue({
				code: "custom",
				message: "The passwords did not match",
				path: ["confirmPassword"],
			})
	})

authRoutes
	.post(
		"/register",
		async ({ body, set }) => {
			const validatedInput = signupParams.safeParse(body)

			if (!validatedInput.success) {
				set.status = 400
				return {
					error: { fields: validatedInput.error.flatten().fieldErrors },
					data: null,
				}
			}

			try {
				const hashedPassword = await Bun.password.hash(
					validatedInput.data.password,
				)
				const id = generateIdFromEntropySize(16)
				await db
					.insert(authUser)
					.values({
						id,
						username: validatedInput.data.username,
						email: validatedInput.data.email,
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
				confirmPassword: t.String(),
			}),
		},
	)
	.post(
		"/login",
		async ({ body, set }) => {
			const { email, password } = body

			try {
				if (!email || typeof email !== "string") {
					set.status = 400
					return { data: null, error: { message: "Invalid email or password" } }
				}
				if (!password || typeof password !== "string") {
					set.status = 400
					return { data: null, error: { message: "Invalid email or password" } }
				}

				const user = await db
					.select()
					.from(authUser)
					.where(eq(authUser.email, email))
					.execute()

				if (!user || user.length === 0 || !user[0].hashedPassword) {
					set.status = 400
					return { data: null, error: { message: "Invalid email or password" } }
				}

				const validPassword = await Bun.password.verify(
					password,
					user[0].hashedPassword,
				)

				if (!validPassword) {
					set.status = 400
					return { data: null, error: { message: "Invalid email or password" } }
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
