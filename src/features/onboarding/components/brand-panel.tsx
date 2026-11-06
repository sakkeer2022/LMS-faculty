import Image from "next/image";
import { BRAND } from "../model/content";

const ROW_ONE = [4, 1, 2, 3];
const ROW_TWO = [5, 6, 7, 8];

/** Left panel of screens 43b, 43d and 43e (the login panel's photo collage with the onboarding copy). */
export function BrandPanel() {
  return (
    <aside className="login-brand onboarding-brand">
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
      <div className="login-pitch onboarding-pitch">
        <p className="login-pitch-eyebrow">{BRAND.eyebrow}</p>
        <p className="login-pitch-title onboarding-pitch-title">
          {BRAND.title.map((line, i) => (
            <span key={line}>
              {line}
              {i < BRAND.title.length - 1 && <br />}
            </span>
          ))}
        </p>
        <p className="login-pitch-copy onboarding-pitch-copy">{BRAND.copy}</p>
      </div>
      <div className="onboarding-brand-bottom">
        <dl className="onboarding-stats">
          {BRAND.stats.map((s) => (
            <div key={s.label}>
              <dt>{s.value}</dt>
              <dd>{s.label}</dd>
            </div>
          ))}
        </dl>
        <figure className="onboarding-quote">
          <blockquote>{BRAND.quote.text}</blockquote>
          <figcaption>
            <span className="onboarding-quote-avatar" aria-hidden>
              {BRAND.quote.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
            <span>
              <strong>{BRAND.quote.name}</strong>
              <span>{BRAND.quote.detail}</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </aside>
  );
}
