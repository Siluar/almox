import { Router } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";

const ACCESS_CODE = process.env.ACCESS_CODE || "1234";
const SECRET = process.env.SESSION_SECRET || "almox-dev-secret-change-me";
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export function signToken(): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyToken(token: string): boolean {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as { exp?: unknown };
    return typeof exp === "number" && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  next();
}

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";

  if (!code) {
    res.status(401).json({ error: "Informe o código de acesso" });
    return;
  }

  if (code !== ACCESS_CODE) {
    res.status(401).json({ error: "Código de acesso inválido" });
    return;
  }

  res.json({ token: signToken() });
});

export function isDefaultAccessCode(): boolean {
  return ACCESS_CODE === "1234";
}