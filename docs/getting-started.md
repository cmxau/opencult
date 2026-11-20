# Getting Started

## Requirements

- Node 18+
- A Chromium-based browser (Chrome or Edge) for Web Bluetooth. On iOS use [Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055).
- A Cult CS-BF01 scale. This is optional, because the app works for viewing history and importing data without one.
- An OpenAI API key. This is optional and only needed for the AI coach.

## Run locally

```bash
git clone https://github.com/cmxau/opencult.git
cd opencult
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome or Edge.

## First run

1. Create a profile (name, sex, date of birth, height, activity level). The metric formulas need these.
2. Go to **Measure**, press connect, and pick the scale in the browser's Bluetooth chooser.
3. Step on the scale. Live weight streams first. After about five seconds the impedance and heart-rate packet arrives and the measurement is saved.
4. Optionally add an OpenAI key under **Settings** to enable the AI coach.

> Web Bluetooth requires a secure context. `localhost` and HTTPS both qualify.

## Next

- [Commands](commands.md): scripts and tests
- [Architecture](architecture.md): how the code is organised
