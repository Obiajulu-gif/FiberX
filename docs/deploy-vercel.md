# Deploying the FiberX demo to Vercel

The demo (`apps/demo`) is a static Vite + React SPA. On the hosted build it runs
entirely in **mock mode** — no Fiber node and no proxy are required, so it works
as a zero-backend showcase. (The "Proxy Wallet" option is automatically hidden
in production unless you set `VITE_PROXY_URL`.)

The repository supports two Vercel layouts:

- **Repository root** deployments using the root [`vercel.json`](../vercel.json).
- **`apps/demo` root-directory** deployments using [`apps/demo/vercel.json`](../apps/demo/vercel.json).

The second config exists because some Vercel imports set the Root Directory to
`apps/demo`. The demo package also exposes a `build:libs` script, so project-level
build commands like `pnpm build:libs && pnpm --filter @fiberx/demo build` work
from either the repository root or the demo package directory.

## Option A — Import the GitHub repo at repository root

1. Go to <https://vercel.com/new>.
2. **Import** `Obiajulu-gif/FiberX`.
3. Leave **Root Directory** as the repository root (`./`).
4. Vercel reads the root `vercel.json`, so Build/Install/Output are pre-filled.
   Framework preset can stay "Other".
5. Click **Deploy**. You'll get a URL like `https://fiberx.vercel.app`.

Root config summary:

```json
{
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "pnpm --filter @fiberx/core build && pnpm --filter @fiberx/react build && pnpm --filter @fiberx/demo build -- --outDir ../../dist --emptyOutDir",
  "outputDirectory": "dist"
}
```

## Option B — Import with Root Directory = `apps/demo`

This also works. Vercel will use `apps/demo/vercel.json`:

```json
{
  "installCommand": "cd ../.. && pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @fiberx/core build && pnpm --filter @fiberx/react build && pnpm --filter @fiberx/demo build",
  "outputDirectory": "dist"
}
```

If your Vercel project has a custom Build Command set in the dashboard, use one
of these safe commands:

```bash
# From repository root
pnpm --filter @fiberx/core build && pnpm --filter @fiberx/react build && pnpm --filter @fiberx/demo build -- --outDir ../../dist --emptyOutDir

# From apps/demo
pnpm build:libs && pnpm --filter @fiberx/demo build
```

Every push to `main` will auto-deploy.

### Optional: enable the Proxy Wallet on the hosted demo

By default the hosted demo only offers the Mock wallet. If you also deploy the
proxy somewhere (e.g. a small Node host) and want the demo to use it, add these
Environment Variables in the Vercel project settings and redeploy:

- `VITE_PROXY_URL` = your proxy URL (e.g. `https://your-proxy.example.com`)
- `VITE_PROXY_API_KEY` = the proxy's `FIBER_PROXY_API_KEY`

## Option C — Vercel CLI

```bash
npm i -g vercel
vercel login            # opens your browser / email flow
cd FiberX
vercel                  # first run: link/create the project, then deploys a preview
vercel --prod           # promote to production
```

The CLI picks up the relevant `vercel.json` based on your chosen root directory.

## Notes

- Vercel auto-detects pnpm from `pnpm-lock.yaml` and honours the
  `packageManager` field in the root `package.json`.
- The build compiles `@fiberx/core` and `@fiberx/react` (tsup) before the
  demo's `vite build`, which consumes their `dist` output.
- The repository-root build writes to the repository-level `dist` folder.
- The `apps/demo` root-directory build writes to `apps/demo/dist`.
- The SPA `rewrites` rule serves `index.html` for all routes so client-side
  navigation/deep links don't 404.
