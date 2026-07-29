import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { checkinFor, dueItems, hub, progress, today } from "../domain.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
registerMainMenuItem({ label: "Today’s dashboard", data: "dashboard:show", order: 30 });
const composer = new Composer<Ctx>();
function summary(ctx: Ctx): string { const data = hub(ctx); const due = dueItems(data); const targets = due.filter((i) => i.kind === "target"); const habits = due.filter((i) => i.kind === "habit"); const pending = due.filter((i) => !checkinFor(data, i.id)); const week = progress(data, 7); const month = progress(data, 30); const deadlines = data.items.filter((i) => i.deadline && i.deadline >= today() && i.active).map((i) => `${i.title} (${i.deadline})`); return `Today’s targets: ${targets.length ? targets.map((i) => `${i.title}${checkinFor(data, i.id) ? " ✓" : ""}`).join(", ") : "None yet"}.\nToday’s habits: ${habits.length ? habits.map((i) => `${i.title}${checkinFor(data, i.id) ? " ✓" : ""}`).join(", ") : "None yet"}.\nStreak: ${data.streak.current} days · Best: ${data.streak.longest} days.\nPending: ${pending.length ? pending.map((i) => i.title).join(", ") : "You’re caught up"}.\nUpcoming: ${deadlines.length ? deadlines.join(", ") : "No deadlines"}.\nThis week: ${week.done}/${week.total || 0} done. This month: ${month.done}/${month.total || 0} done.`; }
const keys = inlineKeyboard([[inlineButton("Check in", "check_in:start"), inlineButton("Weekly report", "weekly_report:generate")], [inlineButton("Manage items", "items:manage")], [inlineButton("Back to menu", "menu:main")]]);
composer.command("dashboard", async (ctx) => { await ctx.reply(summary(ctx), { reply_markup: keys }); });
composer.callbackQuery("dashboard:show", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText(summary(ctx), { reply_markup: keys }); });
export default composer;
