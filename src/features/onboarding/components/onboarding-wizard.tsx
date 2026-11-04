"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ButtonLink, Heading, Text } from "@/components/ui";
import { ApiError } from "@/lib/api/contracts";
import { loadCatalogue, startOnboarding, submitApplication } from "../model/api";
import type { Step } from "../model/picker";
import { EMPTY_CREDENTIALS, DOCUMENTS, type ApplicationResult, type Credentials, type DocumentField, type OfferingTree, type OnboardingSession } from "../model/types";
import { fileIssue, isDocumentField, stepOfField, validateCredentials, type FieldErrors } from "../model/validation";
import { BrandPanel } from "./brand-panel";
import { Stepper } from "./stepper";
import { CredentialsStep } from "./credentials-step";
import { SubjectsStep } from "./subjects-step";
import { DocumentsStep } from "./documents-step";
import { SubmittedStep } from "./submitted-step";

type Phase = "loading" | "invalid" | "form" | "submitted";

const HOME_URL = process.env.NEXT_PUBLIC_SITE_URL || "/login";

/**
 * Tutor onboarding from the invitation email (screens 43b-43e). The link carries a single-use
 * token; the answers stay in this page's memory (never in storage or the URL) and are submitted
 * once, with the documents, at the end.
 */
export function OnboardingWizard() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<OnboardingSession>();
  const [tree, setTree] = useState<OfferingTree>();
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const [credentials, setCredentials] = useState<Credentials>(EMPTY_CREDENTIALS);
  const [credentialErrors, setCredentialErrors] = useState<FieldErrors>({});
  const [path, setPath] = useState<Step[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [offline, setOffline] = useState(false);
  const [subjectError, setSubjectError] = useState<string>();
  const [files, setFiles] = useState<Record<DocumentField, File | null>>({ photoId: null, degreeCertificate: null, panCard: null });
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
    Promise.all([startOnboarding(token), loadCatalogue()])
      .then(([s, t]) => {
        if (cancelled) return;
        setSession(s);
        setTree(t);
        setPhase("form");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "INVITATION_INVALID") setPhase("invalid");
        else {
          setLoadError(err instanceof ApiError ? err.message : "We could not load your invitation. Check your connection and try again.");
          setPhase("invalid");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Move focus to the new step's heading for keyboard and screen-reader users
  useEffect(() => {
    main.current?.querySelector<HTMLElement>("h1")?.focus();
    window.scrollTo({ top: 0 });
  }, [step, phase]);

  function continueFromCredentials() {
    const checked = validateCredentials(credentials);
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
      const issue = fileIssue(files[doc.field], doc.label);
      if (issue) errors[doc.field] = issue;
    }
    if (!declared) errors.declarationAccepted = "Confirm these documents are yours and accept the tutor terms";
    setDocumentErrors(errors);
    setFormError(undefined);
    if (Object.keys(errors).length) return;
    const checked = validateCredentials(credentials);
    if (!checked.ok) {
      setCredentialErrors(checked.errors);
      setStep(0);
      return;
    }
    setPending(true);
    try {
      const submitted = await submitApplication({
        token,
        credentials: { ...credentials, mobileNumber: checked.data.mobileNumber },
        curriculumIds: selected,
        offersOfflineClasses: offline,
        files: files as Record<DocumentField, File>,
      });
      setResult(submitted);
      setPhase("submitted");
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setFormError("We could not submit your application. Check your connection and try again.");
        return;
      }
      if (err.code === "INVITATION_INVALID") {
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
      setDocumentErrors(Object.fromEntries(fields.filter(([k]) => isDocumentField(k) || k === "declarationAccepted")));
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
            Checking your invitation…
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
            <Heading level={1} id="invalid-title" className="onboarding-title" tabIndex={-1}>
              This link can&apos;t be used
            </Heading>
            <Text className="onboarding-subtitle">
              {loadError ||
                "This invitation link is invalid, already used or expired. Ask your Amentorz contact to send you a new invitation."}
            </Text>
            <ButtonLink href="/login" variant="outline">
              Go to sign in
            </ButtonLink>
          </section>
        </main>
      </div>
    );
  }

  if (phase === "submitted" && result) {
    return (
      <div className="login onboarding">
        <BrandPanel />
        <main id="main" className="login-panel onboarding-panel" ref={main}>
          <SubmittedStep result={result} homeUrl={HOME_URL} />
        </main>
      </div>
    );
  }

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
            offline={offline}
            error={subjectError}
            onPath={setPath}
            onSelected={(ids) => {
              setSelected(ids);
              if (ids.length) setSubjectError(undefined);
            }}
            onOffline={setOffline}
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
          {session && <p className="sr-only">Applying as {session.email}</p>}
          {step === 0 ? (
            <CredentialsStep
              values={credentials}
              errors={credentialErrors}
              onChange={setCredentials}
              onContinue={continueFromCredentials}
            />
          ) : (
            <DocumentsStep
              files={files}
              declared={declared}
              errors={documentErrors}
              formError={formError}
              pending={pending}
              onFile={(field, file) => {
                setFiles((f) => ({ ...f, [field]: file }));
                setDocumentErrors((e) => ({ ...e, [field]: file ? fileIssue(file, DOCUMENTS.find((d) => d.field === field)!.label) : undefined }));
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
