import { db } from "@db/connect"
import { trip } from "@db/schema/trip"
import { and, eq } from "drizzle-orm"
import Elysia, { t } from "elysia"
import { authMiddleware } from "../middleware/auth"

const DEFAULT_MAX_PARTICIPANTS = 5

export const tripRoutes = new Elysia({ prefix: "/trip" })
	.use(authMiddleware)
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

			const { maxParticipants, ...data } = body

			const insertedTrip = await db
				.insert(trip)
				.values({
					maxParticipants: maxParticipants || DEFAULT_MAX_PARTICIPANTS,
					createdBy: user.id,
					startLocation: { lat: 0, lng: 0 },
					...data,
				})
				.returning()

			return {
				data: insertedTrip,
				error: null,
			}
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.String(),
				startDate: t.String(),
				endDate: t.Optional(t.String()),
				maxParticipants: t.Optional(t.Number()),
				startLocation: t.Optional(
					t.Object({
						lat: t.Number(),
						lng: t.Number(),
					}),
				),
				endLocation: t.Optional(
					t.Object({
						lat: t.Number(),
						lng: t.Number(),
					}),
				),
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
	.get("/overview", async ({ user, set }) => {
		if (!user) {
			set.status = 401
			return {
				error: { message: "Unauthorized" },
				data: null,
			}
		}

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
				.limit(5)

			for (let i = 0; i < trips.length; i++) {
				const m = await trx
					.select({
						id: tripParticipant.id,
						userId: tripParticipant.userId,
						tripId: tripParticipant.tripId,
					})
					.from(tripParticipant)
					.where(eq(tripParticipant.tripId, trips[i].id))
					.limit(3)
				const c = await trx
					.select({ count: count() })
					.from(tripParticipant)
					.where(eq(tripParticipant.tripId, trips[i].id))

				// @ts-expect-error error
				trips[i].participants = m
				// @ts-expect-error error
				trips[i].participantCount = c[0].count
			}
			return trips
		})

		return {
			data: res,
			error: null,
		}
	})
	// POST /trip/join/:id (join a trip)
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
					},
				},
			})

			return {
				data: foundTripWithParticipants,
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
		async ({ user, body, set, params: { id } }) => {
			if (!user) {
				set.status = 401
				return {
					status: 401,
					body: "Unauthorized",
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
				startLocation: t.Optional(
					t.Object({
						lat: t.Number(),
						lng: t.Number(),
					}),
				),
				endLocation: t.Optional(
					t.Object({
						lat: t.Number(),
						lng: t.Number(),
					}),
				),
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
	.delete(
		"/:id",
		async ({ user, set, params: { id } }) => {
			if (!user) {
				set.status = 401
				return {
					status: 401,
					body: "Unauthorized",
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
