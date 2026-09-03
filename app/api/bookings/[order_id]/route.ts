import { NextResponse } from "next/server";
import { loadDB } from "@/lib/db";

function sanitize(booking: any) {
  const { otp_code, ...rest } = booking;
  return rest;
}

export async function GET(_req: Request, { params }: { params: { order_id: string } }) {
  const bookings = loadDB();
  const booking = bookings.find((b) => b.order_id === params.order_id);
  if (!booking) {
    return NextResponse.json({ error: "Booking machi majoud" }, { status: 404 });
  }
  return NextResponse.json(sanitize(booking));
}
