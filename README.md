# Feishin

  <p align="center">
    <a href="https://github.com/jeffvli/feishin/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/jeffvli/feishin?style=flat-square&color=brightgreen"
      alt="License">
    </a>
        <a href="https://github.com/jeffvli/feishin/releases">
      <img src="https://img.shields.io/github/v/release/jeffvli/feishin?style=flat-square&color=blue"
      alt="Release">
    </a>
    <a href="https://github.com/jeffvli/feishin/releases">
      <img src="https://img.shields.io/github/downloads/jeffvli/feishin/total?style=flat-square&color=orange"
      alt="Downloads">
    </a>
      <a href="https://hub.docker.com/r/jeffvictorli/feishin">
      <img src="https://img.shields.io/docker/v/jeffvictorli/feishin?style=flat-square&color=orange"
      alt="Docker">
    </a>
    </a>
      <a href="https://hub.docker.com/r/jeffvictorli/feishin">
      <img src="https://img.shields.io/docker/pulls/jeffvictorli/feishin?style=flat-square&color=orange"
      alt="Docker pulls">
    </a>
  </p>
  <p align="center">
    <a href="https://discord.gg/FVKpcMDy5f">
      <img src="https://img.shields.io/discord/922656312888811530?color=black&label=discord&logo=discord&logoColor=white"
      alt="Discord">
    </a>
    <a href="https://matrix.to/#/#sonixd:matrix.org">
      <img src="https://img.shields.io/matrix/sonixd:matrix.org?color=black&label=matrix&logo=matrix&logoColor=white"
      alt="Matrix">
    </a>
  </p>

Repository for the rewrite of [Sonixd](https://github.com/jeffvli/sonixd).

## Getting Started

The default credentials to login will be `admin/admin`.

Download the [latest desktop client](https://github.com/jeffvli/feishin/releases).

### Docker Compose

**Warning:** Check the environment variable configuration before running the commands below.

1. Copy and rename [example.env](https://github.com/jeffvli/feishin/blob/dev/example.env) to `.env` and make any changes necessary
2. Run the compose file: `docker compose --file docker-compose.yml --env-file .env up`

### Docker

**Warning:** Check the environment variable configuration before running the commands below.

**Run a postgres database container:**

```
docker run postgres:13 \
  -p 5432:5432 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=feishin
```

**Run the Feishin server container:**

```
docker run jeffvictorli/feishin:latest \
  -p 8643:9321 \
  -e APP_BASE_URL=http://192.168.0.1:8643 \
  -e DATABASE_PORT=5432 \
  -e DATABASE_URL=postgresql://admin:admin@localhost:5432/feishin?schema=public \
  -e TOKEN_SECRET=secret
```

**Docker Environment Variables**

```
APP_BASE_URL — The URL the site will be accessible at from your server (needed for CORS)

DATABASE_PORT — The port of your running postgres container

DATABASE_URL — The connection string to your postgres instance following this format: postgresql://<DB_USERNAME>:<DB_PASSWORD>@<DB_URL>/<DB_NAME>?schema=public

    Replace the following:
        <DB_USERNAME> — The admin username of your postgres container (POSTGRES_USER)
        <DB_PASSWORD> — The admin password of your postgres container (POSTGRES_PASSWORD)
        <DB_NAME> — The name of the database created in your postgres container (POSTGRES_DB)
        <DB_URL> — The URL the postgres container is reachable from

    Example: postgresql://admin:password@192.168.0.1:5432/feishin?schema=public

TOKEN_SECRET — The string used to sign auth tokens

(optional) TOKEN_EXPIRATION — The time before the auth JWT expires

(optional) TOKEN_REFRESH_EXPIRATION - The time before the auth JWT refresh token expires
```

### After installing the server and database

You can access the desktop client via the [latest release](https://github.com/jeffvli/feishin/releases), or you can visit the web client at your server URL (e.g http://192.168.0.1:8643).

## FAQ

### Why is there a red lock next to the server I want to select?

If the server is specified to "require user credentials", you will need to add and enable your own credentials to access it. Since the songs and images aren't proxied by the Feishin backend, the server credentials would otherwise be leaked to any user that has access to it. The added credentials are stored locally in the browser and are then used to generate the audio and image URLs in the client.

### What music servers does Feishin support?

Feishin supports any music server that implements a [Subsonic](http://www.subsonic.org/pages/api.jsp), [Navidrome](https://www.navidrome.org/), or [Jellyfin](https://jellyfin.org/) API.

- [Jellyfin](https://github.com/jellyfin/jellyfin)
- [Navidrome](https://github.com/navidrome/navidrome)
- [Airsonic](https://github.com/airsonic/airsonic)
- [Airsonic-Advanced](https://github.com/airsonic-advanced/airsonic-advanced)
- [Gonic](https://github.com/sentriz/gonic)
- [Astiga](https://asti.ga/)
- [Supysonic](https://github.com/spl0k/supysonic)

### Why does Feishin use its own database and backend instead of just use (insert music server)'s API?

Feishin was an idea I had after I ran into usage limitations while building out [Sonixd](https://github.com/jeffvli/sonixd). Each music server has their own quirks, and I decided I wanted to consolidate and extend their features with my own backend implemntation which includes: web/desktop clients, advanced filtering, smart playlists, desktop MPV player, and more.

### Can I use (insert database) instead of Postgresql?

Due to [Prisma limitations](https://www.prisma.io/docs/concepts/components/prisma-migrate/prisma-migrate-limitations-issues#you-cannot-automatically-switch-database-providers), there is no easy way to switch to a different database provider at this time.

## Development

Built and tested using Node `v16.15.0`.

This project is built off of [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) v4.6.0.

### Developing with Docker Compose

1. Copy and rename the `example.env` to `.env.dev` and make any changes necessary
2. **Run the server**: Use `npm run docker:up` to build and run the dev server
   1. Prisma studio available on `http://localhost:5555`
   2. Server available on `http://localhost:8643`
   3. Default seeded login credentials are `admin/admin`
3. **Run the client**: Use `npm run start` to run the development Electron client
   1. The web version of the client is available on `http://localhost:4343`

**Docker Compose files**

```
docker-compose.yml — The public compose file for running the latest release

docker-compose.dev.yml - Build and run the development environment locally (includes Prisma studio)

docker-compose.prod.yml - Build and run the production environment locally
```

### NPM Scripts:

```
$ npm run package — Packages the application for the local system

$ npm run start — Runs the development Electron and web client

$ npm run start:web — Runs the development web client

$ npm run docker:up — Builds and starts the docker development environment using the 'docker-compose.dev.yml' file

$ npm run docker:down — Stops the running docker development environment

$ npm run docker:dbpush — Pushes any schema changes made in 'schema.prisma' to the docker development database without migrating

$ npm run docker:migrate - Migrates any schema changes made in 'schema.prisma' and creates a migration file

$ npm run docker:createmigrate - Creates a migration file for any schema changes made in 'schema.prisma' without applying the migration

$ npm run docker:reset - Resets the docker development database and applies the default seed

$ npm run prod:buildserver - Builds and tags the server docker images locally with the 'latest' and '$VERSION' tags

$ npm run prod:publishserver - Pushes the locally build server docker images to docker hub
```

## License

[GNU General Public License v3.0 ©](https://github.com/jeffvli/sonixd-rewrite/blob/dev/LICENSE)
