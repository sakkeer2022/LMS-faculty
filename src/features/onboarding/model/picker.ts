import type { OfferingTree, PickerNode, PickerOffering } from "./types";

/**
 * The column picker on screen 43c. A selection path walks the category tree from a root
 * ("Academic") to a bookable leaf, then through the leaf's offerings: board (when any
 * offering has one), level (when any has one) and finally the subject column, where each
 * subject toggles a subject card. Pure functions, unit-tested.
 */

export type Step = { kind: "node"; id: string } | { kind: "board"; id: string } | { kind: "level"; id: string };

export type ColumnItem = {
  key: string;
  label: string;
  /** Picking it opens another column (a chevron in the design) */
  hasNext: boolean;
  step?: Step;
  /** Subject items only */
  curriculumId?: string;
};

export type Column = { key: string; title: string; kind: "node" | "board" | "level" | "subject"; items: ColumnItem[] };

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

function childrenOf(tree: OfferingTree, parentId: string | null): PickerNode[] {
  return tree.nodes.filter((n) => n.parentId === parentId);
}

function uniqueNamed<T extends { id: string; name: string }>(items: (T | null)[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) if (item && !seen.has(item.id)) seen.set(item.id, item);
  return [...seen.values()];
}

/** Offerings of the leaf, narrowed by the chosen board and level. */
function narrowed(tree: OfferingTree, leafId: string, boardId?: string, levelId?: string): PickerOffering[] {
  return tree.offerings.filter(
    (o) =>
      o.categoryId === leafId &&
      (boardId === undefined || o.board?.id === boardId) &&
      (levelId === undefined || o.level?.id === levelId),
  );
}

/** The columns to show for a selection path (the first is always the roots). */
export function columnsFor(tree: OfferingTree, path: readonly Step[]): Column[] {
  const columns: Column[] = [];
  const nodeColumn = (parentId: string | null): Column => ({
    key: `node:${parentId ?? "root"}`,
    title: parentId ? "Category" : "Stream",
    kind: "node",
    items: childrenOf(tree, parentId).map((n) => ({
      key: n.id,
      label: n.name,
      hasNext: true,
      step: { kind: "node", id: n.id },
    })),
  });
  columns.push(nodeColumn(null));

  let leafId: string | undefined;
  let boardId: string | undefined;
  let levelId: string | undefined;
  for (const step of path) {
    if (step.kind === "node") {
      const node = tree.nodes.find((n) => n.id === step.id);
      if (!node) break;
      if (!node.isLeaf) {
        columns.push(nodeColumn(node.id));
        continue;
      }
      leafId = node.id;
    } else if (step.kind === "board") boardId = step.id;
    else levelId = step.id;
  }
  if (!leafId) return columns;

  const offerings = narrowed(tree, leafId);
  const boards = uniqueNamed(offerings.map((o) => o.board));
  const pathHasBoard = path.some((s) => s.kind === "board");
  if (boards.length && !pathHasBoard) {
    columns.push({
      key: `board:${leafId}`,
      title: "Board",
      kind: "board",
      items: boards.map((b) => ({ key: b.id, label: b.name, hasNext: true, step: { kind: "board", id: b.id } })),
    });
    return columns;
  }
  if (boards.length) {
    columns.push({
      key: `board:${leafId}`,
      title: "Board",
      kind: "board",
      items: boards.map((b) => ({ key: b.id, label: b.name, hasNext: true, step: { kind: "board", id: b.id } })),
    });
  }

  const afterBoard = narrowed(tree, leafId, boards.length ? boardId : undefined);
  const levels = uniqueNamed(afterBoard.map((o) => o.level));
  const pathHasLevel = path.some((s) => s.kind === "level");
  if (levels.length) {
    columns.push({
      key: `level:${leafId}:${boardId ?? ""}`,
      title: "Level",
      kind: "level",
      items: levels.map((l) => ({ key: l.id, label: l.name, hasNext: true, step: { kind: "level", id: l.id } })),
    });
    if (!pathHasLevel) return columns;
  }

  const final = narrowed(tree, leafId, boards.length ? boardId : undefined, levels.length ? levelId : undefined);
  columns.push({
    key: `subject:${leafId}:${boardId ?? ""}:${levelId ?? ""}`,
    title: "Subject",
    kind: "subject",
    items: [...final]
      .sort((a, b) => byName(a.subject, b.subject))
      .map((o) => ({ key: o.curriculumId, label: o.subject.name, hasNext: false, curriculumId: o.curriculumId })),
  });
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
  subject: string;
  /** "Academic › School › K-12 › CBSE › Class 11" */
  pathLabel: string;
}

/** The card for a curriculum: its subject and the names from the root down to the level. */
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
  return {
    curriculumId,
    subject: offering.subject.name,
    pathLabel: [...names, offering.board?.name, offering.level?.name].filter(Boolean).join(" › "),
  };
}

export const MAX_SUBJECTS = 30;

export function toggleSubject(selected: readonly string[], curriculumId: string): string[] {
  if (selected.includes(curriculumId)) return selected.filter((id) => id !== curriculumId);
  if (selected.length >= MAX_SUBJECTS) return [...selected];
  return [...selected, curriculumId];
}
