"use client";
import { useEffect, useState } from "react";
import { Button, Heading, Text } from "@/components/ui";
import { ApiError } from "@/lib/api/contracts";
import { decidePriceConsent, formatPaise, getMe, getPriceConsent, gstPercent, type PriceConsent } from "../model";
import { PortalShell } from "./portal-shell";

/**
 * Price consent after sign-in (LMS-39). The tutor accepts or declines the session prices
 * Amentorz set for each subject they chose at onboarding. The final design is pending
 * (backend docs/PENDING_DECISIONS.md, F5); this screen shows the data and the two actions.
 */
export function PriceConsentScreen() {
  const [name, setName] = useState<string>();
  const [consent, setConsent] = useState<PriceConsent>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"accept" | "reject">();
  const [confirmDecline, setConfirmDecline] = useState(false);

  useEffect(() => {
    getMe()
      .then((me) => setName(me.fullName))
      .catch(() => window.location.assign("/login?redirect=/consent"));
    getPriceConsent()
      .then((c) => {
        if (c.status === "accepted") window.location.assign("/home");
        else setConsent(c);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Your prices could not be loaded."));
  }, []);

  async function decide(decision: "accept" | "reject") {
    if (!consent) return;
    setPending(decision);
    setError("");
    try {
      const next = await decidePriceConsent(decision, consent.snapshotHash);
      if (next.status === "accepted") window.location.assign("/home");
      else {
        setConsent(next);
        setConfirmDecline(false);
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "PRICES_CHANGED") {
        setConsent(await getPriceConsent());
        setError("Your prices changed while this page was open. Review the new prices.");
      } else setError(err instanceof ApiError ? err.message : "Your answer could not be saved. Try again.");
    } finally {
      setPending(undefined);
    }
  }

  return (
    <PortalShell name={name}>
      <section className="consent" aria-labelledby="consent-title">
        <div className="consent-head">
          <Heading level={1} id="consent-title" className="consent-title">
            Review your session prices
          </Heading>
          <Text className="consent-subtitle">
            Amentorz set a price for each subject you teach. Students pay the session price plus GST. Accept the prices
            to start using your tutor account.
          </Text>
        </div>

        {!consent && !error && (
          <p className="consent-muted" role="status">
            Loading your prices…
          </p>
        )}
        {error && (
          <p className="ui-field-error" role="alert">
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
                <Text>Decline these prices? Your account stays inactive until new prices are agreed.</Text>
                <div className="consent-actions">
                  <Button onClick={() => void decide("reject")} disabled={Boolean(pending)} aria-busy={pending === "reject" || undefined}>
                    {pending === "reject" ? "Declining…" : "Yes, decline"}
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmDecline(false)} disabled={Boolean(pending)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="consent-actions">
                <Button onClick={() => void decide("accept")} disabled={Boolean(pending)} aria-busy={pending === "accept" || undefined}>
                  {pending === "accept" ? "Accepting…" : consent.status === "rejected" ? "Accept prices instead" : "Accept prices"}
                </Button>
                {consent.status !== "rejected" && (
                  <Button variant="outline" onClick={() => setConfirmDecline(true)} disabled={Boolean(pending)}>
                    Decline
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </PortalShell>
  );
}
