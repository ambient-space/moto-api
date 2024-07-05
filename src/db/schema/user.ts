import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"
import { authUser } from "./auth"

export const userProfile = pgTable("user_profile", {
	userId: text("user_id")
		.primaryKey()
		.references(() => authUser.id),
	fullName: text("full_name"),
	profilePicture: text("profile_picture"),
	bio: text("bio"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const kycDocument = pgTable("kyc_document", {
	id: serial("id").primaryKey(),
	userId: text("user_id").references(() => authUser.id),
	documentType: text("document_type").notNull(), // e.g., 'driving_license', 'registration_certificate'
	documentNumber: text("document_number").notNull(),
	verificationStatus: text("verification_status").notNull(), // e.g., 'pending', 'verified', 'rejected'
	uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
	verifiedAt: timestamp("verified_at"),
})