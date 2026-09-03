import { NextResponse } from "next/server";
import { loadDB, saveDB } from "@/lib/db";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request machi s7i7" }, { status: 400 });
  }

  const { order_id, otp_code } = body;
  if (!order_id || !otp_code) {
    return NextResponse.json({ error: "Khass tkoun order_id w otp_code" }, { status: 400 });
  }

  const bookings = loadDB();
  const booking = bookings.find((b) => b.order_id === order_id);

  if (!booking) {
    return NextResponse.json({ error: "Booking machi majoud" }, { status: 404 });
  }

  const storedOtp = (booking as any).otp_code;
  if (!storedOtp || storedOtp !== otp_code) {
    return NextResponse.json({ error: "رمز التحقق غير صحيح، حاول مرة أخرى" }, { status: 400 });
  }

  booking.is_phone_verified = true;
  booking.status = "Pending";
  delete (booking as any).otp_code;
  saveDB(bookings);

  return NextResponse.json({
    message: "تم تأكيد رقم الهاتف بنجاح! حجزك مسجل وهو قيد المراجعة.",
    order_id,
    status: "Pending",
  });
}
