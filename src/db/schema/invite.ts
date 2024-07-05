import { sharedColumns } from "@db/shared"
import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core"
import { authUser } from "./auth"

// New table for invites (can be used for both communities and trips)
export const invite = pgTable(
	"invite",
	{
		id: serial("id").primaryKey(),
		entityType: text("entity_type").notNull(), // 'community' or 'trip'
		entityId: integer("entity_id").notNull(),
		inviterId: text("inviter_id")
			.references(() => authUser.id, {
				onDelete: "cascade",
			})
			.notNull(),
		inviteeEmail: text("invitee_email").notNull(),
		status: text("status").default("pending").notNull(), // pending, accepted, rejected
		expiresAt: timestamp("expires_at", { mode: "string" }),
		createdAt: sharedColumns.createdAt,
	},
	table => ({
		entityType: index("invite_entity_type_idx").on(table.entityType),
		entityId: index("invite_entity_id_idx").on(table.entityId),
	}),
)

// New table for join requests (can be used for both communities and trips)
export const joinRequest = pgTable(
	"join_request",
	{
		id: serial("id").primaryKey(),
		entityType: text("entity_type").notNull(), // 'community' or 'trip'
		entityId: integer("entity_id").notNull(),
		userId: text("user_id")
			.references(() => authUser.id, {
				onDelete: "cascade",
			})
			.notNull(),
		status: text("status").default("pending").notNull(), // pending, approved, rejected
		message: text("message"),
		createdAt: sharedColumns.createdAt,
	},
	table => ({
		entityType: index("join_request_entity_type_idx").on(table.entityType),
		entityId: index("join_request_entity_id_idx").on(table.entityId),
	}),
)
