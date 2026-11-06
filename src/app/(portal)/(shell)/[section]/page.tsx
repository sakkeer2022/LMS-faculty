import { notFound } from "next/navigation";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { facultyPages } from "@/components/layout/faculty-nav";

// Sidebar sections without a screen yet, as amentorz-admin src/app/(admin)/admin/[section]/page.tsx
const sections = new Map(
  facultyPages.filter(([, href]) => href !== "/dashboard").map(([title, href]) => [href.slice(1), title]),
);

export function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  return params.then(({ section }) => ({ title: sections.get(section) ?? "Page not found" }));
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = sections.get(section);
  if (!title) notFound();
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        title="Not available yet"
        description="This workflow needs a backend service that has not been connected."
      />
    </>
  );
}
