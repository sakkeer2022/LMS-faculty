import { describe, it, expect } from "vitest";
import { MAX_SUBJECTS, toggleSubject } from "../src/features/onboarding/model/picker";
import { cardState, subjectCardsSchema } from "../src/features/subject-cards/api";
import { REVIEW_STATE, libraryCardSchema, resourceForm, resourceSchema } from "../src/features/library/api";

const card = {
  id: "a1", curriculumId: "c1", subject: "Class 11", pathLabel: "Academic › School › K-12 › CBSE › Physics",
  status: "approved", source: "onboarding", requestedAt: "2026-11-12T08:00:00.000Z", decidedAt: "2026-11-12T09:00:00.000Z",
  decisionReason: null, priced: true, libraryEnabled: true,
} as const;

describe("subject cards", () => {
  it("allows at most five subjects at onboarding", () => {
    expect(MAX_SUBJECTS).toBe(5);
    const five = ["a", "b", "c", "d", "e"];
    expect(toggleSubject(five, "f")).toEqual(five);
    expect(toggleSubject(five, "a")).toEqual(["b", "c", "d", "e"]);
  });

  it("parses the live response and labels each state", () => {
    const parsed = subjectCardsSchema.parse({ limit: 5, used: 1, remaining: 4, canRequest: true, cards: [card] });
    expect(parsed.cards[0]?.libraryEnabled).toBe(true);
    expect(cardState(card).label).toBe("Active");
    expect(cardState({ ...card, status: "pending", libraryEnabled: false, priced: false }).label).toBe("Pending approval");
    expect(cardState({ ...card, status: "rejected", libraryEnabled: false }).variant).toBe("destructive");
    expect(cardState({ ...card, libraryEnabled: false }).hint).toContain("Accept your updated prices");
  });
});

describe("library", () => {
  it("parses a card with counts and a resource with a waiting edit", () => {
    expect(libraryCardSchema.parse({ ...card, counts: { approved: 2, inReview: 1, rejected: 0 } }).counts.inReview).toBe(1);
    const resource = resourceSchema.parse({
      id: "r1", curriculumId: "c1", kind: "file", title: "Kinematics", description: null, body: null,
      file: { name: "k.pdf", size: 2048, mimeType: "application/pdf", previewable: true },
      reviewState: "edit_pending", revision: 1,
      pendingEdit: { kind: "file", title: "Kinematics v2", description: null, body: null, file: null, revision: 2, submittedAt: "2026-11-12T10:00:00.000Z" },
      lastDecision: { decision: "approved", notes: null, decidedAt: "2026-11-12T09:00:00.000Z", revision: 1 },
      createdAt: "2026-11-12T08:00:00.000Z", updatedAt: "2026-11-12T10:00:00.000Z",
    });
    expect(REVIEW_STATE[resource.reviewState].label).toBe("Approved · changes in review");
  });

  it("sends a note without a file and an edit without the card id", () => {
    const note = resourceForm({ curriculumId: "c1", kind: "note", title: " Formulae ", description: "", body: "v = u + at" });
    expect(note.get("curriculumId")).toBe("c1");
    expect(note.get("title")).toBe("Formulae");
    expect(note.get("body")).toBe("v = u + at");
    expect(note.has("description")).toBe(false);
    const edit = resourceForm({ resourceId: "r1", curriculumId: "c1", kind: "file", title: "Kinematics", description: "Ch 3", body: "ignored" });
    expect(edit.has("curriculumId")).toBe(false);
    expect(edit.has("body")).toBe(false);
    expect(edit.has("file")).toBe(false);
  });
});
