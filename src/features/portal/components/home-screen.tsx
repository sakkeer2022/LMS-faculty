"use client";
import { useEffect, useState } from "react";
import { Heading, Text } from "@/components/ui";
import { ApiError } from "@/lib/api/contracts";
import { CONSENT_PATH, isFaculty } from "@/lib/auth/access";
import { getMe, getPriceConsent } from "../model";
import { PortalShell } from "./portal-shell";

/** Signed-in landing page; a placeholder until the faculty dashboard is designed. */
export function HomeScreen() {
  const [name, setName] = useState<string>();
  useEffect(() => {
    getMe()
      .then(async (me) => {
        if (!isFaculty(me)) return window.location.assign("/login");
        setName(me.fullName);
        try {
          const consent = await getPriceConsent();
          if (consent.status !== "accepted") window.location.assign(CONSENT_PATH);
        } catch (err) {
          // A faculty account without a profile (development) has no prices to accept
          if (!(err instanceof ApiError && err.status === 404)) throw err;
        }
      })
      .catch(() => window.location.assign("/login?redirect=/home"));
  }, []);
  return (
    <PortalShell name={name}>
      <section className="consent">
        <Heading level={1} className="consent-title">
          {name ? `Welcome, ${name.split(" ")[0]}` : "Welcome"}
        </Heading>
        <Text className="consent-subtitle">
          Your tutor account is active and your prices are accepted. Your dashboard, availability and sessions arrive
          here next.
        </Text>
      </section>
    </PortalShell>
  );
}
