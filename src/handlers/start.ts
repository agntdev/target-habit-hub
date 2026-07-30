import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard } from "../toolkit/index.js";
import { editView, hub, userTimezone } from "../domain.js";

// The /start handler renders the bot's MAIN MENU — the primary way users operate
// a button-first bot. A feature adds its own button by calling
// `registerMainMenuItem(...)` in its own `src/handlers/<slug>.ts`; this handler
// renders whatever is registered (plus a Help button), so you do NOT edit this
// file to add a feature. Send ONE message — no placeholder line above the menu.
const composer = new Composer<Ctx>();

const WELCOME = "You’re all set. Pick one small step for today.";

composer.command("start", async (ctx) => {
  const data = hub(ctx);
  if (!data.profile.onboarded) {
    data.profile.timezone = userTimezone(ctx);
    await ctx.reply(`I’ve set your time zone to ${data.profile.timezone}. Is that right?`, { reply_markup: { inline_keyboard: [[{ text: "Looks right", callback_data: "onboard:timezone:yes" }, { text: "Use UTC", callback_data: "onboard:timezone:utc" }]] } });
    return;
  }
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("onboard:timezone:yes", async (ctx) => { await ctx.answerCallbackQuery(); await editView(ctx, "What time should I remind you to check in?", { inline_keyboard: [[{ text: "7:00 PM", callback_data: "onboard:time:19:00" }, { text: "9:00 PM", callback_data: "onboard:time:21:00" }], [{ text: "8:00 AM", callback_data: "onboard:time:08:00" }]] }); });
composer.callbackQuery("onboard:timezone:utc", async (ctx) => { await ctx.answerCallbackQuery(); hub(ctx).profile.timezone = "UTC"; await editView(ctx, "UTC is set. What time should I remind you to check in?", { inline_keyboard: [[{ text: "7:00 PM", callback_data: "onboard:time:19:00" }, { text: "9:00 PM", callback_data: "onboard:time:21:00" }]] }); });
composer.callbackQuery(/^onboard:time:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); const data = hub(ctx); data.profile.reminderTime = ctx.match[1]; data.profile.onboarded = true; await editView(ctx, "Your reminder is ready. Start with a NEET-friendly template, or make your own.", { inline_keyboard: [[{ text: "Daily revision target", callback_data: "template:revision" }], [{ text: "Make my own", callback_data: "menu:main" }]] }); });
composer.callbackQuery("template:revision", async (ctx) => { await ctx.answerCallbackQuery(); const data = hub(ctx); if (!data.items.some((i) => i.title === "Daily revision")) { const item = { id: "t-revision", kind: "target" as const, title: "Daily revision", description: "Revise one NEET topic", category: "Revision", repeat: "daily" as const, frequency: 1, estimateMinutes: 60, active: true }; data.items.push(item); data.itemIds.push(item.id); } await editView(ctx, "Your Daily revision target is ready. You can check it in when you’re done.", mainMenuKeyboard()); });

// "Back to menu" — re-render the main menu in place from any sub-view.
composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await editView(ctx, WELCOME, mainMenuKeyboard());
});

export default composer;
