import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { db } from "../connect"

export const authUser = pgTable("auth_user", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique(),
	email: text("email").notNull().unique(),
	hashedPassword: text("hashed_password"),
	createdAt: timestamp("created_at").default(new Date()).notNull(),
	updatedAt: timestamp("updated_at")
		.default(new Date())
		.notNull()
		.$onUpdate(() => new Date()),
})

export const authSession = pgTable("auth_session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => authUser.id, { onDelete: "cascade" }),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date",
	}).notNull(),
	createdAt: timestamp("created_at").default(new Date()).notNull(),
	updatedAt: timestamp("updated_at")
		.default(new Date())
		.notNull()
		.$onUpdate(() => new Date()),
})

export const adapter = new DrizzlePostgreSQLAdapter(db, authSession, authUser)
