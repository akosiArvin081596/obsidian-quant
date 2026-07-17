# Obsidian Quant Group

Marketing site for **Obsidian Quant Group** — institutional quantitative asset management.
_Profit from Market Dislocation. Beyond the Market. Within the Model._

Live: **https://obsidianquantgroup.com**

## Stack

- **Next.js 15** (App Router, static export) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (design tokens in `src/index.css`)
- **framer-motion** (motion)

Public pages are statically generated HTML (SEO). The brand system (palette, type, motifs)
is encoded in `src/index.css`, and all copy lives in `src/content/site.ts`.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → out/ synced to dist/
npm run preview  # serve dist/ on :4173
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
