ALTER TABLE "vehicle" ADD COLUMN "combined_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_combined_key_unique" UNIQUE("combined_key");