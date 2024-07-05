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

			const { startDate, endDate, maxParticipants, ...data } = body

			const insertedTrip = await db
				.insert(trip)
				.values({
					startDate: new Date(startDate),
					maxParticipants: maxParticipants || DEFAULT_MAX_PARTICIPANTS,
					createdBy: user.id,
					startLocation: { lat: 0, lng: 0 },
					...(endDate ? { endDate: new Date(endDate) } : {}),
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

			const { startDate, endDate, ...data } = body

			const updatedTrip = await db
				.update(trip)
				.set({
					...data,
					...(startDate ? { startDate: new Date(startDate) } : {}),
					...(endDate ? { endDate: new Date(endDate) } : {}),
				})
				.where(
					and(eq(trip.id, Number.parseInt(id)), eq(trip.createdBy, user.id)),
				)
				.returning()

			return {
				data: updatedTrip,
				error: null,
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
