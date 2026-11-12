"use client";
import { useState } from "react";
import { BookOpen, Lock } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { PanelMessage } from "@/components/layout/panel-message";
import { cardState } from "@/features/subject-cards/api";
import { useLibrary, type LibraryCard } from "./api";
import { ResourceModal } from "./resource-modal";

/**
 * Library (no Figma yet, F18): one card per subject card. An active card (approved, priced, accepted)
 * opens a modal to add, view, edit and withdraw its resources; every add and edit is reviewed by
 * Amentorz before students see it. Pending or rejected cards are shown but locked.
 */
export function LibraryPage() {
  const library = useLibrary();
  const [open, setOpen] = useState<LibraryCard>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Library"
        description="Notes and files for each subject you teach. Amentorz reviews everything you add or change before students see it."
      />
      {library.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading library">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : library.isError ? (
        <Card>
          <PanelMessage onRetry={() => void library.refetch()}>Your library could not be loaded.</PanelMessage>
        </Card>
      ) : library.data.cards.length === 0 ? (
        <EmptyState title="No subject cards yet" description="Add a subject card from your profile to start your library." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {library.data.cards.map((card) => (
            <li key={card.id}>
              <SubjectLibraryCard card={card} onOpen={() => setOpen(card)} />
            </li>
          ))}
        </ul>
      )}
      {open && <ResourceModal card={open} onClose={() => setOpen(undefined)} />}
    </div>
  );
}

function SubjectLibraryCard({ card, onOpen }: { card: LibraryCard; onOpen: () => void }) {
  const state = cardState(card);
  const total = card.counts.approved + card.counts.inReview + card.counts.rejected;
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{card.subject}</CardTitle>
          <Badge variant={state.variant}>{state.label}</Badge>
        </div>
        <CardDescription className="break-words">{card.pathLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {card.libraryEnabled ? (
          <p className="text-sm text-text-secondary">
            {total === 0
              ? "No resources yet."
              : [
                  `${card.counts.approved} approved`,
                  card.counts.inReview ? `${card.counts.inReview} in review` : null,
                  card.counts.rejected ? `${card.counts.rejected} rejected` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        ) : (
          <p className="flex items-start gap-2 text-sm text-text-secondary">
            <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
            {state.hint}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-4 pb-5">
        <Button
          variant={card.libraryEnabled ? "default" : "outline"}
          className="w-full"
          disabled={!card.libraryEnabled}
          onClick={onOpen}
          aria-label={`Manage resources for ${card.subject}, ${card.pathLabel}`}
        >
          <BookOpen aria-hidden /> Manage resources
        </Button>
      </CardFooter>
    </Card>
  );
}
