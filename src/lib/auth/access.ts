import { z } from 'zod';

// The user returned by GET /auth/me (the backend contract `User`).
export const sessionUserSchema = z.object({
  id: z.string().min(1),
  email: z.string(),
  fullName: z.string(),
  mobileNumber: z.string().nullable(),
  timezone: z.string().nullish(),
  lastLoginAt: z.string().nullish(),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  roles: z.array(z.object({
    id: z.string(),
    name: z.string(),
    permissions: z.array(z.object({ name: z.string() })),
  })),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const FACULTY_ROLE = 'faculty';

export function isFaculty(user: SessionUser) {
  return user.isActive && user.roles.some(role => role.name === FACULTY_ROLE);
}

/** Where a signed-in faculty member lands when no destination was asked for (the dashboard screen is not designed yet). */
export const FACULTY_HOME = '/';

export function safeRedirect(value: string | null, fallback = FACULTY_HOME) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return fallback;
  return value;
}
