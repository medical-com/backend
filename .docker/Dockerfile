# Stage 1: Build application
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build


# Stage 2: Production dependencies
FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev


# Stage 3: Production image
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/tsconfig.json ./tsconfig.json

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]