"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Booking {
  order_id: string;
  client_name: string;
  client_phone: string;
  is_phone_verified: boolean;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
}

interface GalleryItem {
  id: string;
  url: string;
  alt: string;
  addedAt: string;
}

interface ServiceItem {
  value: string;
  label: string;
  price: string;
  img: string;
}

interface BusinessSettings {
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

interface Settings {
  business: BusinessSettings;
  services: ServiceItem[];
  gallery: GalleryItem[];
}

const SERVICES_LABEL: Record<string, string> = {
  Haircut: "تسريحة شعر",
  "Beard Trim": "تهذيب اللحية",
  "Hair + Beard": "شعر + لحية",
  "Facial Care": "العناية بالوجه",
  "Full Service": "خدمة كاملة",
};

const STATUS_LABEL: Record<string, string> = {
  Pending_OTP: "في انتظار التحقق",
  Pending: "قيد المراجعة",
  Confirmed: "مؤكد",
  Completed: "منجز",
  Cancelled: "ملغى",
  Blocked: "محظور",
};

type Tab = "bookings" | "business" | "services" | "gallery";

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("bookings");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(Date.now());

  const token = () => (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null);

  const loadAll = useCallback(async () => {
    const t = token();
    if (!t) {
      router.replace("/admin/login");
      return;
    }
    try {
      const [bRes, sRes] = await Promise.all([
        fetch("/api/admin/bookings", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      if (bRes.status === 401 || sRes.status === 401) {
        localStorage.removeItem("admin_token");
        router.replace("/admin/login");
        return;
      }
      setAuthed(true);
      setBookings(await bRes.json());
      setSettings(await sRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAll();
    const iv = setInterval(loadAll, 30000);
    const clock = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      clearInterval(iv);
      clearInterval(clock);
    };
  }, [loadAll]);

  async function updateStatus(orderId: string, status: string) {
    const labels: Record<string, string> = {
      Confirmed: "تأكيد هذا الحجز؟",
      Completed: "وضع علامة 'منجز'؟",
      Cancelled: "إلغاء هذا الحجز؟",
      Blocked: "حظر هذا المستخدم كمزيف؟ (لا يمكن التراجع)",
    };
    if (!window.confirm(labels[status] || "هل أنت متأكد؟")) return;
    const t = token();
    const res = await fetch(`/api/admin/bookings/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadAll();
    else alert("تعذر تحديث الحالة");
  }

  function logout() {
    localStorage.removeItem("admin_token");
    router.replace("/admin/login");
  }

  // ---- Business settings save ----
  async function saveBusiness(updated: BusinessSettings) {
    const t = token();
    const s = settings!;
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ business: updated, services: s.services, gallery: s.gallery }),
    });
    if (res.ok) {
      setSettings({ ...s, business: updated });
      alert("تم حفظ معلومات العمل");
    } else {
      alert("تعذر الحفظ");
    }
  }

  // ---- Services save ----
  async function saveServices(services: ServiceItem[]) {
    const t = token();
    const s = settings!;
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ business: s.business, services, gallery: s.gallery }),
    });
    if (res.ok) {
      setSettings({ ...s, services });
      alert("تم حفظ الخدمات");
    } else {
      alert("تعذر الحفظ");
    }
  }

  async function uploadServiceImage(serviceId: string, file: File) {
    const t = token();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("target", "service");
    fd.append("serviceId", serviceId);
    const res = await fetch("/api/admin/settings/gallery", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}` },
      body: fd,
    });
    if (res.ok) loadAll();
    else alert("تعذر رفع الصورة");
  }

  async function uploadGalleryImage(file: File) {
    const t = token();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("alt", "صالون Barbero Taiib");
    const res = await fetch("/api/admin/settings/gallery", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}` },
      body: fd,
    });
    if (res.ok) loadAll();
    else alert("تعذر رفع الصورة");
  }

  async function deleteGalleryItem(id: string) {
    if (!window.confirm("حذف هذه الصورة؟")) return;
    const t = token();
    const res = await fetch("/api/admin/settings/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ id }),
    });
    if (res.ok) loadAll();
    else alert("تعذر الحذف");
  }

  const filtered = useCallback(() => {
    let list = filter ? bookings.filter((b) => b.status === filter) : bookings;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.client_name.toLowerCase().includes(q) ||
          b.client_phone.includes(q) ||
          b.order_id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookings, filter, search]);
  const stats = (s: string) => bookings.filter((b) => b.status === s).length;

  if (!authed && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal-dark text-cream">
        جاري التحميل...
      </div>
    );
  }
  if (!authed) return null;

  return (
    <main className="min-h-screen bg-charcoal-dark text-cream">
      <header className="border-b border-gold/30 bg-charcoal">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-gold">
              لوحة تحكم Barbero Taiib
            </h1>
            <p className="text-sm text-cream/60">إدارة الحجوزات والإعدادات والمعرض</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-gold/40 px-5 py-2 font-semibold text-gold transition hover:bg-gold/10"
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-6 pt-6">
        {(
          [
            ["bookings", "الحجوزات"],
            ["business", "معلومات العمل"],
            ["services", "الخدمات"],
            ["gallery", "معرض الصور"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`whitespace-nowrap rounded-t-lg px-5 py-2.5 font-semibold transition ${
              tab === key
                ? "border-b-2 border-gold bg-charcoal text-gold"
                : "text-cream/60 hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="border-t border-charcoal-light">
        {tab === "bookings" && (
          <BookingsView
            filtered={filtered()}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            bookings={bookings}
            stats={stats}
            now={now}
            updateStatus={updateStatus}
            onRefresh={loadAll}
          />
        )}

        {tab === "business" && settings && (
          <BusinessEditor business={settings.business} onSave={saveBusiness} />
        )}

        {tab === "services" && settings && (
          <ServicesEditor
            services={settings.services}
            priceMap={SERVICES_LABEL}
            onSave={saveServices}
            onUpload={uploadServiceImage}
          />
        )}

        {tab === "gallery" && settings && (
          <GalleryView
            items={settings.gallery}
            onUpload={uploadGalleryImage}
            onDelete={deleteGalleryItem}
          />
        )}
      </div>
    </main>
  );
}

/* ============ Bookings tab ============ */
function BookingsView({
  filtered,
  search,
  setSearch,
  filter,
  setFilter,
  bookings,
  stats,
  now,
  updateStatus,
  onRefresh,
}: {
  filtered: Booking[];
  search: string;
  setSearch: (v: string) => void;
  filter: string;
  setFilter: (v: string) => void;
  bookings: Booking[];
  stats: (s: string) => number;
  now: number;
  updateStatus: (id: string, s: string) => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-6 py-6 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="الكل" value={bookings.length} color="text-gold" />
        <StatCard label="بانتظار التحقق" value={stats("Pending_OTP")} color="text-yellow-400" />
        <StatCard label="قيد المراجعة" value={stats("Pending")} color="text-blue-400" />
        <StatCard label="مؤكد" value={stats("Confirmed")} color="text-green-400" />
        <StatCard label="منجز" value={stats("Completed")} color="text-emerald-300" />
        <StatCard label="محظور" value={stats("Blocked")} color="text-red-400" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 pb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم / الهاتف / رقم الطلب..."
          className="min-w-[200px] flex-1 rounded-lg border border-charcoal-light bg-charcoal px-4 py-2 text-cream placeholder:text-cream/40 outline-none focus:border-gold"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-charcoal-light bg-charcoal px-4 py-2 text-cream outline-none focus:border-gold"
        >
          <option value="">كل الحجوزات</option>
          <option value="Pending_OTP">بإنتظار التحقق</option>
          <option value="Pending">قيد المراجعة</option>
          <option value="Confirmed">مؤكد</option>
          <option value="Completed">منجز</option>
          <option value="Cancelled">ملغى</option>
          <option value="Blocked">محظور</option>
        </select>
        <button
          onClick={onRefresh}
          className="rounded-lg border border-gold/40 px-4 py-2 font-semibold text-gold transition hover:bg-gold/10"
        >
          تحديث
        </button>
      </div>

      <div className="mx-auto max-w-6xl overflow-x-auto px-6 pb-14">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-cream/50">لا توجد حجوزات مطابقة</p>
        ) : (
          <table className="w-full min-w-[760px] overflow-hidden rounded-xl border border-charcoal-light bg-charcoal text-sm">
            <thead className="border-b border-charcoal-light bg-charcoal-dark text-gold">
              <tr>
                <Th>رقم الطلب</Th>
                <Th>العميل</Th>
                <Th>الهاتف</Th>
                <Th>الخدمة</Th>
                <Th>التاريخ</Th>
                <Th>الحالة</Th>
                <Th>تحقق</Th>
                <Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.order_id} className="border-b border-charcoal-light/50 hover:bg-charcoal-light/30">
                  <Td>
                    <span className="font-mono text-gold" dir="ltr">{b.order_id}</span>
                    <div className="text-[10px] text-cream/40">{timeAgo(b.created_at, now)}</div>
                  </Td>
                  <Td>{b.client_name}</Td>
                  <Td><span dir="ltr">{b.client_phone}</span></Td>
                  <Td>{SERVICES_LABEL[b.service_type] || b.service_type}</Td>
                  <Td>
                    <div>{b.appointment_date}</div>
                    <div className="text-xs text-cream/50">{b.appointment_time}</div>
                  </Td>
                  <Td>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColor(b.status)}`}>
                      {STATUS_LABEL[b.status] || b.status}
                    </span>
                  </Td>
                  <Td>
                    {b.is_phone_verified ? (
                      <span className="font-semibold text-green-400">✓ مؤكد</span>
                    ) : (
                      <span className="text-yellow-400">غير مؤكد</span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      {b.status === "Pending" && (
                        <>
                          <Btn onClick={() => updateStatus(b.order_id, "Confirmed")} color="green" label="موافقة" />
                          <Btn onClick={() => updateStatus(b.order_id, "Cancelled")} color="red" label="رفض" />
                          <Btn onClick={() => updateStatus(b.order_id, "Blocked")} color="gray" label="حظر" />
                        </>
                      )}
                      {b.status === "Confirmed" && (
                        <>
                          <Btn onClick={() => updateStatus(b.order_id, "Completed")} color="green" label="إنجاز" />
                          <Btn onClick={() => updateStatus(b.order_id, "Cancelled")} color="red" label="إلغاء" />
                        </>
                      )}
                      {b.status === "Pending_OTP" && (
                        <span className="text-xs text-cream/50">بانتظار تحقق العميل</span>
                      )}
                      {b.status === "Blocked" && (
                        <span className="text-xs text-red-400">مستخدم مزيف محظور</span>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ============ Business settings tab ============ */
function BusinessEditor({
  business,
  onSave,
}: {
  business: BusinessSettings;
  onSave: (b: BusinessSettings) => void;
}) {
  const [form, setForm] = useState(business);
  const on = (k: keyof BusinessSettings, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    const link = "https://wa.me/" + String(form.whatsapp).replace(/\D/g, "");
    const instaUser = String(form.instagram).replace(/^@/, "").trim();
    const maps =
      typeof form.lat === "number" && typeof form.lng === "number"
        ? `https://www.google.com/maps?q=${form.lat},${form.lng}`
        : form.mapsLink;
    onSave({
      ...form,
      whatsappLink: link,
      instagram: instaUser,
      instagramLink: `https://instagram.com/${instaUser}`,
      mapsLink: maps,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-6 py-8">
      <Field label="اسم المحل">
        <input className={inputCls} value={form.name} onChange={(e) => on("name", e.target.value)} />
      </Field>
      <Field label="الشعار/العبارة">
        <input className={inputCls} value={form.tagline} onChange={(e) => on("tagline", e.target.value)} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="رقم واتساب (بصيغة دولية، مثال 212602714889)">
          <input className={inputCls} dir="ltr" value={form.whatsapp} onChange={(e) => on("whatsapp", e.target.value)} />
        </Field>
        <Field label="انستغرام (بدون @)">
          <input className={inputCls} dir="ltr" value={form.instagram} onChange={(e) => on("instagram", e.target.value)} />
        </Field>
      </div>

      <Field label="ساعات العمل">
        <input className={inputCls} value={form.hours} onChange={(e) => on("hours", e.target.value)} />
      </Field>
      <Field label="ملاحظة الحجز">
        <input className={inputCls} value={form.bookingNote} onChange={(e) => on("bookingNote", e.target.value)} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="العنوان">
          <input className={inputCls} value={form.address} onChange={(e) => on("address", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="خط العرض (Lat)">
          <input className={inputCls} dir="ltr" type="number" value={form.lat} onChange={(e) => on("lat", parseFloat(e.target.value) || 0)} />
        </Field>
        <Field label="خط الطول (Lng)">
          <input className={inputCls} dir="ltr" type="number" value={form.lng} onChange={(e) => on("lng", parseFloat(e.target.value) || 0)} />
        </Field>
      </div>

      <button
        onClick={save}
        className="w-full rounded-lg bg-gold py-3 font-bold text-charcoal-dark transition hover:bg-gold-light"
      >
        حفظ معلومات العمل
      </button>
    </div>
  );
}

/* ============ Services tab ============ */
function ServicesEditor({
  services,
  priceMap,
  onSave,
  onUpload,
}: {
  services: ServiceItem[];
  priceMap: Record<string, string>;
  onSave: (s: ServiceItem[]) => void;
  onUpload: (id: string, file: File) => void;
}) {
  const [items, setItems] = useState<ServiceItem[]>(services);
  const set = (i: number, patch: Partial<ServiceItem>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-6 py-8">
      {items.map((s, i) => (
        <div key={s.value} className="flex flex-wrap items-center gap-3 rounded-xl border border-charcoal-light bg-charcoal p-4">
          <img src={s.img} alt="" className="h-16 w-16 rounded-lg object-cover" />
          <div className="min-w-[160px] flex-1">
            <input
              className="w-full rounded-lg border border-charcoal-light bg-charcoal-dark px-3 py-2 text-cream outline-none focus:border-gold"
              value={s.label}
              onChange={(e) => set(i, { label: e.target.value })}
            />
          </div>
          <div className="w-28">
            <input
              className="w-full rounded-lg border border-charcoal-light bg-charcoal-dark px-3 py-2 text-cream outline-none focus:border-gold"
              value={s.price}
              placeholder="الثمن"
              onChange={(e) => set(i, { price: e.target.value })}
            />
          </div>
          <label className="cursor-pointer rounded-lg border border-charcoal-light px-3 py-2 text-xs text-cream/70 hover:border-gold">
            تغيير الصورة
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(s.value, f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      ))}
      <button
        onClick={() => onSave(items)}
        className="w-full rounded-lg bg-gold py-3 font-bold text-charcoal-dark transition hover:bg-gold-light"
      >
        حفظ الخدمات والأسعار
      </button>
    </div>
  );
}

/* ============ Gallery tab ============ */
function GalleryView({
  items,
  onUpload,
  onDelete,
}: {
  items: GalleryItem[];
  onUpload: (f: File) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <label className="mb-6 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gold/40 py-8 text-gold transition hover:bg-gold/5">
        <span className="text-lg font-bold">+</span>
        <span>رفع صورة حقيقية (صالون / أعمال)</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </label>

      {items.length === 0 ? (
        <p className="py-10 text-center text-cream/50">
          لا توجد صور بعد. ارفع صوراً حقيقية لصالونك وأعمالك لتعرضها في الموقع.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className="group relative overflow-hidden rounded-xl border border-charcoal-light">
              <img src={it.url} alt={it.alt || "gallery"} className="aspect-square w-full object-cover" />
              <button
                onClick={() => onDelete(it.id)}
                className="absolute bottom-2 left-2 rounded-md bg-red-600/90 px-3 py-1.5 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ small components ============ */
function timeAgo(iso: string, now: number): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const diff = Math.floor((now - t) / 1000);
  if (diff < 60) return "قبل قليل";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-start font-semibold">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-charcoal-light bg-charcoal p-4 text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-cream/60">{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-cream/80">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-charcoal-light bg-charcoal-dark px-4 py-3 text-cream outline-none transition focus:border-gold";

function statusColor(status: string) {
  switch (status) {
    case "Pending_OTP":
      return "bg-yellow-500/15 text-yellow-400";
    case "Pending":
      return "bg-blue-500/15 text-blue-400";
    case "Confirmed":
      return "bg-green-500/15 text-green-400";
    case "Completed":
      return "bg-emerald-500/15 text-emerald-300";
    case "Cancelled":
      return "bg-red-500/15 text-red-400";
    case "Blocked":
      return "bg-gray-500/15 text-gray-400";
    default:
      return "bg-charcoal-light text-cream";
  }
}

function Btn({
  onClick,
  color,
  label,
}: {
  onClick: () => void;
  color: "green" | "red" | "gray";
  label: string;
}) {
  const colors = {
    green: "bg-green-500/15 text-green-400 hover:bg-green-500/25",
    red: "bg-red-500/15 text-red-400 hover:bg-red-500/25",
    gray: "bg-gray-500/15 text-gray-300 hover:bg-gray-500/25",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${colors[color]}`}
    >
      {label}
    </button>
  );
}


