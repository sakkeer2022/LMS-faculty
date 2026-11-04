"use client";
import Image from "next/image";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { signOut } from "../model";

/** Minimal signed-in frame until the faculty dashboard is designed. */
export function PortalShell({ name, children }: { name?: string; children: ReactNode }) {
  return (
    <div className="portal">
      <header className="portal-header">
        <Image src="/auth/logo.svg" alt="Amentorz" width={110} height={16} unoptimized className="portal-logo" />
        <div className="portal-user">
          {name && <span>{name}</span>}
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </header>
      <main id="main" className="portal-main">
        {children}
      </main>
    </div>
  );
}
