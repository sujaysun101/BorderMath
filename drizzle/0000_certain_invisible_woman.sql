CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"citizenships" text DEFAULT '["US"]' NOT NULL,
	"passport_expiry" date,
	"passport_alert_months" integer DEFAULT 6 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_legs" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"country_code" text NOT NULL,
	"entry_date" date NOT NULL,
	"exit_date" date NOT NULL,
	"transport" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"citizenship" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visa_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"country_code" text NOT NULL,
	"visa_type" text NOT NULL,
	"expiry_date" date NOT NULL,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_legs" ADD CONSTRAINT "trip_legs_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;