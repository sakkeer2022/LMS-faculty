/**
 * Marketing copy on the onboarding brand panel, as in Figma 43b/43d/43e. The figures and the
 * parent quote are design placeholders: replace them with real numbers and a consented
 * testimonial before launch (backend docs/PENDING_DECISIONS.md, F8).
 */
export const BRAND = {
  eyebrow: "TEACH WITH AMENTORZ",
  title: ["Teach the subject you love.", "Get paid for the sessions you", "actually run."],
  copy:
    "Set your own availability, keep a transparent incentive score, and get paid on the 7th for the previous month — base plus incentive, with every deduction shown.",
  stats: [
    { value: "1.86 L", label: "sessions delivered" },
    { value: "30", label: "sessions clears incentive" },
    { value: "7th", label: "monthly payout day" },
  ],
  quote: {
    text: "“The tutor taught straight from our NCERT chapter list. My daughter went from 62% to 84% in two terms.”",
    name: "Sunita Mehta",
    detail: "Parent · Class 10 CBSE · Pune",
  },
} as const;

export const TIMELINE = [
  { title: "Document submitted", text: "Operations verifies your ID, degree and PAN. Usually 3–5 working days." },
  { title: "Document check", text: "Operations verifies your ID, degree and PAN. Usually 3–5 working days." },
  { title: "Short subject call", text: "A 20-minute call on the subjects you selected. We book it by email." },
  { title: "Profile goes live", text: "Your profile appears in tutor search and you can set your availability." },
] as const;
