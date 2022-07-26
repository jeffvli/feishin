# Stage 1 - Build frontend
FROM node:16.5-alpine as ui-builder
WORKDIR /app
COPY . .
RUN npm install && npm run build:renderer

# Stage 2 - Build server
FROM node:16.5-alpine as server-builder
WORKDIR /app
COPY src/server .
RUN ls -lh
RUN npm install
RUN npm run build

# Stage 3 - Deploy
FROM node:16.5-alpine
WORKDIR /root
RUN mkdir appdata
RUN mkdir sonixd-server
RUN mkdir sonixd-client

# Install server modules
COPY src/server/package.json ./sonixd-server
RUN cd ./sonixd-server && npm install --production

# Add server build files
COPY --from=server-builder /app/dist ./sonixd-server
COPY --from=server-builder /app/prisma ./sonixd-server/prisma

# Add client build files
COPY --from=ui-builder /app/release/app/dist/renderer ./sonixd-client

COPY docker-entrypoint.sh ./sonixd-server/docker-entrypoint.sh
RUN chmod +x ./sonixd-server/docker-entrypoint.sh

RUN cd ./sonixd-server && npx prisma generate
RUN npm install pm2 -g

WORKDIR /root/sonixd-server

EXPOSE 9321
CMD ["sh", "docker-entrypoint.sh"]
