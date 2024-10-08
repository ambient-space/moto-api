import { sharedColumns } from "@db/shared"
import { relations } from "drizzle-orm"
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { authUser } from "./auth"
import { trip } from "./trip"
import { userProfile } from "./user"

// New table for communities
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

export const validCommunityRoles = ["admin", "moderator", "member"] as const
export const validCommunityRoleEnum = pgEnum(
	"community_role",
	validCommunityRoles,
)

// New table for community members
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
	role: validCommunityRoleEnum("role"), // e.g., admin, moderator, member
	joinedAt: timestamp("joined_at", { mode: "string" }).defaultNow().notNull(),
	updatedAt: sharedColumns.updatedAt,
})

// Relations for communities
export const communityRelations = relations(community, ({ many }) => ({
	members: many(communityMember),
	trips: many(trip),
}))

// Relations for community members
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

// New table for announcements
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

// New table for messages
export const message = pgTable("message", {
	id: serial("id").primaryKey(),
	uuid: uuid("uuid").defaultRandom().notNull(),
	communityId: integer("community_id").references(() => community.id, {
		onDelete: "cascade",
	}),
	tripId: integer("trip_id").references(() => trip.id),
	senderId: text("sender_id").references(() => authUser.id),
	content: text("content").notNull(),
	sentAt: timestamp("sent_at", { mode: "string" }).defaultNow().notNull(),
})

// Relations for messages
export const messageRelations = relations(message, ({ one }) => ({
	sender: one(authUser, {
		fields: [message.senderId],
		references: [authUser.id],
	}),
	senderProfile: one(userProfile, {
		fields: [message.senderId],
		references: [userProfile.userId],
	}),
	community: one(community, {
		fields: [message.communityId],
		references: [community.id],
	}),
}))

export const inviteStatuses = ["pending", "accepted", "rejected"] as const
export const joinRequestStatuses = ["pending", "approved", "rejected"] as const

export const validInviteStatusesEnum = pgEnum("invite_status", inviteStatuses)
export const validJoinRequestStatusesEnum = pgEnum(
	"join_request_status",
	joinRequestStatuses,
)

export const communityInvite = pgTable(
	"community_invite",
	{
		id: serial("id").primaryKey(),
		communityId: integer("community_id").references(() => community.id, {
			onDelete: "cascade",
		}),
		inviterId: text("inviter_id").references(() => authUser.id, {
			onDelete: "cascade",
		}),
		inviteCode: text("invite_code").notNull().unique(),
		status: validInviteStatusesEnum("status").default("pending").notNull(),
		expiresAt: timestamp("expires_at", { mode: "string" }),
		createdAt: sharedColumns.createdAt,
	},
	table => ({
		communityId: index("invite_community_id_idx").on(table.communityId),
		inviteCode: index("invite_code_idx").on(table.inviteCode),
	}),
)

// Relations for community invites
export const communityInviteRelations = relations(
	communityInvite,
	({ one }) => ({
		inviter: one(authUser, {
			fields: [communityInvite.inviterId],
			references: [authUser.id],
		}),
		profile: one(userProfile, {
			fields: [communityInvite.inviterId],
			references: [userProfile.userId],
		}),
		community: one(community, {
			fields: [communityInvite.communityId],
			references: [community.id],
		}),
	}),
)

// New table for community join requests
export const communityJoinRequest = pgTable(
	"community_join_request",
	{
		id: serial("id").primaryKey(),
		communityId: integer("community_id").references(() => community.id, {
			onDelete: "cascade",
		}),
		userId: text("user_id").references(() => authUser.id, {
			onDelete: "cascade",
		}),
		status: validJoinRequestStatusesEnum("status").default("pending").notNull(),
		createdAt: sharedColumns.createdAt,
	},
	table => ({
		communityId: index("join_request_community_id_idx").on(table.communityId),
	}),
)

// Relations for community join requests
export const communityJoinRequestRelations = relations(
	communityJoinRequest,
	({ one }) => ({
		authUser: one(authUser, {
			fields: [communityJoinRequest.userId],
			references: [authUser.id],
		}),
		profile: one(userProfile, {
			fields: [communityJoinRequest.userId],
			references: [userProfile.userId],
		}),
		community: one(community, {
			fields: [communityJoinRequest.communityId],
			references: [community.id],
		}),
	}),
)
