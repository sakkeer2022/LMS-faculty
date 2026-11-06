export type FacultyIcon =
  | "dashboard"
  | "availability"
  | "bookings"
  | "sessions"
  | "logs"
  | "homework"
  | "library"
  | "progress"
  | "performance"
  | "earnings"
  | "reviews"
  | "profile";

export type FacultyNavigationGroup = {
  label: string;
  items: [title: string, href: string, icon: FacultyIcon][];
};

// Destinations and grouping from the Figma "Faculty sidebar" (TEACH / RECORD / EARN / ACCOUNT).
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
      ["Progress Reports", "/progress", "progress"],
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

export function isNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const facultyPages = facultyNavigation.flatMap((group) => group.items);
