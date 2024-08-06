import { db } from "@db/connect"
import { trip } from "@db/schema/trip"
import { eq } from "drizzle-orm"
import Elysia, { t } from "elysia"
import { authMiddleware } from "../../middleware/auth"
import {
	acceptJoinRequest,
	createJoinRequest,
	createTrip,
	deleteTrip,
	generateInvite,
	getTripDetails,
	getTripOverview,
	leaveTrip,
	updateTrip,
} from "./handlers"

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
	.post("/", async context => createTrip(context), {
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
			isPrivate: t.Optional(t.Boolean()),
			communityId: t.Optional(t.Number()),
		}),
	})
	// GET /trip/overview (get 5 most recent trips)
	.get("/overview", async context => getTripOverview(context), {
		query: t.Object({
			page: t.Optional(t.String()),
			limit: t.Optional(t.String()),
		}),
	})
	// POST /trip/join/:id (join a trip)
	.post("/:id/join", async context => createJoinRequest(context), {
		params: t.Object({
			id: t.String(),
		}),
	})
	// POST /trip/join/accept/:requestId (accept a join request)
	.post(
		":id/join/:requestId/accept",
		async context => acceptJoinRequest(context),
		{
			params: t.Object({
				requestId: t.String(),
				id: t.String(),
			}),
		},
	)
	// POST /trip/leave/:id (leave a trip)
	.post("/:id/leave", async context => leaveTrip(context), {
		params: t.Object({
			id: t.String(),
		}),
	})
	// POST /trip/invite/:id (invite a user to a trip)
	.post("/:id/invite", context => generateInvite(context), {
		params: t.Object({
			id: t.Number(),
		}),
	})
	// GET /trip/:id (trip details with members)
	.get("/:id", async context => getTripDetails(context), {
		params: t.Object({
			id: t.String(),
		}),
	})
	// PATCH /trip/:id (update a trip)
	.patch("/:id", async context => updateTrip(context), {
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
	})
	// DELETE /trip/:id (delete a trip)
	.delete("/:id", context => deleteTrip(context), {
		params: t.Object({
			id: t.String(),
		}),
	})
