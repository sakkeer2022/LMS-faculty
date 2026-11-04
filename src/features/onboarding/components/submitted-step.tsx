import { ButtonLink, Heading, Text } from "@/components/ui";
import { TIMELINE } from "../model/content";
import type { ApplicationResult } from "../model/types";

/** Screen 43e, "Application submitted": reference and what happens next. */
export function SubmittedStep({ result, homeUrl }: { result: ApplicationResult; homeUrl: string }) {
  const firstName = result.fullName.trim().split(/\s+/)[0];
  return (
    <section className="onboarding-form onboarding-submitted" aria-labelledby="submitted-title">
      <svg className="onboarding-done-mark" width="72" height="56" viewBox="0 0 72 56" aria-hidden>
        <path d="M8 30l17 17L64 9" fill="none" stroke="#15803d" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 29l17 17L64 8" fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="onboarding-head">
        <Heading level={1} id="submitted-title" className="onboarding-title" tabIndex={-1}>
          Application submitted
        </Heading>
        <Text className="onboarding-subtitle">
          Thanks, {firstName}. Your application has been submitted successfully. We&apos;ll review your information and
          update you as your application progresses.
        </Text>
      </div>
      <p className="onboarding-reference">
        Application reference <span>{result.applicationReference}</span>
      </p>
      <ol className="onboarding-timeline" aria-label="What happens next">
        {TIMELINE.map((step, i) => (
          <li key={step.title} data-done={i === 0}>
            <span className="onboarding-timeline-mark" aria-hidden>
              {i === 0 ? (
                <svg width="10" height="10" viewBox="0 0 12 12">
                  <path d="M2.5 6.5l2.2 2.2L9.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <div className="onboarding-timeline-body">
              <p className="onboarding-timeline-title">
                {step.title}
                {i === 0 && <span className="sr-only"> (done)</span>}
              </p>
              <p className="onboarding-timeline-text">{step.text}</p>
            </div>
            <svg className="onboarding-timeline-chevron" aria-hidden width="14" height="14" viewBox="0 0 16 16">
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </li>
        ))}
      </ol>
      <ButtonLink href={homeUrl} className="onboarding-home">
        Back to Amentorz
      </ButtonLink>
    </section>
  );
}
