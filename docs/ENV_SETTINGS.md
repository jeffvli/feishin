# Environment variables for settings (web / Docker)

These variables override app settings **on first run** when no persisted settings exist. They are injected via `settings.js` (from `settings.js.template`) and only apply to the **web** build.

**Format:** All values are strings; booleans use `true`/`false`, numbers are numeric strings. Leave unset or empty to use the default.

---

## General

| Setting | Default | Env variable | Available values / Description |
|-------------|---------|--------------|--------------------------------|
| `general.accent` | `rgb(53, 116, 252)` | `FS_GENERAL_ACCENT` | CSS `rgb(r, g, b)` string (e.g. `rgb(53, 116, 252)`). Invalid values are ignored. |
| `general.albumBackground` | `false` | `FS_GENERAL_ALBUM_BACKGROUND` | `true` / `false` — Show album background image. |
| `general.albumBackgroundBlur` | `3` | `FS_GENERAL_ALBUM_BACKGROUND_BLUR` | Blur amount for album background (number). |
| `general.artistBackground` | `true` | `FS_GENERAL_ARTIST_BACKGROUND` | `true` / `false` — Show artist background image. |
| `general.artistBackgroundBlur` | `3` | `FS_GENERAL_ARTIST_BACKGROUND_BLUR` | Blur amount for artist background (number). |
| `general.blurExplicitImages` | `false` | `FS_GENERAL_BLUR_EXPLICIT_IMAGES` | `true` / `false` — Blur explicit images. |
| `general.combinedLyricsAndVisualizer` | `false` | `FS_GENERAL_COMBINED_LYRICS_AND_VISUALIZER` | `true` / `false` — Combine lyrics and visualizer panel. |
| `general.enableGridMultiSelect` | `false` | `FS_GENERAL_ENABLE_GRID_MULTI_SELECT` | `true` / `false` — Enable multi-select in grid views. |
| `general.externalLinks` | `true` | `FS_GENERAL_EXTERNAL_LINKS` | `true` / `false` — Show external links in UI. |
| `general.followCurrentSong` | `true` | `FS_GENERAL_FOLLOW_CURRENT_SONG` | `true` / `false` — Follow current song in list. |
| `general.followSystemTheme` | `false` | `FS_GENERAL_FOLLOW_SYSTEM_THEME` | `true` / `false` — Use OS light/dark preference. |
| `general.homeFeature` | `true` | `FS_GENERAL_HOME_FEATURE` | `true` / `false` — Show home featured carousel. |
| `general.homeFeatureStyle` | `single` | `FS_GENERAL_HOME_FEATURE_STYLE` | `multiple` / `single` — Home featured carousel style. |
| `general.language` | `en` | `FS_GENERAL_LANGUAGE` | UI language code (e.g. `en`, `de`, `fr`). |
| `general.theme` | `defaultDark` | `FS_GENERAL_THEME` | One of: `ayuDark`, `ayuLight`, `catppuccinLatte`, `catppuccinMocha`, `defaultDark`, `defaultLight`, `dracula`, `githubDark`, `githubLight`, `glassyDark`, `gruvboxDark`, `gruvboxLight`, `highContrastDark`, `highContrastLight`, `materialDark`, `materialLight`, `monokai`, `nightOwl`, `nord`, `oneDark`, `rosePine`, `rosePineDawn`, `rosePineMoon`, `shadesOfPurple`, `solarizedDark`, `solarizedLight`, `tokyoNight`, `vscodeDarkPlus`, `vscodeLightPlus`. |
| `general.themeDark` | `defaultDark` | `FS_GENERAL_THEME_DARK` | Same as theme (used when system is dark). |
| `general.themeLight` | `defaultLight` | `FS_GENERAL_THEME_LIGHT` | Same as theme (used when system is light). |
| `general.lastfmApiKey` | *(empty)* | `FS_GENERAL_LASTFM_API_KEY` | Last.fm API key. |
| `general.lastFM` | `true` | `FS_GENERAL_LAST_FM` | `true` / `false` — Enable Last.fm. |
| `general.listenBrainz` | `true` | `FS_GENERAL_LISTEN_BRAINZ` | `true` / `false` — ListenBrainz links. |
| `general.musicBrainz` | `true` | `FS_GENERAL_MUSIC_BRAINZ` | `true` / `false` — MusicBrainz links. |
| `general.nativeAspectRatio` | `false` | `FS_GENERAL_NATIVE_ASPECT_RATIO` | `true` / `false` — Use native cover art aspect ratio. |
| `general.pathReplace` | *(empty)* | `FS_GENERAL_PATH_REPLACE` | Path pattern to replace (e.g. server path in Docker). |
| `general.pathReplaceWith` | *(empty)* | `FS_GENERAL_PATH_REPLACE_WITH` | Replacement path. |
| `general.playerbarOpenDrawer` | `false` | `FS_GENERAL_PLAYERBAR_OPEN_DRAWER` | `true` / `false` — Open queue/lyrics as drawer from player bar. |
| `general.primaryShade` | `6` | `FS_GENERAL_PRIMARY_SHADE` | Mantine primary shade 0–9 (number). |
| `general.qobuz` | `true` | `FS_GENERAL_QOBUZ` | `true` / `false` — Qobuz links. |
| `general.resume` | `true` | `FS_GENERAL_RESUME` | `true` / `false` — Resume playback on load. |
| `general.showLyricsInSidebar` | `true` | `FS_GENERAL_SHOW_LYRICS_IN_SIDEBAR` | `true` / `false` — Show lyrics in sidebar. |
| `general.showRatings` | `true` | `FS_GENERAL_SHOW_RATINGS` | `true` / `false` — Show star ratings. |
| `general.showVisualizerInSidebar` | `true` | `FS_GENERAL_SHOW_VISUALIZER_IN_SIDEBAR` | `true` / `false` — Show visualizer in sidebar. |
| `general.sidebarCollapsedNavigation` | `true` | `FS_GENERAL_SIDEBAR_COLLAPSED_NAVIGATION` | `true` / `false` — Start with collapsed sidebar nav. |
| `general.sidebarCollapseShared` | `false` | `FS_GENERAL_SIDEBAR_COLLAPSE_SHARED` | `true` / `false` — Share sidebar collapse state. |
| `general.sidebarPlaylistList` | `true` | `FS_GENERAL_SIDEBAR_PLAYLIST_LIST` | `true` / `false` — Show playlist list in sidebar. |
| `general.sidebarPlaylistSorting` | `false` | `FS_GENERAL_SIDEBAR_PLAYLIST_SORTING` | `true` / `false` — Enable playlist sorting in sidebar. |
| `general.sideQueueType` | `sideQueue` | `FS_GENERAL_SIDE_QUEUE_TYPE` | `sideDrawerQueue` / `sideQueue` — Side play queue style. |
| `general.sideQueueLayout` | `horizontal` | `FS_GENERAL_SIDE_QUEUE_LAYOUT` | `horizontal` / `vertical` — Attached side queue layout orientation. |
| `general.useThemeAccentColor` | `false` | `FS_GENERAL_USE_THEME_ACCENT_COLOR` | `true` / `false` — Use theme’s accent color instead of custom. |
| `general.useThemePrimaryShade` | `true` | `FS_GENERAL_USE_THEME_PRIMARY_SHADE` | `true` / `false` — Use theme’s primary shade. |
| `general.zoomFactor` | `100` | `FS_GENERAL_ZOOM_FACTOR` | UI zoom percentage (number). |

