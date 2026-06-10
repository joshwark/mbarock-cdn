# MBA Rock — Site Content Bundle

Serves the production CDN assets behind [mbarock.com](https://mbarock.com) (learn.mbarock.com).

- `lessons.v2.json` — public lesson canon (74 lessons). Member content — concepts, deep dives,
  tasks, quizzes, materials, lyrics — is served per-lesson from Supabase `lesson_secure` behind
  RLS (BR-20260610-35), never from this repo.
- `lessons.css` — site-wide styles
- `/lesson/`, `/module/`, `/dashboard/`, `/quiz/`, … — static pages hydrated client-side from the
  public canon (and, for members, from `lesson_secure`).
