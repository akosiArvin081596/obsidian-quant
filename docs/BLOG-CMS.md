# Blog CMS

Custom Blog CMS and SEO publishing module for Obsidian Quant (spec §3.1 Initial Build).

## Local setup

1. Start Postgres (Docker Desktop must be running):

```bash
docker compose up -d
```

Postgres is exposed on **host port 5433** (not 5432) so it does not collide with Laragon’s local Postgres.

2. Copy env and set the database URL:

```bash
cp .env.example .env
# DATABASE_URL="postgresql://obsidian:obsidian@localhost:5433/obsidian_quant?schema=public"
```

3. Migrate and seed:

```bash
npm run db:migrate
# or: npx prisma migrate deploy
npm run db:seed
```

Default admin (override with `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`):

- Email: `admin@obsidianquantgroup.com`
- Password: `ChangeMeNow!2026`

4. Run the app:

```bash
npm run dev
```

- Public blog: `/blog/`
- Admin: `/admin/login/` → `/admin/blog/`

## Roles

Administrator, Editor, Author, SEO Manager, Viewer — permissions enforced on `/api/admin/*`.

## Backend API (local Node / App Router)

| Route | Purpose |
|-------|---------|
| `POST/GET/DELETE /api/admin/auth/` | Login, session, logout |
| `GET/POST /api/admin/posts/` | List / create draft |
| `GET/PATCH/DELETE /api/admin/posts/:id/` | Read, autosave, soft-delete (trash) |
| `POST …/publish\|schedule\|unschedule\|submit-review\|unpublish\|archive\|restore\|duplicate\|purge/` | Workflow actions |
| `GET …/revisions/` · `GET …/revisions/:revisionId/` · `POST …/restore/` | Revision history |
| `GET/POST /api/admin/media/` · `PATCH …/:id/` | Media library |
| `GET/POST /api/admin/tags/` · `GET/POST /api/admin/categories/` | Taxonomy |
| `GET/POST /api/admin/redirects/` · `PATCH/DELETE …/:id/` | Redirect manager |
| `GET /api/admin/audit/` | Audit log |
| `GET /api/admin/link-check/` · `GET …/posts/:id/link-check/` | Broken-link scan (on-demand) |
| `GET /api/admin/link-targets/` | Internal link search for editor |
| `GET /api/public/posts/` · `GET …/:slug/` | Public payloads |
| `GET /api/public/tags/` · `GET /api/public/categories/` | Public taxonomy |
| `GET /uploads/*` | Uploaded media |
| `GET /sitemap.xml` · `GET /sitemaps/posts.xml` · `GET /rss.xml` | Discovery feeds |

## Related posts & link health (§3.2 Phase 1)

- **Related posts** — public articles rank candidates by shared tags, primary/secondary category, and recency (`src/lib/blog/relatedPosts.ts`).
- **Link health** — admin at `/admin/blog/links/` and **Check links** on Publish settings; scans post HTML for broken internal routes and unreachable external URLs.

## Deferred (§3.2 remaining)

GSC/GA dashboards, AI assists, comments, newsletter, import/export, user management UI.

## Publishing workflow

- **Publish now** — live immediately (requires `posts:publish`).
- **Schedule for later** — sets `status=scheduled` + `scheduledAt`; promoted to published automatically when due (checked on admin list / public blog reads).
- **Submit for review** — sets `status=pending_review` for editorial approval (Authors without publish permission use this as their primary action).
- **Pending / Scheduled** dashboard counts and filters reflect those live statuses.

## Production notes

See [DEPLOY.md](../DEPLOY.md) for Node + nginx + Postgres cutover from the previous static export.
