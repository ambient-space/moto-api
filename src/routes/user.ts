import { db } from "@db/connect"
import { userProfile } from "@db/schema/user"
import type { ExtendedContext } from "@lib/types"
import { eq } from "drizzle-orm"
import Elysia, { type Context } from "elysia"

export const userRoutes = new Elysia({ prefix: "/user" })

userRoutes.get("/", async (context: Context & ExtendedContext) => {
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
