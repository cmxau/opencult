# Open Cult

An independent, privacy-first PWA for the **Cult Smart Body Fat Scale (CS-BF01)**. All data stays on your device — no accounts, no cloud, no tracking.

Connect via Bluetooth, get a full body composition breakdown, track trends over time, and chat with an AI coach using your own OpenAI key.

---

## Disclaimer

This is an unofficial, third-party project built for educational, research, and personal-interoperability purposes only. It is not affiliated with, endorsed by, or sponsored by the makers of the Cult Smart Body Fat Scale or any related brand. Product names are referenced nominatively solely to describe hardware compatibility.

The metrics displayed are computed from published bioimpedance formulas and are **not clinically validated**. Nothing here constitutes medical advice. Bioimpedance measurements are inherently noisy and vary with hydration, temperature, and posture — treat every number as a trend indicator, not a ground truth.

---

## Features

### Body Composition Tracking

- Connects to the Cult CS-BF01 scale over Web Bluetooth
- Decodes the proprietary BLE protocol (0xCF marker, 11-byte packet, XOR checksum)
- Computes **26 raw metrics** from 3 BLE values (weight, impedance, heart rate) using published clinical formulas:
  - BMI, BMR (Mifflin-St Jeor 1990)
  - Body fat % (Deurenberg et al. 1991)
  - Total body water (Watson et al. 1980)
  - Skeletal muscle mass (Janssen et al. 2000)
  - Bone mass, protein, minerals (Pietrobelli 1998 / Roche 1996)
  - Visceral fat level (Kuk et al. 2009)
- Computes **30+ derived metrics** including:
  - FFMI (Kouri et al. 1995), FMI (Schutz et al. 2002), ASMI (Baumgartner et al. 1998)
  - TDEE, fat loss / muscle gain calorie targets
  - Fitness age, obesity risk score, cardiometabolic risk score
  - Ideal weight range (Devine / Robinson / Hamwi formulas)
  - Days to goal estimate (Hall et al. 2011 model)

### History & Trends

- Full measurement history per profile, grouped by month
- Trend charts for any of the 30+ tracked metrics
- Body recomposition score — tracks fat loss + muscle gain simultaneously
- Metric picker: tap to open a bottom-sheet selector grouped by category (Measurements, Fat, Muscle, Lean tissue, Water, Bone & minerals, Protein, Metabolism, Health assessment, Goals)
- Time range filter: 1 week, 1 month, 3 months, all time

### AI Coach

- Persistent chat threads powered by OpenAI (GPT-4o / GPT-4o-mini)
- Context-aware — AI sees your profile, goals, and last 10 measurements
- API key stored locally on device only, never sent to any server other than OpenAI

### Multi-Profile

- Up to 10 profiles on one device
- Per-profile goals: target weight, target body fat %, weekly change rate
- Avatar colour picker, activity level, date of birth

### Data Portability

- Manual JSON export / import
- Auto-export daily: downloads `open-cult-backup.json` on first app open at or after a configured time
- Import replaces all data with confirmation dialog; success or failure shown as a toast notification

### Other

- PWA — installable on iOS, Android, and desktop
- Light / dark mode toggle (persists across sessions, no flash on load)
- Weekly weigh-in reminders via Web Notifications (fires while app is open)
- Units: kg / lbs, cm / ft·in
- Page transitions and spring animations via Framer Motion (respects `prefers-reduced-motion`)
- Custom glass-styled confirm dialogs for all destructive actions (delete profile, forget device, replace data)
- In-app feedback links: request a feature or report a bug directly to the GitHub repo

---

## Stack

| Layer     | Library                                   |
| --------- | ----------------------------------------- |
| UI        | React 19 + TypeScript                     |
| Routing   | React Router v7                           |
| Styling   | Tailwind CSS v3 + CSS custom properties   |
| Animation | Framer Motion v12                         |
| Charts    | Recharts v3                               |
| Database  | Dexie (IndexedDB wrapper)                 |
| AI        | OpenAI SDK v6                             |
| Build     | Vite 8 + vite-plugin-pwa                  |
| Tests     | Vitest + Testing Library + fake-indexeddb |

---

