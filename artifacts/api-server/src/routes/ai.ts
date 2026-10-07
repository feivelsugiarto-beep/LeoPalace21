import { Router, type IRouter, type Request } from "express";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { db, sessionsTable, roomsTable, inspectionsTable } from "@workspace/db";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

router.post("/ai/analyze/:photoId", async (req, res): Promise<void> => {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Missing bearer token." }); return; }

  const room = await getRoomFromToken(token);
  if (!room) { res.status(401).json({ error: "Invalid or expired session." }); return; }

  const photoId = parseInt(req.params.photoId as string, 10);
  const [photo] = await db.select().from(inspectionsTable).where(eq(inspectionsTable.id, photoId));

  if (!photo || photo.roomId !== room.id) {
    res.status(404).json({ error: "Photo not found." });
    return;
  }

  const filePath = path.resolve(workspaceRoot, "artifacts/api-server/uploads", photo.filename);

  let imageData: string;
  try {
    imageData = fs.readFileSync(filePath).toString("base64");
  } catch {
    res.status(404).json({ error: "Image file not found on server." });
    return;
  }

  const ext = path.extname(photo.filename).toLowerCase().replace(".", "");
  const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg"
    : ext === "png" ? "image/png"
    : ext === "webp" ? "image/webp"
    : "image/jpeg";

  const lang = req.query.lang === "ja" ? "ja" : "en";
  const systemPrompt = lang === "ja"
    ? `あなたは住宅会社の物件損傷検査員です。壁紙・壁の写真を分析してください。
簡潔かつ実務的に記述してください：1) 損傷や状態の説明、2) 重症度（なし・軽微・中程度・重大）、3) 推奨対応。
80文字以内で回答してください。損傷が見当たらない場合はその旨を明記してください。日本語で回答してください。`
    : `You are a property damage inspector. Analyze wallpaper/wall photos for a housing company. 
Be direct and practical. Describe: 1) what damage or condition you see, 2) severity (none/minor/moderate/severe), 3) recommended action. 
Keep it under 80 words. If the image shows no damage, say so clearly.`;

  const userPrompt = lang === "ja"
    ? "この壁・壁紙の損傷を分析してください："
    : "Analyze this wall/wallpaper for damage:";

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 400,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageData}` } },
          ],
        },
      ],
    });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500;
    let message = lang === "ja"
      ? "AI分析に失敗しました。しばらくしてから再試行してください。"
      : "AI analysis failed. Please try again later.";
    if (status === 429) {
      message = lang === "ja"
        ? "AIのご利用上限に達しました。OpenAIアカウントのご確認をお願いします。"
        : "OpenAI quota exceeded. Please check your API key billing at platform.openai.com.";
    }
    res.status(status).json({ error: message });
    return;
  }

  const analysis = completion.choices[0]?.message?.content ?? (lang === "ja" ? "画像を分析できませんでした。" : "Could not analyze image.");

  await db.update(inspectionsTable)
    .set({ notes: analysis })
    .where(eq(inspectionsTable.id, photoId));

  res.json({ analysis });
});

export default router;
