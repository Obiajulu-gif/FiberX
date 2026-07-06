# Deploying the FiberX demo to Vercel

The demo (`apps/demo`) is a static Vite + React SPA. On the hosted build it runs
entirely in **mock mode** — no Fiber node and no proxy are required, so it works
as a zero-backend showcase. (The "Proxy Wallet" option is automatically hidden
in production unless you set `VITE_PROXY_URL`.)

The repo already contains a [`vercel.json`](../vercel.json) that tells Vercel how
to build this pnpm monorepo:

```json
{
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "pnpm build:libs && pnpm --filter @fiberx/demo build",
  "outputDirectory": "apps/demo/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Option A — Import the GitHub repo (recommended, no CLI)

1. Go to <https://vercel.com/new>.
2. **Import** `Obiajulu-gif/FiberX`.
3. Leave **Root Directory** as the repository root (`./`). Do **not** set it to
   `apps/demo` — the build needs the whole workspace to build the SDK packages.
4. Vercel reads `vercel.json`, so Build/Install/Output are pre-filled. Framework
   preset can stay "Other".
5. Click **Deploy**. You'll get a URL like `https://fiberx.vercel.app`.

Every push to `main` will auto-deploy.

### Optional: enable the Proxy Wallet on the hosted demo

By default the hosted demo only offers the Mock wallet. If you also deploy the
proxy somewhere (e.g. a small Node host) and want the demo to use it, add these
Environment Variables in the Vercel project settings and redeploy:

- `VITE_PROXY_URL` = your proxy URL (e.g. `https://your-proxy.example.com`)
- `VITE_PROXY_API_KEY` = the proxy's `FIBER_PROXY_API_KEY`

## Option B — Vercel CLI

```bash
npm i -g vercel
vercel login            # opens your browser / email flow
cd FiberX
vercel                  # first run: link/create the project, then deploys a preview
vercel --prod           # promote to production
```

The CLI also picks up `vercel.json`, so no extra flags are needed.

## Notes

- Vercel auto-detects pnpm from `pnpm-lock.yaml` and honours the
  `packageManager` field in the root `package.json`.
- `build:libs` compiles `@fiberx/core` and `@fiberx/react` (tsup) before the
  demo's `vite build`, which consumes their `dist` output.
- The SPA `rewrites` rule serves `index.html` for all routes so client-side
  navigation/deep links don't 404.
