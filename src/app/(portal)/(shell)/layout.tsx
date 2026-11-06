import type { ReactNode } from "react";
import { requireFaculty } from "@/lib/auth/server";
import { PortalFrame } from "@/features/portal/components/portal-frame";

// Signed-in portal frame (sidebar and topbar), as amentorz-admin src/app/(admin)/admin/layout.tsx.
// requireFaculty checks the session with the backend and sends a tutor with unaccepted prices to /consent.
export default async function Layout({ children }: { children: ReactNode }) {
  await requireFaculty();
  return <PortalFrame>{children}</PortalFrame>;
}