---

## Playback

| Setting path | Default | Env variable | Available values / Description |
|-------------|---------|--------------|--------------------------------|
| `playback.mediaSession` | `false` | `FS_PLAYBACK_MEDIA_SESSION` | `true` / `false` — Media Session API (e.g. browser/media keys). |
| `playback.webAudio` | `true` | `FS_PLAYBACK_WEB_AUDIO` | `true` / `false` — Use Web Audio for playback. |
| `playback.audioFadeOnStatusChange` | `true` | `FS_PLAYBACK_AUDIO_FADE_ON_STATUS_CHANGE` | `true` / `false` — Fade on play/pause. |
| `playback.preservePitch` | `true` | `FS_PLAYBACK_PRESERVE_PITCH` | `true` / `false` — Preserve pitch when changing speed. |
| `playback.scrobble.enabled` | `true` | `FS_PLAYBACK_SCROBBLE_ENABLED` | `true` / `false` — Enable scrobbling. |
| `playback.scrobble.notify` | `false` | `FS_PLAYBACK_SCROBBLE_NOTIFY` | `true` / `false` — Scrobble notifications. |
| `playback.scrobble.scrobbleAtDuration` | `240` | `FS_PLAYBACK_SCROBBLE_AT_DURATION` | Seconds of playback before scrobble. |
| `playback.scrobble.scrobbleAtPercentage` | `75` | `FS_PLAYBACK_SCROBBLE_AT_PERCENTAGE` | Percentage of track before scrobble. |
| `playback.transcode.enabled` | `false` | `FS_PLAYBACK_TRANSCODE_ENABLED` | `true` / `false` — Enable transcoding. |

