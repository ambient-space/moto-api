ALTER TABLE "announcement" ALTER COLUMN "created_at" SET DEFAULT '2024-07-05 12:41:08.417';--> statement-breakpoint
ALTER TABLE "community" ALTER COLUMN "created_at" SET DEFAULT '2024-07-05 12:41:08.416';--> statement-breakpoint
ALTER TABLE "community" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-05 12:41:08.416';--> statement-breakpoint
ALTER TABLE "trip" ALTER COLUMN "created_at" SET DEFAULT '2024-07-05 12:41:08.416';--> statement-breakpoint
ALTER TABLE "trip" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-05 12:41:08.416';--> statement-breakpoint
ALTER TABLE "user_profile" ALTER COLUMN "created_at" SET DEFAULT '2024-07-05 12:41:08.418';--> statement-breakpoint
ALTER TABLE "user_profile" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-05 12:41:08.418';--> statement-breakpoint
ALTER TABLE "auth_session" ADD COLUMN "created_at" timestamp DEFAULT '2024-07-05 12:41:08.412' NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_session" ADD COLUMN "updated_at" timestamp DEFAULT '2024-07-05 12:41:08.412' NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_user" ADD COLUMN "created_at" timestamp DEFAULT '2024-07-05 12:41:08.411' NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_user" ADD COLUMN "updated_at" timestamp DEFAULT '2024-07-05 12:41:08.411' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle" ADD COLUMN "created_at" timestamp DEFAULT '2024-07-05 12:41:08.420' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle" ADD COLUMN "updated_at" timestamp DEFAULT '2024-07-05 12:41:08.420' NOT NULL;