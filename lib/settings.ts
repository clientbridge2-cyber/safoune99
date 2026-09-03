import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "settings.json");

export interface GalleryItem {
  id: string;
  url: string;
  alt: string;
  addedAt: string;
}

export interface ServiceItem {
  value: string;
  label: string;
  price: string;
  img: string;
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  whatsapp: string;
  whatsappLink: string;
  instagram: string;
  instagramLink: string;
  address: string;
  lat: number;
  lng: number;
  mapsLink: string;
  hours: string;
  bookingNote: string;
}

export interface BookingSettings {
  services: ServiceItem[];
  gallery: GalleryItem[];
  business: BusinessSettings;
}

const DEFAULTS: BookingSettings = {
  business: {
    name: "Barbero Taiib",
    tagline: "فخامة واحترافية في العناية بالشعر واللحية",
    whatsapp: "212602714889",
    whatsappLink: "https://wa.me/212602714889",
    instagram: "barbero__taiib",
    instagramLink: "https://instagram.com/barbero__taiib",
    address: "35.17755° N, 2.92598° W",
    lat: 35.17755,
    lng: -2.92598,
    mapsLink: "https://www.google.com/maps?q=35.17755,-2.92598",
    hours: "نستقبل جميع أيام الأسبوع",
    bookingNote: "سنرسل لك رمز تحقق عبر واتساب للتأكد من الرقم",
  },
  services: [
    { value: "Haircut", label: "تسريحة شعر", price: "50", img: "/services/haircut.jpg" },
    { value: "Beard Trim", label: "تهذيب اللحية", price: "30", img: "/services/beard.jpg" },
    { value: "Hair + Beard", label: "شعر + لحية", price: "70", img: "/services/hairbeard.jpg" },
    { value: "Facial Care", label: "العناية بالوجه", price: "80", img: "/services/facial.jpg" },
    { value: "Full Service", label: "خدمة كاملة", price: "120", img: "/services/full.jpg" },
  ],
  gallery: [],
};

export function loadSettings(): BookingSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      return {
        business: { ...DEFAULTS.business, ...(parsed.business || {}) },
        services: parsed.services && parsed.services.length ? parsed.services : DEFAULTS.services,
        gallery: parsed.gallery || [],
      };
    }
  } catch (e) {
    console.error("Error loading settings", e);
  }
  return DEFAULTS;
}

export function saveSettings(settings: BookingSettings): void {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export function sanitizeSettings(s: BookingSettings): BookingSettings {
  return JSON.parse(JSON.stringify(s));
}