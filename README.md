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
| `npm test`          | Vitest                                                        |
| `npm run build`     | Production build                                              |

`/api/v1/*` is proxied to `BACKEND_ORIGIN`, so the auth cookies stay same-origin.

## Login (`/login`)

Built from Figma "Amentorz-webapp" "Screen/02 · Login", node 3:4730, in `src/features/auth` (form, zod schema), `src/components/auth` (controls, brand panel) and `src/app/(auth)`. It signs in with `POST /auth/faculty/login` (with `rememberMe` from "Keep me signed in"), then returns to the `redirect` path or `/`. The student landing page links here as "Faculty login" (set `NEXT_PUBLIC_FACULTY_URL` there). "Forgot password?" goes to `/recovery`. `/` redirects to `/login` until the faculty dashboard is designed.

## Forgot password (`/recovery`)

Forgot password (`/recovery`, Figma 427:4388, 427:4492, 427:29259) is one page with four steps: email, code, new password, done. It uses `POST /auth/recovery/requests`, `/verify` and `/reset`; the reset credential lives only in component state, never in a URL or storage. The code step has no frame yet (see the backend `docs/PENDING_DECISIONS.md`, P8).

## Layout

`src/app` routes · `src/features/<feature>` screens · `src/components/shadcn` shadcn/ui primitives (Tailwind v4) · `src/components/layout` the faculty shell (sidebar with icon rail, mobile drawer, top bar) and page helpers · `src/components/data-table` TanStack Table `DataTable` · `src/components/auth` login and recovery blocks · `src/lib/api` the API client (CSRF, refresh) · `src/lib/auth` session types · `src/app/globals.css` the Figma foundations (node 35:2) as Tailwind tokens · `public/auth` Figma assets (downloaded; the Figma URLs expire).

Read `AGENTS.md` for the rules and `SHARED.md` for what is shared with the other apps.
