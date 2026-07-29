import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { hub } from "../domain.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
registerMainMenuItem({ label: "Edit profile", data: "edit_profile:start", order: 50 });
const composer = new Composer<Ctx>();
function profileText(ctx: Ctx): string { const p = hub(ctx).profile; return `Your time zone is ${p.timezone}. Your daily reminder is ${p.reminderTime}. Weekly reports arrive on ${p.reportDay}.`; }
const keyboard = inlineKeyboard([[inlineButton("Time zone", "profile:timezone"), inlineButton("Reminder time", "profile:time")], [inlineButton("Report day", "profile:report")], [inlineButton("Back to menu", "menu:main")]]);
composer.callbackQuery("edit_profile:start", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.reply(profileText(ctx), { reply_markup: keyboard }); });
composer.callbackQuery("profile:timezone", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("Choose the time zone that matches your day.", { reply_markup: inlineKeyboard([[inlineButton("India", "profile:tz:Asia/Kolkata"), inlineButton("UTC", "profile:tz:UTC")], [inlineButton("Back", "edit_profile:start")]]) }); });
composer.callbackQuery(/^profile:tz:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); hub(ctx).profile.timezone = ctx.match[1]; await ctx.editMessageText("Your time zone is updated. Future reminders will follow it.", { reply_markup: keyboard }); });
composer.callbackQuery("profile:time", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("Pick your daily check-in reminder time.", { reply_markup: inlineKeyboard([[inlineButton("7:00 PM", "profile:time:19:00"), inlineButton("9:00 PM", "profile:time:21:00")], [inlineButton("8:00 AM", "profile:time:08:00")]]) }); });
composer.callbackQuery(/^profile:time:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); hub(ctx).profile.reminderTime = ctx.match[1]; await ctx.editMessageText("Your reminder time is updated.", { reply_markup: keyboard }); });
composer.callbackQuery("profile:report", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("Choose when your weekly report arrives.", { reply_markup: inlineKeyboard([[inlineButton("Monday morning", "profile:report:monday")], [inlineButton("Sunday morning", "profile:report:sunday")]]) }); });
composer.callbackQuery(/^profile:report:(monday|sunday)$/, async (ctx) => { await ctx.answerCallbackQuery(); hub(ctx).profile.reportDay = ctx.match[1] as "monday" | "sunday"; await ctx.editMessageText("Your weekly report day is updated.", { reply_markup: keyboard }); });
export default composer;
