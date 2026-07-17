FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/

COPY tsconfig.base.json ./
COPY shared/ ./shared/
COPY backend/ ./backend/

RUN npm ci --workspaces --if-present

RUN npm run build --workspace=shared
RUN npm run build --workspace=backend

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder --chown=app:app /app/backend/dist ./dist
COPY --from=builder --chown=app:app /app/shared/dist ./shared/dist
COPY --from=builder --chown=app:app /app/backend/package.json ./
COPY --from=builder --chown=app:app /app/node_modules ./node_modules

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
