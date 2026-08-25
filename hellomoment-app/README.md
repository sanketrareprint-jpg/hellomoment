# hellomoment.in — bare skeleton

This is the first deployable slice of hellomoment.in: account registration,
login, and a dashboard page that reads back from a real Postgres database.
No contacts, templates, or WhatsApp sending yet — this exists purely to
prove the pipeline (code → hosting → database) works before we build
features on top of it.

Tested locally end-to-end (register → login → DB-backed dashboard →
logout, plus redirect-when-logged-out) against a local Postgres instance.

## What's inside

- Next.js 16 (App Router, TypeScript, Tailwind)
- Auth.js (NextAuth v5) with email+password (Credentials provider), JWT sessions
- `pg` for direct SQL against Postgres — no ORM, so there's no extra binary
  to install or fetch (kept deliberately simple for this first deploy)
- One table (`users`) — see `db/schema.sql`

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `DATABASE_URL` — a Postgres connection string
- `AUTH_SECRET` — generate with `openssl rand -base64 32`

## Deploying to Railway (hosting + database)

Run these from inside this folder, in your own terminal (Railway CLI needs
real internet access to Railway's servers, which this app's build sandbox
doesn't have — that's the only reason this is a manual runbook rather than
something done for you).

```bash
# 0. Install the CLI if you don't already have it, and log in (opens a browser)
npm i -g @railway/cli
railway login

# 1. Create a new Railway project and link this folder to it
railway init --name hellomoment-skeleton

# 2. Provision a Postgres database into that same project
railway deploy -t postgres

# 3. Deploy this app's code as its own service in the project
railway up --detach

# 4. Find the exact service names Railway assigned
railway service list
```

Then wire the app service up to the database (replace `<app-service>` with
whatever `railway service list` printed for this app — usually the folder
name, `hellomoment-app`):

```bash
# 5. Point the app at the Postgres service's connection string
railway variable set DATABASE_URL='${{Postgres.DATABASE_URL}}' --service <app-service> --skip-deploys

# 6. Give it a session secret
railway variable set AUTH_SECRET="$(openssl rand -base64 32)" --service <app-service>
```

Step 6 alone triggers a redeploy with both variables now set. If step 5's
`${{Postgres.DATABASE_URL}}` reference doesn't resolve (check with
`railway variable list --service <app-service> --kv`), fall back to
copying the literal value from `railway variable list --service Postgres --kv`
and setting that instead.

Apply the schema once, using Postgres's **public** connection string (the
migration runs from your machine, outside Railway's private network — look
for `DATABASE_PUBLIC_URL` in `railway variable list --service Postgres --kv`):

```bash
DATABASE_URL="paste-the-DATABASE_PUBLIC_URL-value-here" npm run migrate
```

Finally, get your live URL:

```bash
railway domain
```

Open it, click through register → dashboard → log out, and it's confirmed
working end to end. Pointing hellomoment.in's DNS at this is a later step
once we're past this bare-skeleton stage.

## Local development

```bash
npm install
npm run migrate   # applies db/schema.sql to DATABASE_URL
npm run dev        # http://localhost:3000
```

## What's next (not in this skeleton yet)

Contact management + bulk import, the flyer template studio, the daily
birthday/anniversary automation, festival campaigns, and the AiSensy
WhatsApp integration — all specified in `spec-v1.md` in the project. This
skeleton is Phase 0 (prove the pipeline); the roadmap in that doc picks up
from here.
