FROM node:16.5-alpine

ARG DATABASE_PORT

ADD docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

COPY ./wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Change directory so that our commands run inside this new directory
WORKDIR /app

# Copy dependency definitions
COPY package.*json ./
COPY prisma ./

# Install dependecies
RUN npm install

# Get all the code needed to run the app
COPY . .

# Expose the port the app runs in
EXPOSE 9321

# Serve the app
ENTRYPOINT ./docker-entrypoint.sh $DATABASE_PORT
