import { db } from "@db/connect"
import { userProfile } from "@db/schema/user"
import { eq } from "drizzle-orm"
import Elysia, { t } from "elysia"
import { authMiddleware } from "../middleware/auth"

export const userRoutes = new Elysia({ prefix: "/user" })
	.use(authMiddleware)
	.get("/", async context => {
		const { user } = context
		if (!user) {
			context.set.status = 401
			return {
				status: 401,
				body: "Unauthorized",
			}
		}

		const foundUser = await db
			.select()
			.from(userProfile)
			.where(eq(userProfile.userId, user.id))
			.execute()

		if (!foundUser || foundUser.length === 0) {
			const insertedUser = await db
				.insert(userProfile)
				.values({
					userId: user.id,
					fullName: "",
					profilePicture: "",
					bio: "",
				})
				.returning()
			return {
				status: 200,
				data: insertedUser,
			}
		}

		return {
			status: 200,
			data: foundUser,
		}
	})
	.post(
		"/",
		async context => {
			const { user, body } = context
			if (!user) {
				context.set.status = 401
				return {
					status: 401,
					body: "Unauthorized",
				}
			}

			const foundUser = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, user.id))
				.execute()

			if (!foundUser || foundUser.length === 0) {
				context.set.status = 404
				return {
					status: 404,
					body: "User not found",
				}
			}

			const updatedUser = await db
				.update(userProfile)
				.set({
					fullName: body.fullName,
					profilePicture: body.profilePicture,
					bio: body.bio,
				})
				.where(eq(userProfile.userId, user.id))
				.returning()

			return {
				status: 200,
				data: updatedUser,
			}
		},
		{
			body: t.Object({
				fullName: t.String(),
				profilePicture: t.String(),
				bio: t.String(),
			}),
		},
	)
