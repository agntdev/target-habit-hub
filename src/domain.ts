import type { Ctx } from "./bot.js";

export const CATEGORIES = ["Study", "Health", "Revision", "Practice Questions", "Mock Tests", "Water", "Sleep", "Exercise", "Reading", "Personal Habits"] as const;
export type Status = "done" | "skipped" | "missed" | "progress";
export type Repeat = "daily" | "weekdays" | "weekly" | "once";
export interface Item { id: string; kind: "target" | "habit"; title: string; description: string; category: string; repeat: Repeat; frequency: number; deadline?: string; estimateMinutes?: number; active: boolean; }
export interface Checkin { itemId: string; status: Status; date: string; at: string; }
export interface Profile { timezone: string; reminderTime: string; reportDay: "monday" | "sunday"; active: boolean; onboarded: boolean; }
export interface HubData { profile: Profile; items: Item[]; itemIds: string[]; checkins: Checkin[]; checkinDates: string[]; streak: { current: number; longest: number; lastMissedDate?: string; recoveryOpen: boolean; milestones: number[] }; flow?: { kind: "target" | "habit"; step: "category" | "title" | "description" | "repeat" | "frequency" | "estimate" | "deadline"; draft: Partial<Item> }; }

let clock: () => Date = () => new Date();
/** Test seam for every date-based decision in this module. */
export function now(): Date { return clock(); }
export function setClockForTests(next?: () => Date): void { clock = next ?? (() => new Date()); }
export function today(): string { return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(now()); }
export function hub(ctx: Ctx): HubData {
  return (ctx.session.hub ??= { profile: { timezone: "Asia/Kolkata", reminderTime: "19:00", reportDay: "monday", active: true, onboarded: false }, items: [], itemIds: [], checkins: [], checkinDates: [], streak: { current: 0, longest: 0, recoveryOpen: false, milestones: [] } });
}
export function userTimezone(ctx: Ctx): string {
  const language = ctx.from?.language_code?.toLowerCase() ?? "en";
  return language.startsWith("en") || language.startsWith("hi") ? "Asia/Kolkata" : "UTC";
}
export function itemDue(item: Item, date = today()): boolean {
  if (!item.active) return false;
  if (item.repeat === "once") return !item.deadline || item.deadline >= date;
  if (item.repeat === "weekdays") { const day = new Date(`${date}T12:00:00Z`).getUTCDay(); return day > 0 && day < 6; }
  return true;
}
export function dueItems(data: HubData): Item[] { return data.items.filter((item) => itemDue(item)); }
export function checkinFor(data: HubData, itemId: string, date = today()): Checkin | undefined { return data.checkins.find((c) => c.itemId === itemId && c.date === date); }
export function recordCheckin(data: HubData, itemId: string, status: Status): void {
  const date = today(); const at = now().toISOString();
  const previous = checkinFor(data, itemId, date);
  if (previous) { previous.status = status; previous.at = at; } else { data.checkins.push({ itemId, status, date, at }); if (!data.checkinDates.includes(date)) data.checkinDates.push(date); }
  const due = dueItems(data); const statuses = due.map((i) => checkinFor(data, i.id, date)?.status);
  if (statuses.some((s) => s === "missed")) { data.streak.current = 0; data.streak.lastMissedDate = date; data.streak.recoveryOpen = true; return; }
  if (due.length > 0 && statuses.every((s) => s === "done")) { data.streak.current = Math.max(1, data.streak.current + 1); data.streak.longest = Math.max(data.streak.longest, data.streak.current); data.streak.recoveryOpen = false; }
}
export function escapeText(value: string): string { return value.replace(/[<>]/g, "").trim().slice(0, 120); }
export function progress(data: HubData, days: number): { done: number; total: number; minutes: number; missed: number } {
  const dates = data.checkinDates.slice(-days); const checks = data.checkins.filter((c) => dates.includes(c.date));
  return { done: checks.filter((c) => c.status === "done").length, missed: checks.filter((c) => c.status === "missed").length, total: checks.length, minutes: checks.filter((c) => c.status === "done").reduce((n, c) => n + (data.items.find((i) => i.id === c.itemId)?.estimateMinutes ?? 0), 0) };
}
