import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barbero Taiib - احجز موعدك الآن",
  description: "Luxury barbershop booking - احجز موعدك الآن عند Barbero Taiib",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-charcoal-dark text-cream font-body antialiased">
        {children}
      </body>
    </html>
  );
}
