export const BUSINESS = {
  name: "Barbero Taiib",
  whatsapp: "212602714889",
  whatsappLink: "https://wa.me/212602714889",
  instagram: "https://instagram.com/barbero__taiib",
  lat: 35.17755,
  lng: -2.92598,
  mapsLink: "https://www.google.com/maps?q=35.17755,-2.92598",
};

export const SERVICES = [
  { value: "Haircut", label: "تسريحة شعر", ar: "Haircut", price: "50", img: "/services/haircut.jpg" },
  { value: "Beard Trim", label: "تهذيب اللحية", ar: "Beard Trim", price: "30", img: "/services/beard.jpg" },
  { value: "Hair + Beard", label: "شعر + لحية", ar: "Hair + Beard", price: "70", img: "/services/hairbeard.jpg" },
  { value: "Facial Care", label: "العناية بالوجه", ar: "Facial Care", price: "80", img: "/services/facial.jpg" },
  { value: "Full Service", label: "خدمة كاملة", ar: "Full Service", price: "120", img: "/services/full.jpg" },
];

export function normalizePhone(phone: string): string {
  let p = phone.trim().replace(/[\s-]/g, "");
  if (p.startsWith("0")) {
    p = "+212" + p.slice(1);
  }
  return p;
}

export function moroccanPhoneIsValid(phone: string): boolean {
  return /^\+212[5-7][0-9]{8}$|^0[5-7][0-9]{8}$/.test(phone.trim());
}

export function generateOTP(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function generateOrderId(): string {
  return "ORD-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}
