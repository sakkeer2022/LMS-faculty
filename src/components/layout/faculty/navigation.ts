// Faculty portal navigation, Figma "Screen/17 · Dashboard" sidebar. Mirrors amentorz-admin
// src/components/layout/admin/navigation.ts; the portal has no base path, so hrefs are absolute.
export type FacultyIcon =
  | "dashboard"
  | "availability"
  | "bookings"
  | "sessions"
  | "logs"
  | "homework"
  | "library"
  | "reports"
  | "performance"
  | "earnings"
  | "reviews"
  | "profile";
export type FacultyNavigationGroup = {
  label: string;
  items: [title: string, href: string, icon: FacultyIcon][];
};
export const facultyNavigation: FacultyNavigationGroup[] = [
  {
    label: "Teach",
    items: [
      ["Dashboard", "/dashboard", "dashboard"],
      ["Availability", "/availability", "availability"],
      ["Bookings", "/bookings", "bookings"],
      ["Sessions", "/sessions", "sessions"],
    ],
  },
  {
    label: "Record",
    items: [
      ["Daily Logs", "/daily-logs", "logs"],
      ["Homework", "/homework", "homework"],
      ["Library", "/library", "library"],
      ["Progress Reports", "/progress-reports", "reports"],
    ],
  },
  {
    label: "Earn",
    items: [
      ["Performance", "/performance", "performance"],
      ["Earnings", "/earnings", "earnings"],
      ["Reviews", "/reviews", "reviews"],
    ],
  },
  { label: "Account", items: [["Profile", "/profile", "profile"]] },
];

export const facultyPages = facultyNavigation.flatMap((group) => group.items);

export function isNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
export function facultyPageTitle(pathname: string) {
  return (
    facultyPages.find(([, href]) => isNavigationActive(pathname, href))?.[0] ??
    "Page not found"
  );
}
