import { db } from "@db/connect"
import { message } from "@db/schema/community"
import Elysia, { t } from "elysia"
import { authMiddleware } from "../middleware/auth"

export const messageRoutes = new Elysia({ prefix: "/message" })
	.use(authMiddleware)
	.ws("/:id", {
		body: t.Object({
			message: t.Object({
				text: t.String(),
				user: t.Object({
					_id: t.String(),
					name: t.String(),
				}),
				createdAt: t.String(),
				_id: t.String(),
			}),
			community: t.String(),
		}),
		async open(ws) {
			if (!ws.data.user) {
				ws.close()
			}
			const { id } = ws.data.params
			if (!ws.data.user) return

			const { user } = ws.data

			const isMemberOfCommunity = await db.query.communityMember.findFirst({
				where: (communityMember, { eq, and }) =>
					and(
						eq(communityMember.userId, user.id),
						eq(communityMember.communityId, Number.parseInt(id)),
					),
			})

			if (!isMemberOfCommunity) {
				ws.close()
			}
			ws.subscribe(ws.data.params.id)
		},
		async message(ws, body) {
			const { user } = ws.data
			if (!user) return
			try {
				await db.insert(message).values({
					content: body.message.text,
					uuid: body.message._id,
					senderId: user.id,
					sentAt: body.message.createdAt,
					communityId: Number.parseInt(ws.data.params.id),
				})
				ws.publish(ws.data.params.id, JSON.stringify(body))
			} catch (e) {
				console.error(e)
			}
		},
	})
	.get("/:id", async ({ user, params, set }) => {
		if (!user) {
			set.status = 401
			return {
				data: null,
				error: { message: "Unauthorized access" },
			}
		}
		const { id } = params

		try {
			const isMemberOfCommunity = await db.query.communityMember.findFirst({
				where: (communityMember, { eq, and }) =>
					and(
						eq(communityMember.userId, user.id),
						eq(communityMember.communityId, Number.parseInt(id)),
					),
			})

			if (!isMemberOfCommunity) {
				set.status = 400
				return {
					data: null,
					error: { message: "Not a member of this community" },
				}
			}

			const messages = await db.query.message.findMany({
				where: (message, { eq }) =>
					eq(message.communityId, Number.parseInt(id)),
				with: { senderProfile: true },
				orderBy: (messages, { desc }) => [desc(messages.id)],
			})

			const parsedMessages = messages.map(message => ({
				_id: message.uuid,
				text: message.content,
				createdAt: message.sentAt,
				user: {
					_id: message.senderId,
					name: message.senderProfile?.fullName || "Unknown",
				},
			}))

			return {
				data: parsedMessages,
				error: null,
			}
		} catch (e) {
			console.error(e)
			set.status = 500
			return {
				error: e,
				data: null,
			}
		}
	})
