# iker.sh

personal site — terminal-themed, built with [astro](https://astro.build/).

## stack

- **astro** (content collections, typescript)
- **scss** for styles
- **bun** for package management
- **cloudflare pages** for hosting (build: `bun run build`, output: `dist`)

## scripts

```sh
bun install        # install deps
bun run dev        # local dev server
bun run build      # production build → dist/
bun run preview    # preview the production build
bun run typecheck  # astro check
bun run lint       # eslint + prettier
bun run format     # prettier --write
```

## layout

```
src/
├── components/   # TitleBar, TabBar, Prompt, FileListing, ProjectCard
├── content/      # content collections (about, projects, reading)
│   └── config.ts # zod schemas
├── layouts/      # Terminal.astro (page shell)
├── pages/        # routes
├── scripts/      # terminal.ts (typewriter + SPA-like tab transitions)
└── styles/       # terminal.scss
```

## content

- **about** — `src/content/about/index.md`
- **projects** — markdown files in `src/content/projects/`
- **reading** — JSON files in `src/content/reading/` (one entry per book)

## deploy

cloudflare pages, on push to `main`. no deploy workflow needed in this repo.
