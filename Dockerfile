# Stage 1 - Build frontend
FROM node:16.5-alpine as ui-builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build:renderer
RUN npm prune --production
RUN npm cache clean --force
RUN rm -rf /root/.cache

# Stage 2 - Build server
FROM node:16.5-alpine as server-builder
WORKDIR /app
COPY server .
RUN npm install && npx prisma generate
RUN npm run build
RUN npm prune --production
RUN npm cache clean --force
RUN rm -rf /root/.cache


# Stage 3 - Deploy
FROM node:16.5-alpine
WORKDIR /root
RUN mkdir appdata
RUN mkdir feishin-server
RUN mkdir feishin-client

RUN npm cache clean --force
RUN npm prune --production

# Add server build files
COPY --from=server-builder /app/dist ./feishin-server
COPY --from=server-builder /app/node_modules ./feishin-server/node_modules
COPY --from=server-builder /app/prisma ./feishin-server/prisma

# Add client build files
COPY --from=ui-builder /app/release/app/dist/renderer ./feishin-client

COPY docker-entrypoint.sh ./feishin-server/docker-entrypoint.sh
RUN chmod +x ./feishin-server/docker-entrypoint.sh

RUN npm install pm2 -g

WORKDIR /root/feishin-server

EXPOSE 9321
CMD ["sh", "docker-entrypoint.sh"]
