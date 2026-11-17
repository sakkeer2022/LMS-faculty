import type { ApplicationResult } from "../model/types";

/**
 * Screen 43e, "Application submitted" (Figma "Screen/43e · Apply to teach — Submitted"): the purple tick,
 * the confirmation copy and the application reference. Nothing else is on the screen; what happens next
 * is sent by email. `resubmitted` is the same screen after a re-upload.
 */
export function SubmittedStep({ result, resubmitted = false }: { result: ApplicationResult; resubmitted?: boolean }) {
  const firstName = result.fullName.trim().split(/\s+/)[0];
  return (
    <section className="onboarding-form onboarding-submitted" aria-labelledby="submitted-title">
      <svg className="onboarding-done-mark" width="80" height="60" viewBox="0 0 80 60" aria-hidden>
        <defs>
          <linearGradient id="done-mark-face" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--purple-400)" }} />
            <stop offset="1" style={{ stopColor: "var(--purple-600)" }} />
          </linearGradient>
        </defs>
        {/* The darker stroke, offset down, gives the tick its depth */}
        <path d="M10 33l18 18L70 11" fill="none" style={{ stroke: "var(--purple-800)" }} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 29l18 18L70 7" fill="none" stroke="url(#done-mark-face)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 27l14 14" fill="none" style={{ stroke: "var(--purple-200)" }} strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="onboarding-head">
        <h1 id="submitted-title" className="onboarding-title" tabIndex={-1}>
          {resubmitted ? "Application re-submitted" : "Application submitted"}
        </h1>
        <p className="onboarding-subtitle">
          Thanks, {firstName}. Your application has been {resubmitted ? "re-submitted" : "submitted"} successfully. We&apos;ll review
          your information and update you as your application progresses.
        </p>
      </div>
      <p className="onboarding-reference">
        Application reference : <span>{result.applicationReference}</span>
      </p>
    </section>
  );
}
