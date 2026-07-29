# Target & Habit Hub — Bot specification

**Archetype:** workflow

**Voice:** supportive and encouraging — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot for NEET aspirants to create, track, and sustain daily study targets and personal habits with one-tap status updates, timezone-aware reminders, streak tracking, weekly reports, and anonymous analytics for the owner.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- NEET aspirants

## Success criteria

- Users complete 70% of their daily targets/habits
- Weekly report completion rate of 80%
- Streak recovery rate of 50% within 24 hours

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu
- **/dashboard** (command, actor: user, command: /dashboard) — View today's targets, habits, and progress summary
- **Create Target** (button, actor: user, callback: create_target:start) — Start creating a new study target
- **Create Habit** (button, actor: user, callback: create_habit:start) — Start creating a new personal habit
- **Edit Profile** (button, actor: user, callback: edit_profile:start) — Update time zone, reminder settings, or preferences

## Flows

### Onboarding
_Trigger:_ /start

1. Detect time zone from Telegram locale
2. Ask user to confirm or edit time zone
3. Request preferred daily reminder time
4. Offer NEET-ready templates

_Data touched:_ User

### Create Target
_Trigger:_ create_target:start

1. Select category from seeded list or Custom
2. Enter title and description
3. Choose repeat rule (daily/weekdays/N times per week/one-time with deadline)
4. Optionally set study-duration estimate

_Data touched:_ Target

### Create Habit
_Trigger:_ create_habit:start

1. Select category from seeded list or Custom
2. Enter title and description
3. Choose repeat rule (daily/weekdays/N times per week)
4. Set times-per-period frequency

_Data touched:_ Habit

### Dashboard
_Trigger:_ /dashboard

1. Display Today's Targets
2. Display Today's Habits
3. Show Current Streak and Longest Streak
4. List Pending Tasks and Upcoming Deadlines
5. Show Weekly & Monthly progress

_Data touched:_ User, Target, Habit, Check-in, Streak record

### Check-in
_Trigger:_ check_in:start

1. Show Today's Targets and Habits with status buttons
2. Record one-tap status (Done/Skipped/Missed/In Progress)
3. Update streak record and send appropriate feedback

_Data touched:_ Check-in, Streak record

### Weekly Report
_Trigger:_ weekly_report:generate

1. Compile completed/missed tasks
2. Calculate streak changes
3. Include study hours if estimated
4. Generate personalized suggestions
5. Send to user on local Monday morning

_Data touched:_ Report, Check-in, Streak record

### Milestone Celebration
_Trigger:_ milestone:celebrate

1. Detect 7/30/50/100/365-day streaks
2. Send concise, encouraging message
3. Update milestone count for admin stats

_Data touched:_ Streak record, User

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User** _(retention: persistent)_ — Telegram account with private data and preferences
  - fields: Telegram ID, Time zone, Preferred reminder time, Report day preference, Active status
- **Target** _(retention: persistent)_ — Customizable study task with deadline and repeat rules
  - fields: Title, Category, Repeat rule, Deadline, Study duration estimate, Status
- **Habit** _(retention: persistent)_ — Customizable routine with repeat frequency
  - fields: Title, Category, Repeat rule, Times-per-period, Status
- **Check-in** _(retention: persistent)_ — One-tap status recording with timestamp
  - fields: User ID, Item ID, Status, Timestamp
- **Streak record** _(retention: persistent)_ — Tracking of current and longest streaks
  - fields: User ID, Current streak, Longest streak, Last missed date, Recovery window status
- **Report** _(retention: persistent)_ — Weekly summary of progress and suggestions
  - fields: User ID, Date, Completed tasks, Missed tasks, Streak change, Study hours, Suggestions

## Integrations

- **Telegram** (required) — Bot API messaging
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure seeded categories (Study, Health, Revision, Practice Questions, Mock Tests, Water, Sleep, Exercise, Reading, Personal Habits)
- Set milestone thresholds and messages
- Adjust streak recovery rules
- Configure admin chat for anonymous stats

## Notifications

- Daily reminders at user's preferred local time
- Weekly reports on user's local Monday morning (customizable)
- Streak milestone celebrations
- Supportive recovery messages for missed items

## Permissions & privacy

- All user data is private and never shared
- Anonymous aggregated stats only for admin (no personal identifiers)
- Users can archive/delete items while retaining history
- No social sharing or cross-user comparisons

## Edge cases

- User changes time zone after setting up reminders
- Multiple check-ins for same item on same day from different devices
- Missed check-in during Telegram outage
- User deletes item that contributed to streak

## Required tests

- End-to-end test of onboarding flow with time zone detection
- Test all four check-in statuses and their effects on streaks
- Verify weekly report generation with personalized suggestions
- Validate anonymous stats collection to admin chat

## Assumptions

- Telegram locale accurately reflects user's time zone
- Users will consistently use one-tap check-ins rather than text commands
- Owner will provide the 10 seeded categories as specified
- Users will appreciate gentle encouragement over punitive streak resets
