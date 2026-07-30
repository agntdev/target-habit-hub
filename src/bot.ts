import { createBot, type BotContext, type CreateBotOptions } from "./toolkit/index.js";
import type { StorageAdapter } from "grammy";
import type { Composer } from "grammy";
import start from "./handlers/start.js";
import createHabitStart from "./handlers/create-habit-start.js";
import createTargetStart from "./handlers/create-target-start.js";
import dashboard from "./handlers/dashboard.js";
import editProfileStart from "./handlers/edit-profile-start.js";
import help from "./handlers/help.js";
import tracking from "./handlers/tracking.js";

// The per-chat session shape (ephemeral conversation state only). Extend as the
// bot grows. Durable domain data must NOT live here — use the toolkit's
// persistent storage (see AGENTS.md).
export interface Session {
  hub?: import("./domain.js").HubData;
}

export type Ctx = BotContext<Session>;

/**
 * BuildBotOptions lets a runtime-specific ENTRY POINT (never a feature handler)
 * override how the bot is assembled:
 *
 *  - `storage`: an explicit grammY session StorageAdapter (Workers passes a
 *    Durable-Object-backed one; Node auto-selects Redis/in-memory).
 */
export interface BuildBotOptions {
  /** Static handler list for the Worker entry; never loaded asynchronously. */
  handlers?: Composer<Ctx>[];
  storage?: StorageAdapter<Session>;
  telemetryEnv?: CreateBotOptions<Session>["telemetryEnv"];
  telemetryReporterOptions?: CreateBotOptions<Session>["telemetryReporterOptions"];
}

/**
 * buildBot — assembles synchronously registered feature handlers, then registers
 * the global fallback. Does NOT start the bot.
 *
 * Runtime-agnostic: both the Node entry and Workers use this static manifest.
 */
export function buildBot(token: string, opts: BuildBotOptions = {}) {
  const bot = createBot<Session>(token, {
    initial: () => ({}),
    storage: opts.storage,
    telemetryEnv: opts.telemetryEnv,
    telemetryReporterOptions: opts.telemetryReporterOptions,
  });

  // Keep this registration synchronous. The replay harness sends an update as
  // soon as makeBot() returns, so a filesystem scan or deferred import here
  // silently leaves handlers unattached.
  for (const handler of opts.handlers ?? [
    start,
    createHabitStart,
    createTargetStart,
    dashboard,
    editProfileStart,
    help,
    tracking,
  ]) bot.use(handler);

  bot.on("message", (ctx) => ctx.reply("Sorry, I didn't understand that. Try /help."));

  return bot;
}
