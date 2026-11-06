import { z } from "zod";
import type { Credentials, DocumentField } from "./types";

/** Mirrors the backend OnboardingApplicationDto (faculty.onboarding.dto.ts) and passwordSchema. */
export const credentialsSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(150, "Full name must be at most 150 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain a number")
      .refine((v) => new TextEncoder().encode(v).length <= 72, "Password must be at most 72 bytes"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    mobileNumber: z
      .string()
      .transform((v) => v.replace(/[\s()-]/g, ""))
      .pipe(z.string().regex(/^\+[1-9][0-9]{7,14}$/, "Enter the phone number with its country code, e.g. +91 98765 43210")),
    city: z.string().trim().max(100, "Must be at most 100 characters"),
    highestQualification: z.string().trim().min(2, "Enter your highest qualification").max(150, "Must be at most 150 characters"),
    teachingExperience: z.enum(["0-1", "1-3", "3-5", "5-10", "10+"], { error: "Select a range" }),
    studiedAt: z.string().trim().max(200, "Must be at most 200 characters"),
  })
  .superRefine((v, ctx) => {
    if (v.password && v.confirmPassword && v.password !== v.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
    }
  });

export type FieldErrors = Partial<Record<string, string>>;

export function validateCredentials(values: Credentials): { ok: true; data: z.output<typeof credentialsSchema> } | { ok: false; errors: FieldErrors } {
  const parsed = credentialsSchema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0]);
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "jpg", "jpeg", "png"] as const;
export const ACCEPT_ATTRIBUTE =
  ".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png,application/msword,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation";

/** Quick checks before upload; the server checks the file signature. */
export function fileIssue(file: File | null, label: string): string | undefined {
  if (!file) return `Upload your ${label.toLowerCase()}`;
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) return "Upload a PDF, DOC, PPT, JPG or PNG file";
  if (file.size === 0) return "The file is empty";
  if (file.size > MAX_FILE_BYTES) return "The file is larger than 10 MB";
  return undefined;
}

/** Which step a server field error belongs to, so the wizard can go back to it. */
export function stepOfField(field: string): 0 | 1 | 2 {
  if (field.startsWith("curriculumIds") || field === "offersOfflineClasses") return 1;
  if ((["photoId", "degreeCertificate", "panCard", "declarationAccepted"] as string[]).includes(field)) return 2;
  return 0;
}

export function isDocumentField(field: string): field is DocumentField {
  return field === "photoId" || field === "degreeCertificate" || field === "panCard";
}
