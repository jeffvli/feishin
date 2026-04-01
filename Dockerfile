# --- Builder stage
FROM node:23-alpine AS builder
WORKDIR /app

# Copy package.json first to cache node_modules
COPY package.json pnpm-lock.yaml .

RUN npm install -g pnpm

RUN pnpm install

# Copy code and build with cached modules
COPY . .
RUN pnpm run build:web

# --- Production stage
FROM nginxinc/nginx-unprivileged:alpine-slim

COPY --chown=nginx:nginx --from=builder /app/out/web /usr/share/nginx/html
COPY --chown=nginx:nginx ./settings.js.template /etc/nginx/templates/settings.js.template
COPY --chown=nginx:nginx ng.conf.template /etc/nginx/templates/default.conf.template

ENV SERVER_LOCK=false SERVER_NAME="" SERVER_TYPE="" SERVER_URL="" REMOTE_URL=""
ENV LEGACY_AUTHENTICATION="" ANALYTICS_DISABLED="" PUBLIC_PATH="/"

EXPOSE 9180
CMD ["nginx", "-g", "daemon off;"]