## Getting Started

**Requirements:** Node 18+, a Chromium-based browser (Web Bluetooth), the Cult CS-BF01 scale.

```bash
git clone https://github.com/cmxau/open-cult.git
cd open-cult
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome or Edge.

---

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # Type-check + production build → dist/
npm run preview    # Serve the dist/ build locally
npm run lint       # ESLint
npm run test       # Vitest (watch)
npm run test:ui    # Vitest browser UI
```

Run a single test file:

```bash
npx vitest run src/test/metrics/formulas.test.ts
```

---

## Deployment (Vercel)

The app is pure static output. No environment variables required — the OpenAI key is user-supplied at runtime.

```bash
npm run build
npx vercel --prod
```

Or connect the repo in the Vercel dashboard — it auto-detects Vite and runs `npm run build` with output directory `dist/`.

`vercel.json` is included and handles:

- SPA rewrites (all routes → `index.html`)
- Service worker cache headers (`Cache-Control: no-cache` on `sw.js`)
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`)

---

## Architecture

```
src/
├── App.tsx                    # Provider tree + routes + AutoExportWatcher
├── main.tsx
├── index.css                  # CSS custom properties (light/dark), glass utilities
│
├── features/
│   ├── bluetooth/
│   │   ├── decoder.ts         # BLE packet decoder (0xCF protocol)
│   │   └── useBluetooth.ts    # Web Bluetooth hook — scan, connect, stream packets
│   │
│   ├── metrics/
│   │   ├── computeFromScale.ts  # RawMeasurement from 3 BLE values + user profile
│   │   ├── index.ts             # DerivedMetrics from RawMeasurement + user profile
│   │   ├── formulas.ts          # Pure functions: FFMI, TDEE, ideal weight range, …
│   │   ├── extended.ts          # Additional derived metrics (FMI, fitness age, …)
│   │   ├── classify.ts          # Status classification (ok/warn/alert) per metric
│   │   ├── categories.ts        # Metric → category mapping
│   │   └── trends.ts            # Trend stats, body recomposition score
│   │
│   ├── ai/
│   │   ├── openaiClient.ts    # generateInsight() — single-shot JSON response
│   │   ├── chatService.ts     # sendChat() — multi-turn conversation
│   │   └── promptBuilder.ts   # System prompt + user context serialisation
│   │
│   ├── history/
│   │   ├── historyService.ts  # CRUD + exportAllData / importAllData
│   │   └── useAutoExport.ts   # Hook: auto-download backup once per day
│   │
│   ├── settings/
│   │   ├── settingsService.ts # getSettings / updateSettings (Dexie singleton)
│   │   ├── SettingsContext.tsx # React context + useSettings()
│   │   └── ThemeContext.tsx    # Resolved theme, dark class on <html>, useTheme()
│   │
│   ├── users/
│   │   ├── userService.ts     # CRUD + AVATAR_COLORS
│   │   └── UserContext.tsx    # Active user, multi-profile list, useUsers()
│   │
│   └── reminders/
│       └── reminderService.ts # Web Notifications polling (fires while app open)
│
├── pages/
│   ├── HomePage.tsx           # Dashboard — metrics bento grid, trend chart, filter pills
│   ├── MeasurePage.tsx        # BLE scan → weigh-in flow → save measurement
│   ├── HistoryPage.tsx        # Measurements grouped by month, per-metric trend charts, bottom-sheet metric picker
│   ├── ChatPage.tsx           # AI chat with thread management
│   └── SettingsPage.tsx       # Profiles, units, device, reminders, OpenAI, backup, feedback links
│
├── shared/
│   ├── db/
│   │   ├── index.ts           # Dexie schema v3, migrations
│   │   └── types.ts           # All TypeScript types + DEFAULT_SETTINGS
│   ├── ui/                    # GlassCard, MetricCard, TrendChart, Modal, ConfirmDialog, …
│   ├── motion.ts              # Shared Framer Motion variants + spring configs
│   └── units.ts               # kg↔lbs, cm↔ft/in conversion helpers
│
└── test/
    ├── bluetooth/decoder.test.ts
    ├── history/historyService.test.ts
    ├── metrics/classify.test.ts
    ├── metrics/formulas.test.ts
    └── setup.ts
