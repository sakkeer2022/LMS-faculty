"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/shadcn/button";
import { ApiError } from "@/lib/api/contracts";
import { loadCatalogue, loadTeachingModes, startOnboarding, startReupload, submitApplication, submitReupload } from "../model/api";
import type { Step } from "../model/picker";
import {
  ADDITIONAL_DOCUMENTS,
  EMPTY_CREDENTIALS,
  DOCUMENTS,
  FIELD_OF_TYPE,
  credentialsFromSession,
  type ApplicationResult,
  type Credentials,
  type DocumentField,
  type OfferingTree,
  type ReuploadSession,
  type TeachingMode,
} from "../model/types";
import { additionalFilesIssue, fileIssue, isDocumentField, stepOfField, validateCredentials, type FieldErrors } from "../model/validation";
import { BrandPanel } from "./brand-panel";
import { Stepper } from "./stepper";
import { CredentialsStep } from "./credentials-step";
import { SubjectsStep } from "./subjects-step";
import { DocumentsStep } from "./documents-step";
import { SubmittedStep } from "./submitted-step";
import { ReuploadNotice } from "./reupload-notice";

type Phase = "loading" | "invalid" | "form" | "submitted";
export type WizardMode = "apply" | "reupload";

const LINK_INVALID = ["INVITATION_INVALID", "REUPLOAD_LINK_INVALID"];
const NO_FILES: Record<DocumentField, File | null> = { photoId: null, degreeCertificate: null, panCard: null };

/**
 * Tutor onboarding (screens 43b-43e). `apply` opens from the invitation email; `reupload` opens from the
 * "update your application" email an admin sends with a reason, and fills in the application on file
 * (no password step: the account exists). The link carries a single-use token; the answers stay in this
 * page's memory (never in storage or the URL) and are submitted once, with the documents, at the end.
 */
