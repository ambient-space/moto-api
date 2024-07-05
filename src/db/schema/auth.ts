import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { db } from "../connect"

export const authUser = pgTable("auth_user", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique(),
	email: text("email").notNull().unique(),
	hashedPassword: text("hashed_password"),
})

export const authSession = pgTable("auth_session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => authUser.id),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date",
	}).notNull(),
})

export const adapter = new DrizzlePostgreSQLAdapter(db, authSession, authUser)
