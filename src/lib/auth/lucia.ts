import { adapter, type authUser } from "@db/schema/auth"
import { Lucia, TimeSpan } from "lucia"

// Initialize Lucia
export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: false, // set `Secure` flag in HTTPS
		},
	},
	sessionExpiresIn: new TimeSpan(7, "d"),
	getUserAttributes: attributes => {
		return {
			// we don't need to expose the password hash!
			email: attributes.email,
		}
	},
})

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia
		DatabaseUserAttributes: Omit<typeof authUser.$inferSelect, "id">
	}
}
