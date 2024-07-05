import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"
import { authUser } from "./auth"

export const vehicle = pgTable("vehicle", {
	id: serial("id").primaryKey(),
	userId: text("user_id").references(() => authUser.id, {
		onDelete: "cascade",
	}),
	make: text("make").notNull(),
	model: text("model").notNull(),
	year: integer("year").notNull(),
	licensePlate: text("license_plate"),
	vehicleType: text("vehicle_type").notNull(), // e.g., motorcycle, car, etc.
	createdAt: timestamp("created_at").default(new Date()).notNull(),
	updatedAt: timestamp("updated_at")
		.default(new Date())
		.notNull()
		.$onUpdate(() => new Date()),
})
