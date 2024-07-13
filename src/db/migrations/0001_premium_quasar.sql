ALTER TABLE "message" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_participant" DROP COLUMN IF EXISTS "status";