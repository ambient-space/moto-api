import { sharedColumns } from "@db/shared"
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core"
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
	...sharedColumns,
})
