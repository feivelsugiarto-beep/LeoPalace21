import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db, sessionsTable, roomsTable, inspectionsTable } from "@workspace/db";

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const uploadsDir = path.resolve(workspaceRoot, "artifacts/api-server/uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomBytes(16).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  },
});

const router: IRouter = Router();

function extractToken(req: Request): string | null {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

async function getRoomFromToken(token: string) {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session) return null;
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, session.roomId));
  return room ?? null;
}

router.get("/inspections", async (req, res): Promise<void> => {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Missing bearer token." }); return; }

  const room = await getRoomFromToken(token);
  if (!room) { res.status(401).json({ error: "Invalid or expired session." }); return; }

  const photos = await db
    .select()
    .from(inspectionsTable)
    .where(eq(inspectionsTable.roomId, room.id));

  res.json({ photos: photos.map(p => ({
    id: p.id,
    filename: p.filename,
    originalName: p.originalName,
    notes: p.notes,
    deviceLabel: p.deviceLabel,
    createdAt: p.createdAt,
    url: `/api/uploads/${p.filename}`,
  })) });
});

router.post("/inspections/upload", upload.single("photo"), async (req, res): Promise<void> => {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Missing bearer token." }); return; }

  const room = await getRoomFromToken(token);
  if (!room) { res.status(401).json({ error: "Invalid or expired session." }); return; }

  if (!req.file) { res.status(400).json({ error: "No image file provided." }); return; }

  const [inspection] = await db
    .insert(inspectionsTable)
    .values({
      roomId: room.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      notes: (req.body as { notes?: string }).notes?.trim() || null,
      deviceLabel: (req.body as { deviceLabel?: string }).deviceLabel?.trim() || null,
    })
    .returning();

  res.status(201).json({
    id: inspection.id,
    filename: inspection.filename,
    originalName: inspection.originalName,
    notes: inspection.notes,
    deviceLabel: inspection.deviceLabel,
    createdAt: inspection.createdAt,
    url: `/api/uploads/${inspection.filename}`,
  });
});

router.delete("/inspections/:id", async (req, res): Promise<void> => {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Missing bearer token." }); return; }

  const room = await getRoomFromToken(token);
  if (!room) { res.status(401).json({ error: "Invalid or expired session." }); return; }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [deleted] = await db
    .delete(inspectionsTable)
    .where(eq(inspectionsTable.id, id))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Photo not found." }); return; }

  res.sendStatus(204);
});

export default router;
