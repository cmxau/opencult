# Commands

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Vite dev server on `localhost:5173`           |
| `npm run build`    | Type-check (`tsc -b`) then production build to `dist/` |
| `npm run preview`  | Serve the `dist/` build locally               |
| `npm run lint`     | ESLint                                        |
| `npm run test`     | Vitest in watch mode                          |
| `npm run test:ui`  | Vitest browser UI                             |

## Running tests

Run one file:

```bash
npx vitest run src/test/metrics/formulas.test.ts
```

Run everything once, without watch:

```bash
npx vitest run
```

Current suites live in `src/test/`:

| Suite                              | Covers                                        |
| ---------------------------------- | --------------------------------------------- |
| `bluetooth/decoder.test.ts`        | Packet marker, checksum, weighing vs body     |
| `metrics/formulas.test.ts`         | Pure formula functions                        |
| `metrics/classify.test.ts`         | ok / warn / alert status classification       |
| `history/historyService.test.ts`   | Measurement CRUD and export / import (fake-indexeddb) |
