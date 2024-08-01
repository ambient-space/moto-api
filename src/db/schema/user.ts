import { sharedColumns } from "@db/shared"
import { relations } from "drizzle-orm"
import {
	integer,
	numeric,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core"
import { authUser } from "./auth"
import { communityMember } from "./community"
import { tripParticipant } from "./trip"
import { vehicle } from "./vehicle"

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

export const userProfileRelations = relations(userProfile, ({ one, many }) => ({
	authUser: one(authUser, {
		fields: [userProfile.userId],
		references: [authUser.id],
	}),
	kycDocuments: many(kycDocument),
	tripParticipant: many(tripParticipant),
	communityMember: many(communityMember),
	userVehicles: many(userVehicles),
}))

export const userVehicles = pgTable("user_vehicle", {
	id: serial("id").primaryKey(),
	userId: text("user_id").references(() => authUser.id, {
		onDelete: "cascade",
	}),
	vehicleId: integer("vehicle_id")
		.notNull()
		.references(() => vehicle.id),
	year: numeric("year"),
	...sharedColumns,
})

export const userVehiclesRelations = relations(userVehicles, ({ one }) => ({
	vehicle: one(vehicle, {
		fields: [userVehicles.vehicleId],
		references: [vehicle.id],
	}),
	user: one(authUser, {
		fields: [userVehicles.userId],
		references: [authUser.id],
	}),
	profile: one(userProfile, {
		fields: [userVehicles.userId],
		references: [userProfile.userId],
	}),
}))

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
