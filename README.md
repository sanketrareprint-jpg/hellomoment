# hellomoment.in

Automated birthday, anniversary, and festival WhatsApp wishes for your customers.
Businesses register, add (or bulk-import) their contacts with DOB/anniversary/WhatsApp
number/photo, design a flyer template once, and hellomoment.in automatically composites
a personalized flyer and sends it on WhatsApp — via [AiSensy](https://aisensy.com) —
to the contact and to the business owner, the moment it's their day. Custom festivals
(Diwali, Eid, New Year, anything) broadcast to the whole contact list on their own schedule.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma** ORM — SQLite by default, drop-in swap to PostgreSQL for scale
- **Tailwind CSS** for the UI
- **sharp** for server-side flyer image compositing (no native `node-canvas`/cairo build needed)
- **AiSensy Campaign API** for WhatsApp sending
- Custom email/password auth (bcrypt + JWT cookie) — no third-party auth dependency

## ⚠️ Important: install this outside of where it was built

This codebase was written in a sandboxed environment with **no access to npm's
registry** (or PyPI, GitHub raw content, apt, etc — all package registries were
network-blocked), so `npm install` could not be run or verified here. The pure
business logic that doesn't depend on Next.js/Prisma — date matching (including the
Feb 29 leap-year edge case), phone number normalization, and the actual flyer image
compositing pipeline — **was independently tested and confirmed working** using
globally available `tsx`/`sharp` (see `scripts/test-core-logic.ts`). The Next.js
pages, API routes, and Prisma schema were written carefully by hand but have not been
run through `next build`. Please run `npm install && npm run build` yourself as the
first step (locally, or directly on your hosting provider) — that is expected to
surface at most minor issues, not architectural ones.

## 1. Setup

```bash
npm install
cp .env.example .env
# edit .env — see "Configuration" below
npm run db:push       # creates the SQLite database from prisma/schema.prisma
npm run dev            # http://localhost:3000
```

Register a business account at `/register`, then in the app:

1. **Settings** — paste your AiSensy API key and the campaign names you'll use for
   birthdays/anniversaries/festivals (see "AiSensy setup" below). Also fill in your
   **Brand kit for flyers** here (logo, phone, address, products line, and firm name
   in English or Marathi) — enter it once and reuse it on any number of templates.
2. **Flyer templates** — upload a background image per occasion and position the
   name/date/photo placeholders by dragging on the live preview. Optionally turn on
   any of your Brand kit elements (logo, firm name, phone, address, products) and
   drag those into place too — useful for festival flyers where every festival can
   use its own background/design but still carry your business branding. Mark one
   template per occasion as "default" — that's the one the daily job uses (a festival
   can also link to its own specific template instead, from the festival's edit page).
3. **Contacts** — add people one at a time, or use **Bulk import** for a CSV/XLSX.
4. **Festivals** — add any custom occasions (Diwali, Eid, your shop's anniversary, etc).
5. Use **Send test wish now** on a contact's edit page to confirm everything actually
   sends before relying on the automatic daily trigger.

## 2. AiSensy setup

hellomoment.in doesn't create WhatsApp templates on your behalf — it triggers
campaigns you've already created and approved in AiSensy.

1. In AiSensy, create a WhatsApp template message with:
   - A **header** of type **Image** (this is where the generated flyer goes).
   - A **body** with exactly **3 variables**, used in this order:
     `{{1}}` = contact's name, `{{2}}` = the date (e.g. "25 August"),
     `{{3}}` = the wish caption/message.
   - Get it approved by WhatsApp, then create a **Campaign** in AiSensy using that
     template and set its status to **Live**. Note the exact campaign name.
2. **Default setup used by this app:** every new business account is pre-filled in
   Settings with a single shared campaign name, **`hellomomentwishes`**, used for
   birthdays, anniversaries, and festivals alike — so you only need to create one
   AiSensy campaign called exactly `hellomomentwishes` (Live status) to get started.
   If you'd rather run separate campaigns per occasion (e.g. a differently-designed
   header image for festivals), just change the relevant field(s) in Settings —
   nothing else in the app needs to change.
