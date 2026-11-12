"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { subjectCardSchema } from "@/features/subject-cards/api";

// Contract: amentorz-backend docs/openapi.yaml, tag "Faculty library" (getOwnLibrary,
// listOwnLibraryResources, createOwnLibraryResource, updateOwnLibraryResource,
// withdrawOwnLibraryResource, getOwnLibraryResourceFile). Every add and edit is reviewed by Amentorz.

export const libraryCardSchema = subjectCardSchema.extend({
  counts: z.object({ approved: z.number(), inReview: z.number(), rejected: z.number() }),
});
export type LibraryCard = z.infer<typeof libraryCardSchema>;

const fileSchema = z.object({ name: z.string(), size: z.number(), mimeType: z.string(), previewable: z.boolean() });
const content = {
  kind: z.enum(["file", "note"]),
  title: z.string(),
  description: z.string().nullable(),
  body: z.string().nullable(),
  file: fileSchema.nullable(),
};
export const resourceSchema = z.object({
  id: z.string(),
  curriculumId: z.string(),
  ...content,
  reviewState: z.enum(["pending", "rejected", "approved", "edit_pending", "edit_rejected"]),
  revision: z.number(),
  pendingEdit: z.object({ ...content, revision: z.number(), submittedAt: z.string() }).nullable(),
  lastDecision: z
    .object({ decision: z.enum(["approved", "rejected"]), notes: z.string().nullable(), decidedAt: z.string(), revision: z.number() })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Resource = z.infer<typeof resourceSchema>;
export type ResourceKind = Resource["kind"];

export const libraryKeys = {
  overview: () => ["faculty", "me", "library"] as const,
  resources: (curriculumId: string) => ["faculty", "me", "library", "resources", curriculumId] as const,
};

export function useLibrary() {
  return useQuery({
    queryKey: libraryKeys.overview(),
    queryFn: async ({ signal }) =>
      z.object({ cards: z.array(libraryCardSchema) }).parse((await api<unknown>("/faculty/me/library", { signal })).data),
  });
}

export function useResources(curriculumId: string | undefined) {
  return useQuery({
    queryKey: libraryKeys.resources(curriculumId ?? ""),
    enabled: Boolean(curriculumId),
    queryFn: async ({ signal }) =>
      z
        .array(resourceSchema)
        .parse((await api<unknown>(`/faculty/me/library/resources?curriculumId=${encodeURIComponent(curriculumId ?? "")}`, { signal })).data),
  });
}

export interface ResourceInput {
  /** Set when editing */
  resourceId?: string;
  curriculumId: string;
  kind: ResourceKind;
  title: string;
  description: string;
  body: string;
  /** Required for a new file resource; optional on edit (keeps the current file) */
  file?: File;
}

/** Multipart, as the backend expects: the file in `file`, the rest as text fields. */
export function resourceForm(input: ResourceInput): FormData {
  const form = new FormData();
  if (!input.resourceId) form.set("curriculumId", input.curriculumId);
  form.set("kind", input.kind);
  form.set("title", input.title.trim());
  if (input.description.trim()) form.set("description", input.description.trim());
  if (input.kind === "note") form.set("body", input.body);
  if (input.kind === "file" && input.file) form.set("file", input.file, input.file.name);
  return form;
}

function useLibraryMutation<V>(fn: (input: V) => Promise<unknown>, curriculumId: string) {
  const client = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: fn,
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: libraryKeys.resources(curriculumId) }),
        client.invalidateQueries({ queryKey: libraryKeys.overview(), exact: true }),
      ]),
  });
}

export function useSaveResource(curriculumId: string) {
  return useLibraryMutation(async (input: ResourceInput) => {
    const path = input.resourceId
      ? `/faculty/me/library/resources/${encodeURIComponent(input.resourceId)}`
      : "/faculty/me/library/resources";
    const res = await api<unknown>(path, { method: input.resourceId ? "PUT" : "POST", body: resourceForm(input) });
    return resourceSchema.parse(res.data);
  }, curriculumId);
}

export function useWithdrawResource(curriculumId: string) {
  return useLibraryMutation(
    (resourceId: string) => api<unknown>(`/faculty/me/library/resources/${encodeURIComponent(resourceId)}`, { method: "DELETE" }),
    curriculumId,
  );
}

const PREVIEW_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

/** The tutor's own file (live or the edit waiting for review) as a blob URL. The caller revokes it. */
export async function fetchResourceFile(resourceId: string, version: "live" | "pending" = "live") {
  const url = `/api/v1/faculty/me/library/resources/${encodeURIComponent(resourceId)}/file?version=${version}`;
  const get = () => fetch(url, { credentials: "same-origin", cache: "no-store", headers: { "x-portal": "faculty" } });
  let response = await get();
  if (response.status === 401) {
    await api<unknown>("/auth/me");
    response = await get();
  }
  if (!response.ok) throw new Error(response.status === 404 ? "The file no longer exists." : "The file could not be opened.");
  const blob = await response.blob();
  const type = PREVIEW_TYPES.has(blob.type) ? blob.type : "application/octet-stream";
  return URL.createObjectURL(new Blob([blob], { type }));
}

/** How a resource's review state reads to the tutor. */
export const REVIEW_STATE: Record<Resource["reviewState"], { label: string; variant: "success" | "warning" | "info" | "destructive" }> = {
  pending: { label: "Pending review", variant: "warning" },
  rejected: { label: "Rejected", variant: "destructive" },
  approved: { label: "Approved", variant: "success" },
  edit_pending: { label: "Approved · changes in review", variant: "info" },
  edit_rejected: { label: "Approved · changes rejected", variant: "warning" },
};

export const ACCEPTED_FILES = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx";

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
