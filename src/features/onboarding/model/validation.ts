import { z } from "zod";
import type { Credentials, DocumentField } from "./types";

const profileFields = {
  fullName: z.string().trim().min(2, "Enter your full name").max(150, "Full name must be at most 150 characters"),
  // "+91 9876543210" from the phone field: spaces are removed before the E.164 check
  mobileNumber: z
    .string()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^\+[1-9][0-9]{7,14}$/, "Enter the phone number with its country code, e.g. +91 98765 43210")),
  city: z.string().trim().max(100, "Must be at most 100 characters"),
  highestQualification: z.string().trim().min(2, "Enter your highest qualification").max(150, "Must be at most 150 characters"),
  teachingExperience: z.enum(["0-1", "1-3", "3-5", "5-10", "10+"], { error: "Select a range" }),
  teachingMode: z.string().min(1, "Select your preferred mode of teaching"),
  studiedAt: z.string().trim().max(200, "Must be at most 200 characters"),
};

/** A re-upload has no password step (the account exists); the other answers follow the same rules. */
export const reuploadCredentialsSchema = z.object({ ...profileFields, password: z.string(), confirmPassword: z.string() });

/** Mirrors the backend OnboardingApplicationDto (faculty.onboarding.dto.ts) and passwordSchema. */
export const credentialsSchema = z
  .object({
    ...profileFields,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain a number")
      .refine((v) => new TextEncoder().encode(v).length <= 72, "Password must be at most 72 bytes"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .superRefine((v, ctx) => {
    if (v.password && v.confirmPassword && v.password !== v.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
    }
  });

export type FieldErrors = Partial<Record<string, string>>;

export function validateCredentials(
  values: Credentials,
  mode: "apply" | "reupload" = "apply",
): { ok: true; data: z.output<typeof reuploadCredentialsSchema> } | { ok: false; errors: FieldErrors } {
  const parsed = (mode === "apply" ? credentialsSchema : reuploadCredentialsSchema).safeParse(values);
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
  if (field.startsWith("curriculumIds")) return 1;
  if ((["photoId", "degreeCertificate", "panCard", "declarationAccepted", "removeDocumentIds"] as string[]).includes(field)) return 2;
  if (field.startsWith("additionalDocuments")) return 2;
  return 0;
}

export function isDocumentField(field: string): field is DocumentField {
  return field === "photoId" || field === "degreeCertificate" || field === "panCard";
}

/** Checks the optional additional documents; returns one message for the first bad file. */
export function additionalFilesIssue(files: readonly File[], kept = 0, max = 5): string | undefined {
  if (files.length + kept > max) return `Add at most ${max} additional documents`;
  for (const file of files) {
    const issue = fileIssue(file, "document");
    if (issue) return `${file.name}: ${issue}`;
  }
  return undefined;
}
