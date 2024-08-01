import { db } from "@db/connect"
import { trip, tripParticipant } from "@db/schema/trip"
import { and, count, eq } from "drizzle-orm"
import Elysia, { t } from "elysia"
import { authMiddleware } from "../middleware/auth"

const DEFAULT_MAX_PARTICIPANTS = 5

export const tripRoutes = new Elysia({ prefix: "/trip" })
	.use(authMiddleware)
	// GET /trip (get all trips)
	.get("/", async ({ user, set }) => {
		if (!user) {
			set.status = 401
			return {
				error: { message: "Unauthorized" },
				data: null,
			}
		}

		const foundTrips = await db
			.select()
			.from(trip)
			.where(eq(trip.createdBy, user.id))
			.execute()

		return {
			data: foundTrips,
			error: null,
		}
	})
	// POST /trip (create a trip)
	.post(
		"/",
		async ({ user, body, set }) => {
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
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.String(),
				startDate: t.String(),
				endDate: t.Optional(t.String()),
				maxParticipants: t.Optional(t.Number()),
				// startLocation: t.Optional(
				// 	t.Object({
				// 		lat: t.Number(),
				// 		lng: t.Number(),
				// 	}),
				// ),
				// endLocation: t.Optional(
				// 	t.Object({
				// 		lat: t.Number(),
				// 		lng: t.Number(),
				// 	}),
				// ),
				startLocation: t.String(),
				endLocation: t.Optional(t.String()),
				route: t.Optional(
					t.Array(
						t.Object({
							lat: t.Number(),
							lng: t.Number(),
						}),
					),
				),
				communityId: t.Optional(t.Number()),
			}),
		},
	)
	// GET /trip/overview (get 5 most recent trips)
	.get(
		"/overview",
		async ({ user, set, query }) => {
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
		},
		{
			query: t.Object({
				page: t.Optional(t.String()),
				limit: t.Optional(t.String()),
			}),
		},
	)
	// POST /trip/join/:id (join a trip)
	.post(
		"/join/:id",
		async ({ user, params, set }) => {
			if (!user) {
				set.status = 401
				return {
					data: null,
					error: { message: "Unauthorized" },
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

			if (existingMember !== undefined) {
				set.status = 400
				return {
					data: null,
					error: { message: "Already a member of this trip" },
				}
			}

			const insertedMember = await db
				.insert(tripParticipant)
				.values({
					userId: user.id,
					tripId: Number.parseInt(id),
					role: "participant",
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
		"/leave/:id",
		async ({ user, params, set }) => {
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
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	// GET /trip/:id (trip details with members)
	.get(
		"/:id",
		async ({ user, params: { id }, set }) => {
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

			const isCurrentUserParticipant = await db.query.tripParticipant.findFirst(
				{
					where: (tripParticipant, { eq, and }) =>
						and(
							eq(tripParticipant.userId, user.id),
							eq(tripParticipant.tripId, Number.parseInt(id)),
						),
				},
			)

			return {
				data: {
					isAdmin: isCurrentUserParticipant?.role === "organizer",
					isParticipant: isCurrentUserParticipant !== undefined,
					memberCount: c[0].count,
					...foundTripWithParticipants,
				},
				error: null,
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	// PATCH /trip/:id (update a trip)
	.patch(
		"/:id",
		async ({ user, body, set, params: { id } }) => {
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
					.where(
						and(eq(trip.id, Number.parseInt(id)), eq(trip.createdBy, user.id)),
					)
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
		},
		{
			body: t.Object({
				name: t.Optional(t.String()),
				description: t.Optional(t.String()),
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
				// startLocation: t.Optional(
				// 	t.Object({
				// 		lat: t.Number(),
				// 		lng: t.Number(),
				// 	}),
				// ),
				// endLocation: t.Optional(
				// 	t.Object({
				// 		lat: t.Number(),
				// 		lng: t.Number(),
				// 	}),
				// ),
				startLocation: t.Optional(t.String()),
				endLocation: t.Optional(t.String()),
				maxParticipants: t.Optional(t.Number()),
				route: t.Optional(
					t.Array(
						t.Object({
							lat: t.Number(),
							lng: t.Number(),
						}),
					),
				),
				communityId: t.Optional(t.Number()),
			}),
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	// DELETE /trip/:id (delete a trip)
	.delete(
		"/:id",
		async ({ user, set, params: { id } }) => {
			if (!user) {
				set.status = 401
				return {
					data: null,
					error: { message: "Unauthorized" },
				}
			}

			await db
				.delete(trip)
				.where(
					and(eq(trip.id, Number.parseInt(id)), eq(trip.createdBy, user.id)),
				)

			return set.status === 204
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
