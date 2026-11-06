# Shared with the other apps

`amentorz-admin`, `amentorz-student` and `amentorz-faculty` are separate repos on one stack. Code that is the same in all three is copied, not published as a package, so keep the copies in step.

| Area                                   | Where                                              | Origin                          |
| -------------------------------------- | -------------------------------------------------- | ------------------------------- |
| API client (CSRF, one shared refresh)  | `src/lib/api/client.ts`, `contracts.ts`            | amentorz-admin (identical)      |
| Session user type (`GET /auth/me`)     | `src/lib/auth/access.ts`                           | amentorz-admin, role changed    |
| `implement-screen` skill               | `.claude/skills/implement-screen`                  | amentorz-admin                  |
| Figma tokens (Tailwind `@theme`)       | `src/app/globals.css`                              | amentorz-admin (identical), Figma "Webapplication" 35:2 |
| Login and recovery blocks, brand photos | `src/features/auth`, `src/components/auth`, `public/auth` | amentorz-admin; faculty copy, text and endpoint differ |
| shadcn primitives, `cn`, `DataTable`, page helpers | `src/components/shadcn`, `src/lib/utils.ts`, `src/components/data-table`, `src/components/layout` | amentorz-admin (copied) |
| Session gate (`middleware.ts`, `lib/auth/server.ts`), providers | `src/middleware.ts`, `src/lib/auth/server.ts`, `src/app/providers.tsx` | amentorz-admin; faculty role and price-consent check |
| Onboarding form fields (`TextField`, `SelectField`, `CheckboxField`, `FileDropField`) | `src/features/onboarding/components/fields.tsx` | faculty only |

Differences on purpose: the faculty app adds the invitation onboarding wizard and the price-consent screen (`src/features/onboarding`, `src/features/portal`), which keep their own stylesheets on the shared theme roles. Copied from amentorz-student; the admin is the origin of the API client and the login screen.

Check `amentorz-backend/src/docs/SHARED_COMPONENTS.md` before writing a helper that the backend or another app may already have.
