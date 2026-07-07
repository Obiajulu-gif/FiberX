# Deploying the FiberX proxy to Render

The **demo frontend** lives on Vercel (static, mock mode). The **proxy backend**
(`apps/proxy`) is a long-running Fastify server, which is a better fit for
Render. You only need this if you want the hosted demo to talk to a proxy /
real Fiber node — the Vercel demo works on its own in mock mode without it.

The repo ships a [`render.yaml`](../render.yaml) blueprint, so deploying is a few
clicks.

## Option A — Blueprint (recommended)

1. Push this repo to GitHub (already done: `Obiajulu-gif/FiberX`).
2. Go to <https://dashboard.render.com> → **New** → **Blueprint**.
3. Select the `FiberX` repo. Render reads `render.yaml` and proposes a
   `fiberx-proxy` web service.
4. Click **Apply**. Render runs:
   - build: `pnpm install && build @fiberx/core && build @fiberx/proxy`
   - start: `node apps/proxy/dist/index.js`
5. When it goes live you'll get a URL like `https://fiberx-proxy.onrender.com`.
   Health check: `GET /health` should return `{"ok":true,"mode":"mock",...}`.

`FIBER_PROXY_API_KEY` is auto-generated — copy its value from the Render
dashboard (Environment tab); you'll need it in the next step.

## Option B — Manual web service

New → **Web Service** → connect the repo, then set:

| Field | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install -g pnpm@10.28.2 && pnpm install --no-frozen-lockfile && pnpm --filter @fiberx/core build && pnpm --filter @fiberx/proxy build` |
| Start Command | `node apps/proxy/dist/index.js` |
| Health Check Path | `/health` |

Environment variables: `FIBER_PROXY_MODE=mock`, `FIBER_PROXY_API_KEY=<a secret>`,
`CORS_ORIGIN=https://<your-demo>.vercel.app`, `LOG_LEVEL=info`.

> Render injects its own `PORT`; the proxy already binds to `0.0.0.0:$PORT`, so
> no port config is needed.

## Option C — Docker

A [`apps/proxy/Dockerfile`](../apps/proxy/Dockerfile) is included. On Render pick
**Runtime = Docker**, Dockerfile path `./apps/proxy/Dockerfile`, and Docker
context `.` (repo root).

## Wire the Vercel demo to the Render proxy

By default the hosted demo only offers the **Mock** wallet. To make the
**Proxy Wallet** option appear and hit your Render service, set these in the
Vercel project (Settings → Environment Variables) and redeploy:

- `VITE_PROXY_URL` = `https://fiberx-proxy.onrender.com`
- `VITE_PROXY_API_KEY` = the `FIBER_PROXY_API_KEY` value from Render

Then tighten CORS on Render:

- `CORS_ORIGIN` = `https://<your-demo>.vercel.app`

Now open the demo, click **Connect Fiber Wallet → Fiber Proxy Wallet**, and the
browser will round-trip through the Render proxy.

## Going to a real Fiber node

On the Render service set:

- `FIBER_PROXY_MODE` = `real`
- `FIBER_RPC_URL` = your node's JSON-RPC URL (e.g. `http://host:8227`)

If the node is unreachable the proxy returns a clear `502` explaining to check
`FIBER_RPC_URL` and node status. See [deploy-real-fiber.md](deploy-real-fiber.md)
for running an actual FNN.

## Troubleshooting

**`Error: Cannot find matching keyid` during build.** This is a corepack bug:
the corepack bundled with Node 20.x ships stale package-manager signing keys and
fails to verify pnpm. The blueprint avoids corepack entirely by installing pnpm
with `npm install -g pnpm@10.28.2`. If you hand-wrote a build command that starts
with `corepack enable`, replace it with the `npm install -g pnpm@...` command
shown above.

## Notes on the free plan

Render's free web services spin down after inactivity, so the first request
after idle can take ~30s to cold-start. That's fine for a demo; use a paid
instance for anything latency-sensitive.
