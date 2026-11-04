import { describe, expect, it } from "vitest";
import { cardFor, choose, columnsFor, isSelected, MAX_SUBJECTS, toggleSubject, type Step } from "@/features/onboarding/model/picker";
import { fileIssue, stepOfField, validateCredentials } from "@/features/onboarding/model/validation";
import { EMPTY_CREDENTIALS, type OfferingTree } from "@/features/onboarding/model/types";
import { formatPaise, gstPercent } from "@/features/portal/model";

// Academic › School › K-12 (leaf with boards and levels); Academic › JEE / NEET (leaf, levels only);
// Non-academic › Skill (leaf, subjects only)
const tree: OfferingTree = {
  nodes: [
    { id: "academic", parentId: null, name: "Academic", isLeaf: false },
    { id: "non", parentId: null, name: "Non-academic", isLeaf: false },
    { id: "school", parentId: "academic", name: "School", isLeaf: false },
    { id: "k12", parentId: "school", name: "K-12", isLeaf: true },
    { id: "jee", parentId: "academic", name: "JEE / NEET", isLeaf: true },
    { id: "skill", parentId: "non", name: "Skill", isLeaf: true },
  ],
  offerings: [
    { curriculumId: "c1", categoryId: "k12", board: { id: "cbse", name: "CBSE" }, level: { id: "c11", name: "Class 11" }, subject: { id: "math", name: "Mathematics" } },
    { curriculumId: "c2", categoryId: "k12", board: { id: "cbse", name: "CBSE" }, level: { id: "c11", name: "Class 11" }, subject: { id: "phy", name: "Physics" } },
    { curriculumId: "c3", categoryId: "k12", board: { id: "icse", name: "ICSE" }, level: { id: "c10", name: "Class 10" }, subject: { id: "phy", name: "Physics" } },
    { curriculumId: "c4", categoryId: "jee", board: null, level: { id: "main", name: "JEE Main" }, subject: { id: "phy", name: "Physics" } },
    { curriculumId: "c5", categoryId: "skill", board: null, level: null, subject: { id: "cs", name: "Computer Science" } },
  ],
};

const kinds = (path: Step[]) => columnsFor(tree, path).map((c) => c.kind);
const labels = (path: Step[], i: number) => columnsFor(tree, path)[i]!.items.map((x) => x.label);

describe("column picker", () => {
  it("starts with the streams", () => {
    expect(kinds([])).toEqual(["node"]);
    expect(labels([], 0)).toEqual(["Academic", "Non-academic"]);
  });

  it("walks categories, then board, level and subject for a leaf with boards", () => {
    let path: Step[] = [{ kind: "node", id: "academic" }];
    expect(labels(path, 1)).toEqual(["School", "JEE / NEET"]);
    path = [...path, { kind: "node", id: "school" }];
    expect(labels(path, 2)).toEqual(["K-12"]);
    path = [...path, { kind: "node", id: "k12" }];
    expect(kinds(path)).toEqual(["node", "node", "node", "board"]);
    expect(labels(path, 3)).toEqual(["CBSE", "ICSE"]);
    path = [...path, { kind: "board", id: "cbse" }];
    expect(kinds(path)).toEqual(["node", "node", "node", "board", "level"]);
    expect(labels(path, 4)).toEqual(["Class 11"]);
    path = [...path, { kind: "level", id: "c11" }];
    expect(kinds(path).at(-1)).toBe("subject");
    expect(labels(path, 5)).toEqual(["Mathematics", "Physics"]);
    expect(columnsFor(tree, path)[5]!.items.map((i) => i.curriculumId)).toEqual(["c1", "c2"]);
  });

  it("skips the board column when the leaf has no boards, and the level column when it has no levels", () => {
    expect(kinds([{ kind: "node", id: "academic" }, { kind: "node", id: "jee" }])).toEqual(["node", "node", "level"]);
    const skill: Step[] = [{ kind: "node", id: "non" }, { kind: "node", id: "skill" }];
    expect(kinds(skill)).toEqual(["node", "node", "subject"]);
    expect(labels(skill, 2)).toEqual(["Computer Science"]);
  });

  it("choosing in an earlier column drops everything to its right", () => {
    const path: Step[] = [{ kind: "node", id: "academic" }, { kind: "node", id: "school" }, { kind: "node", id: "k12" }];
    const columns = columnsFor(tree, path);
    expect(choose(path, columns, 1, { kind: "node", id: "jee" })).toEqual([{ kind: "node", id: "academic" }, { kind: "node", id: "jee" }]);
    expect(isSelected(path, 1, { kind: "node", id: "school" })).toBe(true);
    expect(isSelected(path, 1, { kind: "node", id: "jee" })).toBe(false);
  });

  it("names each card from the root to the level", () => {
    expect(cardFor(tree, "c1")).toEqual({ curriculumId: "c1", subject: "Mathematics", pathLabel: "Academic › School › K-12 › CBSE › Class 11" });
    expect(cardFor(tree, "c5")?.pathLabel).toBe("Non-academic › Skill");
    expect(cardFor(tree, "unknown")).toBeUndefined();
  });

  it("toggles subjects up to the maximum", () => {
    expect(toggleSubject(["c1"], "c2")).toEqual(["c1", "c2"]);
    expect(toggleSubject(["c1", "c2"], "c1")).toEqual(["c2"]);
    const full = Array.from({ length: MAX_SUBJECTS }, (_, i) => `x${i}`);
    expect(toggleSubject(full, "y")).toHaveLength(MAX_SUBJECTS);
  });
});

