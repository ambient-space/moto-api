import { sharedColumns } from "@db/shared"
import { relations } from "drizzle-orm"
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core"
import { authUser } from "./auth"
import { community } from "./community"
import { userProfile } from "./user"

// New table for trips
export const trip = pgTable("trip", {
	id: serial("id").primaryKey(),
	communityId: integer("community_id").references(() => community.id),
	createdBy: text("created_by")
		.references(() => authUser.id)
		.notNull(),
	name: text("name").notNull(),
	description: text("description"),
	startDate: timestamp("start_date", { mode: "string" }).notNull(),
	endDate: timestamp("end_date", { mode: "string" }),
	isPrivate: boolean("is_private").default(false).notNull(),
	// startLocation: jsonb("start_location").notNull(), // { lat: number, lng: number }
	// endLocation: jsonb("end_location"), // { lat: number, lng: number }
	startLocation: text("start_location").notNull(),
	endLocation: text("end_location"),
	route: jsonb("route"), // Array of waypoints
	maxParticipants: integer("max_participants"),
	...sharedColumns,
})

export const validTripStatuses = ["confirmed", "pending", "declined"] as const
export const validTripStatusEnum = pgEnum("trip_status", validTripStatuses)

export const validTripRoles = ["organizer", "participant"] as const
export const validTripRoleEnum = pgEnum("trip_role", validTripRoles)

// New table for trip participants
export const tripParticipant = pgTable("trip_participant", {
	id: serial("id").primaryKey(),
	tripId: integer("trip_id")
		.notNull()
		.references(() => trip.id, { onDelete: "cascade" }),
	userId: text("user_id").references(() => authUser.id, {
		onDelete: "cascade",
	}),
	role: validTripRoleEnum("role"), // e.g., organizer, participant
	joinedAt: timestamp("joined_at", { mode: "string" }).defaultNow(),
	updatedAt: sharedColumns.updatedAt,
})

// Relations for trips
export const tripRelations = relations(trip, ({ many, one }) => ({
	participants: many(tripParticipant),
	authUser: one(authUser, {
		fields: [trip.createdBy],
		references: [authUser.id],
	}),
	profile: one(userProfile, {
		fields: [trip.createdBy],
		references: [userProfile.userId],
	}),
	community: one(community, {
		fields: [trip.communityId],
		references: [community.id],
	}),
}))

// Relations for trip participants
export const tripParticipantRelations = relations(
	tripParticipant,
	({ one }) => ({
		authUser: one(authUser, {
			fields: [tripParticipant.userId],
			references: [authUser.id],
		}),
		profile: one(userProfile, {
			fields: [tripParticipant.userId],
			references: [userProfile.userId],
		}),
		trip: one(trip, {
			fields: [tripParticipant.tripId],
			references: [trip.id],
		}),
	}),
)

export const inviteStatuses = ["pending", "accepted", "rejected"] as const
export const joinRequestStatuses = ["pending", "approved", "rejected"] as const

export const validInviteStatusesEnum = pgEnum("invite_status", inviteStatuses)
export const validJoinRequestStatusesEnum = pgEnum(
	"join_request_status",
	joinRequestStatuses,
)

// New table for trip invite
export const tripInvite = pgTable(
	"trip_invite",
	{
		id: serial("id").primaryKey(),
		tripId: integer("trip_id")
			.notNull()
			.references(() => trip.id, { onDelete: "cascade" }),
		inviterId: text("inviter_id")
			.references(() => authUser.id)
			.notNull(),
		inviteCode: text("invite_code").notNull().unique(),
		status: validInviteStatusesEnum("status").default("pending").notNull(), // pending, accepted, rejected
		expiresAt: timestamp("expires_at", { mode: "string" }),
		...sharedColumns,
	},
	table => ({
		tripId: index("trip_invite_trip_id_idx").on(table.tripId),
		inviteCode: index("trip_invite_invite_code_idx").on(table.inviteCode),
	}),
)

// Relations for trip invite
export const tripInviteRelations = relations(tripInvite, ({ one }) => ({
	trip: one(trip, {
		fields: [tripInvite.tripId],
		references: [trip.id],
	}),
	inviter: one(authUser, {
		fields: [tripInvite.inviterId],
		references: [authUser.id],
	}),
	profile: one(userProfile, {
		fields: [tripInvite.inviterId],
		references: [userProfile.userId],
	}),
}))

// New table for trip join request
export const tripJoinRequest = pgTable(
	"trip_join_request",
	{
		id: serial("id").primaryKey(),
		tripId: integer("trip_id")
			.notNull()
			.references(() => trip.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.references(() => authUser.id)
			.notNull(),
		status: validJoinRequestStatusesEnum("status").default("pending").notNull(), // pending, approved, rejected
		...sharedColumns,
	},
	table => ({
		tripId: index("trip_join_request_trip_id_idx").on(table.tripId),
	}),
)

// Relations for trip join request
export const tripJoinRequestRelations = relations(
	tripJoinRequest,
	({ one }) => ({
		trip: one(trip, {
			fields: [tripJoinRequest.tripId],
			references: [trip.id],
		}),
		authUser: one(authUser, {
			fields: [tripJoinRequest.userId],
			references: [authUser.id],
		}),
		profile: one(userProfile, {
			fields: [tripJoinRequest.userId],
			references: [userProfile.userId],
		}),
	}),
)
