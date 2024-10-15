<img src="assets/icons/icon.png" alt="logo" title="feishin" align="right" height="60px" />

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

Rewrite of [Sonixd](https://github.com/jeffvli/sonixd).

## Features

-   [x] MPV player backend
-   [x] Web player backend
-   [x] Modern UI
-   [x] Scrobble playback to your server
-   [x] Smart playlist editor (Navidrome)
-   [x] Synchronized and unsynchronized lyrics support
-   [ ] [Request a feature](https://github.com/jeffvli/feishin/issues) or [view taskboard](https://github.com/users/jeffvli/projects/5/views/1)

## Screenshots

<a href="https://raw.githubusercontent.com/jeffvli/feishin/development/media/preview_full_screen_player.png"><img src="https://raw.githubusercontent.com/jeffvli/feishin/development/media/preview_full_screen_player.png" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/jeffvli/feishin/development/media/preview_album_artist_detail.png"><img src="https://raw.githubusercontent.com/jeffvli/feishin/development/media/preview_album_artist_detail.png" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/jeffvli/feishin/development/media/preview_album_detail.png"><img src="https://raw.githubusercontent.com/jeffvli/feishin/development/media/preview_album_detail.png" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/jeffvli/feishin/development/media/preview_smart_playlist.png"><img src="https://raw.githubusercontent.com/jeffvli/feishin/development/media/preview_smart_playlist.png" width="49.5%"/></a>

## Getting Started

### Desktop (recommended)

Download the [latest desktop client](https://github.com/jeffvli/feishin/releases). The desktop client is the recommended way to use Feishin. It supports both the MPV and web player backends, as well as includes built-in fetching for lyrics.

#### MacOS Notes

If you're using a device running macOS 12 (Monterey) or higher, [check here](https://github.com/jeffvli/feishin/issues/104#issuecomment-1553914730) for instructions on how to remove the app from quarantine.

For media keys to work, you will be prompted to allow Feishin to be a Trusted Accessibility Client. After allowing, you will need to restart Feishin for the privacy settings to take effect.

### Web and Docker

Visit [https://feishin.vercel.app](https://feishin.vercel.app) to use the hosted web version of Feishin. The web client only supports the web player backend.

Feishin is also available as a Docker image. The images are hosted via `ghcr.io` and are available to view [here](https://github.com/jeffvli/feishin/pkgs/container/feishin). You can run the container using the following commands:

```bash
# Run the latest version
docker run --name feishin -p 9180:9180 ghcr.io/jeffvli/feishin:latest

# Build the image locally
docker build -t feishin .
docker run --name feishin -p 9180:9180 feishin
```

#### Docker Compose

To install via Docker Compose use the following snippit. This also works on Portainer.

```
version: '3'
services:
  feishin:
    container_name: feishin
    image: 'ghcr.io/jeffvli/feishin:latest'
    environment:
      - SERVER_NAME=jellyfin # pre defined server name
      - SERVER_LOCK=true # When true AND name/type/url are set, only username/password can be toggled
      - SERVER_TYPE=jellyfin # navidrome also works
      - SERVER_URL= # http://address:port
      - PUID=1000
      - PGID=1000
      - UMASK=002
      - TZ=America/Los_Angeles
    ports:
      - 9180:9180
    restart: unless-stopped
```

### Configuration

1. Upon startup you will be greeted with a prompt to select the path to your MPV binary. If you do not have MPV installed, you can download it [here](https://mpv.io/installation/) or install it using any package manager supported by your OS. After inputting the path, restart the app.

2. After restarting the app, you will be prompted to select a server. Click the `Open menu` button and select `Manage servers`. Click the `Add server` button in the popup and fill out all applicable details. You will need to enter the full URL to your server, including the protocol and port if applicable (e.g. `https://navidrome.my-server.com` or `http://192.168.0.1:4533`).

-   **Navidrome** - For the best experience, select "Save password" when creating the server and configure the `SessionTimeout` setting in your Navidrome config to a larger value (e.g. 72h).
    -   **Linux users** - The default password store uses `libsecret`. `kwallet4/5/6` are also supported, but must be explicitly set in Settings > Window > Passwords/secret score.

3. _Optional_ - If you want to host Feishin on a subpath (not `/`), then pass in the following environment variable: `PUBLIC_PATH=PATH`. For example, to host on `/feishin`, pass in `PUBLIC_PATH=/feishin`.

4. _Optional_ - To hard code the server url, pass the following environment variables: `SERVER_NAME`, `SERVER_TYPE` (one of `jellyfin` or `navidrome`), `SERVER_URL`. To prevent users from changing these settings, pass `SERVER_LOCK=true`. This can only be set if all three of the previous values are set.

## FAQ

### MPV is either not working or is rapidly switching between pause/play states

First thing to do is check that your MPV binary path is correct. Navigate to the settings page and re-set the path and restart the app. If your issue still isn't resolved, try reinstalling MPV. Known working versions include `v0.35.x` and `v0.36.x`. `v0.34.x` is a known broken version.

### What music servers does Feishin support?

Feishin supports any music server that implements a [Navidrome](https://www.navidrome.org/) or [Jellyfin](https://jellyfin.org/) API. **Subsonic API is not currently supported**. This will likely be added in [later when the new Subsonic API is decided on](https://support.symfonium.app/t/subsonic-servers-participation/1233).

-   [Navidrome](https://github.com/navidrome/navidrome)
-   [Jellyfin](https://github.com/jellyfin/jellyfin)
-   Subsonic-compatible servers
    -   [Airsonic-Advanced](https://github.com/airsonic-advanced/airsonic-advanced)
    -   [Ampache](https://ampache.org)
    -   [Astiga](https://asti.ga/)
    -   [Funkwhale](https://www.funkwhale.audio/)
    -   [Gonic](https://github.com/sentriz/gonic)
    -   [LMS](https://github.com/epoupon/lms)
    -   [Nextcloud Music](https://apps.nextcloud.com/apps/music)
    -   [Supysonic](https://github.com/spl0k/supysonic)
    -   More (?)

### I have the issue "The SUID sandbox helper binary was found, but is not configured correctly" on Linux

This happens when you have user (unprivileged) namespaces disabled (`sysctl kernel.unprivileged_userns_clone` returns 0). You can fix this by either enabling unprivileged namespaces, or by making the `chrome-sandbox` Setuid.

```bash
chmod 4755 chrome-sandbox
sudo chown root:root chrome-sandbox
```

Ubunutu 24.04 specifically introduced breaking changes that affect how namespaces work. Please see https://discourse.ubuntu.com/t/ubuntu-24-04-lts-noble-numbat-release-notes/39890#:~:text=security%20improvements%20 for possible fixes.

## Development

Built and tested using Node `v16.15.0`.

This project is built off of [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) v4.6.0.

## Translation

This project uses [Weblate](https://hosted.weblate.org/projects/feishin/) for translations. If you would like to contribute, please visit the link and submit a translation.

## License

[GNU General Public License v3.0 ©](https://github.com/jeffvli/feishin/blob/dev/LICENSE)
