import {
	boolean,
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
	createdBy: text("created_by").references(() => authUser.id),
	name: text("name").notNull(),
	description: text("description"),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date"),
	startLocation: jsonb("start_location").notNull(), // { lat: number, lng: number }
	endLocation: jsonb("end_location"), // { lat: number, lng: number }
	route: jsonb("route"), // Array of waypoints
	maxParticipants: integer("max_participants"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const tripParticipant = pgTable("trip_participant", {
	id: serial("id").primaryKey(),
	tripId: integer("trip_id").references(() => trip.id),
	userId: text("user_id").references(() => authUser.id),
	status: text("status").notNull(), // e.g., confirmed, pending, declined
	joinedAt: timestamp("joined_at").defaultNow().notNull(),
})
