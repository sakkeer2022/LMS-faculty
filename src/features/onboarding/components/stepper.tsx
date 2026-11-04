const STEPS = ["Credentials", "Subjects & rates", "Documents"] as const;

/** "1 Credentials — 2 Subjects & rates — 3 Documents" (screens 43b-43d). */
export function Stepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="onboarding-stepper" aria-label="Application steps">
      {STEPS.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={label} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className="onboarding-step-mark" aria-hidden>
              {state === "done" ? (
                <svg width="10" height="10" viewBox="0 0 12 12">
                  <path d="M2.5 6.5l2.2 2.2L9.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span className="onboarding-step-label">
              {label}
              {state === "done" && <span className="sr-only"> (completed)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
