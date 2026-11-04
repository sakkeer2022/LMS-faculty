# amentorz-faculty

The faculty web app (Next.js 15, React 19, Tailwind 4, TanStack Query, zod). Port **3003**. The admin (3001) and student (3002) apps are separate repos; the backend is `amentorz-backend`.

## Run

```
cp .env.example .env     # then set the values; never commit .env
npm install
npm run dev              # http://localhost:3003
```

| Script              | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `npm run typecheck` | TypeScript, strict                                            |
| `npm run lint`      | UI lint: native controls and headings only in `components/ui` |
| `npm test`          | Vitest                                                        |
| `npm run build`     | Production build                                              |

`/api/v1/*` is proxied to `BACKEND_ORIGIN`, so the auth cookies stay same-origin.

## Login (`/login`)

Built from Figma "Amentorz-webapp" "Screen/02 · Login", node 3:4730, in `src/features/auth` (form, zod schema, `login.css`) and `src/app/(auth)`. It signs in with `POST /auth/faculty/login` (with `rememberMe` from "Keep me signed in"), then goes to `/consent` when the backend reports `requiresTermsAcceptance` (price consent pending), otherwise to the `redirect` path or `/home`. The backend refuses sign-in until the tutor is approved and every subject card has a price (`FACULTY_PENDING_REVIEW`, `FACULTY_PENDING_PRICING`, `FACULTY_REJECTED`, `FACULTY_SUSPENDED` in `ApiError.code`). The student landing page links here as "Faculty login" (set `NEXT_PUBLIC_FACULTY_URL` there). "Forgot password?" goes to `/recovery`. `/` redirects to `/login` until the faculty dashboard is designed.

## Forgot password (`/recovery`)

Forgot password (`/recovery`, Figma 427:4388, 427:4492, 427:29259) is one page with four steps: email, code, new password, done. It uses `POST /auth/recovery/requests`, `/verify` and `/reset`; the reset credential lives only in component state, never in a URL or storage. The code step has no frame yet (see the backend `docs/PENDING_DECISIONS.md`, P8).

## Onboarding (`/onboarding?token=…`)

The admin's invitation email links here. `src/features/onboarding` is a four-step wizard (designs 43b credentials, 43c subjects, 43d documents, 43e submitted):

- `POST /faculty/onboarding/session` checks the token (a generic `INVITATION_INVALID` for any unusable link) and returns the invited email.
- `GET /faculty/onboarding/catalogue` returns the offering tree; the subjects step is a column picker (stream → … → leaf) with subject cards (`model/picker.ts`, max 30).
- `POST /faculty/onboarding/applications` is one multipart request: the text fields plus `photoId`, `degreeCertificate`, `panCard` (PDF, JPG, PNG, DOC, DOCX, PPT, PPTX). Server field errors are routed back to the step that owns the field.

The brand-panel numbers and testimonial in `model/content.ts` are placeholders (backend PENDING_DECISIONS F8).

## Price consent (`/consent`) and home (`/home`)

`src/features/portal`: after the admin prices every subject card, the tutor signs in and sees `GET /faculty/me/price-consent` (per-card session price and what the student pays). Accept or decline posts `POST /faculty/me/price-consent` with the snapshot hash; a `PRICES_CHANGED` 409 reloads the prices. Declining records the decision and notifies the admin; the tutor stays on `/consent` until re-priced. The design is not final (F5). `/home` redirects to `/consent` until the prices are accepted.

## Layout

`src/app` routes · `src/features/<feature>` screens · `src/components/ui` the only place for native `button`, `input`, `form` and headings · `src/lib/api` the API client (CSRF, refresh) · `src/lib/auth` session types · `src/styles/tokens.css` the Figma foundations (node 35:2) · `public/auth` Figma assets (downloaded; the Figma URLs expire).

Read `AGENTS.md` for the rules and `SHARED.md` for what is shared with the other apps.
