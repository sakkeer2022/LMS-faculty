import type { ReactNode } from "react";
import Image from "next/image";
import "@/features/auth/login.css";

const ROW_ONE = [4, 1, 2, 3];
const ROW_TWO = [5, 6, 7, 8];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="login">
      <aside className="login-brand">
        <div className="login-brand-row" style={{ left: -115, top: 133, opacity: 0.14 }} aria-hidden>
          {ROW_ONE.map((n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={n} src={`/auth/photo-${n}.png`} alt="" />
          ))}
        </div>
        <div className="login-brand-row" style={{ left: -211, top: 320, opacity: 0.1 }} aria-hidden>
          {ROW_TWO.map((n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={n} src={`/auth/photo-${n}.png`} alt="" />
          ))}
        </div>
        <div className="login-brand-fade" style={{ left: -26, top: 446 }} aria-hidden />
        <div className="login-brand-fade" style={{ left: -98, top: 98 }} aria-hidden />
        <div className="login-brand-glow" style={{ left: -211, top: 700 }} aria-hidden>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/auth/glow.svg" alt="" />
          </div>
        </div>
        <div className="login-brand-glow" style={{ left: 287, top: -249 }} aria-hidden>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/auth/glow.svg" alt="" />
          </div>
        </div>
        <div className="login-brand-top">
          <Image src="/auth/logo.svg" alt="Amentorz" width={122} height={18} priority unoptimized />
        </div>
        <div className="login-pitch">
          <p className="login-pitch-eyebrow">TEACH WITH AMENTORZ</p>
          <p className="login-pitch-title">
            Teach what you know.
            <br />
            Make every session count.
          </p>
          <p className="login-pitch-copy">
            Teach students through live sessions, manage your availability, and keep track of your teaching activity from
            one place.
          </p>
        </div>
      </aside>
      <main id="main" className="login-panel">
        {children}
      </main>
    </div>
  );
}
