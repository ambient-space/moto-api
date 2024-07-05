ALTER TABLE "announcements" RENAME TO "announcement";--> statement-breakpoint
ALTER TABLE "community_members" RENAME TO "community_member";--> statement-breakpoint
ALTER TABLE "messages" RENAME TO "message";--> statement-breakpoint
ALTER TABLE "announcement" DROP CONSTRAINT "announcements_community_id_community_id_fk";
--> statement-breakpoint
ALTER TABLE "announcement" DROP CONSTRAINT "announcements_trip_id_trip_id_fk";
--> statement-breakpoint
ALTER TABLE "announcement" DROP CONSTRAINT "announcements_created_by_auth_user_id_fk";
--> statement-breakpoint
ALTER TABLE "community_member" DROP CONSTRAINT "community_members_community_id_community_id_fk";
--> statement-breakpoint
ALTER TABLE "community_member" DROP CONSTRAINT "community_members_user_id_auth_user_id_fk";
--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "messages_community_id_community_id_fk";
--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "messages_trip_id_trip_id_fk";
--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "messages_sender_id_auth_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "announcement" ADD CONSTRAINT "announcement_community_id_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."community"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "announcement" ADD CONSTRAINT "announcement_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "announcement" ADD CONSTRAINT "announcement_created_by_auth_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_member" ADD CONSTRAINT "community_member_community_id_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."community"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_member" ADD CONSTRAINT "community_member_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_community_id_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."community"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_auth_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
