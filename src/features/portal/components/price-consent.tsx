"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/shadcn/button";
import { ApiError } from "@/lib/api/contracts";
import { FACULTY_HOME } from "@/lib/auth/access";
import { decidePriceConsent, formatPaise, getMe, getPriceConsent, gstPercent, type PriceConsent } from "../model";
import { PortalShell } from "./portal-shell";
import { SignPricesDialog } from "./sign-prices-dialog";

/**
 * Price consent after sign-in (LMS-39). The tutor accepts or declines the session prices
 * Amentorz set for each subject they chose at onboarding. Accepting opens the price agreement
 * (SignPricesDialog), where the tutor signs, as a parent signs the Student Terms in the student app.
 */
export function PriceConsentScreen() {
  const [name, setName] = useState<string>();
  const [consent, setConsent] = useState<PriceConsent>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"accept" | "reject">();
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string>();

  useEffect(() => {
    getMe()
      .then((me) => setName(me.fullName))
      .catch(() => window.location.assign("/login?redirect=/consent"));
    getPriceConsent()
      .then((c) => {
        if (c.status === "accepted") window.location.assign(FACULTY_HOME);
        else setConsent(c);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Your prices could not be loaded."));
  }, []);

  async function decide(decision: "accept" | "reject", signature?: Blob) {
    if (!consent) return;
    setPending(decision);
    setError("");
    setSignError(undefined);
    try {
      const next = await decidePriceConsent(decision, consent.snapshotHash, signature);
      if (next.status === "accepted") window.location.assign(FACULTY_HOME);
      else {
        setConsent(next);
        setConfirmDecline(false);
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "PRICES_CHANGED") {
        setSigning(false);
        setConsent(await getPriceConsent());
        setError("Your prices changed while this page was open. Review the new prices.");
      } else {
        const message = err instanceof ApiError ? err.message : "Your answer could not be saved. Try again.";
        if (decision === "accept") setSignError(message);
        else setError(message);
      }
    } finally {
      setPending(undefined);
    }
  }

  return (
    <PortalShell name={name}>
      <section className="consent" aria-labelledby="consent-title">
        <div className="consent-head">
          <h1 id="consent-title" className="consent-title">
            Review your session prices
          </h1>
          <p className="consent-subtitle">
            Amentorz set a price for each subject you teach. Students pay the session price plus GST. Review and sign
            the price agreement to start using your tutor account.
          </p>
        </div>

        {!consent && !error && (
          <p className="consent-muted" role="status">
            Loading your prices…
          </p>
        )}
        {error && (
          <p className="text-xs leading-4 text-destructive" role="alert">
            {error}
          </p>
        )}

        {consent && (
          <>
            {consent.status === "rejected" && (
              <div className="consent-banner" role="status">
                You declined these prices. The Amentorz team has been told and will contact you. Your account stays
                inactive until you accept prices.
              </div>
            )}
            <div className="consent-table-wrap">
              <table className="consent-table">
                <caption className="sr-only">Session prices per subject</caption>
                <thead>
                  <tr>
                    <th scope="col">Subject</th>
                    <th scope="col" className="num">
                      Session price
                    </th>
                    <th scope="col" className="num">
                      GST
                    </th>
                    <th scope="col" className="num">
                      Student pays
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consent.subjects.map((s) => (
                    <tr key={s.assignmentId}>
                      <td>
                        <strong>{s.subject}</strong>
                        <span className="consent-path">{s.pathLabel}</span>
                      </td>
                      <td className="num">{formatPaise(s.price.sessionPricePaise)}</td>
                      <td className="num consent-muted">
                        {formatPaise(s.price.gstPaise)} ({gstPercent(s.price.gstRateBps)})
                      </td>
                      <td className="num">{formatPaise(s.price.studentPaysPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="consent-muted">Sessions are 60 minutes. Prices are in Indian rupees.</p>

            {confirmDecline ? (
              <div className="consent-confirm" role="group" aria-label="Confirm decline">
                <p>Decline these prices? Your account stays inactive until new prices are agreed.</p>
                <div className="consent-actions">
                  <Button type="button" onClick={() => void decide("reject")} disabled={Boolean(pending)} aria-busy={pending === "reject" || undefined}>
                    {pending === "reject" ? "Declining…" : "Yes, decline"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setConfirmDecline(false)} disabled={Boolean(pending)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="consent-actions">
                <Button type="button" onClick={() => setSigning(true)} disabled={Boolean(pending)}>
                  {consent.status === "rejected" ? "Accept prices instead" : "Accept prices"}
                </Button>
                {consent.status !== "rejected" && (
                  <Button type="button" variant="outline" onClick={() => setConfirmDecline(true)} disabled={Boolean(pending)}>
                    Decline
                  </Button>
                )}
              </div>
            )}
            <SignPricesDialog
              open={signing}
              consent={consent}
              tutorName={name}
              pending={pending === "accept"}
              error={signError}
              onClose={() => {
                setSigning(false);
                setSignError(undefined);
              }}
              onSign={(signature) => void decide("accept", signature)}
            />
          </>
        )}
      </section>
    </PortalShell>
  );
}