```

### Data Flow

```
BLE scale hardware
  ↓  11-byte packet (bluetooth/decoder.ts)
ScalePacket { type, weightKg, impedanceOhms, heartRateBpm }
  ↓  + user profile (metrics/computeFromScale.ts)
RawMeasurement (26 fields)
  ↓  + user profile (metrics/index.ts)
DerivedMetrics (30+ fields)
  ↓  save (history/historyService.ts)
Dexie IndexedDB → Measurement { id, userId, timestamp, raw, derived, notes }
```

### Database Schema (v3)

| Table          | Indexes                          |
| -------------- | -------------------------------- |
| `users`        | `++id, createdAt`                |
| `measurements` | `++id, userId, timestamp`        |
| `devices`      | `++id, macAddress`               |
| `settings`     | `id` (singleton, always id=1)    |
| `aiInsights`   | `++id, measurementId, createdAt` |
| `chatThreads`  | `++id, userId, updatedAt`        |
| `chatMessages` | `++id, threadId, createdAt`      |

Migration from v1→v2 splits `units` into `weightUnit`/`heightUnit`. v2→v3 backfills `DerivedMetrics` on pre-existing measurements.

---

## BLE Protocol

The CS-BF01 uses a proprietary 11-byte packet over a GATT characteristic:

| Offset | Length | Field                                                  |
| ------ | ------ | ------------------------------------------------------ |
| 0      | 1      | Marker — must be `0xCF`                                |
| 1      | 1      | Heart rate BPM (body phase only)                       |
| 2      | 1      | Signal quality / counter (ignored)                     |
| 3–4    | 2      | Weight LE uint16 ÷ 100 → kg                            |
| 5–6    | 2      | Impedance LE uint16 ohms (0 during weighing)           |
| 7–8    | 2      | Reserved                                               |
| 9      | 1      | Phase: `0x01` = live weighing, `0x00` = body/HR locked |
| 10     | 1      | XOR checksum of bytes 0–9                              |

Packets with wrong marker or failed checksum are discarded. A `weighing` packet streams live weight. A `body` packet carries the final locked weight + impedance + heart rate used to compute all metrics.

---

## Privacy

- No network requests except OpenAI (only when you initiate a chat or insight, using your own key)
- No analytics, no telemetry, no accounts
- All data stored in browser IndexedDB on the device
- Export your data at any time as a plain JSON file
- Uninstalling the PWA or clearing browser data removes everything

---

## Platform Support

| Platform     | Browser                                                                  | BLE | Notes                                                                                                            |
| ------------ | ------------------------------------------------------------------------ | --- | ---------------------------------------------------------------------------------------------------------------- |
| Windows      | Chrome, Edge                                                             | ✓   | Full support                                                                                                     |
| macOS        | Chrome, Edge                                                             | ✓   | Full support                                                                                                     |
| Linux        | Chrome                                                                   | ✓   | Full support                                                                                                     |
| Android      | Chrome                                                                   | ✓   | Full support                                                                                                     |
| iOS / iPadOS | [Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055) | ✓   | Install Bluefy — a Web Bluetooth-capable browser for iOS. Safari and Chrome on iOS do not support Web Bluetooth. |

The app is fully functional without a scale for manual data entry, viewing history, and importing exported data.

---

## References & Credits

This project would not exist without prior open-source work on BLE scale reverse-engineering and body composition formulas:

- **[openScale](https://github.com/oliexdev/openScale)** — the most comprehensive open-source scale companion app for Android. Invaluable reference for BLE protocol decoding across dozens of scale manufacturers, including the packet structure that informed the decoder here.
- **[whoof](https://github.com/madhursatija/whoof)** — a lean Web Bluetooth scale client that demonstrated the feasibility of the browser-native BLE approach used in this project.
- **[occult](https://github.com/anshuman852/occult)** — an earlier web client specifically targeting the Cult CS-BF01, whose protocol exploration directly helped validate the 11-byte packet format and XOR checksum logic.

---

## License

MIT — product names are trademarks of their respective owners; this project is not affiliated with or endorsed by them.
