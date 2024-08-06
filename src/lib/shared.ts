import { db } from "@db/connect"
import { communityInvite } from "@db/schema/community"
import { tripInvite } from "@db/schema/trip"
import { eq } from "drizzle-orm"

export function isValidEmail(email: string): boolean {
	return /.+@.+/.test(email)
}
const genRanHex = (size: number) =>
	[...Array(size)]
		.map(() => Math.floor(Math.random() * 16).toString(16))
		.join("")

export const generateUniqueInviteCode = async (
	entity: "trip" | "community",
	maxAttempts = 10,
): Promise<string> => {
	try {
		for (let i = 0; i < maxAttempts; i++) {
			const inviteCode = genRanHex(12)

			const existingInvite =
				entity === "trip"
					? await db.query.tripInvite.findFirst({
							where: eq(tripInvite.inviteCode, inviteCode),
						})
					: await db.query.communityInvite.findFirst({
							where: eq(communityInvite.inviteCode, inviteCode),
						})
			if (!existingInvite) return inviteCode
		}
	} catch (e) {
		console.error(e)
	}
	throw new Error("Failed to generate a unique invite code")
}
