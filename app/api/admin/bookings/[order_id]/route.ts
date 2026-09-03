import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { loadDB, saveDB } from "@/lib/db";

const validStatuses = ["Confirmed", "Cancelled", "Completed", "Blocked"];

export async function PATCH(request: Request, { params }: { params: { order_id: string } }) {
  const user = getAuthFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request machi s7i7" }, { status: 400 });
  }

  const { status } = body;
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Status ghalt" }, { status: 400 });
  }

  const bookings = loadDB();
  const booking = bookings.find((b) => b.order_id === params.order_id);
  if (!booking) {
    return NextResponse.json({ error: "Booking machi majoud" }, { status: 404 });
  }

  booking.status = status as any;
  saveDB(bookings);

  return NextResponse.json({
    order_id: booking.order_id,
    status: booking.status,
    message: "تم تحديث الحالة بنجاح",
  });
}
