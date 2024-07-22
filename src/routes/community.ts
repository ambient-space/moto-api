import { db } from "@db/connect"
import { community, communityMember } from "@db/schema/community"
import { count, eq } from "drizzle-orm"
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
	.get("/overview", async ({ user, set }) => {
		if (!user) {
			set.status = 401
			return {
				error: { message: "Unauthorized" },
				data: null,
			}
		}

		const res = await db.transaction(async trx => {
			const communities = await trx
				.select({
					id: community.id,
					name: community.name,
					profilePicture: community.profilePicture,
					coverImage: community.coverImage,
					description: community.description,
				})
				.from(community)
				.limit(5)

			for (let i = 0; i < communities.length; i++) {
				const m = await trx
					.select({
						id: communityMember.id,
						userId: communityMember.userId,
						role: communityMember.role,
						communityId: communityMember.communityId,
					})
					.from(communityMember)
					.where(eq(communityMember.communityId, communities[i].id))
					.limit(3)
				const c = await trx
					.select({ count: count() })
					.from(communityMember)
					.where(eq(communityMember.communityId, communities[i].id))

				// @ts-expect-error error
				communities[i].members = m
				// @ts-expect-error error
				communities[i].memberCount = c[0].count
			}
			return communities
		})

		return {
			data: res,
			error: null,
		}
	})
	.post(
		"/join/:id",
		async ({ user, params, set }) => {
			if (!user) {
				set.status = 401
				return {
					status: 401,
					body: "Unauthorized",
				}
			}
			const { id } = params
			const existingMember = await db.query.communityMember.findFirst({
				where: (communityMember, { eq, and }) =>
					and(
						eq(communityMember.userId, user.id),
						eq(communityMember.communityId, Number.parseInt(id)),
					),
			})

			if (existingMember !== undefined) {
				set.status = 400
				return {
					data: null,
					error: { message: "Already a member of this community" },
				}
			}

			const insertedMember = await db
				.insert(communityMember)
				.values({
					communityId: Number.parseInt(id),
					userId: user.id,
					role: "member",
				})
				.returning()
			return {
				data: insertedMember,
				error: null,
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
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
			const insertedCommunity = await db
				.insert(community)
				.values({
					...body,
					createdBy: user.id,
				})
				.returning()

			await db.insert(communityMember).values({
				communityId: insertedCommunity[0].id,
				userId: user.id,
				role: "admin",
			})
			return {
				data: insertedCommunity[0],
				error: null,
			}
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.String(),
				isPrivate: t.Optional(t.Boolean()),
				profilePicture: t.Optional(t.String()),
				coverImage: t.Optional(t.String()),
			}),
		},
	)
	.get(
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
			// const isUserMember = await db.query.communityMember.findFirst({
			// 	where: (communityMember, { eq, and }) =>
			// 		and(
			// 			eq(communityMember.userId, user.id),
			// 			eq(communityMember.communityId, Number.parseInt(id)),
			// 		),
			// })

			// if (!isUserMember) {
			// 	set.status = 401
			// 	return {
			// 		status: 401,
			// 		body: "Unauthorized",
			// 	}
			// }

			const foundCommunityWithMembers = await db.query.community.findFirst({
				where: (community, { eq }) => eq(community.id, Number.parseInt(id)),
				with: {
					trips: {
						where: (trip, { eq }) => eq(trip.communityId, Number.parseInt(id)),
					},
					members: {
						where: (communityMember, { eq }) =>
							eq(communityMember.communityId, Number.parseInt(id)),
						with: {
							profile: {
								columns: {
									fullName: true,
									profilePicture: true,
								},
							},
						},
					},
				},
			})

			return {
				data: foundCommunityWithMembers,
				error: null,
			}
		},
		{
			params: t.Object({
				id: t.String(),
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
