# CruxAI — Frontend (Web)

Next.js 15 + Tailwind web app for **CruxAI**, an AI learning platform: upload a
book → citation-grounded summary, audio, flashcards (spaced repetition), adaptive
quiz, knowledge map, exams and multi-book synthesis. Built by
[Tamerlan Musayev](https://github.com/tamerlanmusayev).

> Backend lives in a separate repo: **cruxai-backend**.

---

## Stack
- **Next.js 15** (App Router), **React 19**, **Tailwind CSS**
- Dark "premium AI" theme, fully responsive (mobile-first)
- i18n in **AZ / RU / EN**, live presence via **socket.io-client**
- SEO: metadata, OpenGraph, sitemap, robots, manifest

## Quick start
```bash
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL
npm install
npm run dev                    # http://localhost:3000
```

## Routes
```
/                home — upload + language popup
/doc/[id]        summary (notebook + citations) + actions
/doc/[id]/quiz   adaptive quiz
/doc/[id]/flashcards   spaced-repetition study
/doc/[id]/graph  knowledge map (SVG)
/doc/[id]/exam   timed exam + weak-area report
/library         your documents
/review          due flashcards across the library
/progress        per-concept mastery
/synthesis       multi-book synthesis
/stats           public platform metrics
```

## Environment

| Var | Required | Notes |
|-----|----------|-------|
| `NEXT_PUBLIC_API_URL` | yes | CruxAI API base URL |
| `NEXT_PUBLIC_SITE_URL` | prod | canonical/OG/sitemap base |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | no | reCAPTCHA v3 (blank = off) |
| `NEXT_PUBLIC_YANDEX_METRICA_ID` | no | analytics |
| `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` | no | analytics |

## API client (Swagger-generated)
The frontend talks to the backend through a typed client generated from the
API's OpenAPI spec (via `swagger-axios-codegen`), mirroring the fe-booking setup.

```bash
# with the backend running on http://localhost:4000
npm run gen:api      # regenerates lib/api-client/service.ts from /openapi.json
```

`lib/api-client/index.ts` wires the shared axios instance (base URL, Bearer auth,
error normalization); `lib/api.ts` exposes thin typed wrappers used by the app.
Re-run `gen:api` after backend endpoint changes.

## Demo video
Drop a clip at `public/demo.mp4` — the “How it works” tab (right edge) opens it.

## Deploy (Vercel)
1. Import this repo on vercel.com.
2. Set `NEXT_PUBLIC_API_URL` (and `NEXT_PUBLIC_SITE_URL`).
3. Deploy — every push redeploys.

## License
MIT.
