# Obsidian Quant Group

Marketing site for **Obsidian Quant Group** — institutional quantitative asset management.
_Profit from Market Dislocation. Beyond the Market. Within the Model._

Live: **https://obsidianquantgroup.com**

## Stack

- **Next.js 15** (App Router, Node runtime) + **React 19** + **TypeScript**
- **PostgreSQL** + Prisma (Blog CMS)
- **Tailwind CSS v4** (design tokens in `src/index.css`)
- **framer-motion** (motion)
- **TipTap** editor in `/admin/blog`

Public marketing pages + `/blog` are server-rendered. Copy for brochure pages
lives in `src/content/site.ts`; blog posts are managed in the CMS.

## Develop

```bash
docker compose up -d          # Postgres
cp .env.example .env          # set DATABASE_URL
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev                   # http://localhost:3000
```

- Blog: `/blog/`
- Admin: `/admin/login/` (see [docs/BLOG-CMS.md](docs/BLOG-CMS.md))

```bash
npm run build
npm start
npm test
```

## Structure

```
src/
  app/          Next.js routes + metadata (marketing + investor)
  components/   reusable UI + brand motifs
  layouts/      Header, Footer, Preloader, …
  views/        page bodies (client components)
  content/      site.ts — all copy
  lib/          cn(), motion, seo, contact, …
```

## Deploy

Push to `main` → GitHub Actions builds & deploys to the VPS automatically.
See [DEPLOY.md](./DEPLOY.md) for the full pipeline.
