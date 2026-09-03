import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data.json");

export interface Booking {
  order_id: string;
  client_name: string;
  client_phone: string;
  is_phone_verified: boolean;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  ip_address?: string;
  status: "Pending_OTP" | "Pending" | "Confirmed" | "Completed" | "Cancelled" | "Blocked";
  created_at: string;
}

export function loadDB(): Booking[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error("Error loading DB", e);
  }
  return [];
}

export function saveDB(bookings: Booking[]): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2));
}
