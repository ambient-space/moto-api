import { db } from "@db/connect"
import {
	community,
	communityInvite,
	communityJoinRequest,
	communityMember,
} from "@db/schema/community"
import { generateUniqueInviteCode } from "@lib/shared"
import type { DeepKeys, InferRouteContext } from "@lib/types"
import { count, eq } from "drizzle-orm"
import type { communityRoutes } from "."

type CommunityContext<T extends DeepKeys<(typeof communityRoutes)["_routes"]>> =
	(ctx: InferRouteContext<typeof communityRoutes, T>) => unknown

export const getCommunity: CommunityContext<"community/index/get"> = async ({
	user,
	set,
}) => {
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
}

export const getCommunityOverview: CommunityContext<
	"community/overview/get"
> = async ({ user, set, query }) => {
	if (!user) {
		set.status = 401
		return {
			error: { message: "Unauthorized" },
			data: null,
		}
	}

	const page = Number.parseInt(query.page || "0")
	const limit = Number.parseInt(query.limit || "5")

	const res = await db.transaction(async trx => {
		const communities = await trx
			.select({
				id: community.id,
				name: community.name,
				description: community.description,
			})
			.from(community)
			.offset(page * limit)
			.limit(limit)

		for (let i = 0; i < communities.length; i++) {
			const c = await trx
				.select({ count: count() })
				.from(communityMember)
				.where(eq(communityMember.communityId, communities[i].id))
			const isMember = await trx.query.communityMember.findFirst({
				where: (communityMember, { eq, and }) =>
					and(
						eq(communityMember.userId, user.id),
						eq(communityMember.communityId, communities[i].id),
					),
			})

			// @ts-expect-error error
			communities[i].isMember = isMember !== undefined
			// @ts-expect-error error
			communities[i].memberCount = c[0].count
		}
		return communities
	})

	return {
		data: res,
		error: null,
	}
}

export const generateInvite: CommunityContext<
	"community/:id/invite/post"
> = async ({ user, set, params: { id } }) => {
	if (!user) {
		set.status = 401
		return {
			data: null,
			error: { message: "Unauthorized" },
		}
	}

	let inviteCode = ""
	try {
		inviteCode = await generateUniqueInviteCode("community")
	} catch (e) {
		set.status = 500

		return {
			data: null,
			error: { message: "Failed to generate invite code" },
		}
	}

	try {
		const isUserAdmin = await db.query.community.findFirst({
			where: (community, { eq, and }) =>
				and(
					eq(community.id, Number.parseInt(id)),
					eq(community.createdBy, user.id),
				),
		})

		if (!isUserAdmin) {
			set.status = 403
			return {
				data: null,
				error: { message: "You are not authorized to create an invite" },
			}
		}

		const res = await db
			.insert(communityInvite)
			.values({
				inviteCode,
				communityId: Number.parseInt(id),
				inviterId: user.id,
				expiresAt: new Date(
					Date.now() + 1000 * 60 * 60 * 24 * 7,
				).toDateString(),
			})
			.returning()

		return {
			data: res[0],
			error: null,
		}
	} catch (e) {
		set.status = 500
		return {
			data: null,
			error: { message: "Failed to create an invite" },
		}
	}
}

export const joinCommunity: CommunityContext<
	"community/:id/join/post"
> = async ({ user, params, set }) => {
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

	const community = await db.query.community.findFirst({
		where: (community, { eq }) => eq(community.id, Number.parseInt(id)),
		columns: {
			isPrivate: true,
		},
	})

	if (!community) {
		set.status = 404
		return {
			data: null,
			error: { message: "Community not found" },
		}
	}

	if (community.isPrivate) {
		const joinRequest = await db
			.insert(communityJoinRequest)
			.values({
				userId: user.id,
				communityId: Number.parseInt(id),
			})
			.returning()

		return {
			data: { isPrivate: true, request: joinRequest },
			error: null,
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
		data: { isPrivate: false, member: insertedMember },
		error: null,
	}
}

export const acceptJoinRequest: CommunityContext<
	"community:id/join/:requestId/accept/post"
> = async ({ user, set, params }) => {
	if (!user) {
		set.status = 401
		return {
			data: null,
			error: { message: "Unauthorized" },
		}
	}

	const { id, requestId } = params

	try {
		const community = await db.query.community.findFirst({
			columns: {
				createdBy: true,
			},
			where: (community, { eq }) => eq(community.id, Number.parseInt(id)),
		})

		if (!community || community.createdBy !== user.id) {
			set.status = 401
			return {
				data: null,
				error: { message: "Unauthorized" },
			}
		}

		const joinRequest = await db.query.communityJoinRequest.findFirst({
			where: (communityJoinRequest, { eq }) =>
				eq(communityJoinRequest.id, Number.parseInt(requestId)),
		})

		if (!joinRequest) {
			set.status = 404
			return {
				data: null,
				error: { message: "Join request not found" },
			}
		}

		const insertedMember = await db
			.insert(communityMember)
			.values({
				userId: joinRequest.userId,
				communityId: Number.parseInt(id),
				role: "member",
			})
			.returning()

		await db
			.update(communityJoinRequest)
			.set({ status: "approved" })
			.where(eq(communityJoinRequest.id, Number.parseInt(requestId)))

		return {
			data: insertedMember,
			error: null,
		}
	} catch (e) {
		set.status = 500
		return {
			data: null,
			error: { message: "Failed to accept join request" },
		}
	}
}

export const createCommunity: CommunityContext<
	"community/index/post"
> = async ({ user, set, body }) => {
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
}

export const getCommunityById: CommunityContext<"community/:id/get"> = async ({
	user,
	set,
	params,
}) => {
	if (!user) {
		set.status = 401
		return {
			status: 401,
			body: "Unauthorized",
		}
	}

	const { id } = params

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

	const c = await db
		.select({ count: count() })
		.from(communityMember)
		.where(eq(communityMember.communityId, Number.parseInt(id)))

	const isCurrentUserMember = await db.query.communityMember.findFirst({
		where: (communityMember, { eq, and }) =>
			and(
				eq(communityMember.userId, user.id),
				eq(communityMember.communityId, Number.parseInt(id)),
			),
	})

	return {
		data: {
			isAdmin: isCurrentUserMember?.role === "admin",
			isMember: isCurrentUserMember !== undefined,
			memberCount: c[0].count,
			...foundCommunityWithMembers,
		},
		error: null,
	}
}

export const updateCommunityById: CommunityContext<
	"community/:id/patch"
> = async ({ user, set, params, body }) => {
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
}

export const leaveCommunity: CommunityContext<
	"community/:id/invite/post"
> = async ({ user, set, params }) => {
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

	if (existingMember === undefined) {
		set.status = 400
		return {
			data: null,
			error: { message: "Not a member of this community" },
		}
	}

	const deletedMember = await db
		.delete(communityMember)
		.where(eq(communityMember.id, existingMember.id))
		.returning()
	return {
		data: deletedMember,
		error: null,
	}
}

export const deleteCommunity: CommunityContext<
	"community/:id/delete"
> = async ({ user, set, params }) => {
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
		.where(eq(community.id, Number.parseInt(id)))
		.returning()
	return {
		data: deletedCommunity,
		error: null,
	}
}
