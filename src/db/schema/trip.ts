import { sharedColumns } from "@db/shared"
import { relations } from "drizzle-orm"
import {
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
	startLocation: jsonb("start_location").notNull(), // { lat: number, lng: number }
	endLocation: jsonb("end_location"), // { lat: number, lng: number }
	route: jsonb("route"), // Array of waypoints
	maxParticipants: integer("max_participants"),
	...sharedColumns,
})

export const validTripStatuses = ["confirmed", "pending", "declined"] as const
export const validTripStatusEnum = pgEnum("trip_status", validTripStatuses)

export const validTripRoles = ["organizer", "participant"] as const
export const validTripRoleEnum = pgEnum("trip_role", validTripRoles)

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
