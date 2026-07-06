# syntax=docker/dockerfile:1
# Build with repository root as context:
# docker build -f apps/proxy/Dockerfile -t fiberx-proxy .

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/proxy ./apps/proxy

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @fiberx/core build && pnpm --filter @fiberx/proxy build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3099
RUN corepack enable

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/apps/proxy/package.json ./apps/proxy/package.json
COPY --from=builder /app/apps/proxy/dist ./apps/proxy/dist

EXPOSE 3099
CMD ["node", "apps/proxy/dist/index.js"]
