import { sql } from "drizzle-orm"
import { timestamp } from "drizzle-orm/pg-core"

export const sharedColumns = {
	createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: "string" })
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => sql`CURRENT_TIMESTAMP(3)`),
}
