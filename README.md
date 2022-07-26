<img src="assets/icon.png" alt="sonixd logo" title="sonixd" align="right" height="60px" />

# Sonixd

  <a href="https://github.com/jeffvli/sonixd/releases">
    <img src="https://img.shields.io/github/v/release/jeffvli/sonixd?style=flat-square&color=blue"
    alt="Release">
  </a>
  <a href="https://github.com/jeffvli/sonixd/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/jeffvli/sonixd?style=flat-square&color=brightgreen"
    alt="License">
  </a>
  <a href="https://github.com/jeffvli/sonixd/releases">
    <img src="https://img.shields.io/github/downloads/jeffvli/sonixd/total?style=flat-square&color=orange"
    alt="Downloads">
  </a>
  <a href="https://discord.gg/FVKpcMDy5f">
    <img src="https://img.shields.io/discord/922656312888811530?color=red&label=discord&logo=discord&logoColor=white"
    alt="Discord">
  </a>
  <a href="https://matrix.to/#/#sonixd:matrix.org">
    <img src="https://img.shields.io/matrix/sonixd:matrix.org?color=red&label=matrix&logo=matrix&logoColor=white"
    alt="Matrix">
  </a>

Sonixd is a cross-platform desktop client built for Subsonic-API (and Jellyfin in 0.8.0+) compatible music servers. This project was inspired by the many existing clients, but aimed to address a few key issues including <strong>scalability</strong>, <strong>library management</strong>, and <strong>user experience</strong>.

- [**Usage documentation & FAQ**](https://github.com/jeffvli/sonixd/discussions/15)
- [**Theming documentation**](https://github.com/jeffvli/sonixd/discussions/61)

Sonixd has been tested on the following: [Navidrome](https://github.com/navidrome/navidrome), [Airsonic](https://github.com/airsonic/airsonic), [Airsonic-Advanced](https://github.com/airsonic-advanced/airsonic-advanced), [Gonic](https://github.com/sentriz/gonic), [Astiga](https://asti.ga/), [Jellyfin](https://github.com/jellyfin/jellyfin)

### [Demo Sonixd using Navidrome](https://github.com/jeffvli/sonixd/discussions/244)

## Features

- HTML5 audio with crossfading and gapless\* playback
- Drag and drop rows with multi-select
- Modify and save playlists intuitively
- Handles large playlists and queues
- Global mediakeys (and partial MPRIS) support
- Multi-theme support
- Supports all Subsonic/Jellyfin API compatible servers
- Built with Electron, React with the [rsuite v4](https://github.com/rsuite/rsuite) component library

<h5>* Gapless playback is artifically created using the crossfading players so it may not be perfect, YMMV.</h5>

## Screenshots

<a href="https://raw.githubusercontent.com/jeffvli/sonixd/main/assets/screenshots/0.13.1/album.png"><img src="https://raw.githubusercontent.com/jeffvli/sonixd/main/assets/screenshots/0.13.1/album.png" width="49.5%"/></a>
<a href="https://raw.githubusercontent.com/jeffvli/sonixd/main/assets/screenshots/0.13.1/artist.png"><img src="https://raw.githubusercontent.com/jeffvli/sonixd/main/assets/screenshots/0.13.1/artist.png" width="49.5%"/></a>
<a href="https://raw.githubusercontent.com/jeffvli/sonixd/main/assets/screenshots/0.13.1/search.png"><img src="https://raw.githubusercontent.com/jeffvli/sonixd/main/assets/screenshots/0.13.1/search.png" width="49.5%"/></a>
<a href="https://raw.githubusercontent.com/jeffvli/sonixd/main/assets/screenshots/0.13.1/now_playing.png"><img src="https://raw.githubusercontent.com/jeffvli/sonixd/main/assets/screenshots/0.13.1/now_playing.png" width="49.5%"/></a>

## Install

You can install sonixd by downloading the [latest release](https://github.com/jeffvli/sonixd/releases) for your specified operating system.

---

### Windows

If you prefer not to download the release binary, you can install using `winget`.

Using your favorite terminal (cmd/pwsh):

```
winget install sonixd
```

---

### Arch Linux

There is an AUR package of the latest AppImage release available [here](https://aur.archlinux.org/packages/sonixd-appimage).

To install it you can use your favourite AUR package manager and install the package: `sonixd-appimage`

For example using `yay`:

```
yay -S sonixd-appimage
```

If you encounter any problems please comment on the [AUR](https://aur.archlinux.org/packages/sonixd-appimage) or contact the [maintainer](mailto:robin@blckct.io) directly before you open an issue here.

---

Once installed, run the application and sign in to your music server with the following details. If you are using [airsonic-advanced](https://github.com/airsonic-advanced/airsonic-advanced), you will need to make sure that you create a `decodable` credential for your login user within the admin control panel.

- Server - `e.g. http://localhost:4040/`
- User name - `e.g. admin`
- Password - `e.g. supersecret!`

If you have any questions, feel free to check out the [Usage Documentation & FAQ](https://github.com/jeffvli/sonixd/discussions/15).

## Development / Contributing

This project is built off of [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) v2.3.0.
If you want to contribute to this project, please first create an [issue](https://github.com/jeffvli/sonixd/issues/new) or [discussion](https://github.com/jeffvli/sonixd/discussions/new) so that we can both discuss the idea and its feasability for integration.

First, clone the repo via git and install dependencies (Windows development now requires additional setup, see [#232](https://github.com/jeffvli/sonixd/issues/232)):

```bash
git clone https://github.com/jeffvli/sonixd.git
yarn install
```

Start the app in the `dev` environment:

```bash
yarn start
```

To package apps for the local platform:

```bash
yarn package
```

If you receive errors while packaging the application, try upgrading/downgrading your Node version (tested on v14.18.0).

If you are unable to run via debug in VS Code, check troubleshooting steps [here](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/2757#issuecomment-784200527).

If your devtools extensions are failing to run/install, check troubleshooting steps [here](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/2788).

## License

[GNU General Public License v3.0 ©](https://github.com/jeffvli/sonixd/blob/main/LICENSE)
