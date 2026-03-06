<img src="assets/icons/icon.png" alt="logo" title="feishin" align="right" height="60px" width="60px" />

# Feishin — Mobile-Improved Fork

> This is a community fork of [jeffvli/feishin](https://github.com/jeffvli/feishin) focused on making Feishin a great **mobile browser** experience. All credit for the original app goes to jeffvli and the Feishin contributors.

<p align="center">
  <a href="https://github.com/jeffvli/feishin/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/jeffvli/feishin?style=flat-square&color=brightgreen" alt="License">
  </a>
</p>

---

## What's different in this fork

| Change | Why |
|--------|-----|
| **Safe-area insets** on the mobile playerbar | Fixes the bar being hidden behind iOS/Android browser chrome and home indicators |
| **Touch swipe** on carousels | Lets you swipe left/right through album, artist, and playlist carousels on a phone |
| **Skip error fix** | Suppresses the "Playback paused due to error" toast that Safari fires when you skip a track during crossfade |
| **Header badges hidden on mobile** | Removes the total-songs and total-duration pills on narrow screens so the page title fits |
| **Full mobile playerbar** | Stop · Shuffle · Previous · Play/Pause · Next · Repeat · Settings — plus a seek slider with elapsed/remaining time |
| **Playlists carousel on home page** | Your playlists are front and center instead of a feature slider (see the M3U tip below) |
| **Crossfade on by default** (3 s) | Songs blend into each other like a streaming app instead of stopping abruptly |
| **My Library collapsed by default** | Less visual clutter when you first open the sidebar |

---

## Requirements — you need a music server

Feishin is a **front-end only**. It streams music from one of these back-end servers:

| Server | Best for | Link |
|--------|----------|------|
| **Navidrome** ⭐ | Self-hosted, lightweight, great playlist support | [navidrome.org](https://www.navidrome.org/) |
| **Jellyfin** | Full media server (movies, TV, music) | [jellyfin.org](https://jellyfin.org/) |
| **OpenSubsonic-compatible** | Airsonic, Gonic, Ampache, Funkwhale, and others | [opensubsonic.netlify.app](https://opensubsonic.netlify.app/) |

> **Navidrome is the recommended choice** if you just want to self-host music. It is small, fast, and works perfectly with this fork.

---

## Quick start with Docker Compose

Clone this repo and copy the example compose file:

```bash
git clone https://github.com/Dennist03/feishin.git
cd feishin
```

Edit `docker-compose.yml` and fill in your server details, then:

```bash
docker compose up -d --build
```

Open `http://your-server-ip:9180` in any browser — including your phone.

```yaml
services:
  feishin:
    build: .
    container_name: feishin
    restart: unless-stopped
    ports:
      - "9180:9180"
    environment:
      # Optional: lock Feishin to your server so users only need to log in
      # - SERVER_NAME=My Music
      # - SERVER_TYPE=navidrome   # navidrome | jellyfin | subsonic
      # - SERVER_URL=https://your-navidrome-server.example.com
      # - SERVER_LOCK=true
```

---

## Setting up Navidrome

Navidrome is a self-hosted music server. It reads a folder of music files and turns them into a browsable, streamable library.

### Install with Docker Compose (recommended)

```yaml
services:
  navidrome:
    image: deluan/navidrome:latest
    container_name: navidrome
    restart: unless-stopped
    ports:
      - "4533:4533"
    environment:
      ND_SCANSCHEDULE: 1h
      ND_LOGLEVEL: info
      ND_SESSIONTIMEOUT: 72h    # keeps you logged in longer
      ND_BASEURL: ""
    volumes:
      - ./navidrome/data:/data          # database and config
      - /path/to/your/music:/music:ro   # your music folder (read-only)
```

1. Replace `/path/to/your/music` with the actual path to your music files.
2. Run `docker compose up -d`.
3. Open `http://your-server-ip:4533` and create your admin account.
4. Navidrome will scan your music folder and build the library automatically.

### Official Navidrome docs

- Full installation guide: [navidrome.org/docs/installation/](https://www.navidrome.org/docs/installation/)
- Docker setup: [navidrome.org/docs/installation/docker/](https://www.navidrome.org/docs/installation/docker/)
- Configuration options: [navidrome.org/docs/usage/configuration-options/](https://www.navidrome.org/docs/usage/configuration-options/)

---

## Building playlists with M3U files

> This is why the **Playlists carousel** is at the top of the home page in this fork — it's the fastest way to jump into music you care about.

Navidrome automatically imports `.m3u` playlist files it finds inside your music folder. You can use this to create playlists that group music by folder, mood, genre — anything you like.

### What is an M3U file?

An M3U file is a plain text file that lists paths to music files, one per line. Navidrome reads these files during a library scan and turns each one into a playlist.

### Example: create a playlist from a folder

Say your music is organized like this:

```
/music/
  Rock/
    Classic Rock/
      song1.mp3
      song2.mp3
    Punk/
      song3.mp3
  Jazz/
    Miles Davis/
      kind_of_blue.flac
```

Create a file called `Classic Rock.m3u` inside your music folder:

```
#EXTM3U
#PLAYLIST:Classic Rock

Rock/Classic Rock/song1.mp3
Rock/Classic Rock/song2.mp3
```

Or point to files anywhere in the library:

```
#EXTM3U
#PLAYLIST:Late Night Mix

Jazz/Miles Davis/kind_of_blue.flac
Rock/Classic Rock/song1.mp3
```

### Rules for M3U files in Navidrome

- **Place the `.m3u` file inside your music folder** (anywhere in the tree is fine).
- Paths in the file should be **relative to the music root folder**.
- The `#PLAYLIST:Name` line sets the playlist name shown in Feishin. If you leave it out, Navidrome uses the filename.
- Navidrome re-imports the playlist on every scheduled scan (or when you trigger a manual scan).
- Changes to the `.m3u` file are picked up on the next scan.

### Trigger a rescan after adding M3U files

In Navidrome's web UI: **Settings → Scan Library** (or wait for the scheduled scan). Once the scan finishes, your playlists will appear in Feishin's **Playlists** carousel on the home page.

---

## Original Feishin features

- Web player backend (runs in any browser)
- MPV player backend (desktop app only)
- Scrobble playback to your server (Last.fm, ListenBrainz via server)
- Smart playlist editor (Navidrome)
- Synchronized and unsynchronized lyrics
- Full keyboard and media-key support

For the full desktop app (Windows / macOS / Linux), download a release from the [original jeffvli/feishin repo](https://github.com/jeffvli/feishin/releases).

---

## Development

Built and tested using Node `v23.11.0` and `pnpm`.

```bash
pnpm install
pnpm run dev          # development server
pnpm run build:web    # build the web/Docker version
```

---

## Credits and License

Original app by [jeffvli](https://github.com/jeffvli/feishin) and contributors.
Mobile improvements in this fork contributed by the community.

[GNU General Public License v3.0](https://github.com/jeffvli/feishin/blob/dev/LICENSE)
