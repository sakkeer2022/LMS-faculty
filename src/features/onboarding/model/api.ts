"use client";
import { api } from "@/lib/api/client";
import { applicationResultSchema, offeringTreeSchema, sessionSchema, type Credentials, type DocumentField } from "./types";

export async function startOnboarding(token: string) {
  const res = await api<unknown>("/faculty/onboarding/session", { method: "POST", body: JSON.stringify({ token }) });
  return sessionSchema.parse(res.data);
}

export async function loadCatalogue() {
  const res = await api<unknown>("/faculty/onboarding/catalogue");
  return offeringTreeSchema.parse(res.data);
}

export interface ApplicationInput {
  token: string;
  credentials: Credentials & { mobileNumber: string };
  curriculumIds: string[];
  offersOfflineClasses: boolean;
  files: Record<DocumentField, File>;
}

export async function submitApplication(input: ApplicationInput) {
  const form = new FormData();
  form.set("token", input.token);
  const c = input.credentials;
  form.set("fullName", c.fullName.trim());
  form.set("password", c.password);
  form.set("confirmPassword", c.confirmPassword);
  form.set("mobileNumber", c.mobileNumber);
  if (c.city.trim()) form.set("city", c.city.trim());
  form.set("highestQualification", c.highestQualification.trim());
  form.set("teachingExperience", c.teachingExperience);
  if (c.studiedAt.trim()) form.set("studiedAt", c.studiedAt.trim());
  form.set("curriculumIds", JSON.stringify(input.curriculumIds));
  form.set("offersOfflineClasses", String(input.offersOfflineClasses));
  form.set("declarationAccepted", "true");
  for (const [field, file] of Object.entries(input.files)) form.set(field, file, file.name);
  const res = await api<unknown>("/faculty/onboarding/applications", { method: "POST", body: form });
  return applicationResultSchema.parse(res.data);
}
