import { sharedColumns } from "@db/shared"
import { boolean, jsonb, pgTable, serial, text } from "drizzle-orm/pg-core"

export const location = pgTable("location", {
	id: serial("id").primaryKey(),
	name: text("name"),
	description: text("description"),

	latitude: text("latitude").notNull(),
	longitude: text("longitude").notNull(),

	// Text-based location fields
	address: text("address"),
	city: text("city"),
	state: text("state"),
	country: text("country"),
	postalCode: text("postal_code"),

	// Type flag
	isGeocoded: boolean("is_geocoded"),

	// Additional useful fields
	placeId: text("place_id"), // For integration with mapping services
	timezone: text("timezone"),

	// Additional properties (flexible storage for extra data)
	properties: jsonb("properties"),

	...sharedColumns,
})
