"use client";
import { useMemo } from "react";
import { Button } from "@/components/shadcn/button";
import { cardFor, MAX_SUBJECTS, toggleSubject, type Step } from "../model/picker";
import type { OfferingTree } from "../model/types";
import { SubjectColumns } from "./subject-columns";

/**
 * Screen 43c, "What do you teach?": pick a stream, then move through the columns; each
 * category at the end of a branch (e.g. "Class 11") opens a last column of subjects, and each
 * subject adds a card on the right. The columns follow the admin's category tree
 * (Categories & content).
 */
export function SubjectsStep({
  tree,
  path,
  selected,
  error,
  onPath,
  onSelected,
  onBack,
  onContinue,
}: {
  tree: OfferingTree;
  path: Step[];
  selected: string[];
  error?: string;
  onPath: (path: Step[]) => void;
  onSelected: (ids: string[]) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const cards = useMemo(() => selected.flatMap((id) => cardFor(tree, id) ?? []), [tree, selected]);

  return (
    <section className="onboarding-subjects" aria-labelledby="subjects-title">
      <div className="onboarding-head">
        <h1 id="subjects-title" className="onboarding-title" tabIndex={-1}>
          What do you teach?
        </h1>
        <p className="onboarding-subtitle">
          Pick a stream, then move through the columns to the subject you teach. Add up to {MAX_SUBJECTS} subjects and classes you cover.
        </p>
      </div>

      <div className="onboarding-subjects-body">
        <div className="onboarding-picker-wrap">
          <SubjectColumns
            tree={tree}
            path={path}
            onPath={onPath}
            isPicked={(id) => selected.includes(id)}
            // At the limit, only picked subjects stay clickable (to remove them)
            isDisabled={(id) => selected.length >= MAX_SUBJECTS && !selected.includes(id)}
            onPick={(id) => onSelected(toggleSubject(selected, id))}
          />
        </div>

        <aside className="onboarding-cards" aria-labelledby="cards-title">
          <div className="onboarding-cards-head">
            <h2 id="cards-title" className="onboarding-cards-title">
              Subjects
            </h2>
            <p className="onboarding-cards-sub">Teaching profiles you opted</p>
          </div>
          <ul className="onboarding-card-list" aria-live="polite">
            {cards.length === 0 && (
              <li className="onboarding-card-empty">Pick a subject in the last column to add it here.</li>
            )}
            {cards.map((card) => (
              <li key={card.curriculumId} className="onboarding-card">
                <div>
                  <p className="onboarding-card-subject">{card.subject}</p>
                  <p className="onboarding-card-path">{card.pathLabel}</p>
                </div>
                <Button type="button"
                  variant="ghost"
                  className="onboarding-card-remove"
                  aria-label={`Remove ${card.subject}, ${card.pathLabel}`}
                  onClick={() => onSelected(selected.filter((id) => id !== card.curriculumId))}
                >
                  <svg aria-hidden width="12" height="12" viewBox="0 0 12 12">
                    <path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </Button>
              </li>
            ))}
          </ul>
          {selected.length >= MAX_SUBJECTS && (
            <p className="text-[11px] leading-4 text-muted-foreground">
              You can add up to {MAX_SUBJECTS} subjects. Remove one to pick another.
            </p>
          )}
          {error && (
            <p className="text-xs leading-4 text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="onboarding-cards-actions">
            <Button type="button" variant="ghost" className="onboarding-back" onClick={onBack}>
              Back
            </Button>
            <Button type="button" onClick={onContinue}>Continue to documents</Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
