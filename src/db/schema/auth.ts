import { sharedColumns } from "@db/shared"
import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { userProfile } from "./user"

export const authUser = pgTable("auth_user", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique(),
	email: text("email").notNull().unique(),
	hashedPassword: text("hashed_password"),
	...sharedColumns,
})

export const authUserRelations = relations(authUser, ({ one, many }) => ({
	profile: one(userProfile, {
		fields: [authUser.id],
		references: [userProfile.userId],
	}),
	session: many(authSession),
}))

export const authSession = pgTable("auth_session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => authUser.id, { onDelete: "cascade" }),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date",
	}).notNull(),
	...sharedColumns,
})

export const authSessionRelations = relations(authSession, ({ one }) => ({
	user: one(authUser, {
		fields: [authSession.userId],
		references: [authUser.id],
	}),
}))
