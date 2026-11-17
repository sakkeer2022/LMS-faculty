"use client";
import { FileSignature } from "lucide-react";
import { useRef, useState } from "react";
import { AppDialog } from "@/components/forms/app-dialog";
import { SignaturePad, type SignaturePadHandle } from "@/components/forms/signature-pad";
import { Button } from "@/components/shadcn/button";
import { formatPaise, gstPercent, type PriceConsent } from "../model";

/**
 * The price agreement the tutor signs to accept their session prices. Same dialog and signature pad as the
 * parent/guardian consent in the student app (AppDialog, SignaturePad): the terms, the prices being agreed
 * and a signature box. "Sign and accept" sends the drawn signature with the acceptance.
 */
export function SignPricesDialog({
  open,
  consent,
  tutorName,
  pending,
  error,
  onClose,
  onSign,
}: {
  open: boolean;
  consent: PriceConsent;
  tutorName?: string;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSign: (signature: Blob) => void;
}) {
  const pad = useRef<SignaturePadHandle>(null);
  const [hasInk, setHasInk] = useState(false);

  async function sign() {
    const signature = await pad.current?.toPng();
    if (signature) onSign(signature);
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      dismissible={!pending}
      width={720}
      title="Review and sign your price agreement"
      subtitle={`${consent.subjects.length} ${consent.subjects.length === 1 ? "subject" : "subjects"} · prices per 60-minute session, in Indian rupees`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => void sign()} disabled={!hasInk || pending} aria-busy={pending || undefined}>
            {pending ? "Signing…" : "Sign and accept"}
          </Button>
        </>
      }
    >
      <section className="flex flex-col gap-3 rounded-md bg-sunken p-4 text-sm" aria-labelledby="agreement-heading">
        <h3 id="agreement-heading" className="flex items-center gap-2 font-semibold">
          <FileSignature aria-hidden className="size-5" />
          Agreement
        </h3>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-text-secondary">
          <li>
            I{tutorName ? `, ${tutorName},` : ""} agree to teach the subjects below on Amentorz at the session prices shown.
          </li>
          <li>Each price is for one 60-minute session. Students pay the session price plus GST.</li>
          <li>If Amentorz changes a price, I will be asked to review and sign again before it applies to me.</li>
        </ul>
      </section>

      <section aria-labelledby="agreement-prices">
        <h3 id="agreement-prices" className="mb-2 text-sm font-semibold">
          Session prices
        </h3>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[520px] border-collapse text-[13px]">
            <caption className="sr-only">Session prices you are agreeing to</caption>
            <thead>
              <tr className="bg-sunken text-left text-xs text-text-secondary">
                <th scope="col" className="px-3.5 py-2.5 font-semibold">
                  Subject
                </th>
                <th scope="col" className="px-3.5 py-2.5 text-right font-semibold whitespace-nowrap">
                  Session price
                </th>
                <th scope="col" className="px-3.5 py-2.5 text-right font-semibold whitespace-nowrap">
                  GST
                </th>
                <th scope="col" className="px-3.5 py-2.5 text-right font-semibold whitespace-nowrap">
                  Student pays
                </th>
              </tr>
            </thead>
            <tbody>
              {consent.subjects.map((s) => (
                <tr key={s.assignmentId} className="border-t border-border-subtle align-top">
                  <td className="px-3.5 py-2.5">
                    <strong className="font-semibold">{s.subject}</strong>
                    <span className="mt-0.5 block text-[11px] break-words text-muted-foreground">{s.pathLabel}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap tabular-nums">{formatPaise(s.price.sessionPricePaise)}</td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap text-text-secondary tabular-nums">
                    {formatPaise(s.price.gstPaise)} ({gstPercent(s.price.gstRateBps)})
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap tabular-nums">{formatPaise(s.price.studentPaysPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="signature-heading">
        <div className="mb-3 flex items-center justify-between">
          <h3 id="signature-heading" className="text-sm font-semibold">
            Signature
          </h3>
          <Button
            variant="ghost"
            className="h-auto p-0 font-semibold text-accent-foreground hover:bg-transparent hover:underline disabled:text-disabled-foreground"
            onClick={() => pad.current?.clear()}
            disabled={!hasInk || pending}
          >
            Clear
          </Button>
        </div>
        <div className="rounded-md border border-dashed border-border-strong">
          <SignaturePad ref={pad} onInkChange={setHasInk} label="Draw your signature here" />
        </div>
      </section>
      {error && (
        <p className="text-sm text-error-foreground" role="alert">
          {error}
        </p>
      )}
    </AppDialog>
  );
}
