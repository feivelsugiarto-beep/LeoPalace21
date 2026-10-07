import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { roomsTable } from "./rooms";

export const inspectionsTable = pgTable("inspections", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => roomsTable.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  notes: text("notes"),
  deviceLabel: text("device_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInspectionSchema = createInsertSchema(inspectionsTable).omit({ id: true, createdAt: true });
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspectionsTable.$inferSelect;
