import { z } from "zod";

// Contract: amentorz-backend docs/openapi.yaml (startFacultyOnboarding,
// getFacultyOnboardingCatalogue, submitFacultyApplication). Parsed so drift fails loudly.

export const sessionSchema = z.object({ email: z.string(), expiresAt: z.string() });
export type OnboardingSession = z.infer<typeof sessionSchema>;

const named = z.object({ id: z.string(), name: z.string() });
export const offeringTreeSchema = z.object({
  nodes: z.array(z.object({ id: z.string(), parentId: z.string().nullable(), name: z.string(), isLeaf: z.boolean() })),
  offerings: z.array(
    z.object({
      curriculumId: z.string(),
      categoryId: z.string(),
      board: named.nullable(),
      level: named.nullable(),
      subject: named,
    }),
  ),
});
export type OfferingTree = z.infer<typeof offeringTreeSchema>;
export type PickerNode = OfferingTree["nodes"][number];
export type PickerOffering = OfferingTree["offerings"][number];

export const applicationResultSchema = z.object({
  applicationReference: z.string(),
  fullName: z.string(),
  email: z.string(),
  submittedAt: z.string(),
});
export type ApplicationResult = z.infer<typeof applicationResultSchema>;

export const TEACHING_EXPERIENCE = [
  { value: "0-1", label: "Less than 1 year" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5-10", label: "5–10 years" },
  { value: "10+", label: "More than 10 years" },
] as const;

/** "Preferred mode of teaching" options, from GET /faculty/onboarding/teaching-modes (seeded by the backend). */
export const teachingModeSchema = z.object({ code: z.string(), name: z.string(), offersOffline: z.boolean() });
export type TeachingMode = z.infer<typeof teachingModeSchema>;

export interface Credentials {
  fullName: string;
  password: string;
  confirmPassword: string;
  /** "+91 9876543210": the country code and the number, from the phone field */
  mobileNumber: string;
  city: string;
  highestQualification: string;
  teachingExperience: string;
  teachingMode: string;
  studiedAt: string;
}

export const EMPTY_CREDENTIALS: Credentials = {
  fullName: "",
  password: "",
  confirmPassword: "",
  mobileNumber: "",
  city: "",
  highestQualification: "",
  teachingExperience: "",
  teachingMode: "",
  studiedAt: "",
};

export type DocumentField = "photoId" | "degreeCertificate" | "panCard";

export const DOCUMENTS: readonly { field: DocumentField; label: string; hint: string }[] = [
  { field: "photoId", label: "Photo ID", hint: "Aadhaar, passport or driving licence" },
  { field: "degreeCertificate", label: "Highest degree certificate", hint: "The qualification you entered on the previous step" },
  { field: "panCard", label: "PAN card", hint: "Required before we can pay you — TDS is deducted at 10%" },
];

/** Optional extra documents on the documents step (stored as "Additional document"). */
export const ADDITIONAL_DOCUMENTS = { field: "additionalDocuments", max: 5 } as const;

// ── Re-upload after an admin's request (contract: startFacultyReupload, submitFacultyReupload) ──

export const reuploadDocumentSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  uploadedAt: z.string(),
  required: z.boolean(),
});
export type ReuploadDocument = z.infer<typeof reuploadDocumentSchema>;

export const reuploadSessionSchema = z.object({
  email: z.string(),
  expiresAt: z.string(),
  reason: z.string(),
  applicationReference: z.string().nullable(),
  values: z.object({
    fullName: z.string(),
    mobileNumber: z.string().nullable(),
    city: z.string().nullable(),
    highestQualification: z.string().nullable(),
    teachingExperience: z.string().nullable(),
    teachingMode: z.string().nullable(),
    studiedAt: z.string().nullable(),
  }),
  curriculumIds: z.array(z.string()),
  documents: z.array(reuploadDocumentSchema),
});
export type ReuploadSession = z.infer<typeof reuploadSessionSchema>;

/** Document type on file → the onboarding field that replaces it. */
export const FIELD_OF_TYPE: Record<string, DocumentField> = {
  GOVERNMENT_ID: "photoId",
  DEGREE_CERTIFICATE: "degreeCertificate",
  PAN_CARD: "panCard",
};

/** The answers on file as the form's values (no password: the account exists). */
export function credentialsFromSession(session: ReuploadSession): Credentials {
  const v = session.values;
  return {
    fullName: v.fullName,
    password: "",
    confirmPassword: "",
    mobileNumber: v.mobileNumber ?? "",
    city: v.city ?? "",
    highestQualification: v.highestQualification ?? "",
    teachingExperience: v.teachingExperience ?? "",
    teachingMode: v.teachingMode ?? "",
    studiedAt: v.studiedAt ?? "",
  };
}
