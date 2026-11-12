"use client";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/shadcn/button";
import { choose, columnsFor, isSelected, type Step } from "../model/picker";
import type { OfferingTree } from "../model/types";

/**
 * The column picker of screen 43c, shared by onboarding ("What do you teach?") and the profile's
 * "Add subject card" dialog: the columns follow the admin's category tree; a leaf opens its subjects,
 * and each subject is one offering (curriculumId). Styles live in onboarding.css.
 */
export function SubjectColumns({
  tree,
  path,
  onPath,
  isPicked,
  isDisabled,
  onPick,
}: {
  tree: OfferingTree;
  path: Step[];
  onPath: (path: Step[]) => void;
  /** The subject shows a tick */
  isPicked: (curriculumId: string) => boolean;
  /** The subject cannot be picked (for example a card the tutor already has) */
  isDisabled?: (curriculumId: string) => boolean;
  onPick: (curriculumId: string) => void;
}) {
  const columns = useMemo(() => columnsFor(tree, path), [tree, path]);
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the newest column in view
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [columns.length]);

  return (
    <div className="onboarding-picker" ref={scroller} role="group" aria-label="Subject picker">
      {columns.map((column, index) => (
        <ul key={column.key} className="onboarding-column" aria-label={column.title}>
          {column.items.length === 0 && <li className="onboarding-column-empty">Nothing to choose here yet</li>}
          {column.items.map((item) => {
            const leaf = item.curriculumId;
            const active = leaf ? isPicked(leaf) : isSelected(path, index, item.step);
            const disabled = leaf ? Boolean(isDisabled?.(leaf)) : false;
            return (
              <li key={item.key}>
                <Button
                  type="button"
                  variant="ghost"
                  className="onboarding-column-item"
                  data-active={active}
                  disabled={disabled}
                  aria-pressed={leaf ? active : undefined}
                  aria-current={!leaf && active ? "true" : undefined}
                  onClick={() => {
                    if (leaf) onPick(leaf);
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
  );
}