---

## Discord

| Setting path | Default | Env variable | Available values / Description |
|-------------|---------|--------------|--------------------------------|
| `discord.enabled` | `false` | `FS_DISCORD_ENABLED` | `true` / `false` — Discord rich presence. |
| `discord.clientId` | *(built-in)* | `FS_DISCORD_CLIENT_ID` | Custom Discord application ID. |
| `discord.displayType` | `feishin` | `FS_DISCORD_DISPLAY_TYPE` | `artist` / `feishin` / `song`. |
| `discord.linkType` | `none` | `FS_DISCORD_LINK_TYPE` | `last_fm` / `musicbrainz` / `musicbrainz_last_fm` / `none`. |
| `discord.showAsListening` | `false` | `FS_DISCORD_SHOW_AS_LISTENING` | `true` / `false`. |
| `discord.showPaused` | `true` | `FS_DISCORD_SHOW_PAUSED` | `true` / `false` — Show paused state. |
| `discord.showServerImage` | `false` | `FS_DISCORD_SHOW_SERVER_IMAGE` | `true` / `false`. |
| `discord.showStateIcon` | `true` | `FS_DISCORD_SHOW_STATE_ICON` | `true` / `false`. |

---

## Lyrics

| Setting path | Default | Env variable | Available values / Description |
|-------------|---------|--------------|--------------------------------|
| `lyrics.fetch` | `true` | `FS_LYRICS_FETCH` | `true` / `false` — Fetch lyrics. |
| `lyrics.follow` | `true` | `FS_LYRICS_FOLLOW` | `true` / `false` — Follow current line. |
| `lyrics.delayMs` | `0` | `FS_LYRICS_DELAY_MS` | Sync delay in milliseconds. |
| `lyrics.preferLocalLyrics` | `true` | `FS_LYRICS_PREFER_LOCAL` | `true` / `false` — Prefer local lyric files. |
| `lyrics.showMatch` | `true` | `FS_LYRICS_SHOW_MATCH` | `true` / `false`. |
| `lyrics.showProvider` | `true` | `FS_LYRICS_SHOW_PROVIDER` | `true` / `false`. |
| `lyrics.enableAutoTranslation` | `false` | `FS_LYRICS_ENABLE_AUTO_TRANSLATION` | `true` / `false`. |
| `lyrics.translationApiKey` | *(empty)* | `FS_LYRICS_TRANSLATION_API_KEY` | API key for lyric translation. |
| `lyrics.translationTargetLanguage` | `en` | `FS_LYRICS_TRANSLATION_TARGET_LANGUAGE` | Target language code. |
| `lyrics.alignment` | `center` | `FS_LYRICS_ALIGNMENT` | `center` / `left` / `right`. |

---

## Auto DJ

| Setting path | Default | Env variable | Available values / Description |
|-------------|---------|--------------|--------------------------------|
| `autoDJ.enabled` | `false` | `FS_AUTO_DJ_ENABLED` | `true` / `false`. |
| `autoDJ.itemCount` | `5` | `FS_AUTO_DJ_ITEM_COUNT` | Number of items to add. |
| `autoDJ.timing` | `1` | `FS_AUTO_DJ_TIMING` | Timing value (number). |

---

## CSS

| Setting path | Default | Env variable | Available values / Description |
|-------------|---------|--------------|--------------------------------|
| `css.content` | *(empty)* | `FS_CSS_CONTENT` | Custom CSS string (sanitized like in-app custom CSS). Set `FS_CSS_ENABLED=true` to apply. |
| `css.enabled` | `false` | `FS_CSS_ENABLED` | `true` / `false` — Enable custom CSS. |

---

## Font

| Setting path | Default | Env variable | Available values / Description |
|-------------|---------|--------------|--------------------------------|
| `font.type` | `builtIn` | `FS_FONT_TYPE` | `builtIn` / `system` / `custom`. |
| `font.builtIn` | `Inter` | `FS_FONT_BUILT_IN` | Built-in font name. |
| `font.system` | *(empty)* | `FS_FONT_SYSTEM` | System font name (when type is `system`). |
