import { sharedColumns } from "@db/shared"
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
	isPrivate: boolean("is_private").default(false),
	coverImage: text("cover_image"),
	profilePicture: text("profile_picture"),
	...sharedColumns,
})

export const communityMember = pgTable("community_member", {
	id: serial("id").primaryKey(),
	communityId: integer("community_id").references(() => community.id, {
		onDelete: "cascade",
	}),
	userId: text("user_id").references(() => authUser.id, {
		onDelete: "cascade",
	}),
	role: text("role").default("member"), // e.g., admin, moderator, member
	joinedAt: timestamp("joined_at", { mode: "string" }).defaultNow().notNull(),
	updatedAt: sharedColumns.updatedAt,
})

export const announcement = pgTable("announcement", {
	id: serial("id").primaryKey(),
	communityId: integer("community_id").references(() => community.id, {
		onDelete: "cascade",
	}),
	tripId: integer("trip_id").references(() => trip.id, { onDelete: "cascade" }),
	createdBy: text("created_by").references(() => authUser.id, {
		onDelete: "cascade",
	}),
	content: text("content").notNull(),
	createdAt: sharedColumns.createdAt,
})

export const message = pgTable("message", {
	id: serial("id").primaryKey(),
	communityId: integer("community_id").references(() => community.id, {
		onDelete: "cascade",
	}),
	tripId: integer("trip_id").references(() => trip.id),
	senderId: text("sender_id").references(() => authUser.id),
	content: text("content").notNull(),
	sentAt: timestamp("sent_at", { mode: "string" }).defaultNow().notNull(),
})
