import { sharedColumns } from "@db/shared"
import { pgTable, serial, text } from "drizzle-orm/pg-core"

export const vehicle = pgTable("vehicle", {
	id: serial("id").primaryKey(),
	make: text("make").notNull(),
	model: text("model").notNull(),
	vehicleType: text("vehicle_type").notNull(),
	combinedKey: text("combined_key").notNull().unique(),
	...sharedColumns,
})
