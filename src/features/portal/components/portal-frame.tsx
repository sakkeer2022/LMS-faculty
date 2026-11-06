"use client";
import type { ReactNode } from "react";
import { FacultyShell } from "@/components/layout/faculty-shell";
import { useDashboard } from "@/features/dashboard/adapter";
import { useLogout, useMe, useTeachingSubjects } from "../api";

/** Connects the faculty shell to the session, teaching subjects, queue counts and logout. */
export function PortalFrame({ children }: { children: ReactNode }) {
  const me = useMe().data;
  const subjects = useTeachingSubjects();
  const counts = useDashboard("counts").data;
  const logout = useLogout();
  return (
    <FacultyShell
      account={{ name: me?.fullName, subtitle: subjects.length ? subjects.join(", ") : "Tutor" }}
      counts={counts}
      onLogout={() => logout.mutate()}
      loggingOut={logout.isPending}
    >
      {children}
    </FacultyShell>
  );
}
