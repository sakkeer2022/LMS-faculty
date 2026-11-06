import { Suspense } from "react";
import "@/features/onboarding/onboarding.css";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";

export const metadata = { title: "Apply to teach" };

// Opened from the invitation email: /onboarding?token=… (screens 43b-43e)
export default function Page() {
  return (
    <Suspense>
      <OnboardingWizard />
    </Suspense>
  );
}