describe("credentials validation (mirrors the backend)", () => {
  const valid = {
    ...EMPTY_CREDENTIALS,
    fullName: "Anil Verma",
    password: "Tutor12345",
    confirmPassword: "Tutor12345",
    mobileNumber: "+91 98765 43210",
    highestQualification: "M.Sc. Physics",
    teachingExperience: "5-10",
  };
  it("accepts a valid form and normalises the phone number", () => {
    const result = validateCredentials(valid);
    expect(result.ok && result.data.mobileNumber).toBe("+919876543210");
  });
  it.each([
    [{ fullName: "" }, "fullName"],
    [{ password: "short1", confirmPassword: "short1" }, "password"],
    [{ password: "nodigitshere", confirmPassword: "nodigitshere" }, "password"],
    [{ confirmPassword: "Other12345" }, "confirmPassword"],
    [{ mobileNumber: "98765 43210" }, "mobileNumber"],
    [{ highestQualification: "" }, "highestQualification"],
    [{ teachingExperience: "" }, "teachingExperience"],
  ])("rejects %j", (override, field) => {
    const result = validateCredentials({ ...valid, ...override });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[field]).toBeTruthy();
  });
});

describe("documents", () => {
  const file = (name: string, size = 100) => new File([new Uint8Array(size)], name);
  it("accepts the allowed types and rejects others, empty and oversized files", () => {
    for (const name of ["a.pdf", "a.PNG", "a.jpeg", "a.doc", "a.docx", "a.ppt", "a.pptx"]) expect(fileIssue(file(name), "Photo ID")).toBeUndefined();
    expect(fileIssue(null, "Photo ID")).toBe("Upload your photo id");
    expect(fileIssue(file("a.exe"), "Photo ID")).toMatch(/PDF/);
    expect(fileIssue(file("a.pdf", 0), "Photo ID")).toBe("The file is empty");
    expect(fileIssue(file("a.pdf", 10 * 1024 * 1024 + 1), "Photo ID")).toBe("The file is larger than 10 MB");
  });
  it("routes server field errors to their step", () => {
    expect(stepOfField("fullName")).toBe(0);
    expect(stepOfField("curriculumIds")).toBe(1);
    expect(stepOfField("panCard")).toBe(2);
    expect(stepOfField("declarationAccepted")).toBe(2);
  });
});

describe("money", () => {
  it("formats paise as INR", () => {
    expect(formatPaise(145000)).toBe("₹1,450");
    expect(formatPaise(171150)).toBe("₹1,711.50");
    expect(formatPaise(99950)).toBe("₹999.50");
    expect(gstPercent(1800)).toBe("18%");
  });
});
