import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request machi s7i7" }, { status: 400 });
  }

  const { username, password } = body;

  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPassHash = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync("admin123", 10);
  const adminPassPlain = process.env.ADMIN_PASSWORD; // fallback plaintext support

  const passMatches = adminPassPlain
    ? password === adminPassPlain
    : bcrypt.compareSync(password || "", adminPassHash);

  if (username !== adminUser || !passMatches) {
    return NextResponse.json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" }, { status: 401 });
  }

  const token = signToken(username);

  return NextResponse.json({
    token,
    user: username,
    expiresIn: "8h",
  });
}
