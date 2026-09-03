import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "barbero-taiib-super-secret-change-me";
const EXPIRES_IN = "8h";

export function signToken(user: string): string {
  return jwt.sign({ user }, JWT_SECRET, { expiresIn: EXPIRES_IN as any });
}

export function verifyToken(token: string): { user: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { user: string };
  } catch {
    return null;
  }
}

export function getAuthFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const bearer = auth.replace("Bearer ", "");
  const token = verifyToken(bearer);
  return token ? token.user : null;
}
