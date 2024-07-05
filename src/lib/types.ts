import type { Session, User } from "lucia"

export type ExtendedContext = {
	user: User | null
	session: Session | null
}
