# --- Builder stage
FROM node:18-alpine as builder
WORKDIR /app
COPY . /app

# Scripts include electron-specific dependencies, which we don't need
RUN npm install --legacy-peer-deps --ignore-scripts
RUN npm run build:web

# --- Production stage
FROM nginx:alpine-slim

COPY --chown=nginx:nginx --from=builder /app/release/app/dist/web /usr/share/nginx/html
COPY ng.conf.template /etc/nginx/templates/default.conf.template

ENV PUBLIC_PATH="/" FS_SERVER_NAME="" FS_SERVER_URL="" FS_SERVER_TYPE="" FS_SERVER_USERNAME="" FS_SERVER_PASSWORD=""
EXPOSE 9180
CMD ["nginx", "-g", "daemon off;"]
