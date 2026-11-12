"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { PanelMessage } from "@/components/layout/panel-message";
import { AppDialog } from "@/components/forms/app-dialog";
import { AddSubjectCardDialog } from "./add-subject-card-dialog";
import { cardState, useCancelSubjectCard, useSubjectCards, type SubjectCard } from "./api";

/**
 * Profile › Subject Cards (decided 2026-11-12): the tutor's cards with their state, and "Add subject
 * card" while fewer than the limit (5, counting pending requests). A pending request can be cancelled.
 */
export function SubjectCardsSection() {
  const cards = useSubjectCards();
  const cancel = useCancelSubjectCard();
  const [adding, setAdding] = useState(false);
  const [cancelling, setCancelling] = useState<SubjectCard>();

  const confirmCancel = async () => {
    if (!cancelling) return;
    try {
      await cancel.mutateAsync(cancelling.id);
      toast.success(`Request for ${cancelling.subject} cancelled`);
      setCancelling(undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The request could not be cancelled.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject cards</CardTitle>
        <CardDescription>
          {cards.data
            ? `The subjects you teach · ${cards.data.used} of ${cards.data.limit} used`
            : "The subjects you teach"}
        </CardDescription>
        {cards.data && (
          <CardAction>
            <Button
              size="sm"
              onClick={() => setAdding(true)}
              disabled={!cards.data.canRequest}
              title={cards.data.canRequest ? undefined : cards.data.remaining === 0 ? `You have ${cards.data.limit} subject cards, the most allowed` : undefined}
            >
              <Plus aria-hidden /> Add subject card
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="pb-5">
        {cards.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2" role="status" aria-label="Loading subject cards">
            {Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : cards.isError ? (
          <PanelMessage onRetry={() => void cards.refetch()}>Your subject cards could not be loaded.</PanelMessage>
        ) : (
          <>
            <ul className="grid gap-3 sm:grid-cols-2">
              {cards.data.cards.map((card) => {
                const state = cardState(card);
                return (
                  <li key={card.id} className="flex flex-col gap-1 rounded-md border border-border-subtle p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{card.subject}</p>
                      <Badge variant={state.variant}>{state.label}</Badge>
                    </div>
                    <p className="text-xs break-words text-muted-foreground">{card.pathLabel}</p>
                    <p className="pt-1 text-xs text-text-secondary">{state.hint}</p>
                    {card.status === "rejected" && card.decisionReason && (
                      <p className="text-xs text-text-secondary">Reason: {card.decisionReason}</p>
                    )}
                    {card.status === "pending" && card.source === "profile" && (
                      <Button variant="link" size="sm" className="h-auto self-start px-0" onClick={() => setCancelling(card)}>
                        Cancel request
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            {!cards.data.canRequest && cards.data.remaining === 0 && (
              <p className="pt-3 text-xs text-muted-foreground">
                You have {cards.data.limit} subject cards, the most allowed.
                {cards.data.cards.some((c) => c.status === "pending" && c.source === "profile")
                  ? " Cancel a pending request to pick another subject."
                  : ""}
              </p>
            )}
          </>
        )}
      </CardContent>
      {cards.data && <AddSubjectCardDialog open={adding} onClose={() => setAdding(false)} cards={cards.data} />}
      <AppDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(undefined)}
        title="Cancel this request?"
        subtitle={cancelling ? `${cancelling.subject} · ${cancelling.pathLabel}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelling(undefined)} disabled={cancel.isPending}>
              Keep request
            </Button>
            <Button variant="destructive" onClick={() => void confirmCancel()} disabled={cancel.isPending}>
              {cancel.isPending ? "Cancelling…" : "Cancel request"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">The subject is removed from your profile and frees a slot.</p>
      </AppDialog>
    </Card>
  );
}