3. In hellomoment.in → Settings, paste your AiSensy **API key** (Manage → API Key in
   your AiSensy dashboard). The campaign name field(s) are already pre-filled with
   `hellomomentwishes`; edit them if you used a different name.
4. A specific flyer template can override the campaign name too (useful if a
   festival needs its own template with a differently-approved header).

Reference: [AiSensy API Reference Docs](https://wiki.aisensy.com/en/articles/11501889-api-reference-docs),
[AiSensy media-based template messages](https://wiki.aisensy.com/en/articles/11501590-how-to-create-send-media-based-whatsapp-template-messages-in-aisensy).

## 3. Configuration (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `file:./storage/data/dev.db` for SQLite (default), or a `postgresql://...` URL for production scale |
| `STORAGE_DIR` | Where uploaded photos/templates and generated flyers live on disk. Defaults to `./storage`. **Must point at a persistent volume in production** (see Railway deployment below) |
| `JWT_SECRET` | Random 32+ char string signing login sessions (`openssl rand -base64 32`) |
| `APP_BASE_URL` | Your public HTTPS URL, e.g. `https://hellomoment.in` — **AiSensy fetches the generated flyer image from `${APP_BASE_URL}/api/files/generated/<file>.jpg`, so this must be a real public URL in production, not localhost** |
| `CRON_SECRET` | Random secret protecting `/api/cron/daily` — your scheduler sends it as `Authorization: Bearer <CRON_SECRET>` |
| `AISENSY_API_KEY` | Optional fallback only; each business's own key (entered in Settings) is what's actually used |

### Why uploads/flyers aren't in `public/`

Uploaded photos, template backgrounds, and every generated flyer are stored under
`STORAGE_DIR` and served through `GET /api/files/[...path]` — a small route handler
that streams the file back — rather than Next's automatic `public/` folder serving.
This is deliberate: on a host like Railway you get **one persistent volume per
service**, and that volume also needs to hold the SQLite database file. If the
volume were mounted inside `public/`, the database would be downloadable by anyone
who guessed (or brute-forced) its filename — a serious problem. Keeping everything
under one private `STORAGE_DIR`, with only `photos/`, `templates/`, and
`generated/` exposed (and only those) through the `/api/files` route, avoids that
while still giving AiSensy a public URL it can fetch the flyer image from.

## 4. Deploying to Railway

This section assumes you already have a [Railway](https://railway.com) account and
have pushed this codebase to a GitHub repository (Railway deploys from git).

**If hellomoment.in isn't registered yet:** register it at any registrar first —
[Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) sells at
cost (no markup) and gives you DNS management in the same place, which makes step 5
below easier; Namecheap or GoDaddy work equally well if you already use one of them.

1. **Push to GitHub.** Create a new repo (e.g. `hellomoment`), then from this
   project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/hellomoment.git
   git push -u origin main
   ```

2. **Create the Railway project.** New Project → Deploy from GitHub repo → pick
   `hellomoment`. Railway auto-detects Node.js and runs `npm run build` / `npm start`
   (from `package.json`) — no Dockerfile needed.

3. **Attach a persistent volume.** In the service's Settings → Volumes, add a
   volume and mount it at `/app/storage`. This is the single volume that will hold
   both the database and all uploaded/generated images (in separate subfolders).

4. **Set environment variables** on the service (Settings → Variables):
   ```
   DATABASE_URL=file:/app/storage/data/dev.db
   STORAGE_DIR=/app/storage
   JWT_SECRET=<openssl rand -base64 32>
   CRON_SECRET=<openssl rand -base64 32>
   APP_BASE_URL=https://hellomoment.in
   ```
   (Prefer managed Postgres instead of SQLite at real scale? Add Railway's
   Postgres plugin, set `DATABASE_URL` to the connection string it gives you, change
   `provider = "sqlite"` to `"postgresql"` in `prisma/schema.prisma`, and you no
   longer need the `data/` subfolder on the volume — just `STORAGE_DIR` for images.)

5. **Point the domain at Railway.** In the service → Settings → Networking → Custom
   Domain, add `hellomoment.in` (and `www.hellomoment.in` if you want both). Railway
   gives you a CNAME target; add that as a CNAME record for `hellomoment.in` at your
   DNS provider. Railway issues a free SSL certificate automatically once DNS
   resolves (can take up to a few hours).

6. **Database sync happens automatically.** The `start` script runs
   `prisma db push` against the live `DATABASE_URL` every time the service
   boots, before `next start` runs — so the tables are created inside the
   volume-backed SQLite file (or your Postgres database, if you switched)
   automatically on first deploy and after every schema change, no manual
   step needed. (Do **not** use `railway run npm run db:push` for this —
   that command runs locally on your machine with Railway's env vars
   borrowed, not inside the actual deployed container, so it would create a
   database file on your own computer instead of the real server.)

7. **Add the daily trigger as a second service.** Cron jobs on Railway run a
   service's start command on a schedule, so create one more service from the same
   GitHub repo (New Service → same repo):
   - Settings → Deploy → **Custom Start Command**: `npm run cron:daily`
   - Settings → **Cron Schedule**: e.g. `30 2 * * *` (02:30 UTC ≈ 8:00am IST —
     adjust for your business's actual timezone and desired send time)
   - Variables: `APP_BASE_URL=https://hellomoment.in` and the **same** `CRON_SECRET`
     as the main service
   - This service needs no volume — it just makes one HTTP request to the main
     service and exits.

8. Visit `https://hellomoment.in/register`, create your business account, and
   follow the in-app setup checklist (AiSensy key, a flyer template, some contacts).
   Use **Send test wish now** on a contact to confirm the whole pipeline — flyer
   generation, file storage, and the AiSensy send — actually works before relying
   on the daily job.

Reference: [Railway Volumes](https://docs.railway.com/reference/volumes), [Railway Cron Jobs](https://docs.railway.com/cron-jobs).

## 5. Project structure

```
prisma/schema.prisma        Data model (Business, Contact, FlyerTemplate, Festival, SendLog)
src/lib/
  auth.ts, session.ts       Password hashing, JWT session cookie, auth guards
  dateUtils.ts              Timezone-aware "is it their day" logic (tested, see below)
  flyer.ts                  sharp-based flyer image compositor (tested, see below)
  aisensy.ts                AiSensy Campaign API client
  sendWish.ts               Ties template + contact/festival + AiSensy together, writes SendLog
  uploads.ts                Photo/template image upload handling
src/app/
  (auth)/register, /login   Business signup/login
  dashboard/                Contacts, Flyer templates, Festivals, Send logs, Settings
  api/                      REST endpoints backing the above, + /api/cron/daily
scripts/
  test-core-logic.ts        Standalone test of dateUtils/flyer/aisensy logic (see below)
  run-daily.ts              CLI wrapper to trigger the daily job (`npm run cron:daily`)
```

## 6. Verifying the core logic yourself

The trickiest parts of this app — recurring date matching (with the Feb 29
edge case), WhatsApp number normalization, text wrapping, and actual image
compositing — have a standalone test script that doesn't need Next.js or Prisma:

```bash
npx tsx scripts/test-core-logic.ts
```

It creates synthetic images in memory, runs the real `generateFlyer()` function
against them, and asserts on the output. This already passed in the environment
this app was built in.

## 7. What's intentionally out of scope for v1

- Multi-staff logins per business (currently one login per business account)
- Payment/billing (no subscription plans wired up)
- WhatsApp template creation via API (you create/approve templates in AiSensy directly)
- Object storage (S3/R2) — not needed for a Railway deployment (see section 4); would
  only matter if you later move to a platform with no persistent volumes at all

## Support / extending

Every piece is a normal Next.js route or Prisma model — no framework magic. The
`vercel.json` cron config from an earlier draft of this README has been removed
since Railway is the documented path; if you ever do move to serverless Vercel,
`src/lib/uploads.ts` and `src/lib/sendWish.ts` are the only two files that touch
the filesystem and would need to swap to S3-compatible storage instead.
