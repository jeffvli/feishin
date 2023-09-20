# --- Builder stage
FROM node:18-alpine as builder
WORKDIR /app
COPY . /app

# Scripts include electron-specific dependencies, which we don't need
RUN npm install --legacy-peer-deps --ignore-scripts
RUN npm run build:web

# --- Production stage
FROM nginx:alpine-slim

COPY --from=builder /app/release/app/dist/web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 9180
CMD ["nginx", "-g", "daemon off;"]
