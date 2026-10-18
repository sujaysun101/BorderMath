import { date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name").notNull().default(""),
  citizenships: text("citizenships").notNull().default('["US"]'),
  passportExpiry: date("passport_expiry"),
  passportAlertMonths: integer("passport_alert_months").notNull().default(6),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trips = pgTable("trips", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  citizenship: text("citizenship").notNull(),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tripLegs = pgTable("trip_legs", {
  id: text("id").primaryKey(),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  countryCode: text("country_code").notNull(),
  entryDate: date("entry_date").notNull(),
  exitDate: date("exit_date").notNull(),
  transport: text("transport").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const visaDocuments = pgTable("visa_documents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  countryCode: text("country_code").notNull(),
  visaType: text("visa_type").notNull(),
  expiryDate: date("expiry_date").notNull(),
  notes: text("notes").notNull().default(""),
});
