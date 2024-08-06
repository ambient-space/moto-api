import Elysia, { t } from "elysia"
import { authMiddleware } from "../../middleware/auth"
import {
	acceptJoinRequest,
	createCommunity,
	deleteCommunity,
	generateInvite,
	getCommunity,
	getCommunityById,
	getCommunityOverview,
	joinCommunity,
	leaveCommunity,
	updateCommunityById,
} from "./handlers"

export const communityRoutes = new Elysia({ prefix: "/community" })
	.use(authMiddleware)
	.get("/", async context => getCommunity(context))
	.get("/overview", async context => getCommunityOverview(context), {
		query: t.Object({
			page: t.Optional(t.String()),
			limit: t.Optional(t.String()),
		}),
	})
	.post("/:id/join", async context => joinCommunity(context), {
		params: t.Object({
			id: t.String(),
		}),
	}) // POST /trip/join/accept/:requestId (accept a join request)
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
	.post("/:id/leave", async context => leaveCommunity(context), {
		params: t.Object({
			id: t.String(),
		}),
	})
	.post("/", async context => createCommunity(context), {
		body: t.Object({
			name: t.String(),
			description: t.String(),
			isPrivate: t.Optional(t.Boolean()),
			coverImage: t.Optional(t.String()),
		}),
	})
	.post("/:id/invite", context => generateInvite(context), {
		params: t.Object({
			id: t.String(),
		}),
	})
	.get("/:id", async context => getCommunityById(context), {
		params: t.Object({
			id: t.String(),
		}),
	})
	.patch("/:id", async context => updateCommunityById(context), {
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
	})
	.delete("/:id", async context => deleteCommunity(context), {
		params: t.Object({
			id: t.String(),
		}),
	})
