# Blog CMS — Acceptance checklist (§22)

Use after `docker compose up -d`, migrate, seed, and `npm run dev`.

Automated harness (defaults to `http://localhost:3002`):

```bash
ADMIN_SEED_PASSWORD='…' QA_AUTHOR_EMAIL='…' QA_AUTHOR_PASSWORD='…' QA_MANAGER_PASSWORD='…' \
  npm run qa:acceptance [baseUrl]
```

All four are required and have no defaults — the harness exits 1 before its first
request if any is missing. See `.env.example` for what each one is for. **Point
this at a disposable database, never production:** the suite creates the Author
user, PATCHes an existing one back to `status: "active"`, and stands up a
throwaway manager account.

Verified **2026-07-28** against local Docker Postgres + `next dev` (15/15 PASS) —
note that run predates the env-var requirement and used the old hardcoded
defaults, which have since been removed.

- [x] Author/Admin can create a draft via **Write a Blog**, close the browser, return, and continue from the last successful save (autosave / Save Draft).
- [x] Editor can format content, insert links/images, set featured image alt text, and preview desktop/tablet/mobile.
- [x] Authorized user can complete publishing settings and publish without a code deploy.
- [x] Published article appears on `/blog/` and relevant `/blog/tag/…` or `/blog/category/…` pages.
- [x] View source on a published article: body, title, description, canonical, robots, social meta, and BlogPosting JSON-LD are present.
- [x] Public URL appears in `/sitemap.xml` and is removed when unpublished / noindex / trashed.
- [x] Changing a published slug creates a working redirect from the old `/blog/{old-slug}/` path.
- [x] Draft, preview, admin, trash, and noindex content do not appear in the public sitemap.
- [x] Unauthorized users cannot publish, delete, restore, or change SEO settings (API returns 401/403).
- [x] Script tags / unsafe HTML are stripped on save (sanitization).
- [x] Revision restore brings back an older snapshot without deleting later revision rows.
- [x] Audit log records publish, unpublish, delete, restore, and login actions.
- [x] Related posts on a published article prefer shared tags/category over unrelated recent filler.
- [x] Admin **Link health** (`/admin/blog/links/`) and post editor **Check links** report a planted dead `/blog/missing-slug/` (and optionally a dead external URL).

## Fixes applied during acceptance QA

- Published slug changes now create a 301 redirect row on save (not only on a later re-publish).
- Public article page no longer swallowed Next.js `redirect()` inside `try/catch` (old URLs were 404ing).
- Publish settings gained a **Featured image alt text** field wired to `PATCH /api/admin/media/:id`.

## Deferred (§3.2) — implemented 2026-07-28

- [x] User management UI (`/admin/users/`)
- [x] Import / export JSON backup (`/admin/blog/import-export/`)
- [x] GA/GSC settings + on-site metrics dashboard (`/admin/analytics/`)
- [x] AI assists in post editor (Groq — `GROQ_API_KEY`)
- [x] Newsletter signup (footer) + subscriber list (`/admin/blog/newsletter/`)
- [x] Moderated comments on published articles (`/admin/blog/comments/`)
