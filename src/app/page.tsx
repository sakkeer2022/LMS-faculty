import { redirect } from "next/navigation";
import { FACULTY_HOME } from "@/lib/auth/access";

// The portal gate (middleware, then requireFaculty) sends a signed-out visitor to /login.
export default function Home() {
  redirect(FACULTY_HOME);
}
