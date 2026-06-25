# Obsidian Quant Group

Marketing site for **Obsidian Quant Group** — institutional quantitative asset management.
_Forged in Precision. Beyond the Market. Within the Model._

Live: **https://obsidian.abedubas.dev**

## Stack

- **Vite 7** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (design tokens in `src/index.css`)
- **react-router-dom v7** (SPA), **framer-motion** (motion)

The brand system (palette, type, motifs) is encoded in `src/index.css`, and all
copy lives in `src/content/site.ts` (single source of truth).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build → dist/
npm run preview  # serve the production build
```

## Structure

```
src/
  components/   reusable UI + brand motifs (Logo, AuroraRibbon, …)
  layouts/      Header, Footer, RootLayout, PortalLayout, Preloader, …
  pages/        Home, Firm, Strategy, Architecture, Insights, Portal, Access, Contact, NotFound
  content/      site.ts — all copy
  lib/          cn(), motion presets
```

## Deploy

Push to `main` → GitHub Actions builds & deploys to the VPS automatically.
See [DEPLOY.md](./DEPLOY.md) for the full pipeline.
