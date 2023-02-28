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

- [x] MPV player backend
- [x] Web player backend
- [x] Modern UI
- [x] Scrobble playback to your server
- [x] Smart playlist editor (Navidrome)
- [ ] [Request a feature](https://github.com/jeffvli/feishin/issues) or [view taskboard](https://github.com/users/jeffvli/projects/5/views/1)

## Screenshots

<a href="https://raw.githubusercontent.com/jeffvli/feishin/development/assets/media/preview_home.png"><img src="https://raw.githubusercontent.com/jeffvli/feishin/development/assets/media/preview_home.png" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/jeffvli/feishin/development/assets/media/preview_album_artist_detail.png"><img src="https://raw.githubusercontent.com/jeffvli/feishin/development/assets/media/preview_album_artist_detail.png" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/jeffvli/feishin/development/assets/media/preview_album_detail.png"><img src="https://raw.githubusercontent.com/jeffvli/feishin/development/assets/media/preview_album_detail.png" width="49.5%"/></a> <a href="https://raw.githubusercontent.com/jeffvli/feishin/development/assets/media/preview_smart_playlist.png"><img src="https://raw.githubusercontent.com/jeffvli/feishin/development/assets/media/preview_smart_playlist.png" width="49.5%"/></a>

## Getting Started

Download the [latest desktop client](https://github.com/jeffvli/feishin/releases).

## FAQ

### What music servers does Feishin support?

Feishin supports any music server that implements a [Navidrome](https://www.navidrome.org/) or [Jellyfin](https://jellyfin.org/) API. **Subsonic API is not currently supported**. This will likely be added in [later when the new Subsonic API is decided on](https://support.symfonium.app/t/subsonic-servers-participation/1233).

- [Navidrome](https://github.com/navidrome/navidrome)
- [Jellyfin](https://github.com/jellyfin/jellyfin)
- ~~[Gonic](https://github.com/sentriz/gonic)~~
- ~~[Astiga](https://asti.ga/)~~
- ~~[Supysonic](https://github.com/spl0k/supysonic)~~

## Development

Built and tested using Node `v16.15.0`.

This project is built off of [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) v4.6.0.

## License

[GNU General Public License v3.0 ©](https://github.com/jeffvli/feishin/blob/dev/LICENSE)
