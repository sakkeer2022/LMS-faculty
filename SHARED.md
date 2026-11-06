# Shared with the other apps

`amentorz-admin`, `amentorz-student` and `amentorz-faculty` are separate repos on one stack. Code that is the same in all three is copied, not published as a package, so keep the copies in step.

| Area                                                             | Where                                                                      | Origin                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| API client (CSRF, one shared refresh, `ApiError.code`)           | `src/lib/api/client.ts`, `contracts.ts`                                    | amentorz-admin (identical)                             |
| Session user type (`GET /auth/me`)                               | `src/lib/auth/access.ts`                                                   | amentorz-admin, role changed                           |
| UI lint                                                          | `scripts/check-ui.cjs`                                                     | amentorz-admin (identical)                             |
| `implement-screen` skill                                         | `.claude/skills/implement-screen`                                          | amentorz-admin                                         |
| Figma tokens                                                     | `src/styles/tokens.css`                                                    | Figma "Webapplication" 35:2                            |
| Login screen (form, `login.css`, `login-controls`, brand photos) | `src/features/auth`, `src/components/ui/login-controls.tsx`, `public/auth` | amentorz-admin; faculty copy, text and endpoint differ |
| `Link`, `cx`, `Form`                                             | `src/components/ui`                                                        | amentorz-admin                                         |
| `TextField`, `SelectField`, `CheckboxField`, `FileDropField`     | `src/components/ui/fields.tsx`                                             | faculty only (onboarding)                              |
| shadcn/ui primitives, theme roles in `globals.css`, `cn`         | `src/components/shadcn`, `src/app/globals.css`, `src/lib/utils.ts`         | amentorz-admin (identical; `progress.tsx` faculty only) |
| Portal frame (shell, sidebar, topbar, page header, empty state)  | `src/components/layout`                                                    | amentorz-admin; navigation and account line differ     |
| Session gate (`middleware.ts`, `lib/auth/server.ts`), providers  | `src/middleware.ts`, `src/lib/auth/server.ts`, `src/app/providers.tsx`      | amentorz-admin; faculty role and price-consent check   |

Differences on purpose: the login, onboarding and consent screens use the Figma tokens in `tokens.css` and `components/ui`; the signed-in portal uses the admin's shadcn theme (same values). Copied from amentorz-student; the admin is the origin of the API client and the login screen.

Check `amentorz-backend/src/docs/SHARED_COMPONENTS.md` before writing a helper that the backend or another app may already have.
