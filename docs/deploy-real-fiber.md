# Deploying FiberX with a real Fiber Network Node

FiberX has two runtime modes:

- **Mock mode**: the hosted demo is fully testable without external services.
- **Real mode**: the browser talks to the FiberX proxy, and the proxy talks to a
  real Fiber Network Node JSON-RPC endpoint.

Fiber is a payment-channel network, not a web-hosting platform. The correct
"real Fiber" deployment is therefore:

```text
Browser demo / app
  -> FiberX proxy over HTTPS
    -> local/private Fiber Network Node JSON-RPC
      -> Fiber Network channels/payments
```

Do **not** expose the Fiber node JSON-RPC port directly to the internet. Keep it
bound to localhost/private networking and expose only the FiberX proxy.

## 1. What is already implemented

The repo already contains the real-mode integration path:

- `@fiberx/core` has `FiberRpcProvider`, the Fiber JSON-RPC compatibility layer.
- `@fiberx/proxy` has `FIBER_PROXY_MODE=real`.
- In real mode, `@fiberx/proxy` forwards the allowed app operations to
  `FIBER_RPC_URL`.
- `@fiberx/demo` can use a hosted proxy when `VITE_PROXY_URL` and
  `VITE_PROXY_API_KEY` are configured.

The proxy intentionally exposes a curated REST API instead of arbitrary RPC
passthrough.

## 2. Requirements

You need a server or VPS that can run:

- Node.js 20+ or Docker
- a Fiber Network Node
- the FiberX proxy
- HTTPS termination, usually Nginx/Caddy/Traefik or a hosting provider

You also need CKB testnet funds for real testnet channels/payments.

## 3. Run a Fiber Network Node

Follow the current official Fiber Network Node instructions from the Fiber repo
or hackathon resources. Once the node is running, confirm that JSON-RPC works
locally from the same machine:

```bash
curl -X POST http://127.0.0.1:8227 \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"node_info","params":[]}'
```

Expected result: a JSON-RPC response containing node information.

If this fails, fix the Fiber node before deploying FiberX.

## 4. Configure the proxy in real mode

Create the real env file:

```bash
cp apps/proxy/.env.real.example apps/proxy/.env.real
```

Edit it:

```env
NODE_ENV=production
PORT=3099
LOG_LEVEL=info
FIBER_PROXY_MODE=real
FIBER_RPC_URL=http://127.0.0.1:8227
FIBER_PROXY_API_KEY=replace-with-a-generated-secret
CORS_ORIGIN=https://fiber-x-demo.vercel.app
```

Generate a strong proxy key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 5. Deploy option A: Node process

```bash
pnpm install --frozen-lockfile
pnpm --filter @fiberx/core build
pnpm --filter @fiberx/proxy build

set -a
source apps/proxy/.env.real
set +a

pnpm --filter @fiberx/proxy start
```

Then test:

```bash
curl http://localhost:3099/health
curl -H "x-fiber-connect-key: $FIBER_PROXY_API_KEY" \
  http://localhost:3099/api/node-info
```

## 6. Deploy option B: Docker Compose

```bash
cp apps/proxy/.env.real.example apps/proxy/.env.real
# edit apps/proxy/.env.real

docker compose -f docker-compose.fiber-real.yml up --build -d
```

Then test:

```bash
curl http://localhost:3099/health
curl -H "x-fiber-connect-key: YOUR_KEY" http://localhost:3099/api/node-info
```

If your Fiber node is running on the Docker host rather than inside the same
container network, set `FIBER_RPC_URL` to an address the container can reach.

## 7. Put HTTPS in front of the proxy

Use your server/domain, for example:

```text
https://fiberx-proxy.your-domain.com -> http://127.0.0.1:3099
```

Make sure the proxy response to `/health` is public and `/api/*` requires:

```http
x-fiber-connect-key: YOUR_KEY
```

## 8. Point the hosted demo at the real proxy

In the Vercel project for the demo, add environment variables:

```env
VITE_PROXY_URL=https://fiberx-proxy.your-domain.com
VITE_PROXY_API_KEY=the-same-proxy-key
```

Redeploy the demo. The hosted app will now show the **Fiber Proxy Wallet** option
in the connect modal. Select that provider to test against the real Fiber node.

## 9. Judge testing checklist

With a real node/proxy configured, judges can verify:

1. Open the hosted demo.
2. Click **Connect Fiber Wallet**.
3. Select **Fiber Proxy Wallet**.
4. Confirm the node info comes from the real Fiber node.
5. Create an invoice.
6. Run **Can I pay?**.
7. Send a payment if the node has channels, liquidity, and route availability.
8. Watch the SDK event timeline update.

## 10. What may still fail in real mode

Real mode depends on the state of the Fiber node and network. A payment can fail
if:

- the node has no peers;
- no channel is open;
- channels are not ready;
- outbound liquidity is insufficient;
- the asset is unsupported;
- the invoice format changed in Fiber RPC;
- the route is unavailable;
- CORS/API key values do not match.

These are expected operational states. FiberX should surface them as clear proxy
or readiness errors rather than silently failing.

## 11. Submission wording

Use this wording in the hackathon submission:

> FiberX is fully functional in mock mode for repeatable judging. It also includes
> a real Fiber Network Node integration path through a secure proxy. To run real
> payments, deploy the proxy next to a funded Fiber node with ready channels and
> set `FIBER_PROXY_MODE=real`, `FIBER_RPC_URL`, `FIBER_PROXY_API_KEY`, and the
> hosted demo's `VITE_PROXY_URL`/`VITE_PROXY_API_KEY`.
