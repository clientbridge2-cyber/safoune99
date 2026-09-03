import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { loadDB } from "@/lib/db";

function sanitize(booking: any) {
  const { otp_code, ...rest } = booking;
  return rest;
}

export async function GET(req: Request) {
  const user = getAuthFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = loadDB().map(sanitize);
  return NextResponse.json(bookings);
}
