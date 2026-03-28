# IPL Predictor Pool

A production-ready IPL prediction pool app built with Next.js and Supabase.

## Features

- Google sign-in with Supabase Auth
- One default room with a maximum of 8 players
- First member becomes admin automatically
- Admin can create IPL matches and settle final results
- Admin can seed a sample IPL fixture list for faster setup
- Players can submit one pick per match
- Automatic point settlement:
  - wrong pick: `-50`
  - correct pick: split the losing pool equally
- Season leaderboard and room summary
- Database schema already supports multiple rooms later

## Stack

- Next.js App Router
- Supabase Auth + Postgres + Row Level Security
- Vercel deployment target

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env.local
```

3. Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. In Supabase SQL Editor, run:

[supabase/schema.sql](/C:/Users/india/Documents/New%20project/supabase/schema.sql)

If you already ran an older version of the SQL, run the latest file again so the new seed function is added.

5. Configure auth in Supabase:

- Enable Google provider
- Set the site URL to your local URL and Vercel URL
- Add the callback URL:
  - `http://localhost:3000/auth/callback`
  - `https://your-vercel-domain.vercel.app/auth/callback`

6. Start the app:

```bash
npm run dev
```

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add the same env vars from `.env.local`.
4. In Supabase Auth settings, add the Vercel production callback URL.
5. Deploy.

## How room membership works

- The app uses one seeded room: `IPL 2026 Main Pool`
- Room size is limited to 8 players
- The first person who joins becomes `admin`
- All later members become `member`

## Files to know

- [app/page.js](/C:/Users/india/Documents/New%20project/app/page.js)
- [app/auth/page.js](/C:/Users/india/Documents/New%20project/app/auth/page.js)
- [app/dashboard/page.js](/C:/Users/india/Documents/New%20project/app/dashboard/page.js)
- [app/dashboard/actions.js](/C:/Users/india/Documents/New%20project/app/dashboard/actions.js)
- [supabase/schema.sql](/C:/Users/india/Documents/New%20project/supabase/schema.sql)
