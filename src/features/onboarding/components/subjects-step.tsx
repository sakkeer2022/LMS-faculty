"use client";
import { useEffect, useMemo, useRef } from "react";
import { Button, CheckboxField, Heading, Text } from "@/components/ui";
import {
  cardFor,
  choose,
  columnsFor,
  isSelected,
  MAX_SUBJECTS,
  toggleSubject,
  type Step,
} from "../model/picker";
import type { OfferingTree } from "../model/types";

/**
 * Screen 43c, "What do you teach?": pick a stream, then move through the columns; each
 * subject in the last column adds a card on the right. The columns follow the admin's
 * category tree (Categories & Content) and each leaf's offerings.
 */
export function SubjectsStep({
  tree,
  path,
  selected,
  offline,
  error,
  onPath,
  onSelected,
  onOffline,
  onBack,
  onContinue,
}: {
  tree: OfferingTree;
  path: Step[];
  selected: string[];
  offline: boolean;
  error?: string;
  onPath: (path: Step[]) => void;
  onSelected: (ids: string[]) => void;
  onOffline: (value: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const columns = useMemo(() => columnsFor(tree, path), [tree, path]);
  const cards = useMemo(() => selected.flatMap((id) => cardFor(tree, id) ?? []), [tree, selected]);
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the newest column in view
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [columns.length]);

  return (
    <section className="onboarding-subjects" aria-labelledby="subjects-title">
      <div className="onboarding-head">
        <Heading level={1} id="subjects-title" className="onboarding-title" tabIndex={-1}>
          What do you teach?
        </Heading>
        <Text className="onboarding-subtitle">
          Pick a stream, then move through the columns to quickly add every subject combination you teach.
        </Text>
      </div>

      <div className="onboarding-subjects-body">
        <div className="onboarding-picker-wrap">
          <div className="onboarding-picker" ref={scroller} role="group" aria-label="Subject picker">
            {columns.map((column, index) => (
              <ul key={column.key} className="onboarding-column" aria-label={column.title}>
                {column.items.length === 0 && <li className="onboarding-column-empty">Nothing to choose here yet</li>}
                {column.items.map((item) => {
                  const active =
                    column.kind === "subject"
                      ? selected.includes(item.curriculumId as string)
                      : isSelected(path, index, item.step);
                  return (
                    <li key={item.key}>
                      <Button
                        variant="ghost"
                        className="onboarding-column-item"
                        data-active={active}
                        aria-pressed={column.kind === "subject" ? active : undefined}
                        aria-current={column.kind !== "subject" && active ? "true" : undefined}
                        onClick={() => {
                          if (column.kind === "subject") onSelected(toggleSubject(selected, item.curriculumId as string));
                          else if (item.step) onPath(choose(path, columns, index, item.step));
                        }}
                      >
                        <span>{item.label}</span>
                        {item.hasNext ? (
                          <svg aria-hidden width="14" height="14" viewBox="0 0 16 16">
                            <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        ) : active ? (
                          <svg aria-hidden width="14" height="14" viewBox="0 0 12 12">
                            <path d="M2.5 6.5l2.2 2.2L9.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg aria-hidden width="14" height="14" viewBox="0 0 16 16">
                            <path d="M8 3.5v9M3.5 8h9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
          <CheckboxField
            className="onboarding-offline"
            label="Are you interested in taking offline class?"
            checked={offline}
            onChange={(e) => onOffline(e.target.checked)}
          />
        </div>

        <aside className="onboarding-cards" aria-labelledby="cards-title">
          <div className="onboarding-cards-head">
            <Heading level={2} id="cards-title" className="onboarding-cards-title">
              Subjects
            </Heading>
            <Text className="onboarding-cards-sub">Teaching profiles you opted</Text>
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
                <Button
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
            <p className="ui-field-hint">You can add up to {MAX_SUBJECTS} subjects.</p>
          )}
          {error && (
            <p className="ui-field-error" role="alert">
              {error}
            </p>
          )}
          <div className="onboarding-cards-actions">
            <Button variant="ghost" className="onboarding-back" onClick={onBack}>
              Back
            </Button>
            <Button onClick={onContinue}>Continue to documents</Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
