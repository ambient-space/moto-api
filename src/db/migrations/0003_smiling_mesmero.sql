CREATE TABLE IF NOT EXISTS "location" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"postal_code" text,
	"is_geocoded" boolean,
	"place_id" text,
	"timezone" text,
	"properties" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle" DROP CONSTRAINT "vehicle_user_id_auth_user_id_fk";
--> statement-breakpoint
ALTER TABLE "vehicle" DROP COLUMN IF EXISTS "user_id";--> statement-breakpoint
ALTER TABLE "vehicle" DROP COLUMN IF EXISTS "year";--> statement-breakpoint
ALTER TABLE "vehicle" DROP COLUMN IF EXISTS "license_plate";