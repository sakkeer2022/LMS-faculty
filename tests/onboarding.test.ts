import { describe, expect, it } from "vitest";
import { cardFor, choose, columnsFor, isSelected, MAX_SUBJECTS, toggleSubject, type Step } from "@/features/onboarding/model/picker";
import { fileIssue, stepOfField, validateCredentials } from "@/features/onboarding/model/validation";
import { EMPTY_CREDENTIALS, type OfferingTree } from "@/features/onboarding/model/types";
import { formatPaise, gstPercent } from "@/features/portal/model";

// The admin's category tree: Academic › School › K-12 › CBSE › Class 11 / Class 12 / Class 9,
// and Non-academic › Skill (a leaf one level down). A leaf offers subjects, each one offering
// (board and level null). Class 9 has no subject yet, so the picker hides it.
const offer = (curriculumId: string, categoryId: string, id: string, name: string) => ({ curriculumId, categoryId, board: null, level: null, subject: { id, name } });
const tree: OfferingTree = {
  nodes: [
    { id: "academic", parentId: null, name: "Academic", isLeaf: false },
    { id: "non", parentId: null, name: "Non-academic", isLeaf: false },
    { id: "school", parentId: "academic", name: "School", isLeaf: false },
    { id: "k12", parentId: "school", name: "K-12", isLeaf: false },
    { id: "cbse", parentId: "k12", name: "CBSE", isLeaf: false },
    { id: "p11", parentId: "cbse", name: "Class 11", isLeaf: true },
    { id: "p12", parentId: "cbse", name: "Class 12", isLeaf: true },
    { id: "p9", parentId: "cbse", name: "Class 9", isLeaf: true },
    { id: "skill", parentId: "non", name: "Skill", isLeaf: true },
  ],
  offerings: [
    offer("c11p", "p11", "phy", "Physics"), offer("c11c", "p11", "chem", "Chemistry"),
    offer("c12p", "p12", "phy", "Physics"), offer("cs", "skill", "cod", "Coding"),
  ],
};

const labels = (path: Step[], i: number) => columnsFor(tree, path)[i]!.items.map((x) => x.label);
const walk = (...ids: string[]): Step[] => ids.map((id) => ({ kind: "node", id }));

describe("column picker", () => {
  it("starts with the streams", () => {
    expect(columnsFor(tree, [])).toHaveLength(1);
    expect(labels([], 0)).toEqual(["Academic", "Non-academic"]);
  });

  it("follows the category tree to a leaf, which opens a column of its subjects", () => {
    const path = walk("academic", "school", "k12", "cbse", "p11");
    const columns = columnsFor(tree, path);
    expect(columns.map((c) => c.items.map((i) => i.label))).toEqual([
      ["Academic", "Non-academic"], ["School"], ["K-12"], ["CBSE"], ["Class 11", "Class 12"], ["Physics", "Chemistry"],
    ]);
    const last = columns.at(-1)!;
    expect(last.kind).toBe("subject");
    expect(last.items.map((i) => [i.curriculumId, i.hasNext])).toEqual([["c11p", false], ["c11c", false]]);
    expect(columns[4]!.items[0]).toMatchObject({ hasNext: true, step: { kind: "node", id: "p11" } });
  });

  it("hides a leaf that has no subject yet", () => {
    expect(labels(walk("academic", "school", "k12", "cbse"), 4)).toEqual(["Class 11", "Class 12"]);
  });

  it("opens the subjects of a leaf directly under a stream", () => {
    expect(columnsFor(tree, walk("non", "skill"))[2]!.items).toEqual([{ key: "cs", label: "Coding", hasNext: false, curriculumId: "cs" }]);
  });

  it("choosing in an earlier column drops everything to its right", () => {
    const path = walk("academic", "school", "k12");
    const columns = columnsFor(tree, path);
    expect(choose(path, columns, 1, { kind: "node", id: "school" })).toEqual(walk("academic", "school"));
    expect(isSelected(path, 1, { kind: "node", id: "school" })).toBe(true);
    expect(isSelected(path, 1, { kind: "node", id: "k12" })).toBe(false);
  });

  it("titles each card with the subject and shows the leaf path", () => {
    expect(cardFor(tree, "c11p")).toEqual({ curriculumId: "c11p", subject: "Physics", pathLabel: "Academic › School › K-12 › CBSE › Class 11" });
    expect(cardFor(tree, "cs")?.pathLabel).toBe("Non-academic › Skill");
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
