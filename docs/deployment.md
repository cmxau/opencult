# Deployment

The app builds to static files in `dist/`, so any static host works. The reference deployment is Vercel: <https://open-cult.vercel.app/>.

No environment variables are needed. The OpenAI key is supplied by the user at runtime and stored in their browser.

## Vercel

```bash
npm run build
npx vercel --prod
```

Or import the repo in the Vercel dashboard. It detects Vite, runs `npm run build`, and serves `dist/`.

## Host requirements

Whatever host you use needs to do three things:

1. **HTTPS.** Web Bluetooth and service workers both require a secure context.
2. **SPA fallback.** `BrowserRouter` uses real paths (`/measure`, `/history`, …), so unknown paths must rewrite to `index.html`. Otherwise refreshing on a deep link returns 404.
3. **Don't cache the service worker.** Serve `sw.js` with `Cache-Control: no-cache` so `registerType: 'autoUpdate'` can pick up new releases.

Example `vercel.json` covering these, plus basic security headers:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

## PWA

`vite-plugin-pwa` generates the manifest (standalone, portrait, icons from `public/icons/`) and the service worker at build time. Users can install the app from the browser menu on iOS, Android, and desktop.
