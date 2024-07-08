import { sharedColumns } from "@db/shared"
import { relations } from "drizzle-orm"
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
import { userProfile } from "./user"

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
	communityId: integer("community_id")
		.notNull()
		.references(() => community.id, {
			onDelete: "cascade",
		}),
	userId: text("user_id").references(() => authUser.id, {
		onDelete: "cascade",
	}),
	role: text("role").default("member"), // e.g., admin, moderator, member
	joinedAt: timestamp("joined_at", { mode: "string" }).defaultNow().notNull(),
	updatedAt: sharedColumns.updatedAt,
})

export const communityRelations = relations(community, ({ many }) => ({
	members: many(communityMember),
}))

export const communityMemberRelations = relations(
	communityMember,
	({ one }) => ({
		authUser: one(authUser, {
			fields: [communityMember.userId],
			references: [authUser.id],
		}),
		profile: one(userProfile, {
			fields: [communityMember.userId],
			references: [userProfile.userId],
		}),
		community: one(community, {
			fields: [communityMember.communityId],
			references: [community.id],
		}),
	}),
)

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
