"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (typeof window === "undefined") return;
    const existing = localStorage.getItem("admin_token");
    if (existing) {
      router.push("/admin");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "بيانات الدخول غير صحيحة");
        setLoading(false);
        return;
      }
      localStorage.setItem("admin_token", data.token);
      router.push("/admin");
    } catch {
      setError("حدث خطأ في الاتصال");
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-charcoal-dark px-6">
      <div className="w-full max-w-sm rounded-2xl border border-gold/30 bg-charcoal p-8 shadow-gold">
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/logo.jpg"
            alt="logo"
            width={80}
            height={80}
            className="h-20 w-20 rounded-full border-2 border-gold object-cover"
          />
          <h1 className="mt-3 font-display text-xl font-bold text-gold">لوحة التحكم</h1>
          <p className="text-sm text-cream/60">Barbero Taiib — Admin</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={login} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-cream/80">اسم المستخدم</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-cream/80">كلمة المرور</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold py-3 font-bold text-charcoal-dark transition hover:bg-gold-light disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>

        <Link href="/" className="mt-4 block text-center text-sm text-gold hover:underline">
          ← العودة للموقع
        </Link>
      </div>
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-charcoal-light bg-charcoal-dark px-4 py-3 text-cream outline-none transition focus:border-gold";
