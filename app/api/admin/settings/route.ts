import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { loadSettings, saveSettings, sanitizeSettings } from "@/lib/settings";

export async function GET(req: Request) {
  const user = getAuthFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(sanitizeSettings(loadSettings()));
}

export async function PUT(req: Request) {
  const user = getAuthFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request machi s7i7" }, { status: 400 });
  }

  const settings = loadSettings();
  const next: any = sanitizeSettings(settings);

  if (body.business) {
    next.business = { ...next.business, ...body.business };
  }
  if (Array.isArray(body.services)) {
    next.services = body.services;
  }
  if (body.gallery) {
    next.gallery = body.gallery;
  }

  saveSettings(next);
  return NextResponse.json({ message: "تم حفظ الإعدادات", settings: sanitizeSettings(next) });
}