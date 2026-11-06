import type { OfferingTree, PickerNode } from "./types";

/**
 * The column picker on screen 43c. The columns follow the admin's category tree
 * (Categories & content): picking a category opens its sub-categories in the next column,
 * and a category without sub-categories (a leaf, e.g. "Class 11") toggles a card. Each
 * leaf has one offering in the catalogue (its category curriculum), and the card is that
 * curriculumId. Pure functions, unit-tested.
 */

export type Step = { kind: "node"; id: string };

export type ColumnItem = {
  key: string;
  label: string;
  /** Picking it opens another column (a chevron in the design) */
  hasNext: boolean;
  step?: Step;
  /** Leaves only: the card this item adds or removes */
  curriculumId?: string;
};

export type Column = { key: string; title: string; kind: "node"; items: ColumnItem[] };

function childrenOf(tree: OfferingTree, parentId: string | null): PickerNode[] {
  return tree.nodes.filter((n) => n.parentId === parentId);
}

/** The leaf's offering (the first one, should the catalogue ever send more). */
function curriculumOf(tree: OfferingTree, leafId: string): string | undefined {
  return tree.offerings.find((o) => o.categoryId === leafId)?.curriculumId;
}

/** The columns to show for a selection path (the first is always the roots). */
export function columnsFor(tree: OfferingTree, path: readonly Step[]): Column[] {
  const column = (parentId: string | null): Column => ({
    key: `node:${parentId ?? "root"}`,
    title: parentId ? "Category" : "Stream",
    kind: "node",
    items: childrenOf(tree, parentId).flatMap((n): ColumnItem[] => {
      if (!n.isLeaf) return [{ key: n.id, label: n.name, hasNext: true, step: { kind: "node", id: n.id } }];
      const curriculumId = curriculumOf(tree, n.id);
      return curriculumId ? [{ key: n.id, label: n.name, hasNext: false, curriculumId }] : [];
    }),
  });
  const columns = [column(null)];
  for (const step of path) {
    const node = tree.nodes.find((n) => n.id === step.id);
    if (!node || node.isLeaf) break;
    columns.push(column(node.id));
  }
  return columns;
}

/** Choosing an item in column `index` replaces everything to its right. */
export function choose(path: readonly Step[], columns: readonly Column[], index: number, step: Step): Step[] {
  // Column i (i >= 1) was opened by path[i - 1]; picking in column i sets path[i]
  void columns;
  return [...path.slice(0, index), step];
}

/** Whether column `index`'s item is the one on the current path. */
export function isSelected(path: readonly Step[], index: number, step?: Step) {
  const current = path[index];
  return Boolean(step && current && current.kind === step.kind && current.id === step.id);
}

export interface SubjectCard {
  curriculumId: string;
  /** The leaf's name ("Class 11") */
  subject: string;
  /** What is above it: "Academic › School › K-12 › CBSE › Physics" */
  pathLabel: string;
}

/** The card for a curriculum: the leaf's name and the names from the root down to its parent. */
export function cardFor(tree: OfferingTree, curriculumId: string): SubjectCard | undefined {
  const offering = tree.offerings.find((o) => o.curriculumId === curriculumId);
  if (!offering) return undefined;
  const names: string[] = [];
  let node = tree.nodes.find((n) => n.id === offering.categoryId);
  const guard = new Set<string>();
  while (node && !guard.has(node.id)) {
    guard.add(node.id);
    names.unshift(node.name);
    node = node.parentId ? tree.nodes.find((n) => n.id === node?.parentId) : undefined;
  }
  // A category curriculum's subject is the leaf itself, so the path stops above it
  const ownLeaf = offering.subject.id === offering.categoryId;
  return {
    curriculumId,
    subject: offering.subject.name,
    pathLabel: [...(ownLeaf ? names.slice(0, -1) : names), offering.board?.name, offering.level?.name].filter(Boolean).join(" › "),
  };
}

export const MAX_SUBJECTS = 30;

export function toggleSubject(selected: readonly string[], curriculumId: string): string[] {
  if (selected.includes(curriculumId)) return selected.filter((id) => id !== curriculumId);
  if (selected.length >= MAX_SUBJECTS) return [...selected];
  return [...selected, curriculumId];
}
