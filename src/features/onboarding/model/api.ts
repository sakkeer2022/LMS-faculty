"use client";
import { z } from "zod";
import { api } from "@/lib/api/client";
import {
  applicationResultSchema,
  offeringTreeSchema,
  reuploadSessionSchema,
  sessionSchema,
  teachingModeSchema,
  type Credentials,
  type DocumentField,
} from "./types";

export async function startOnboarding(token: string) {
  const res = await api<unknown>("/faculty/onboarding/session", { method: "POST", body: JSON.stringify({ token }) });
  return sessionSchema.parse(res.data);
}

export async function loadCatalogue() {
  const res = await api<unknown>("/faculty/onboarding/catalogue");
  return offeringTreeSchema.parse(res.data);
}

/** "Preferred mode of teaching" options (online, offline, hybrid), seeded by the backend. */
export async function loadTeachingModes() {
  const res = await api<unknown>("/faculty/onboarding/teaching-modes");
  return z.array(teachingModeSchema).parse(res.data);
}

/** A re-upload link: the admin's reason and the application on file, to pre-fill the form. */
export async function startReupload(token: string) {
  const res = await api<unknown>("/faculty/onboarding/reupload/session", { method: "POST", body: JSON.stringify({ token }) });
  return reuploadSessionSchema.parse(res.data);
}

export interface ApplicationInput {
  token: string;
  credentials: Credentials & { mobileNumber: string };
  curriculumIds: string[];
  /** Required documents; a re-upload may leave one out to keep the file on record */
  files: Partial<Record<DocumentField, File>>;
  additionalFiles: File[];
}

function profileForm(input: ApplicationInput): FormData {
  const form = new FormData();
  form.set("token", input.token);
  const c = input.credentials;
  form.set("fullName", c.fullName.trim());
  form.set("mobileNumber", c.mobileNumber);
  if (c.city.trim()) form.set("city", c.city.trim());
  form.set("highestQualification", c.highestQualification.trim());
  form.set("teachingExperience", c.teachingExperience);
  form.set("teachingMode", c.teachingMode);
  if (c.studiedAt.trim()) form.set("studiedAt", c.studiedAt.trim());
  form.set("curriculumIds", JSON.stringify(input.curriculumIds));
  form.set("declarationAccepted", "true");
  for (const [field, file] of Object.entries(input.files)) if (file) form.set(field, file, file.name);
  for (const file of input.additionalFiles) form.append("additionalDocuments", file, file.name);
  return form;
}

export async function submitApplication(input: ApplicationInput) {
  const form = profileForm(input);
  form.set("password", input.credentials.password);
  form.set("confirmPassword", input.credentials.confirmPassword);
  const res = await api<unknown>("/faculty/onboarding/applications", { method: "POST", body: form });
  return applicationResultSchema.parse(res.data);
}

/** The corrected application from a re-upload link; `removeDocumentIds` are additional documents to drop. */
export async function submitReupload(input: ApplicationInput & { removeDocumentIds: string[] }) {
  const form = profileForm(input);
  form.set("removeDocumentIds", JSON.stringify(input.removeDocumentIds));
  const res = await api<unknown>("/faculty/onboarding/reupload", { method: "POST", body: form });
  return applicationResultSchema.parse(res.data);
}
