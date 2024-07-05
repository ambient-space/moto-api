import { db } from "@db/connect"
import { authSession } from "@db/schema/auth"
import { lte } from "drizzle-orm"
import cron from "node-cron"

export default function scheduledJobs() {
	cron.schedule("0 0 * * *", () => {
		// delete all expired sessions

		db.delete(authSession)
			.where(lte(authSession.expiresAt, new Date()))
			.execute()
	})
}
