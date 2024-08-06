import { db } from "@db/connect"
import {
	trip,
	tripInvite,
	tripJoinRequest,
	tripParticipant,
} from "@db/schema/trip"
import { generateUniqueInviteCode } from "@lib/shared"
import type { DeepKeys, InferRouteContext } from "@lib/types"
import { and, count, eq } from "drizzle-orm"
import type { tripRoutes } from "."

const DEFAULT_MAX_PARTICIPANTS = 5

type TripContext<T extends DeepKeys<(typeof tripRoutes)["_routes"]>> = (
	ctx: InferRouteContext<typeof tripRoutes, T>,
) => unknown

export const generateInvite: TripContext<"trip/:id/invite/post"> = async ({
	user,
	set,
	params: { id },
}) => {
	if (!user) {
		set.status = 401
		return {
			data: null,
			error: { message: "Unauthorized" },
		}
	}

	let inviteCode = ""
	try {
		inviteCode = await generateUniqueInviteCode("trip")
	} catch (e) {
		set.status = 500

		return {
			data: null,
			error: { message: "Failed to generate invite code" },
		}
	}

	try {
		const isUserAdmin = await db.query.trip.findFirst({
			where: (trip, { eq, and }) =>
				and(eq(trip.id, id), eq(trip.createdBy, user.id)),
		})

		if (!isUserAdmin) {
			set.status = 403
			return {
				data: null,
				error: { message: "You are not authorized to create an invite" },
			}
		}

		const res = await db
			.insert(tripInvite)
			.values({
				inviteCode,
				tripId: id,
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

export const createTrip: TripContext<"trip/index/post"> = async ({
	user,
	set,
	body,
}) => {
	if (!user) {
		set.status = 401
		return {
			data: null,
			error: { message: "Unauthorized" },
		}
	}

	const { maxParticipants, ...data } = body

	try {
		const insertedTrip = await db
			.insert(trip)
			.values({
				maxParticipants: maxParticipants || DEFAULT_MAX_PARTICIPANTS,
				createdBy: user.id,
				...data,
			})
			.returning()

		await db.insert(tripParticipant).values({
			userId: user.id,
			tripId: insertedTrip[0].id,
			role: "organizer",
		})

		return {
			data: insertedTrip[0],
			error: null,
		}
	} catch (e) {
		console.error(e)
		return {
			data: null,
			error: e,
		}
	}
}

export const updateTrip: TripContext<"trip/:id/patch"> = async ({
	user,
	set,
	params: { id },
	body,
}) => {
	if (!user) {
		set.status = 401
		return {
			data: null,
			error: { message: "Unauthorized" },
		}
	}

	try {
		const updatedTrip = await db
			.update(trip)
			.set({
				...body,
			})
			.where(and(eq(trip.id, Number.parseInt(id)), eq(trip.createdBy, user.id)))
			.returning()

		return {
			data: updatedTrip,
			error: null,
		}
	} catch (e) {
		console.error(e)
		return {
			data: null,
			error: e,
		}
	}
}

export const getTripDetails: TripContext<"trip/:id/get"> = async ({
	user,
	set,
	params: { id },
}) => {
	if (!user) {
		set.status = 401
		return {
			error: { message: "Unauthorized" },
			data: null,
		}
	}

	const foundTripWithParticipants = await db.query.trip.findFirst({
		where: (trip, { eq }) => eq(trip.id, Number.parseInt(id)),
		with: {
			participants: {
				where: (tripParticipant, { eq }) =>
					eq(tripParticipant.tripId, Number.parseInt(id)),
				with: {
					profile: true,
				},
			},
			community: {
				columns: {
					name: true,
					description: true,
					id: true,
				},
			},
		},
	})

	const c = await db
		.select({ count: count() })
		.from(tripParticipant)
		.where(eq(tripParticipant.tripId, Number.parseInt(id)))

	const isCurrentUserParticipant = await db.query.tripParticipant.findFirst({
		where: (tripParticipant, { eq, and }) =>
			and(
				eq(tripParticipant.userId, user.id),
				eq(tripParticipant.tripId, Number.parseInt(id)),
			),
	})

	return {
		data: {
			isAdmin: isCurrentUserParticipant?.role === "organizer",
			isParticipant: isCurrentUserParticipant !== undefined,
			memberCount: c[0].count,
			...foundTripWithParticipants,
		},
		error: null,
	}
}

export const acceptJoinRequest: TripContext<
	"trip:id/join/:requestId/accept/post"
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
		const trip = await db.query.trip.findFirst({
			columns: {
				createdBy: true,
			},
			where: (trip, { eq }) => eq(trip.id, Number.parseInt(id)),
		})

		if (!trip || trip.createdBy !== user.id) {
			set.status = 401
			return {
				data: null,
				error: { message: "Unauthorized" },
			}
		}

		const joinRequest = await db.query.tripJoinRequest.findFirst({
			where: (tripJoinRequest, { eq }) =>
				eq(tripJoinRequest.id, Number.parseInt(requestId)),
		})

		if (!joinRequest) {
			set.status = 404
			return {
				data: null,
				error: { message: "Join request not found" },
			}
		}

		const insertedParticipant = await db
			.insert(tripParticipant)
			.values({
				userId: joinRequest.userId,
				tripId: Number.parseInt(id),
				role: "participant",
			})
			.returning()

		await db
			.update(tripJoinRequest)
			.set({ status: "approved" })
			.where(eq(tripJoinRequest.id, Number.parseInt(requestId)))

		return {
			data: insertedParticipant,
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
export const getTripOverview: TripContext<"trip/overview/get"> = async ({
	user,
	set,
	query,
}) => {
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
		const trips = await trx
			.select({
				id: trip.id,
				name: trip.name,
				description: trip.description,
				startDate: trip.startDate,
				startLocation: trip.startLocation,
				endLocation: trip.endLocation,
			})
			.from(trip)
			.offset(page * limit)
			.limit(limit)

		for (let i = 0; i < trips.length; i++) {
			const c = await trx
				.select({ count: count() })
				.from(tripParticipant)
				.where(eq(tripParticipant.tripId, trips[i].id))

			const isParticipant = await trx.query.tripParticipant.findFirst({
				where: (tripParticipant, { eq, and }) =>
					and(
						eq(tripParticipant.userId, user.id),
						eq(tripParticipant.tripId, trips[i].id),
					),
			})

			// @ts-expect-error error
			trips[i].isParticipant = isParticipant !== undefined
			// @ts-expect-error error
			trips[i].participantCount = c[0].count
		}
		return trips
	})

	return {
		data: res,
		error: null,
	}
}

export const createJoinRequest: TripContext<"trip/:id/join/post"> = async ({
	user,
	set,
	params,
}) => {
	{
		// Check if user is authenticated
		if (!user) {
			set.status = 401
			return {
				data: null,
				error: { message: "Unauthorized" },
			}
		}
		const { id } = params
		// Check if user is already a participant of the trip
		const existingMember = await db.query.tripParticipant.findFirst({
			where: (tripParticipant, { eq, and }) =>
				and(
					eq(tripParticipant.userId, user.id),
					eq(tripParticipant.tripId, Number.parseInt(id)),
				),
		})

		if (existingMember !== undefined) {
			set.status = 400
			return {
				data: null,
				error: { message: "Already a participant of this trip" },
			}
		}

		// Check if user has already sent a join request
		const existingJoinRequest = await db.query.tripJoinRequest.findFirst({
			where: (tripJoinRequest, { eq, and }) =>
				and(
					eq(tripJoinRequest.userId, user.id),
					eq(tripJoinRequest.tripId, Number.parseInt(id)),
				),
		})

		if (existingJoinRequest !== undefined) {
			set.status = 400
			return {
				data: null,
				error: { message: "Join request already sent" },
			}
		}

		// Check if the trip is private
		const trip = await db.query.trip.findFirst({
			where: (trip, { eq }) => eq(trip.id, Number.parseInt(id)),
			columns: {
				isPrivate: true,
			},
		})

		// If trip is not found
		if (!trip) {
			set.status = 404
			return {
				data: null,
				error: { message: "Trip not found" },
			}
		}

		// If trip is private, create a join request
		if (trip.isPrivate) {
			const joinRequest = await db
				.insert(tripJoinRequest)
				.values({
					userId: user.id,
					tripId: Number.parseInt(id),
				})
				.returning()

			return {
				data: { isPrivate: true, request: joinRequest },
				error: null,
			}
		}

		// If trip is public, add user as a participant
		const insertedMember = await db
			.insert(tripParticipant)
			.values({
				userId: user.id,
				tripId: Number.parseInt(id),
				role: "participant",
			})
			.returning()
		return {
			data: { isPrivate: false, member: insertedMember },
			error: null,
		}
	}
}

export const leaveTrip: TripContext<"trip/:id/leave/post"> = async ({
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
	const existingMember = await db.query.tripParticipant.findFirst({
		where: (tripParticipant, { eq, and }) =>
			and(
				eq(tripParticipant.userId, user.id),
				eq(tripParticipant.tripId, Number.parseInt(id)),
			),
	})

	if (existingMember === undefined) {
		set.status = 400
		return {
			data: null,
			error: { message: "Not a participant of this trip" },
		}
	}

	const deletedMember = await db
		.delete(tripParticipant)
		.where(eq(tripParticipant.id, existingMember.id))
		.returning()
	return {
		data: deletedMember,
		error: null,
	}
}

export const deleteTrip: TripContext<"trip/:id/delete"> = async ({
	user,
	set,
	params: { id },
}) => {
	if (!user) {
		set.status = 401
		return {
			data: null,
			error: { message: "Unauthorized" },
		}
	}

	await db
		.delete(trip)
		.where(and(eq(trip.id, Number.parseInt(id)), eq(trip.createdBy, user.id)))

	return set.status === 204
}
