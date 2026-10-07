import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { accountsTable } from "./accounts";

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accountsTable.id),
  roomNumber: text("room_number").notNull(),
  receptionNumber: text("reception_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
