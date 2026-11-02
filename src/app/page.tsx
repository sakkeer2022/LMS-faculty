import { redirect } from "next/navigation";

// The faculty dashboard is not designed yet; until then the app opens on the login screen.
export default function Home() {
  redirect("/login");
}
