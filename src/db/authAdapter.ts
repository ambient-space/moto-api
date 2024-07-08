import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle"
import { db } from "./connect"
import { authSession, authUser } from "./schema/auth"

export const adapter = new DrizzlePostgreSQLAdapter(db, authSession, authUser)
