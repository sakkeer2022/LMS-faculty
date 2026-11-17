"use client";
import { useMemo, useState } from "react";
import { AppDialog } from "@/components/forms/app-dialog";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import { PanelMessage } from "@/components/layout/panel-message";
import { cardFor, type Step } from "@/features/onboarding/model/picker";
import { SubjectColumns } from "@/features/onboarding/components/subject-columns";
import { useCatalogue, useRequestSubjectCard, type SubjectCards } from "./api";

/**
 * Profile › Subject Cards › Add subject card: the same column picker as onboarding (screen 43c), one
 * subject at a time. Subjects the tutor already has (pending or approved) cannot be picked again. The
 * new card waits for Amentorz to set its price and approve it.
 */
export function AddSubjectCardDialog({
  open,
  onClose,
  cards,
}: {
  open: boolean;
  onClose: () => void;
  cards: SubjectCards;
}) {
  const catalogue = useCatalogue(open);
  const request = useRequestSubjectCard();
  const [path, setPath] = useState<Step[]>([]);
  const [picked, setPicked] = useState<string>();
  const [error, setError] = useState<string>();
  const held = useMemo(
    () => new Set(cards.cards.filter((c) => c.status !== "rejected").map((c) => c.curriculumId)),
    [cards],
  );
  const card = picked && catalogue.data ? cardFor(catalogue.data, picked) : undefined;

  const close = () => {
    setPath([]);
    setPicked(undefined);
    setError(undefined);
    onClose();
  };

  const submit = async () => {
    if (!picked) return setError("Pick a subject in the last column.");
    setError(undefined);
    try {
      await request.mutateAsync(picked);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The subject card could not be added.");
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={close}
      width={860}
      title="Add a subject card"
      subtitle={`Pick a stream, then move through the columns to the subject you teach. ${cards.remaining} of ${cards.limit} cards left.`}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={request.isPending}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!picked || request.isPending}>
            {request.isPending ? "Sending…" : "Request this subject"}
          </Button>
        </>
      }
    >
      {catalogue.isPending ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading subjects">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
      ) : catalogue.isError ? (
        <PanelMessage onRetry={() => void catalogue.refetch()}>The subjects could not be loaded.</PanelMessage>
      ) : (
        <SubjectColumns
          tree={catalogue.data}
          path={path}
          onPath={(next) => setPath(next)}
          isPicked={(id) => id === picked || held.has(id)}
          isDisabled={(id) => held.has(id)}
          onPick={(id) => setPicked((current) => (current === id ? undefined : id))}
        />
      )}
      <div className="flex flex-col gap-1 rounded-md border border-border-subtle bg-sunken px-4 py-3" aria-live="polite">
        {card ? (
          <>
            <p className="text-sm font-semibold">{card.subject}</p>
            <p className="text-xs text-muted-foreground">{card.pathLabel}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Pick a subject in the last column. Subjects you already have are ticked.</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Amentorz sets your price for the new subject and reviews it. Once approved, you accept the price and the card opens in your library.
      </p>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </AppDialog>
  );
}
