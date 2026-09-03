import { NextResponse } from "next/server";
import { loadSettings, sanitizeSettings } from "@/lib/settings";

export async function GET() {
  const settings = sanitizeSettings(loadSettings());
  return NextResponse.json(settings);
}