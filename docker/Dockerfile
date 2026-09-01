FROM node:24-bookworm-slim AS base

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,id=npm-cache,target=/root/.npm,sharing=locked \
    apt-get update -y \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@11.19.0

WORKDIR /app

FROM base AS dev-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile

FROM dev-deps AS builder

COPY . .

RUN pnpm exec prisma generate \
    && pnpm build \
    && rm -rf .next/cache

FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store,sharing=locked \
    pnpm install --prod --frozen-lockfile

FROM base AS runner

COPY --from=prod-deps --chown=node:node --chmod=777 /app/node_modules ./node_modules
COPY --from=builder   --chown=node:node --chmod=777 /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder   --chown=node:node --chmod=777 /app/.next         ./.next
COPY --from=builder   --chown=node:node --chmod=777 /app/public        ./public
COPY --from=builder   --chown=node:node --chmod=777 /app/prisma        ./prisma
COPY --from=builder   --chown=node:node --chmod=777 /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/next.config.ts /app/prisma.config.ts ./

RUN chown node:node /app && chmod 777 /app && mkdir /app/data && chmod 777 /app/data

USER node
EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && exec pnpm start"]
