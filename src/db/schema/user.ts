import { sharedColumns } from "@db/shared"
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"
import { authUser } from "./auth"

export const userProfile = pgTable("user_profile", {
	userId: text("user_id")
		.primaryKey()
		.references(() => authUser.id, { onDelete: "cascade" }),
	fullName: text("full_name"),
	profilePicture: text("profile_picture"),
	bio: text("bio"),
	coverImage: text("cover_image"),
	...sharedColumns,
})

export const kycDocument = pgTable("kyc_document", {
	id: serial("id").primaryKey(),
	userId: text("user_id").references(() => authUser.id, {
		onDelete: "cascade",
	}),
	documentType: text("document_type").notNull(), // e.g., 'driving_license', 'registration_certificate'
	documentNumber: text("document_number").notNull(),
	verificationStatus: text("verification_status").notNull(), // e.g., 'pending', 'verified', 'rejected'
	uploadedAt: timestamp("uploaded_at", { mode: "string" })
		.defaultNow()
		.notNull(),
	verifiedAt: timestamp("verified_at", { mode: "string" }),
})
