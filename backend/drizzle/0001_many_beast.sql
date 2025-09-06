CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_address" varchar(42) NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"max_tickets" bigint NOT NULL,
	"base_price_wei" bigint NOT NULL,
	"dynamic_pricing" boolean DEFAULT true NOT NULL,
	"price_increment_wei" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_address" varchar(42) NOT NULL,
	"token_id" bigint NOT NULL,
	"price_wei" bigint NOT NULL,
	"seller" varchar(42) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_address" varchar(42) NOT NULL,
	"token_id" bigint NOT NULL,
	"owner_address" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" varchar(42) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "events_contract_address_idx" ON "events" USING btree ("contract_address");--> statement-breakpoint
CREATE INDEX "listings_idx" ON "listings" USING btree ("event_address","token_id");--> statement-breakpoint
CREATE INDEX "listings_active_idx" ON "listings" USING btree ("active");--> statement-breakpoint
CREATE INDEX "tickets_idx" ON "tickets" USING btree ("event_address","token_id");--> statement-breakpoint
CREATE INDEX "users_address_idx" ON "users" USING btree ("address");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email";