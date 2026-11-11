import { AlertTriangle } from "lucide-react";

const formatExpiry = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(new Date(iso));

/** What the admin asked to change, and when the link stops working (re-upload only). */
export function ReuploadNotice({ reason, expiresAt }: { reason: string; expiresAt: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-warning-border bg-warning-subtle px-4 py-3 text-[13px] leading-5" role="note">
      <AlertTriangle aria-hidden className="mt-0.5 size-[18px] flex-none text-warning-foreground" />
      <div className="min-w-0">
        <p className="font-semibold text-warning-foreground">Please update your application</p>
        <p className="mt-0.5 break-words whitespace-pre-wrap">{reason}</p>
        <p className="mt-1.5 text-xs text-text-secondary">
          Your answers and documents are filled in. Change what was asked, then re-submit before {formatExpiry(expiresAt)}.
        </p>
      </div>
    </div>
  );
}
