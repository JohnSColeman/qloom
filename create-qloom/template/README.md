# __APP_NAME__

A [qloom](https://github.com/JohnSColeman/qloom) app — Apache Tapestry 5's
programming model in TypeScript, running client-side.

## Develop

    npm install
    npm run dev      # http://localhost:5173

Edit `src/pages/Index.tml` (the unchanged Tapestry-style template) and
`src/pages/Index.ts` (the page class). Static text lives in `src/app.properties`.
Add a page: create `Foo.ts` + `Foo.tml` under `src/pages/` and register a route
in `src/main.ts`.

## Build

    npm run build
    npm run preview

Qloom's authoring guides were synced into `.agents/skills/` — your AI coding
agent will pick them up. Re-run `npx qloom-skills sync` after upgrading Qloom.
