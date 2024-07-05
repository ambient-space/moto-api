import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core"
import { authUser } from "./auth"
import { trip } from "./trip"

export const community = pgTable("community", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	createdBy: text("created_by").references(() => authUser.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	isPrivate: boolean("is_private").default(false),
	rules: text("rules"),
	coverImage: text("cover_image"),
})

export const communityMember = pgTable("community_member", {
	id: serial("id").primaryKey(),
	communityId: integer("community_id").references(() => community.id),
	userId: text("user_id").references(() => authUser.id),
	role: text("role").default("member"), // e.g., admin, moderator, member
	joinedAt: timestamp("joined_at").defaultNow().notNull(),
})

export const announcement = pgTable("announcement", {
	id: serial("id").primaryKey(),
	communityId: integer("community_id").references(() => community.id),
	tripId: integer("trip_id").references(() => trip.id),
	createdBy: text("created_by").references(() => authUser.id),
	content: text("content").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const message = pgTable("message", {
	id: serial("id").primaryKey(),
	communityId: integer("community_id").references(() => community.id),
	tripId: integer("trip_id").references(() => trip.id),
	senderId: text("sender_id").references(() => authUser.id),
	content: text("content").notNull(),
	sentAt: timestamp("sent_at").defaultNow().notNull(),
})
