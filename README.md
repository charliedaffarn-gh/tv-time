# TV Time

A personal show tracker: log shows you hear about, move them into "Watching"
when you start, mark episodes as you go, and see poster art and upcoming air
dates. Built as an installable PWA after the original TV Time app shut down.

## Stack

- **Frontend**: React + Vite + TypeScript, Tailwind CSS, installable as a PWA
- **Backend**: [Supabase](https://supabase.com) (Postgres + auth). Every
  account only ever sees its own shows, enforced by Postgres row-level
  security policies (`supabase/migrations/0001_init.sql`), not app code.
- **Show data & posters**: [TMDB](https://www.themoviedb.org/) API, called
  through small Vercel functions in `/api` so the API key stays server-side.
- **Hosting**: Vercel

Accounts are invite-only — there's no public sign-up page. You create a
login for yourself and each friend directly in Supabase (see below).

## One-time setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run each file in `supabase/migrations/` **in order**
   (`0001_init.sql`, then `0002_episode_ledger.sql`, then `0003_sharing.sql`,
   and so on) — later ones depend on earlier ones. Run any new migration file
   the same way once it's deployed, and always before it, same reasoning as
   `0002`: an in-between state where the code expects a table that doesn't
   exist yet will misbehave.
3. In **Project Settings -> API Keys**, copy the **Publishable key**
   (`sb_publishable_...`). You don't need the secret key for this app.
4. For the **Project URL**, use the **Connect** button at the top of your
   project's dashboard (any framework preset shows it pre-filled), or check
   **Project Settings -> Data API**. It's always `https://<project-ref>.supabase.co`
   — the `<project-ref>` is also the string in your dashboard's own address bar
   (`.../project/<project-ref>/...`) if you'd rather just read it off there.
5. In **Authentication -> Users**, click **Add user** to create a login
   (email + password) for yourself and anyone else you want to invite. To
   add another friend later, just add another user here — no code changes.
   Email confirmation can be left off for invite-only use, or left on if
   you'd rather friends set their own password via an email link.

### 2. TMDB API key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/).
2. In **Settings -> API**, request a free **Developer** key.
3. Copy the **API Key (v3 auth)** — a short alphanumeric string, not the
   longer "Read Access Token".

### 3. Environment variables

Copy `.env.example` to `.env` and fill in the three values from above:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
TMDB_API_KEY=
```

Add the same three to your Vercel project (**Settings -> Environment
Variables**) before deploying.

## Local development

```
npm install
npm run dev
```

This runs the UI at `http://localhost:5173` and talks to Supabase directly,
so sign-in and your show list work normally. The `/api/tmdb/*` functions
that power search and posters are Vercel functions, though, and plain
`vite dev` doesn't run those — search will fail locally with a 404 unless
you use the Vercel CLI instead:

```
npm i -g vercel
vercel link       # links this folder to your Vercel project (one-time)
vercel env pull   # pulls the env vars you set in Vercel into .env.local
vercel dev
```

`vercel dev` serves the frontend and the `/api` functions together, matching
production.

## Deploying

Push to the branch connected to your Vercel project, or run `vercel deploy`.
Vercel auto-detects the Vite frontend and deploys the `/api` functions
alongside it — no extra configuration needed.

## Adding the app to your phone's home screen

Open the deployed URL in your phone's browser, then use "Add to Home
Screen" (iOS Safari) or the install prompt / menu option (Android Chrome).
It'll launch full-screen like a native app.
