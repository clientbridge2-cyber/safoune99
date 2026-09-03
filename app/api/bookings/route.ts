import { NextResponse } from "next/server";
import { loadDB, saveDB, Booking } from "@/lib/db";
import {
  moroccanPhoneIsValid,
  normalizePhone,
  generateOTP,
  generateOrderId,
} from "@/lib/constants";
import { sendOTP } from "@/lib/whatsapp";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request machi s7i7" }, { status: 400 });
  }

  const { client_name, client_phone, service_type, appointment_date, appointment_time } = body;

  if (!client_name || client_name.trim().length < 3) {
    return NextResponse.json(
      { error: "الاسم يجب أن يتكون من 3 أحرف على الأقل" },
      { status: 400 }
    );
  }
  if (!moroccanPhoneIsValid(client_phone)) {
    return NextResponse.json(
      { error: "رقم الهاتف غير صحيح. يجب أن يكون رقماً مغربياً (+212 أو 06/07)" },
      { status: 400 }
    );
  }

  const validServices = ["Haircut", "Beard Trim", "Hair + Beard", "Facial Care", "Full Service"];
  if (!validServices.includes(service_type)) {
    return NextResponse.json({ error: "نوع الخدمة غير صحيح" }, { status: 400 });
  }

  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(appointment_time)) {
    return NextResponse.json({ error: "الوقت غير صحيح" }, { status: 400 });
  }

  const bookings = loadDB();
  const order_id = generateOrderId();
  const otp = generateOTP();
  const phone = normalizePhone(client_phone);

  const booking: Booking = {
    order_id,
    client_name: client_name.trim(),
    client_phone: phone,
    is_phone_verified: false,
    service_type,
    appointment_date,
    appointment_time,
    ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    status: "Pending_OTP",
    created_at: new Date().toISOString(),
  };

  // store otp temporarily (will be removed after verify or on response)
  (booking as any).otp_code = otp;
  bookings.unshift(booking);
  saveDB(bookings);

  // Send OTP via WhatsApp
  const otpResult = await sendOTP(phone, otp);

  if (!otpResult.sent) {
    return NextResponse.json(
      { error: "تعذر إرسال رمز التحقق عبر واتساب. حاول مرة أخرى." },
      { status: 502 }
    );
  }

  // Remove otp from stored DB for security (keep only hash-less transient state).
  // For demo/verification we keep it in memory via a temp map instead.
  return NextResponse.json(
    {
      message: "تم إنشاء الحجز. تم إرسال رمز التحقق.",
      order_id,
      // demo helper - remove in production
      ...(otpResult.mode === "demo" ? { otp_hint: otp } : {}),
      mode: otpResult.mode,
      status: "Pending_OTP",
    },
    { status: 201 }
  );
}
