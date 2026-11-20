# Tech Stack

| Layer     | Library                                   | Notes                                              |
| --------- | ----------------------------------------- | -------------------------------------------------- |
| UI        | React 19 + TypeScript                     | Function components, context for global state      |
| Routing   | React Router v7                           | `BrowserRouter`, five routes                       |
| Styling   | Tailwind CSS v3 + CSS custom properties   | Light/dark tokens in `src/index.css`               |
| Animation | Framer Motion v12                         | Page transitions, springs; honours reduced motion  |
| Charts    | Recharts v3                               | `shared/ui/TrendChart.tsx`                         |
| Database  | Dexie 4 (IndexedDB wrapper)               | Versioned schema, see [database-schema](database-schema.md) |
| AI        | OpenAI SDK v6                             | Called directly from the browser with the user's key |
| Bluetooth | Web Bluetooth API                         | Typed via `@types/web-bluetooth`                   |
| Build     | Vite 8 + `vite-plugin-pwa`                | Manual vendor chunks: react, charts, openai, db    |
| Tests     | Vitest + Testing Library + fake-indexeddb | jsdom environment, globals enabled                 |

## Why these choices

- **No backend.** The app is static output. Persistence is IndexedDB, and the only network call is to OpenAI, using a key the user pastes in. This is what makes the "all data stays on your device" promise cheap to keep.
- **Web Bluetooth over native.** One codebase runs on desktop Chromium and Android. iOS needs a Web Bluetooth-capable browser such as Bluefy.
- **Dexie over raw IndexedDB.** Versioned migrations and indexed queries without boilerplate.
- **Pure-function metrics.** All body-composition maths lives in `features/metrics` as plain functions, which keeps it unit-testable without a DOM.
