"use client";

import { useQuery } from "@tanstack/react-query";

/*
 * Demo data for the faculty dashboard (Figma "Screen/17 · Dashboard — logs blocked").
 * The backend has no faculty dashboard, sessions, daily-log, performance, earnings or review endpoints
 * yet, so — like amentorz-admin src/features/dashboard/adapter.ts — this adapter simulates them. Swap
 * `dashboardRead` for real API calls once those endpoints are in amentorz-backend docs/openapi.yaml;
 * the screen only depends on the types below.
 */

export type Panel = "counts" | "overview" | "sessions" | "reviews";
export type DemoState = "ready" | "loading" | "empty" | "error";

export type SessionStatus = "Completed" | "In progress" | "Confirmed" | "Cancelled";

const counts: Record<string, number> = { "/bookings": 4, "/daily-logs": 2 };

const overview = {
  today: "Wednesday, 2 September 2026",
  cycle: { month: "September", daysRemaining: 28 },
  overdueLogs: { count: 2, blockedDate: "3 Sep", logDate: "2 Sep" },
  billable: { done: 18, threshold: 30, minimumMinutes: 20 },
  performance: { score: 45, max: 50, threshold: 40, latePenalty: 5 },
  incentivePaise: 0,
  rating: { average: 8.6, max: 10, unreadThisMonth: 3 },
};

const sessions: {
  id: string;
  student: string;
  subject: string;
  scheduled: string;
  status: SessionStatus;
}[] = [
  { id: "s-1", student: "Rhea Menon", subject: "Physics · Class 10 CBSE · Ch 4 Electricity", scheduled: "2 Sep · 4:00 PM", status: "Completed" },
  { id: "s-2", student: "Kabir Nair", subject: "Physics · Class 12 CBSE · Ch 2 Electrostatics", scheduled: "2 Sep · 5:00 PM", status: "Completed" },
  { id: "s-3", student: "Ishita Rao", subject: "Physics · Class 11 ICSE · Ch 7 Gravitation", scheduled: "2 Sep · 7:00 PM", status: "Confirmed" },
];

const reviews = {
  total: 41,
  items: [
    {
      id: "r-1",
      student: "Rhea Menon",
      context: "Physics · Class 10 CBSE · 28 Aug 2026",
      rating: 9,
      text: "Explains circuits with real examples instead of just formulas. I finally understood why current splits in a parallel branch.",
    },
    {
      id: "r-2",
      student: "Kabir Nair",
      context: "Physics · Class 12 CBSE · 26 Aug 2026",
      rating: 9,
      text: "Very patient with repeated doubts. Would like a few more numericals as homework after each session.",
    },
  ],
};

export type DashboardData = {
  counts: typeof counts;
  overview: typeof overview;
  sessions: typeof sessions;
  reviews: typeof reviews;
};

const empty: DashboardData = {
  counts: {},
  overview: {
    ...overview,
    overdueLogs: { ...overview.overdueLogs, count: 0 },
    billable: { ...overview.billable, done: 0 },
    performance: { ...overview.performance, score: 0 },
    rating: { ...overview.rating, average: 0, unreadThisMonth: 0 },
  },
  sessions: [],
  reviews: { total: 0, items: [] },
};

// Simulated faculty dashboard API
export async function dashboardRead<P extends Panel>(
  panel: P,
  { state = "ready", signal }: { state?: DemoState; signal?: AbortSignal } = {},
): Promise<DashboardData[P]> {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, state === "loading" ? 12000 : 250);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
  if (state === "error") throw new Error(`${panel} development response unavailable`);
  const source: DashboardData = state === "empty" ? empty : { counts, overview, sessions, reviews };
  return structuredClone(source[panel]);
}

export function useDashboard<P extends Panel>(panel: P, state: DemoState = "ready") {
  return useQuery({
    queryKey: ["faculty-dashboard", panel, state],
    queryFn: ({ signal }) => dashboardRead(panel, { state, signal }),
  });
}
