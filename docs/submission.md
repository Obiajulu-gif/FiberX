# FiberX — Hackathon Submission

## Project summary

**FiberX — Fiber Wallet Connect SDK.** Reusable infrastructure that lets any web
app connect to a Fiber wallet/provider, create invoices, check payment readiness
("Can I pay?"), send payments, and render payment status — with an optional
secure server-side proxy for real Fiber Network Node integration. Fully testable
with **no** Fiber node via a built-in mock provider and mock proxy mode.

## Category

**Wallet and Payment UX Infrastructure** (Part 1 — infrastructure phase).

## Team members

- _<add name / handle here>_

## Links

- Repository: _<add GitHub URL here>_
- Demo video: _<add video URL here>_
- Live demo (optional): _<add hosted URL here>_

## Technical breakdown

- **Monorepo:** pnpm workspaces, TypeScript (strict), tsup, Vitest, Playwright.
- **`@fiberx/core`:** `FiberProvider` interface; `MockFiberProvider`,
  `ProxyFiberProvider`, `FiberRpcProvider`; typed event emitter; `fiber:`
  payment-request codec (base64url + Zod); precision-safe hex↔decimal; a pure
  readiness engine; dedicated error classes.
- **`@fiberx/react`:** context provider, six hooks, seven UI components, local
  namespaced CSS.
- **`@fiberx/proxy`:** Fastify server with API-key auth, CORS, rate limiting, an
  operation allow-list (no raw RPC passthrough), and mock/real modes.
- **`@fiberx/demo`:** Vite + React playground exercising the full flow.
- **Tests:** 49 unit/integration tests (core 32, proxy 9, react 8) + Playwright
  e2e covering the happy path and the insufficient-capacity failure path.

## Fiber infrastructure gap addressed

There is no standard, safe, reusable way for web apps to talk to Fiber wallets
and nodes. Developers currently re-implement RPC normalisation, browser-safety,
and connect/pay UX for every project. FiberX provides that shared layer and
isolates all evolving Fiber RPC in a single compatibility file, so integrators
are insulated from RPC churn.

## Judging-criteria mapping

- **Functional completeness / user flow:** end-to-end connect → invoice →
  readiness → pay → status, demonstrated live and in e2e tests.
- **Relevance & fit:** squarely Wallet/Payment UX infrastructure for Fiber.
- **Usefulness / reusability / integration potential:** publishable packages;
  swap mock → proxy → real node with no app changes.
- **Technical soundness / maintainability:** strict types, Zod validation, error
  classes, one RPC compatibility layer, tests.
- **Documentation:** README + architecture, API, RPC mapping, demo script,
  roadmap.
- **Continued development:** concrete near/long-term roadmap.

## Future roadmap

See [roadmap.md](roadmap.md).

## AI usage note

_<Describe AI assistance used, per hackathon rules. This project was scaffolded
and implemented with AI pair-programming; all code was reviewed, executed, and
tested locally.>_
