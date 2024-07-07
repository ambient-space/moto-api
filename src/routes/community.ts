import { db } from "@db/connect"
import { community } from "@db/schema/community"
import { eq } from "drizzle-orm"
import Elysia, { t } from "elysia"
import { authMiddleware } from "../middleware/auth"

export const communityRoutes = new Elysia({ prefix: "/community" })
	.use(authMiddleware)
	.get("/", async ({ user, set }) => {
		if (!user) {
			set.status = 401
			return {
				error: { message: "Unauthorized" },
				data: null,
			}
		}
		const foundCommunities = await db.select().from(community)
		return {
			data: foundCommunities,
			error: null,
		}
	})
	.post(
		"/",
		async ({ user, body, set }) => {
			if (!user) {
				set.status = 401
				return {
					status: 401,
					body: "Unauthorized",
				}
			}
			const { ...data } = body
			const insertedCommunity = await db
				.insert(community)
				.values({
					...data,
					createdBy: user.id,
				})
				.returning()
			return {
				data: insertedCommunity,
				error: null,
			}
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.String(),
				isPrivate: t.Optional(t.Boolean()),
				profilePicture: t.String(),
				coverImage: t.String(),
			}),
		},
	)
	.patch(
		"/:id",
		async ({ user, body, params, set }) => {
			if (!user) {
				set.status = 401
				return {
					status: 401,
					body: "Unauthorized",
				}
			}
			const { id } = params
			const { ...data } = body
			const updatedCommunity = await db
				.update(community)
				.set(data)
				.where(eq(community.id, id))
				.returning()
			return {
				data: updatedCommunity,
				error: null,
			}
		},
		{
			body: t.Object({
				name: t.Optional(t.String()),
				description: t.Optional(t.String()),
				isPrivate: t.Optional(t.Boolean()),
				profilePicture: t.Optional(t.String()),
				coverImage: t.Optional(t.String()),
			}),
			params: t.Object({
				id: t.Number(),
			}),
		},
	)
	.delete(
		"/:id",
		async ({ user, params, set }) => {
			if (!user) {
				set.status = 401
				return {
					status: 401,
					body: "Unauthorized",
				}
			}
			const { id } = params
			const deletedCommunity = await db
				.delete(community)
				.where(eq(community.id, id))
				.returning()
			return {
				data: deletedCommunity,
				error: null,
			}
		},
		{
			params: t.Object({
				id: t.Number(),
			}),
		},
	)
