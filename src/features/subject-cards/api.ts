"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { loadCatalogue } from "@/features/onboarding/model/api";

// Contract: amentorz-backend docs/openapi.yaml (listOwnSubjectCards, requestSubjectCard,
// cancelSubjectCardRequest). The card limit (5) and every rule are enforced by the server.

export const subjectCardSchema = z.object({
  id: z.string(),
  curriculumId: z.string(),
  subject: z.string(),
  pathLabel: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  source: z.enum(["onboarding", "profile"]),
  requestedAt: z.string(),
  decidedAt: z.string().nullable(),
  decisionReason: z.string().nullable(),
  priced: z.boolean(),
  libraryEnabled: z.boolean(),
});
export type SubjectCard = z.infer<typeof subjectCardSchema>;

export const subjectCardsSchema = z.object({
  limit: z.number(),
  used: z.number(),
  remaining: z.number(),
  canRequest: z.boolean(),
  cards: z.array(subjectCardSchema),
});
export type SubjectCards = z.infer<typeof subjectCardsSchema>;

export const subjectCardKeys = {
  mine: () => ["faculty", "me", "subject-cards"] as const,
  catalogue: () => ["faculty", "catalogue"] as const,
};

export function useSubjectCards() {
  return useQuery({
    queryKey: subjectCardKeys.mine(),
    queryFn: async ({ signal }) => subjectCardsSchema.parse((await api<unknown>("/faculty/me/subject-cards", { signal })).data),
  });
}

/** The onboarding catalogue (same column picker); loaded only when the add dialog opens. */
export function useCatalogue(enabled: boolean) {
  return useQuery({ queryKey: subjectCardKeys.catalogue(), queryFn: loadCatalogue, enabled, staleTime: 5 * 60_000 });
}

function useCardsMutation<V>(fn: (input: V) => Promise<SubjectCards>) {
  const client = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: fn,
    onSuccess: (cards) => {
      client.setQueryData(subjectCardKeys.mine(), cards);
      // The library lists the same cards
      void client.invalidateQueries({ queryKey: ["faculty", "me", "library"] });
    },
  });
}

export function useRequestSubjectCard() {
  return useCardsMutation(async (curriculumId: string) =>
    subjectCardsSchema.parse(
      (await api<unknown>("/faculty/me/subject-cards", { method: "POST", body: JSON.stringify({ curriculumId }) })).data,
    ),
  );
}

export function useCancelSubjectCard() {
  return useCardsMutation(async (cardId: string) =>
    subjectCardsSchema.parse((await api<unknown>(`/faculty/me/subject-cards/${encodeURIComponent(cardId)}`, { method: "DELETE" })).data),
  );
}

/** What a card's state means to the tutor, for the badge and its hint. */
export function cardState(card: Pick<SubjectCard, "status" | "libraryEnabled" | "priced">): {
  label: string;
  variant: "success" | "warning" | "info" | "destructive";
  hint: string;
} {
  if (card.status === "rejected") return { label: "Not approved", variant: "destructive", hint: "This subject was not approved." };
  if (card.status === "pending")
    return { label: "Pending approval", variant: "warning", hint: "Amentorz will set your price and review this subject." };
  if (!card.libraryEnabled)
    return {
      label: "Approved",
      variant: "info",
      hint: card.priced ? "Accept your updated prices to start using this subject." : "Your price is being set.",
    };
  return { label: "Active", variant: "success", hint: "Active. You can add library resources to it." };
}
