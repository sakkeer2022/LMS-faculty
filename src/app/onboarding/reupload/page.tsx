import { Suspense } from "react";
import "@/features/onboarding/onboarding.css";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";

export const metadata = { title: "Update your application" };

// Opened from the "please update your application" email: /onboarding/reupload?token=…
// Same screens as onboarding (43b-43e), filled in with the application on file.
export default function Page() {
  return (
    <Suspense>
      <OnboardingWizard mode="reupload" />
    </Suspense>
  );
}
