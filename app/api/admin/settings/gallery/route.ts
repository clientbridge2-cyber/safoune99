import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { loadSettings, saveSettings } from "@/lib/settings";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function DELETE(req: Request) {
  const user = getAuthFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request machi s7i7" }, { status: 400 });
  }

  const { id } = body;
  if (!id) return NextResponse.json({ error: "يجب إرسال معرّف" }, { status: 400 });

  const settings = loadSettings();
  const item = settings.gallery.find((g) => g.id === id);
  if (!item) {
    return NextResponse.json({ error: "الصورة غير موجودة" }, { status: 404 });
  }

  settings.gallery = settings.gallery.filter((g) => g.id !== id);
  saveSettings(settings);

  if (item.url.startsWith("/uploads/")) {
    const filePath = path.join(UPLOAD_DIR, path.basename(item.url));
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.error("Could not delete file", e);
    }
  }

  return NextResponse.json({ message: "تم حذف الصورة" });
}

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function randomId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(req: Request) {
  const user = getAuthFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }

  const file = formData.get("file");
  const alt = (formData.get("alt") as string) || "Barbero Taiib";
  const target = (formData.get("target") as string) || "gallery"; // "gallery" | "service"

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "لا يوجد ملف مرفوع" }, { status: 400 });
  }

  const ext = MIME_EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "نوع الملف غير مدعوم (استخدم jpg/png/webp/gif)" }, { status: 400 });
  }

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > 5) {
    return NextResponse.json({ error: "الملف أكبر من 5MB" }, { status: 400 });
  }

  ensureDir();
  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = randomId() + ext;
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, bytes);

  const url = `/uploads/${filename}`;
  const settings = loadSettings();

  if (target === "service") {
    const serviceId = (formData.get("serviceId") as string) || "";
    const svc = settings.services.find((s) => s.value === serviceId);
    if (!svc) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ error: "خدمة غير موجودة" }, { status: 404 });
    }
    svc.img = url;
    saveSettings(settings);
    return NextResponse.json({ message: "تم رفع الصورة", url });
  }

  // default: gallery
  const item = { id: randomId(), url, alt, addedAt: new Date().toISOString() };
  settings.gallery.unshift(item);
  saveSettings(settings);
  return NextResponse.json({ message: "تم رفع الصورة", galleryItem: item });
}