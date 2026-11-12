// The add-subject-card dialog reuses the onboarding column picker and its styles
import "@/features/onboarding/onboarding.css";
import { ProfilePage } from "@/features/profile/profile-page";

export const metadata = { title: "Profile" };

export default function Page() {
  return <ProfilePage />;
}
