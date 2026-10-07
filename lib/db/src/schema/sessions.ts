import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { roomsTable } from "./rooms";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  roomId: integer("room_id").notNull().references(() => roomsTable.id),
  deviceLabel: text("device_label"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true, lastSeenAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
