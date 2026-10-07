import { Router, type IRouter, type Request } from "express";
import { randomBytes } from "crypto";
import { eq, and } from "drizzle-orm";
import { db, accountsTable, roomsTable, sessionsTable } from "@workspace/db";

const router: IRouter = Router();

function extractToken(req: Request): string | null {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { managementNumber, roomNumber, receptionNumber, deviceLabel } = req.body as {
    managementNumber?: string;
    roomNumber?: string;
    receptionNumber?: string;
    deviceLabel?: string;
  };

  if (!managementNumber?.trim() || !roomNumber?.trim() || !receptionNumber?.trim()) {
    res.status(400).json({ error: "managementNumber, roomNumber, and receptionNumber are required." });
    return;
  }

  const [account] = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.managementNumber, managementNumber.trim()));

  if (!account) {
    res.status(401).json({ error: "Invalid management number." });
    return;
  }

  const [room] = await db
    .select()
    .from(roomsTable)
    .where(
      and(
        eq(roomsTable.accountId, account.id),
        eq(roomsTable.roomNumber, roomNumber.trim()),
        eq(roomsTable.receptionNumber, receptionNumber.trim()),
      ),
    );

  if (!room) {
    res.status(401).json({ error: "Invalid room number or reception number." });
    return;
  }

  const token = randomBytes(32).toString("hex");

  const [session] = await db
    .insert(sessionsTable)
    .values({
      token,
      roomId: room.id,
      deviceLabel: deviceLabel?.trim() || null,
    })
    .returning();

  res.status(201).json({
    token: session.token,
    account: { id: account.id, managementNumber: account.managementNumber, name: account.name },
    room: { id: room.id, roomNumber: room.roomNumber, receptionNumber: room.receptionNumber },
    session: { id: session.id, deviceLabel: session.deviceLabel, createdAt: session.createdAt },
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token));

  if (!session) {
    res.status(401).json({ error: "Invalid or expired session." });
    return;
  }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, session.roomId));
  if (!room) {
    res.status(401).json({ error: "Room not found." });
    return;
  }

  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, room.accountId));
  if (!account) {
    res.status(401).json({ error: "Account not found." });
    return;
  }

  await db
    .update(sessionsTable)
    .set({ lastSeenAt: new Date() })
    .where(eq(sessionsTable.token, token));

  res.json({
    account: { id: account.id, managementNumber: account.managementNumber, name: account.name },
    room: { id: room.id, roomNumber: room.roomNumber, receptionNumber: room.receptionNumber },
    session: { id: session.id, deviceLabel: session.deviceLabel, createdAt: session.createdAt },
  });
});

router.get("/auth/sessions", async (req, res): Promise<void> => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  const [current] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!current) {
    res.status(401).json({ error: "Invalid or expired session." });
    return;
  }

  const allSessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.roomId, current.roomId));

  res.json({
    currentSessionId: current.id,
    sessions: allSessions.map((s) => ({
      id: s.id,
      deviceLabel: s.deviceLabel,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      isCurrent: s.id === current.id,
    })),
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  const [deleted] = await db
    .delete(sessionsTable)
    .where(eq(sessionsTable.token, token))
    .returning();

  if (!deleted) {
    res.status(401).json({ error: "Invalid or expired session." });
    return;
  }

  res.sendStatus(204);
});

router.post("/auth/switch-room", async (req, res): Promise<void> => {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Missing bearer token." }); return; }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session) { res.status(401).json({ error: "Invalid or expired session." }); return; }

  const [currentRoom] = await db.select().from(roomsTable).where(eq(roomsTable.id, session.roomId));
  if (!currentRoom) { res.status(401).json({ error: "Room not found." }); return; }

  const { roomId } = req.body as { roomId?: number };
  if (!roomId) { res.status(400).json({ error: "roomId is required." }); return; }

  const [targetRoom] = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId));
  if (!targetRoom || targetRoom.accountId !== currentRoom.accountId) {
    res.status(403).json({ error: "Room not found on this account." });
    return;
  }

  await db.update(sessionsTable).set({ roomId: targetRoom.id }).where(eq(sessionsTable.token, token));

  res.json({ room: { id: targetRoom.id, roomNumber: targetRoom.roomNumber, receptionNumber: targetRoom.receptionNumber } });
});

