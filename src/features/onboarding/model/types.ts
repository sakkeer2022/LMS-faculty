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

export interface Credentials {
  fullName: string;
  password: string;
  confirmPassword: string;
  mobileNumber: string;
  city: string;
  highestQualification: string;
  teachingExperience: string;
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
  studiedAt: "",
};

export type DocumentField = "photoId" | "degreeCertificate" | "panCard";

export const DOCUMENTS: readonly { field: DocumentField; label: string; hint: string }[] = [
  { field: "photoId", label: "Photo ID", hint: "Aadhaar, passport or driving licence" },
  { field: "degreeCertificate", label: "Highest degree certificate", hint: "The qualification you entered on the previous step" },
  { field: "panCard", label: "PAN card", hint: "Required before we can pay you — TDS is deducted at 10%" },
];
