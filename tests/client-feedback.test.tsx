import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { additionalFilesIssue, stepOfField, validateCredentials } from "@/features/onboarding/model/validation";
import { credentialsFromSession, EMPTY_CREDENTIALS, reuploadSessionSchema, type ReuploadSession } from "@/features/onboarding/model/types";
import { SubmittedStep } from "@/features/onboarding/components/submitted-step";
import { DocumentsStep } from "@/features/onboarding/components/documents-step";
import { ReuploadNotice } from "@/features/onboarding/components/reupload-notice";

const file = (name: string, size = 100) => new File([new Uint8Array(size)], name);

const session: ReuploadSession = {
  email: "anil.verma@example.com",
  expiresAt: "2026-11-14T10:30:00.000Z",
  reason: "PAN card is blurred; upload a clear scan",
  applicationReference: "AMZ-T-4471",
  values: {
    fullName: "Anil Verma",
    mobileNumber: "+919876543210",
    city: "Pune",
    highestQualification: "M.Sc. Physics",
    teachingExperience: "5-10",
    teachingMode: "hybrid",
    studiedAt: null,
  },
  curriculumIds: ["c1"],
  documents: [
    { id: "d1", type: "GOVERNMENT_ID", label: "Photo ID", fileName: "aadhaar.png", fileSize: 2048, uploadedAt: "2026-11-01T00:00:00Z", required: true },
    { id: "d2", type: "PAN_CARD", label: "PAN card", fileName: "pan.pdf", fileSize: 4096, uploadedAt: "2026-11-01T00:00:00Z", required: true },
    { id: "d3", type: "OTHER", label: "Additional document", fileName: "award.pdf", fileSize: 1024, uploadedAt: "2026-11-01T00:00:00Z", required: false },
  ],
};

describe("re-upload (Task 1)", () => {
  it("parses the session and pre-fills the answers, without a password", () => {
    expect(reuploadSessionSchema.parse(session)).toEqual(session);
    expect(credentialsFromSession(session)).toEqual({
      ...EMPTY_CREDENTIALS,
      fullName: "Anil Verma",
      mobileNumber: "+919876543210",
      city: "Pune",
      highestQualification: "M.Sc. Physics",
      teachingExperience: "5-10",
      teachingMode: "hybrid",
    });
  });

  it("validates a re-upload without a password, but an application with one", () => {
    const values = credentialsFromSession(session);
    expect(validateCredentials(values, "reupload").ok).toBe(true);
    const apply = validateCredentials(values, "apply");
    expect(apply.ok).toBe(false);
    if (!apply.ok) expect(apply.errors.password).toBeTruthy();
  });

  it("shows the admin's reason and the link expiry", () => {
    const html = renderToStaticMarkup(<ReuploadNotice reason={session.reason} expiresAt={session.expiresAt} />);
    expect(html).toContain("Please update your application");
    expect(html).toContain("PAN card is blurred; upload a clear scan");
    expect(html).toContain("2026");
  });
});

describe("additional documents (Task 2)", () => {
  it("allows up to five, counting those kept on file", () => {
    expect(additionalFilesIssue([file("a.pdf"), file("b.png")])).toBeUndefined();
    expect(additionalFilesIssue([file("a.pdf")], 5)).toBe("Add at most 5 additional documents");
    expect(additionalFilesIssue([file("tool.exe")])).toMatch(/^tool\.exe: /);
    expect(stepOfField("additionalDocuments.0")).toBe(2);
    expect(stepOfField("teachingMode")).toBe(0);
  });

  it("renders an optional upload area like the required ones, and the documents on file", () => {
    const html = renderToStaticMarkup(
      <DocumentsStep
        files={{ photoId: null, degreeCertificate: null, panCard: null }}
        additionalFiles={[file("experience.pdf", 2048)]}
        declared={false}
        errors={{}}
        pending={false}
        documentsOnFile={session.documents}
        removedIds={["d3"]}
        onFile={() => undefined}
        onAdditionalFiles={() => undefined}
        onDeclared={() => undefined}
        onBack={() => undefined}
        onSubmit={() => undefined}
        submitLabel="Re-submit application"
      />,
    );
    expect(html).toContain("Additional documents (optional)");
    expect(html.match(/Drag and drop your file here/g)).toHaveLength(4);
    expect(html).toContain("On file: aadhaar.png");
    expect(html).toContain("experience.pdf");
    expect(html).toContain("award.pdf");
    expect(html).toContain("Undo");
    expect(html).toContain("Re-submit application");
  });
});

describe("submitted screen (Task 6, Figma 43e)", () => {
  const result = { applicationReference: "AMZ-T-4471", fullName: "Anil Verma", email: "a@x.com", submittedAt: "2026-11-11T00:00:00Z" };

  it("matches the design: title, copy and reference only", () => {
    const html = renderToStaticMarkup(<SubmittedStep result={result} />);
    expect(html).toContain("Application submitted");
    expect(html).toContain("Thanks, Anil. Your application has been submitted successfully. We&#x27;ll review your information and update you as your application progresses.");
    expect(html).toContain("Application reference : <span>AMZ-T-4471</span>");
    // No timeline and no "Back to Amentorz" button on the Figma screen
    expect(html).not.toContain("Back to Amentorz");
    expect(html).not.toContain("onboarding-timeline");
  });

  it("says re-submitted after a re-upload", () => {
    expect(renderToStaticMarkup(<SubmittedStep result={result} resubmitted />)).toContain("Application re-submitted");
  });
});

describe("signed price consent (Task 3)", () => {
  it("refuses to accept without a signature, before any request", async () => {
    const { decidePriceConsent } = await import("@/features/portal/model");
    await expect(decidePriceConsent("accept", "a".repeat(64))).rejects.toThrow("A signature is required to accept");
  });
});