router.get("/auth/rooms", async (req, res): Promise<void> => {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Missing bearer token." }); return; }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session) { res.status(401).json({ error: "Invalid or expired session." }); return; }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, session.roomId));
  if (!room) { res.status(401).json({ error: "Room not found." }); return; }

  const allRooms = await db.select().from(roomsTable).where(eq(roomsTable.accountId, room.accountId));
  res.json({ rooms: allRooms.map((r) => ({ id: r.id, roomNumber: r.roomNumber, receptionNumber: r.receptionNumber })) });
});

router.post("/auth/rooms", async (req, res): Promise<void> => {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Missing bearer token." }); return; }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session) { res.status(401).json({ error: "Invalid or expired session." }); return; }

  const [currentRoom] = await db.select().from(roomsTable).where(eq(roomsTable.id, session.roomId));
  if (!currentRoom) { res.status(401).json({ error: "Room not found." }); return; }

  const { roomNumber, receptionNumber } = req.body as { roomNumber?: string; receptionNumber?: string };
  if (!roomNumber?.trim() || !receptionNumber?.trim()) {
    res.status(400).json({ error: "roomNumber and receptionNumber are required." });
    return;
  }

  const existing = await db.select().from(roomsTable).where(
    and(eq(roomsTable.accountId, currentRoom.accountId), eq(roomsTable.roomNumber, roomNumber.trim()))
  );
  if (existing.length > 0) {
    res.status(409).json({ error: "A room with that number already exists on this account." });
    return;
  }

  const [newRoom] = await db.insert(roomsTable).values({
    accountId: currentRoom.accountId,
    roomNumber: roomNumber.trim(),
    receptionNumber: receptionNumber.trim(),
  }).returning();

  res.status(201).json({ room: { id: newRoom.id, roomNumber: newRoom.roomNumber, receptionNumber: newRoom.receptionNumber } });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const { managementNumber, name, rooms } = req.body as {
    managementNumber?: string;
    name?: string;
    rooms?: { roomNumber: string; receptionNumber: string }[];
  };

  if (!managementNumber?.trim()) {
    res.status(400).json({ error: "managementNumber is required." });
    return;
  }
  if (!rooms || rooms.length === 0) {
    res.status(400).json({ error: "At least one room is required." });
    return;
  }
  for (const r of rooms) {
    if (!r.roomNumber?.trim() || !r.receptionNumber?.trim()) {
      res.status(400).json({ error: "Each room needs a room number and reception number." });
      return;
    }
  }

  const existing = await db.select().from(accountsTable).where(eq(accountsTable.managementNumber, managementNumber.trim()));
  if (existing.length > 0) {
    res.status(409).json({ error: "That management number is already taken." });
    return;
  }

  const [account] = await db
    .insert(accountsTable)
    .values({ managementNumber: managementNumber.trim(), name: name?.trim() || null })
    .returning();

  await db.insert(roomsTable).values(
    rooms.map((r) => ({
      accountId: account.id,
      roomNumber: r.roomNumber.trim(),
      receptionNumber: r.receptionNumber.trim(),
    })),
  );

  res.status(201).json({ message: "Account created.", managementNumber: account.managementNumber });
});

router.post("/auth/seed", async (req, res): Promise<void> => {
  const existing = await db.select().from(accountsTable).where(eq(accountsTable.managementNumber, "PM-2024-001"));
  if (existing.length > 0) {
    res.json({ message: "Seed data already exists." });
    return;
  }

  const [account] = await db
    .insert(accountsTable)
    .values({ managementNumber: "PM-2024-001", name: "Riverside Property Group" })
    .returning();

  await db.insert(roomsTable).values([
    { accountId: account.id, roomNumber: "101A", receptionNumber: "REC-20240610" },
    { accountId: account.id, roomNumber: "204B", receptionNumber: "REC-20240615" },
    { accountId: account.id, roomNumber: "312", receptionNumber: "REC-20240620" },
  ]);

  res.status(201).json({ message: "Seed data created.", managementNumber: "PM-2024-001" });
});

export default router;
