import { redirect } from "next/navigation";
import { FACULTY_HOME } from "@/lib/auth/access";

// The old post-consent landing page; the dashboard replaces it. Kept so existing links still work.
export default function Page() {
  redirect(FACULTY_HOME);
}
