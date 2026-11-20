# Data Flow

## Measurement: scale to storage

```mermaid
flowchart TD
    HW["Scale hardware"] -->|"11-byte BLE notification"| DEC["bluetooth/decoder.ts<br/>decodePacket()"]
    DEC -->|"ScalePacket<br/>{type, weightKg, impedanceOhms, heartRateBpm}"| HOOK["useBluetooth<br/>live state"]
    HOOK -->|"type = body"| MP["MeasurePage"]
    PROFILE[("User profile")] --> RAW
    MP --> RAW["metrics/computeFromScale.ts<br/>computeRawFromScale()"]
    RAW -->|"RawMeasurement<br/>26 fields"| DER["metrics/index.ts<br/>computeDerivedMetrics()"]
    PROFILE --> DER
    DER -->|"DerivedMetrics<br/>30+ fields"| SAVE["history/historyService.ts<br/>saveMeasurement()"]
    RAW --> SAVE
    SAVE --> IDB[("IndexedDB<br/>measurements")]
```

Stored record: `Measurement { id, userId, timestamp, raw, derived, notes }`.

Only three values come from the scale (weight, impedance, heart rate). Everything else is computed from those and the user's profile (sex, age, height, activity level, goals) using published formulas.

### Packet phases

| Packet type | Meaning                                          | What the app does                          |
| ----------- | ------------------------------------------------ | ------------------------------------------ |
| `weighing`  | Live weight while the user steps on              | Updates the live weight display            |
| `body`      | Final locked weight, impedance, and heart rate   | Moves state to `complete` and records the device |
| `unknown`   | Wrong marker, short packet, or bad checksum      | Discarded                                  |

The Bluetooth hook moves through `idle → scanning → connecting → measuring → complete`, with `error` reachable from any step.

## Reading: storage to screen

```mermaid
flowchart LR
    IDB[("IndexedDB")] --> HS["historyService<br/>getMeasurementsForUser()"]
    HS --> HOME["HomePage<br/>latest + bento grid"]
    HS --> HIST["HistoryPage<br/>by month + trends"]
    HIST --> TR["metrics/trends.ts<br/>stats, recomposition score"]
    HOME --> CL["metrics/classify.ts<br/>ok / warn / alert"]
    TR --> CH["TrendChart<br/>(Recharts)"]
```

## AI coach

```mermaid
sequenceDiagram
    participant U as User
    participant C as ChatPage
    participant S as chatService
    participant D as IndexedDB
    participant O as OpenAI

    U->>C: types a message
    C->>S: sendChat(user, history, measurements, key, model)
    S->>S: system prompt + profile + last 10 measurements + last 20 messages
    S->>O: chat.completions.create (browser to OpenAI directly)
    O-->>S: reply
    S-->>C: text
    C->>D: appendMessage(user) and appendMessage(assistant)
```

Nothing is sent to OpenAI unless the user sends a chat message or requests an insight. The API key lives in the `settings` row in IndexedDB.

## Backup and restore

```mermaid
flowchart LR
    IDB[("users + measurements")] -->|"exportAllData()"| JSON["open-cult-backup.json"]
    JSON -->|"importAllData()<br/>after confirm dialog"| IDB2[("users + measurements<br/>replaced")]
    AUTO["useAutoExport<br/>once per day after set time"] -.-> JSON
```

- **Manual:** export and import from Settings.
- **Auto-export:** on app open, if enabled and the configured time has passed and today hasn't been exported yet, the browser downloads `open-cult-backup.json`. The last-export date is kept in `localStorage`.
- **Scope:** the backup contains `users` and `measurements` only. Settings, the OpenAI key, devices, AI insights, and chat history are **not** included.
- **Import** validates that both arrays exist, then clears and replaces the two tables in one transaction.
