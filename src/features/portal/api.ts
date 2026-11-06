"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { getMe, getPriceConsent } from "./model";

// TanStack Query hooks for the signed-in portal, same shape as amentorz-admin features/auth/api/auth.ts
export const portalKeys = {
  me: () => ["auth", "me"] as const,
  priceConsent: () => ["faculty", "me", "price-consent"] as const,
};

export function useMe() {
  return useQuery({ queryKey: portalKeys.me(), queryFn: getMe, retry: false });
}

export function usePriceConsent() {
  return useQuery({ queryKey: portalKeys.priceConsent(), queryFn: getPriceConsent, retry: false });
}

/** Distinct subjects the tutor teaches, from the priced subject cards (e.g. "Physics"). */
export function useTeachingSubjects() {
  const subjects = usePriceConsent().data?.subjects ?? [];
  return [...new Set(subjects.map((s) => s.subject))];
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api<null>("/auth/logout", { method: "POST" }),
    onSettled: () => {
      client.clear();
      window.location.assign("/login");
    },
  });
}
