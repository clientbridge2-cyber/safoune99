/**
 * OTP Delivery service.
 *
 * For production uses Meta WhatsApp Cloud API (official API).
 * Credentials come from environment variables:
 *   - WHATSAPP_TOKEN      = Meta Cloud API access token
 *   - WHATSAPP_PHONE_ID   = your business phone number ID (numeric, from Meta)
 *   - WHATSAPP_NUMBER     = your business phone number in E.164 (e.g. 212602714889)
 *
 * To send a WhatsApp message template with an OTP, Meta requires an approved
 * template that accepts OTP as text/body, e.g.:
 *   "Your Barbero Taiib verification code is {{1}}"
 *
 * If WHATSAPP_TOKEN is not set, we fall back to a safe DEMO mode that logs the
 * OTP to the server console (useful for local testing). Never ship demo mode to
 * production.
 */

export type OTPResult = {
  sent: boolean;
  mode: "whatsapp" | "demo";
  deliveredTo?: string;
};

function waTemplateMessage(to: string, otp: string) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: process.env.WHATSAPP_TEMPLATE || "barbero_taiib_otp",
      language: { code: "ar" },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: otp,
            },
          ],
        },
      ],
    },
  };
}

export async function sendOTP(phoneE164: string, otp: string): Promise<OTPResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  // Demo / no credentials configured
  if (!token || !phoneId) {
    console.log(`[DEMO OTP] To ${phoneE164} -> Code: ${otp}`);
    return { sent: true, mode: "demo", deliveredTo: phoneE164 };
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(waTemplateMessage(phoneE164, otp)),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("WhatsApp send failed", data);
      return { sent: false, mode: "whatsapp" };
    }
    return { sent: true, mode: "whatsapp", deliveredTo: phoneE164 };
  } catch (err) {
    console.error("WhatsApp send error", err);
    return { sent: false, mode: "whatsapp" };
  }
}
