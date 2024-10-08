import { db } from "@db/connect"
import { authUser } from "@db/schema/auth"
import { userProfile, userVehicles } from "@db/schema/user"
import { eq } from "drizzle-orm"
import Elysia, { t } from "elysia"
import { omit } from "lodash"
import { authMiddleware } from "../middleware/auth"

export const userRoutes = new Elysia({ prefix: "/user" })
	.use(authMiddleware)
	.get("/", async context => {
		const { user } = context
		if (!user) {
			context.set.status = 401
			return {
				error: { message: "Unauthorized" },
				data: null,
			}
		}

		try {
			const foundUser = await db.query.authUser.findFirst({
				columns: {
					id: true,
					username: true,
					email: true,
				},
				where: (authUser, { eq }) => eq(authUser.id, user.id),
				with: {
					profile: {
						columns: {
							fullName: true,
							profilePicture: true,
						},
					},
				},
			})

			return {
				data: foundUser,
				error: null,
			}
		} catch (err) {
			console.error(err)
			context.set.status = 500
			return {
				error: err,
				data: null,
			}
		}
	})
	.get("/profile", async ({ params, set, user }) => {
		try {
			if (!user) {
				set.status = 401
				return {
					error: { message: "Unauthorized" },
					data: null,
				}
			}

			const foundUser = await db.query.userProfile.findFirst({
				where: (userProfile, { eq }) => eq(userProfile.userId, user.id),
				columns: {
					updatedAt: false,
				},
				with: {
					authUser: {
						columns: {
							username: true,
							// email: true,
						},
					},
					userVehicles: {
						with: {
							vehicle: {
								columns: {
									id: true,
									make: true,
									model: true,
									vehicleType: true,
								},
							},
						},
					},
				},
			})

			return {
				data: foundUser,
				error: null,
			}
		} catch (err) {
			console.error(err)
			set.status = 500
			return {
				error: err,
				data: null,
			}
		}
	})
	.get(
		"/profile/:id",
		async ({ params, set, user }) => {
			try {
				if (!user) {
					set.status = 401
					return {
						error: { message: "Unauthorized" },
						data: null,
					}
				}

				const { id } = params
				const foundUser = await db.query.userProfile.findFirst({
					where: (userProfile, { eq }) => eq(userProfile.userId, id),
					columns: {
						updatedAt: false,
					},
					with: {
						authUser: {
							columns: {
								username: true,
							},
						},
						userVehicles: {
							with: {
								vehicle: {
									columns: {
										id: true,
										make: true,
										model: true,
										vehicleType: true,
									},
								},
							},
						},
					},
				})

				return {
					data: foundUser,
					error: null,
				}
			} catch (err) {
				console.error(err)
				set.status = 500
				return {
					error: err,
					data: null,
				}
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.get(
		"community/:id",
		async ({ params, set, user }) => {
			try {
				if (!user) {
					set.status = 401
					return {
						error: { message: "Unauthorized" },
						data: null,
					}
				}

				const { id } = params
				const foundUser = await db.query.communityMember.findFirst({
					where: (communityMember, { eq, and }) =>
						and(
							eq(communityMember.userId, user.id),
							eq(communityMember.communityId, Number.parseInt(id)),
						),
					with: {
						profile: {
							columns: {
								fullName: true,
								profilePicture: true,
							},
						},
					},
				})

				return {
					data: foundUser,
					error: null,
				}
			} catch (err) {
				console.error(err)
				set.status = 500
				return {
					error: err,
					data: null,
				}
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
		async context => {
			const { user, body } = context
			if (!user) {
				context.set.status = 401
				return {
					status: 401,
					body: "Unauthorized",
				}
			}

			const foundUser = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, user.id))
				.execute()

			if (!foundUser || foundUser.length === 0) {
				const newUser = await db
					.insert(userProfile)
					.values({
						userId: user.id,
						fullName: body.fullName,
						profilePicture: body.profilePicture,
						bio: body.bio,
						coverImage: body.coverImage,
					})
					.returning()

				return {
					data: newUser,
					error: null,
				}
			}

			const updatedUser = await db
				.update(userProfile)
				.set({
					fullName: body.fullName,
					profilePicture: body.profilePicture,
					bio: body.bio,
					coverImage: body.coverImage,
				})
				.where(eq(userProfile.userId, user.id))
				.returning()

			return {
				data: updatedUser,
				error: null,
			}
		},
		{
			body: t.Object({
				fullName: t.String(),
				profilePicture: t.Optional(t.String()),
				bio: t.Optional(t.String()),
				coverImage: t.Optional(t.String()),
			}),
		},
	)
	.patch(
		"/",
		async context => {
			const { user, body } = context
			if (!user) {
				context.set.status = 401
				return {
					status: 401,
					body: "Unauthorized",
				}
			}

			const foundUser = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, user.id))
				.execute()

			if (!foundUser || foundUser.length === 0) {
				context.set.status = 404
				return {
					data: null,
					error: { message: "User not found" },
				}
			}

			const updatedUser = await db
				.update(userProfile)
				.set({
					fullName: body.fullName,
					profilePicture: body.profilePicture,
					bio: body.bio,
				})
				.where(eq(userProfile.userId, user.id))
				.returning()

			return {
				data: omit(updatedUser[0], ["createdAt", "updatedAt"]),
				error: null,
			}
		},
		{
			body: t.Object({
				fullName: t.Optional(t.String()),
				profilePicture: t.Optional(t.String()),
				bio: t.Optional(t.String()),
				coverImage: t.Optional(t.String()),
			}),
		},
	)
	.get("/trips", async ({ user, set }) => {
		if (!user) {
			set.status = 401
			return {
				status: 401,
				body: "Unauthorized",
			}
		}

		const foundTrips = await db.query.trip.findMany({
			where: (trip, { eq }) => eq(trip.createdBy, user.id),
			with: {
				participants: {
					with: {
						profile: true,
					},
				},
			},
		})

		return {
			data: foundTrips,
			error: null,
		}
	})
	.get("/communities", async ({ user, set }) => {
		if (!user) {
			set.status = 401
			return {
				status: 401,
				body: "Unauthorized",
			}
		}

		const foundCommunities = await db.query.community.findMany({
			where: (community, { eq }) => eq(community.createdBy, user.id),
			with: {
				members: {
					with: {
						profile: true,
					},
				},
			},
		})

		return {
			data: foundCommunities,
			error: null,
		}
	})
	.delete("/", async context => {
		const { user } = context
		if (!user) {
			context.set.status = 401
			return {
				status: 401,
				body: "Unauthorized",
			}
		}

		const foundUser = await db
			.select()
			.from(authUser)
			.where(eq(authUser.id, user.id))
			.execute()

		if (!foundUser || foundUser.length === 0) {
			context.set.status = 404
			return {
				data: null,
				error: { message: "User not found" },
			}
		}
		try {
			await db.delete(authUser).where(eq(authUser.id, user.id))

			// biome-ignore lint/suspicious/noAssignInExpressions: This is a valid use case
			return (context.set.status = 204)
		} catch (e) {
			console.log(e)
			context.set.status = 500
			return {
				data: null,
				error: { message: "Internal Server Error" },
			}
		}
	})
	.get("/vehicle", async ({ user, set }) => {
		if (!user) {
			set.status = 401
			return {
				status: 401,
				body: "Unauthorized",
			}
		}

		const foundVehicles = await db.query.userVehicles.findMany({
			where: (vehicle, { eq }) => eq(userVehicles.userId, user.id),
			with: {
				vehicle: true,
			},
		})

		return {
			data: foundVehicles,
			error: null,
		}
	})
	.post(
		"/vehicle",
		async ({ user, body, set }) => {
			if (!user) {
				set.status = 401
				return {
					status: 401,
					body: "Unauthorized",
				}
			}

			try {
				const newVehicle = await db
					.insert(userVehicles)
					.values({
						userId: user.id,
						vehicleId: body.vehicleId,
						year: String(body.year),
					})
					.returning()
				return {
					data: newVehicle,
					error: null,
				}
			} catch (e) {
				console.log(e)
				return {
					data: null,
					error: e,
				}
			}
		},
		{
			body: t.Object({
				vehicleId: t.Number(),
				year: t.Number(),
			}),
		},
	)
