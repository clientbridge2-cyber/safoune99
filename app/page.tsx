"use client";

import { useState, useEffect } from "react";
import { BUSINESS, SERVICES } from "@/lib/constants";
import Image from "next/image";

type Step = "form" | "otp" | "done";

interface DynSettings {
  business: any;
  services: { value: string; label: string; price: string; img: string }[];
  gallery: { id: string; url: string; alt: string }[];
}

export default function LandingPage() {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({
    client_name: "",
    client_phone: "",
    service_type: "",
    appointment_date: "",
    appointment_time: "",
  });
  const [orderId, setOrderId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [otpHint, setOtpHint] = useState("");
  const [settings, setSettings] = useState<DynSettings | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const biz = settings?.business || BUSINESS;
  const services = settings?.services?.length ? settings.services : SERVICES;
  const gallery = settings?.gallery || [];

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.client_name.trim().length < 3) {
      setError("الاسم يجب أن يتكون من 3 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ ما");
        setLoading(false);
        return;
      }
      setOrderId(data.order_id);
      setOtpHint(data.otp_hint || "");
      setStep("otp");
    } catch {
      setError("حدث خطأ في الاتصال، حاول مرة أخرى");
    }
    setLoading(false);
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (otp.length !== 4) {
      setError("أدخل رمز التحقق المكون من 4 أرقام");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, otp_code: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "رمز غير صحيح");
        setLoading(false);
        return;
      }
      // fetch full booking for confirmation
      const bRes = await fetch(`/api/bookings/${orderId}`);
      const booking = await bRes.json();
      setBookingDetails(booking);
      setStep("done");
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    }
    setLoading(false);
  }

  function resetAll() {
    setForm({
      client_name: "",
      client_phone: "",
      service_type: "",
      appointment_date: "",
      appointment_time: "",
    });
    setOtp("");
    setOrderId("");
    setBookingDetails(null);
    setError("");
    setOtpHint("");
    setStep("form");
  }

  const serviceLabel = services.find((s) => s.value === bookingDetails?.service_type)?.label;

  return (
    <main className="min-h-screen bg-charcoal-dark text-cream">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{
            backgroundImage: "url('/bg.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-dark/50 via-charcoal-dark/60 to-charcoal-dark" />

        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="mx-auto mb-6 h-40 w-40">
            <Image
              src="/logo.jpg"
              alt="Barbero Taiib logo"
              width={160}
              height={160}
              className="h-full w-full rounded-full border-2 border-gold object-cover shadow-gold"
            />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-gold drop-shadow-gold">
            {biz.name}
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-cream/90">
            {biz.tagline}
          </p>
          <a
            href="#booking"
            className="mt-8 inline-block rounded-lg bg-gold px-8 py-4 text-lg font-bold text-charcoal-dark shadow-gold transition hover:bg-gold-light"
          >
            احجز موعدك الآن
          </a>
        </div>
      </section>

      {/* ===== SERVICES GALLERY ===== */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-gold">
          خدماتنا
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {services.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                update("service_type", s.value);
                document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group relative overflow-hidden rounded-xl border border-charcoal-light bg-charcoal text-start transition hover:border-gold"
            >
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img
                  src={s.img}
                  alt={s.label}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal-dark/95 to-transparent p-3">
                <div className="font-semibold text-cream">{s.label}</div>
                <div className="text-sm font-bold text-gold">{s.price} درهم</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ===== REAL PHOTOS GALLERY ===== */}
      {gallery.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-6">
          <h2 className="mb-6 text-center font-display text-2xl font-bold text-gold">
            أعمالنا
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((g) => (
              <div key={g.id} className="overflow-hidden rounded-xl border border-charcoal-light">
                <img
                  src={g.url}
                  alt={g.alt || "Barbero Taiib"}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== BOOKING MODULE ===== */}
      <section id="booking" className="mx-auto max-w-2xl px-6 py-14">
        <div className="rounded-2xl border border-gold/30 bg-charcoal p-8 shadow-gold">
          <h2 className="mb-6 text-center font-display text-2xl font-bold text-gold">
            {step === "form" && "احجز موعدك الآن"}
            {step === "otp" && "التحقق من رقم الهاتف"}
            {step === "done" && "تم تأكيد حجزك"}
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* STEP: FORM */}
          {step === "form" && (
            <form onSubmit={submitBooking} className="space-y-4">
              <Field label="الاسم الكامل">
                <input
                  type="text"
                  value={form.client_name}
                  onChange={(e) => update("client_name", e.target.value)}
                  placeholder="مثال: محمد العلوي"
                  className={inputCls}
                  required
                />
              </Field>
              <Field label="رقم الهاتف (مغربي)">
                <input
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  value={form.client_phone}
                  onChange={(e) => update("client_phone", e.target.value)}
                  placeholder="0612345678 أو +212612345678"
                  className={inputCls}
                  required
                />
                <p className="mt-1 text-xs text-cream/50">
                  سنرسل لك رمز تحقق عبر واتساب للتأكد من الرقم
                </p>
              </Field>
              <Field label="الخدمة">
                <select
                  value={form.service_type}
                  onChange={(e) => update("service_type", e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="">-- اختر الخدمة --</option>
                  {services.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label} — {s.price} درهم
                    </option>
                  ))}
                </select>
              </Field>

              {form.service_type && (() => {
                const svc = services.find((s) => s.value === form.service_type);
                if (!svc) return null;
                return (
                  <div className="overflow-hidden rounded-lg border border-gold/30">
                    <img
                      src={svc.img}
                      alt={svc.label}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="التاريخ">
                  <input
                    type="date"
                    min={today}
                    value={form.appointment_date}
                    onChange={(e) => update("appointment_date", e.target.value)}
                    className={inputCls}
                    required
                  />
                </Field>
                <Field label="الوقت">
                  <input
                    type="time"
                    value={form.appointment_time}
                    onChange={(e) => update("appointment_time", e.target.value)}
                    className={inputCls}
                    required
                  />
                </Field>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-gold py-4 text-lg font-bold text-charcoal-dark shadow-gold transition hover:bg-gold-light disabled:opacity-60"
              >
                {loading ? "جاري الإرسال..." : "تأكيد و طلب رمز التحقق"}
              </button>
            </form>
          )}

          {/* STEP: OTP */}
          {step === "otp" && (
            <form onSubmit={submitOtp} className="space-y-4 text-center">
              <div className="mx-auto mb-2 w-fit rounded-lg bg-charcoal-light px-4 py-2 text-sm text-cream/80">
                رقم الطلب: <span className="font-mono font-bold text-gold" dir="ltr">{orderId}</span>
              </div>
              {otpHint && (
                <div className="text-xs text-cream/50">
                  (وضع تجريبي) رمز التحقق: <strong className="text-gold">{otpHint}</strong>
                </div>
              )}
              <p className="text-cream/80">
                أدخل رمز التحقق المكون من 4 أرقام الذي تلقيته عبر واتساب
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                dir="ltr"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="0000"
                className={`${inputCls} mx-auto block text-center text-3xl font-bold tracking-[0.5em]`}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gold py-4 text-lg font-bold text-charcoal-dark shadow-gold transition hover:bg-gold-light disabled:opacity-60"
              >
                {loading ? "جاري التحقق..." : "تحقق و تأكيد الحجز"}
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="text-sm text-cream/60 hover:text-cream"
              >
                العودة
              </button>
            </form>
          )}

          {/* STEP: DONE */}
          {step === "done" && bookingDetails && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-4xl text-green-400">
                ✓
              </div>
              <p className="text-lg text-cream/90">
                شكراً {bookingDetails.client_name}! حجزك مسجل وهو قيد المراجعة.
              </p>
              <div className="mx-auto max-w-sm space-y-2 rounded-lg bg-charcoal-light p-5 text-start">
                <Row label="رقم الطلب" value={bookingDetails.order_id} mono />
                <Row label="الخدمة" value={serviceLabel || bookingDetails.service_type} />
                <Row label="التاريخ" value={bookingDetails.appointment_date} />
                <Row label="الوقت" value={bookingDetails.appointment_time} />
                <Row label="الحالة" value="قيد المراجعة" gold />
              </div>
              <p className="text-sm text-cream/60">
                سنتصل بك قريباً للتأكيد النهائي. لأي استفسار راسلنا على واتساب.
              </p>
              <a
                href={BUSINESS.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-[#25D366] px-8 py-3 font-bold text-charcoal-dark transition hover:brightness-110"
              >
                راسلنا على واتساب
              </a>
              <br />
              <button onClick={resetAll} className="mt-2 text-sm text-gold hover:underline">
                حجز موعد جديد
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ===== MAP CARD ===== */}
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="overflow-hidden rounded-2xl border border-charcoal-light bg-charcoal">
          <iframe
            title="Barbero Taiib location map"
            src={`https://maps.google.com/maps?q=${biz.lat},${biz.lng}&z=15&output=embed`}
            className="h-72 w-full grayscale-[0.2]"
            loading="lazy"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div>
              <h3 className="font-display font-bold text-gold">{biz.name}</h3>
              <p className="text-sm text-cream/70">{biz.address}</p>
            </div>
            <a
              href={biz.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-gold px-5 py-2 font-semibold text-charcoal-dark transition hover:bg-gold-light"
            >
              افتح في خرائط جوجل
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-gold/20 bg-charcoal">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Brand */}
            <div>
              <h3 className="font-display text-xl font-bold text-gold">{biz.name}</h3>
              <p className="mt-2 text-sm text-cream/60">{biz.tagline}</p>
            </div>

            {/* Contact links */}
            <div>
              <h4 className="mb-3 font-semibold text-cream">تواصل معنا</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={biz.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-cream/70 transition hover:text-[#3ee06f]"
                  >
                    <WhatsAppIcon /> <span>واتساب مباشر</span>
                  </a>
                </li>
                <li>
                  <a
                    href={biz.instagramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-cream/70 transition hover:text-[#f777a8]"
                  >
                    <InstagramIcon /> <span>@{biz.instagram}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={biz.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-cream/70 transition hover:text-gold"
                  >
                    <MapPinIcon /> <span>الموقع على الخريطة</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Location details */}
            <div>
              <h4 className="mb-3 font-semibold text-cream">الموقع</h4>
              <div className="space-y-2 text-sm text-cream/70">
                <p className="flex items-center gap-2">
                  <MapPinIcon />
                  <span>{biz.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <ClockIcon />
                  <span>{biz.hours}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom bar with map button + copyright */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-charcoal-light pt-6 sm:flex-row">
            <p className="text-sm text-cream/50">© 2026 {biz.name} — جميع الحقوق محفوظة</p>
            <a
              href={biz.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2 text-sm font-bold text-charcoal-dark transition hover:brightness-110"
            >
              <WhatsAppIcon /> احجز عبر واتساب
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-charcoal-light bg-charcoal-dark px-4 py-3 text-cream placeholder:text-cream/30 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-cream/80">{label}</span>
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  mono,
  gold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  gold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-cream/60">{label}</span>
      <span className={mono ? "font-mono font-semibold" : "font-semibold"} >
        <span className={gold ? "text-gold" : "text-cream"}>{value}</span>
      </span>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
    </svg>
  );
}
