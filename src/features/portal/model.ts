"use client";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { sessionUserSchema } from "@/lib/auth/access";

// Contract: amentorz-backend docs/openapi.yaml (getFacultyPriceConsent, decideFacultyPriceConsent)
const amounts = z.object({
  sessionPricePaise: z.number(),
  gstRateBps: z.number(),
  gstPaise: z.number(),
  studentPaysPaise: z.number(),
  ruleId: z.string(),
  revision: z.number(),
});
export const priceConsentSchema = z.object({
  status: z.enum(["required", "accepted", "rejected"]),
  decidedAt: z.string().nullable(),
  snapshotHash: z.string(),
  subjects: z.array(
    z.object({
      assignmentId: z.string(),
      curriculumId: z.string(),
      subject: z.string(),
      pathLabel: z.string(),
      price: amounts.passthrough(),
    }),
  ),
});
export type PriceConsent = z.infer<typeof priceConsentSchema>;

export async function getMe() {
  return sessionUserSchema.parse((await api<unknown>("/auth/me")).data);
}

export async function getPriceConsent() {
  return priceConsentSchema.parse((await api<unknown>("/faculty/me/price-consent")).data);
}

export async function decidePriceConsent(decision: "accept" | "reject", snapshotHash: string) {
  const res = await api<unknown>("/faculty/me/price-consent", {
    method: "POST",
    body: JSON.stringify({ decision, snapshotHash }),
  });
  return priceConsentSchema.parse(res.data);
}

export async function signOut() {
  try {
    await api("/auth/logout", { method: "POST" });
  } finally {
    window.location.assign("/login");
  }
}

const whole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const exact = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

/** Paise to "₹1,450", or "₹999.50" when there are paise (same rule as the admin app). All money is INR. */
export function formatPaise(paise: number) {
  return paise % 100 === 0 ? whole.format(paise / 100) : exact.format(paise / 100);
}

export function gstPercent(bps: number) {
  return `${bps / 100}%`;
}
