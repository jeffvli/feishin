# --- Builder stage
FROM node:18-alpine as builder
WORKDIR /app

#Copy package.json first to cache node_modules
COPY package.json package-lock.json .
# Scripts include electron-specific dependencies, which we don't need
RUN npm install --legacy-peer-deps --ignore-scripts
#Copy code and build with cached modules
COPY . .
RUN npm run build:web

# --- Production stage
FROM nginx:alpine-slim

COPY --chown=nginx:nginx --from=builder /app/release/app/dist/web /usr/share/nginx/html
COPY ng.conf.template /etc/nginx/templates/default.conf.template

ENV PUBLIC_PATH="/"
EXPOSE 9180
CMD ["nginx", "-g", "daemon off;"]
