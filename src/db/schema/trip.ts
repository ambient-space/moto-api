import { sharedColumns } from "@db/shared"
import { sql } from "drizzle-orm"
import {
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core"
import { authUser } from "./auth"
import { community } from "./community"

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

export const tripParticipant = pgTable("trip_participant", {
	id: serial("id").primaryKey(),
	tripId: integer("trip_id").references(() => trip.id, { onDelete: "cascade" }),
	userId: text("user_id").references(() => authUser.id, {
		onDelete: "cascade",
	}),
	status: text("status").notNull(), // e.g., confirmed, pending, declined
	joinedAt: timestamp("joined_at", { mode: "string" }).defaultNow().notNull(),
	updatedAt: sharedColumns.updatedAt,
})