export function OnboardingWizard({ mode = "apply" }: { mode?: WizardMode }) {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [phase, setPhase] = useState<Phase>("loading");
  const [email, setEmail] = useState<string>();
  const [reupload, setReupload] = useState<ReuploadSession>();
  const [tree, setTree] = useState<OfferingTree>();
  const [teachingModes, setTeachingModes] = useState<TeachingMode[]>([]);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const [credentials, setCredentials] = useState<Credentials>(EMPTY_CREDENTIALS);
  const [credentialErrors, setCredentialErrors] = useState<FieldErrors>({});
  const [path, setPath] = useState<Step[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [subjectError, setSubjectError] = useState<string>();
  const [files, setFiles] = useState<Record<DocumentField, File | null>>(NO_FILES);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [declared, setDeclared] = useState(false);
  const [documentErrors, setDocumentErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ApplicationResult>();
  const main = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      setPhase("invalid");
      return;
    }
    const session: Promise<{ email: string; reupload?: ReuploadSession }> =
      mode === "apply" ? startOnboarding(token) : startReupload(token).then((s) => ({ email: s.email, reupload: s }));
    Promise.all([session, loadCatalogue(), loadTeachingModes()])
      .then(([s, t, modes]) => {
        if (cancelled) return;
        setEmail(s.email);
        setTree(t);
        setTeachingModes(modes);
        if (s.reupload) {
          setReupload(s.reupload);
          setCredentials(credentialsFromSession(s.reupload));
          setSelected(s.reupload.curriculumIds);
        }
        setPhase("form");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.code && LINK_INVALID.includes(err.code)) setPhase("invalid");
        else {
          setLoadError(err instanceof ApiError ? err.message : "We could not load your application. Check your connection and try again.");
          setPhase("invalid");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, mode]);

  // Move focus to the new step's heading for keyboard and screen-reader users
  useEffect(() => {
    main.current?.querySelector<HTMLElement>("h1")?.focus();
    window.scrollTo({ top: 0 });
  }, [step, phase]);

  const onFileType = (field: DocumentField) => reupload?.documents.some((d) => d.required && FIELD_OF_TYPE[d.type] === field) ?? false;
  const keptExtras = (reupload?.documents ?? []).filter((d) => !d.required && !removedIds.includes(d.id)).length;

  function continueFromCredentials() {
    const checked = validateCredentials(credentials, mode);
    if (!checked.ok) {
      setCredentialErrors(checked.errors);
      requestAnimationFrame(() => main.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setCredentialErrors({});
    setStep(1);
  }

  function continueFromSubjects() {
    if (!selected.length) {
      setSubjectError("Pick at least one subject you teach.");
      return;
    }
    setSubjectError(undefined);
    setStep(2);
  }

  async function submit() {
    const errors: FieldErrors = {};
    for (const doc of DOCUMENTS) {
      // A re-upload keeps a required document on file unless a new one is chosen
      if (!files[doc.field] && onFileType(doc.field)) continue;
      const issue = fileIssue(files[doc.field], doc.label);
      if (issue) errors[doc.field] = issue;
    }
    const extraIssue = additionalFilesIssue(additionalFiles, keptExtras, ADDITIONAL_DOCUMENTS.max);
    if (extraIssue) errors[ADDITIONAL_DOCUMENTS.field] = extraIssue;
    if (!declared) errors.declarationAccepted = "Confirm these documents are yours and accept the tutor terms";
    setDocumentErrors(errors);
    setFormError(undefined);
    if (Object.keys(errors).length) return;
    const checked = validateCredentials(credentials, mode);
    if (!checked.ok) {
      setCredentialErrors(checked.errors);
      setStep(0);
      return;
    }
    setPending(true);
    try {
      const input = {
        token,
        credentials: { ...credentials, mobileNumber: checked.data.mobileNumber },
        curriculumIds: selected,
        files: Object.fromEntries(Object.entries(files).filter(([, f]) => f)) as Partial<Record<DocumentField, File>>,
        additionalFiles,
      };
      const submitted = mode === "apply" ? await submitApplication(input) : await submitReupload({ ...input, removeDocumentIds: removedIds });
      setResult(submitted);
      setPhase("submitted");
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setFormError("We could not submit your application. Check your connection and try again.");
        return;
      }
      if (err.code && LINK_INVALID.includes(err.code)) {
        setPhase("invalid");
        return;
      }
      const fields = Object.entries(err.fields ?? {}).map(([k, v]) => [k.split(".")[0] as string, v[0] ?? err.message] as const);
      if (!fields.length) {
        setFormError(err.message);
        return;
      }
      const target = Math.min(...fields.map(([k]) => stepOfField(k))) as 0 | 1 | 2;
      setCredentialErrors(Object.fromEntries(fields.filter(([k]) => stepOfField(k) === 0)));
      setDocumentErrors(
        Object.fromEntries(fields.filter(([k]) => isDocumentField(k) || k === "declarationAccepted" || k === ADDITIONAL_DOCUMENTS.field)),
      );
      const subject = fields.find(([k]) => stepOfField(k) === 1);
      if (subject) setSubjectError(subject[1]);
      setStep(target);
    } finally {
      setPending(false);
    }
  }

  if (phase === "loading") {
    return (
      <div className="login onboarding">
        <BrandPanel />
        <main id="main" className="login-panel onboarding-panel" ref={main}>
          <p className="onboarding-status" role="status">
            {mode === "apply" ? "Checking your invitation…" : "Loading your application…"}
          </p>
        </main>
      </div>
    );
  }

  if (phase === "invalid") {
    return (
      <div className="login onboarding">
        <BrandPanel />
        <main id="main" className="login-panel onboarding-panel" ref={main}>
          <section className="onboarding-form" aria-labelledby="invalid-title">
            <h1 id="invalid-title" className="onboarding-title" tabIndex={-1}>
              This link can&apos;t be used
            </h1>
            <p className="onboarding-subtitle">
              {loadError ||
                (mode === "apply"
                  ? "This invitation link is invalid, already used or expired. Ask your Amentorz contact to send you a new invitation."
                  : "This link is invalid, already used or expired. Reply to the email we sent you and we will send a new one.")}
            </p>
            <Button asChild variant="outline">
              <Link href="/login">Go to sign in</Link>
            </Button>
          </section>
        </main>
      </div>
    );
  }

  if (phase === "submitted" && result) {
    return (
      <div className="login onboarding">
        <BrandPanel />
        <main id="main" className="login-panel onboarding-panel onboarding-panel--centered" ref={main}>
          <SubmittedStep result={result} resubmitted={mode === "reupload"} />
        </main>
      </div>
    );
  }

  const notice = reupload && <ReuploadNotice reason={reupload.reason} expiresAt={reupload.expiresAt} />;

  // Step 2 (subjects) uses the full width, without the brand panel (screen 43c)
  if (step === 1 && tree) {
    return (
      <main id="main" className="onboarding onboarding--wide" ref={main}>
        <div className="onboarding-wide-inner">
          <Stepper current={1} />
          <SubjectsStep
            tree={tree}
            path={path}
            selected={selected}
            error={subjectError}
            onPath={setPath}
            onSelected={(ids) => {
              setSelected(ids);
              if (ids.length) setSubjectError(undefined);
            }}
            onBack={() => setStep(0)}
            onContinue={continueFromSubjects}
          />
        </div>
      </main>
    );
  }

  return (
    <div className="login onboarding">
      <BrandPanel />
      <main id="main" className="login-panel onboarding-panel" ref={main}>
        <div className="onboarding-column-main">
          <Stepper current={step} />
          {email && <p className="sr-only">Applying as {email}</p>}
          {notice}
          {step === 0 ? (
            <CredentialsStep
              values={credentials}
              errors={credentialErrors}
              teachingModes={teachingModes}
              mode={mode}
              onChange={setCredentials}
              onContinue={continueFromCredentials}
            />
          ) : (
            <DocumentsStep
              files={files}
              additionalFiles={additionalFiles}
              declared={declared}
              errors={documentErrors}
              formError={formError}
              pending={pending}
              documentsOnFile={reupload?.documents}
              removedIds={removedIds}
              onRemoveOnFile={(id, removed) => setRemovedIds((ids) => (removed ? [...ids, id] : ids.filter((x) => x !== id)))}
              submitLabel={mode === "apply" ? "Submit application" : "Re-submit application"}
              onFile={(field, file) => {
                setFiles((f) => ({ ...f, [field]: file }));
                setDocumentErrors((e) => ({ ...e, [field]: file ? fileIssue(file, DOCUMENTS.find((d) => d.field === field)!.label) : undefined }));
              }}
              onAdditionalFiles={(next) => {
                setAdditionalFiles(next);
                setDocumentErrors((e) => ({ ...e, [ADDITIONAL_DOCUMENTS.field]: additionalFilesIssue(next, keptExtras, ADDITIONAL_DOCUMENTS.max) }));
              }}
              onDeclared={(v) => {
                setDeclared(v);
                if (v) setDocumentErrors((e) => ({ ...e, declarationAccepted: undefined }));
              }}
              onBack={() => setStep(1)}
              onSubmit={() => void submit()}
            />
          )}
        </div>
      </main>
    </div>
  );
}
