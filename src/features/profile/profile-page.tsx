"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { useMe } from "@/features/portal/api";
import { SubjectCardsSection } from "@/features/subject-cards/subject-cards-section";

/**
 * Profile (no Figma yet, F18): the account summary and the Subject Cards section. Profile editing
 * (LMS-82) is not built yet.
 */
export function ProfilePage() {
  const me = useMe();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profile" description="Your account and the subjects you teach" />
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          {me.isPending ? (
            <Skeleton className="h-10 w-64" />
          ) : me.data ? (
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="font-medium">{me.data.fullName}</dd>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="truncate font-medium">{me.data.email}</dd>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Mobile number</dt>
                <dd className="font-medium">{me.data.mobileNumber ?? "—"}</dd>
              </div>
            </dl>
          ) : null}
        </CardContent>
      </Card>
      <SubjectCardsSection />
    </div>
  );
}
