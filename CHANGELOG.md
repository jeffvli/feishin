# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[0.15.0] - 2022-04-13

### Added

- Added setting to save and resume the current queue between sessions (#130) (Thanks @kgarner7)
- Added a simple "play random" button to the player bar (#276)
- Added new seek/volume sliders (#272)
  - Seeking/dragging is now more responsive
- Added improved discord rich presence (#286)
- Added download button on the playlist view (#266)
- (Jellyfin) Added "genre" column to the artist list

### Changed

- Swapped the order of "Seek Forward/Backward" and "Next/Prev Track" buttons on the player bar
- Global volume is now calculated logarithmically (#275) (Thanks @gelaechter)
- "Auto playlist" is now named "Play Random" (#276)
- "Now playing" option is now available on the "Start page" setting

### Fixed

- Playing songs by double clicking on a list should now play in the proper order (#279)
- (Linux) Fixed MPRIS metadata not updating when player automatically increments (#263)
- Application fonts now loaded locally instead of from Google CDN (#284)
- Enabling "Default to Album List on Artist Page" no longer performs a double redirect when entering the artist page (#271)
- Stop button is no longer disabled when playback is stopped (#273)
- Various package updates (#288) (Thanks @kgarner7)
- Top control bar show no longer be accessible when not logged in (#267)

[0.14.0] - 2022-03-12

### Added

- Added zoom options via hotkeys (#252)
  - Zoom in: CTRL + SHIFT + =
  - Zoom out: CTRL + SHIFT + -
- Added PLAY context menu options to the Genre view (#239)
- Added STOP button to the main player controls (#252)
- Added "System Notifications" option to display native notifications when the song automatically changes (#245)
- Added arm64 build (#238)
- New languages
  - Spanish (Thanks @ami-sc) (#250)
  - Sinhala (Thanks @hirusha-adi) (#254)

### Fixed

- (Jellyfin) Fixed the order of returned songs when playing from the Folder view using the context menu (#240)
- (Linux) Reset MPRIS position to 0 when using "previous track" resets the song 0 (#249)
- Fixed JavaScript error when removing all songs from the queue using the context menu (#248)
- Fixed Ampache server support by adding .view to all Subsonic API endpoints (#253)

### Removed

- (Windows) Removed the cover art display when hovering Sonixd on the taskbar (due to new sidebar position) (#242)

[0.13.1] - 2022-02-16

### Fixed

- Fixed startup crash on all OS if the default settings file is not present (#237)

[0.13.0] - 2022-02-16

### Added

- Added new searchbar and search UI (#227, #228)
- Added playback controls to the Sonixd tray menu (#225)
- Added playlist selections to the `Start Page` config option

### Changed

- Sidebar changes (#206)

  - Allow resizing of the sidebar when expanded
  - Allow a toggle of the playerbar's cover art to the sidebar when expanded
  - Display playlist list on the sidebar under the navigation
  - Allow configuration of the display of sidebar elements

- Changed the `Artist` row on the playerbar to use a comma delimited list of the song's artists rather than the album artist (#218)

### Fixed

- Fixed the player volume not resetting to its default value when resetting a song while crossfading (#228)
- (Jellyfin) Fixed artist list not displaying user favorites
- (Jellyfin) Fixed `bitrate` column not properly by its numeric value (#220)
- Fixed javascript exception when incrementing/decrementing the queue (#230)
- Fixed popups/tooltips not using the configured font

[0.12.1] - 2022-02-02

### Fixed

- Fixed translation syntax error causing application to crash when deleting playlists from the context menu (#216)
- Fixed Player behavior (#217)
  - No longer scrobbles an additional time after the last song ends when repeat is off
  - (Jellyfin) Properly handles scrobbling the player's pause/resume and time position

[0.12.0] - 2022-01-31

### Added

- Added support for language/translations (#146) (Thanks @gelaechter)
  - German translation added (Thanks @gelaechter)
  - Simplified Chinese translation added (Thanks @fangxx3863)
- (Windows) Added media keys with desktop overlay (#79) (Thanks @GermanDarknes)
- (Subsonic) Added support for `/getLyrics` to display the current song's lyrics in a popup (#151)
- (Jellyfin) Added song list page
- Added config to choose the default Album/Song list sort on startup (#169)
- Added config to choose the application start page (#176) (Thanks @GermanDarknes)
- Added config for pagination for Album/Song list pages
- (Windows) Added option to set custom directory on installation (#184)
- Added config to set the default artist page to the album list (#199)
- Added info mode for the Now Playing page (#160)
- Added release notes popup

### Changed

- Player behavior
  - `Media Stop` now stops the track and resets it instead of clearing the queue (#200)
  - `Media Prev` now resets to the start of the song if pressed after 5 seconds (#207)
  - `Media Prev` now resets to the start of the song if repeat is off and is the first song of the queue (#207)
  - `Media Next` now does nothing if repeat is off and is the last song of the queue (#207)
  - Playing a single track in the queue without repeat no longer plays the track twice (#205)
  - Scrobbling
    - (Jellyfin) Scrobbling has been reverted to use the `/sessions/playing` endpoint to support the Playback Reporting plugin (#187)
    - Scrobbling occurs after 5 seconds has elapsed for the current track as to not instantly mark the song as played
- Pressing `CTRL + F` or the search button now focuses the text in the searchbar (#203) (Thanks @WeekendWarrior1)
- Changed loading indicators for all pages
- OBS scrobble now outputs an image.txt file instead of the downloading the cover image (#136)
- Player Bar
  - Album name now appears under the artist
  - (Subsonic) 5-star rating is available
  - Clicking on the cover art now displays a full-size image
  - Clicking on the song name now redirects to the Now Playing queue
- (Jellyfin) Removed track limit for "Auto Playlist"

### Fixed

- (macOS) Fixed macOS exit behavior (#198) (Thanks @zackslash)
- (Linux) Fixed MPRIS `position` result (#162)
- (Subsonic) Fixed artist page crashing the application if server does not support `/getArtistInfo2` (#170)
- (Jellyfin) Fixed `View all songs` returning songs out of their album track order
- (Jellyfin) Fixed the "Latest Albums" on the album artist page displaying no albums
- Fixed card overlay button color on click
- Fixed buttons on the Album page to work better with light mode
- Fixed unfavorite button on Album page

[0.11.0] - 2022-01-01

### Added

- Added external integrations
  - Added Discord rich presence to display the currently playing song (#155)
  - Added OBS (Open Broadcaster Software) scrobbling to send current track metadata to desktop or the Tuna plugin (#136)
- Added a `Native` option for Titlebar Style (#148) (Thanks @gelaechter)
- (Jellyfin) Added toggle to allow transcoding for non-directplay compatible filetypes (#158)
- Additional MPRIS support
  - Added metadata:
    - `albumArtist`, `discNumber`, `trackNumber`, `useCount`, `genre`
  - Added events:
    - `seek`, `position`, `volume`, `repeat`, `shuffle`

### Changed

- Overhauled the Artist page
  - (Jellyfin) Split albums by album artist OR compilation
  - (Jellyfin) Added artist genres
  - (Subsonic) Added Top Songs section
  - Moved related artists to the main page scrolling menu
  - Added `View All Songs` button to view all songs by the artist
  - Added artist radio (mix) button
- Horizontal scrolling menu no longer displays scrollbar
- Changed button styling on Playlist/Album/Artist pages
- Changed page image styling to use the card on Playlist/Album/Artist pages

### Fixed

- Fixed various MPRIS features
  - Synchronized the play/pause state between the player and MPRIS client when pausing from Sonixd (#152)
  - Fixed the identity of Sonixd to use the app name instead of description (#163)
- Fixed various submenus opening in the right-click context menu when the option is disabled (#164)
- Fixed compatibility with older Subsonic API servers (now targets Subsonic v1.13.0) (#144)
- Fixed playback causing heavily increased CPU/Power usage #145)

[0.10.0] - 2021-12-15

### Added

- Added 2 new default themes
  - City Lights
  - One Dark
- Added additional album filters (#66)
  - Genres (AND/OR)
  - Artists (AND/OR)
  - Years (FROM/TO)
- Added external column sort filters for multiple pages (#66)
- Added item counter to page titles
- `Play Count` column has been added to albums (only works for Navidrome)

### Changed

- Config page has been fully refreshed to a new look
  - Config popover on the action bar now includes all config tabs
- Tooltips
  - Increased default tooltip delay from 250ms -> 500ms
  - Increased tooltip delay on card overlay buttons to 1000ms
- Grid view
  - Placeholder images for playlists, albums, and artists have been updated (inspired from Jellyfin Web UI)
  - Card title/subtitle width decreased from 100% to default length
  - Separate card info section from image/overlay buttons on hover
- Popovers (config, auto playlist, etc)
  - Now have decreased opacity
- Enabling/disabling global media keys no longer requires app restart

### Fixed

- (Jellyfin) Fixed `Recently Played` and `Most Played` filters on the Dashboard page (#114)
- (Jellyfin) Fixed server scrobble (#126)
  - No longer sends the `/playing` request on song start (prevents song being marked as played when it starts)
  - Fixed song play count increasing multiple times per play
- (Jellyfin) Fixed tracks without embedded art displaying placeholder (#128)
- (Jellyfin) Fixed song `Path` property not displaying data
- (Subsonic) Fixed login check for Funkwhale servers (#135)
- Fixed persistent grid-view scroll position
- Fixed list-view columns
  - `Visibility` column now properly displays data
- Selected media folder is now cleared from settings on disconnect (prevents errors when signing into a new server)
- Fixed adding/removing artist as favorite on the Artist page not updating
- Fixed search bar not properly handling Asian keyboard inputs

## [0.9.1] - 2021-12-07

### Changed

- List-view scroll position is now persistent for the following:
  - Now Playing
  - Playlist list
  - Favorites (all)
  - Album list
  - Artist list
  - Genre list
- Grid-view scroll position is now persistent for the following:
  - Playlist list
  - Favorites (album/artist)
  - Album list
  - Artist list
- (Jellyfin) Changed audio stream URL to force transcoding off (#108)

### Fixed

- (Jellyfin) Fixed the player not sending the "finish" condition when the song meets the scrobble condition (unresolved from 0.9.0) (#111)

## [0.9.0] - 2021-12-06

### Added

- Added 2 new default themes
  - Plex-like
  - Spotify-like
- Added volume control improvements
  - Volume value tooltip while hovering the slider
  - Mouse scroll wheel controls volume while hovering the slider
  - Clicking the volume icon will mute/unmute

### Changed

- Overhauled all default themes
  - Rounded buttons, inputs, etc.
  - Changed grid card hover effects
    - Removed hover scale
    - Removed default background on overlay buttons
    - Moved border to only the image instead of full card
- Album page
  - Genre(s) are now listed on a line separate from the artists
  - Album artist is now distinct from track artists
  - Increased length of the genre/artist line from 70% -> 80%
  - The genre/artist line is now scrollable using the mouse wheel
- (Jellyfin) List view
  - `Artist` column now uses the album artist property
  - `Title (Combined)` column now displays all track artists, comma-delimited instead of the album artist
  - `Genre` column now displays all genres, comma-delimited, left-aligned

### Fixed

- (Jellyfin) Fixed the player not sending the "finish" condition when the song meets the scrobble condition
- (Jellyfin) Fixed album lists not sorting by the `genre` column
- (Jellyfin)(API) Fixed the A-Z(Artist) not sorting by Album Artist on the album list
- (Jellyfin)(API) Fixed auto playlist not respecting the selected music folder
- (Jellyfin)(API) Fixed the artist page not respecting the selected music folder

## [0.8.5] - 2021-11-25

### Fixed

- Fixed default (OOBE) title column not display data (#104)

## [0.8.4] - 2021-11-25

### Fixed

- (Jellyfin)(Linux) Fixed JS MPRIS error when switching tracks due to unrounded song duration
- (Linux) Fixed MPRIS artist, genre, and coverart not updating on track change

## [0.8.3] - 2021-11-25

### Fixed

- (Subsonic) Fixed playing a folder from the folder view
- Fixed rating context menu option available from the Genre page

## [0.8.2] - 2021-11-25

### Added

- Added option to disable auto updates

### Fixed

- Fixed gapless playback on certain \*sonic servers (#100)
- Fixed playerbar coverart not redirecting to `Now Playing` page

## [0.8.1] - 2021-11-24

### Fixed

- (Subsonic) Fixed errors blocking playlists from being deleted

## [0.8.0] - 2021-11-24

### Added

- Added Jellyfin server support (#87)
  - Supports full Sonixd feature-set (except ratings)
- Added a mini config popover to change list/grid view options on the top action bar
- Added system audio device selector (#96)
- Added context menu option `Set rating` to bulk set ratings for songs (and albums/artists on Navidrome) (#95)

### Changed

- Reduced cached image from 500px -> 350px (to match max grid size)
- Grid/header images now respect image aspect ratio returned by the server
- Playback filter input now uses a regex validation before allowing you to add
- Renamed all `Name` columns to `Title`
- Search bar now clears after pressing enter to globally search
- Added borders to popovers

### Fixed

- Fixed application performance issues when player is crossfading to the next track
- Fixed null entries showing at the beginning of descending sort on playlist/now playing lists
- Tooltips no longer pop up on the artist/playlist description when null

## [0.7.0] - 2021-11-15

### Added

- Added download buttons on the Album and Artist pages (#29)
  - Allows you to download (via browser) or copy download links to your clipboard (to use with a download manager)

### Changed

- Changed default tooltip delay from `500ms` -> `250ms`
- Moved search bar from page header to the main layout action bar
- Added notice for macOS media keys to require trusted accessibility in the client

### Fixed

- Fixed auto playlist and album fetch in Gonic servers
- Fixed the macOS titlebar styling to better match the original (#83)
- Fixed thumbnailclip error when resizing the application in macOS (#84)
- Fixed playlist page not using cached image

## [0.6.0] - 2021-11-09

### Added

- Added additional grid-view customization options (#74)
  - Gap size (spaces between cards)
  - Alignment (left-align, center-align)

### Changed

- Changed default album/artist uncached image sizes from `150px` -> `350px`

### Fixed

- (Windows) Fixed default taskbar thumbnail on Windows10 when minimized to use window instead of album cover (#73)
- Fixed playback settings unable to change via the UI
  - Crossfade duration
  - Polling interval
  - Volume fade
- Fixed header styling on the Config page breaking at smaller window widths (#72)
- Fixed the position of the description tooltip on the Artist page
- Fixed the `Add to playlist` popover showing underneath the modal in modal-view

### Removed

- Removed unused `fonts.size.pageTitle` theme property

## [0.5.0] - 2021-11-05

### Added

- Added extensible theming (#60)
- Added playback presets (gapless, fade, normal) to the config
- Added persistence for column sort for all list-views (except playlist and search) (#47)
- Added playback filters to the config to filter out songs based on regex (#53)
- Added music folder selector in auto playlist (this may or may not work depending on your server)
- Added improved playlist, artist, and album pages
  - Added dynamic images on the Playlist page for servers that don't support playlist images (e.g. Navidrome)
- Added link to open the local `settings.json` file
- Added setting to use legacy authentication (#63)

### Changed

- Improved overall application keyboard accessibility
- Playback no longer automatically starts if adding songs to the queue using `Add to queue`
- Prevent accidental page navigation when using [Ctrl/Shift + Click] when multi-selecting rows in list-view
- Standardized buttons between the Now Playing page and the mini player
- "Add random" renamed to "Auto playlist"
- Increased 'info' notification timeout from 1500ms -> 2000ms
- Changed default mini player columns to better fit
- Updated default themes to more modern standards (Default Dark, Default Light)

### Fixed

- Fixed title sort on the `Title (Combined)` column on the album list
- Fixed 2nd song in queue being skipped when using the "Play" button multiple pages (album, artist, auto playlist)
- Fixed `Title` column not showing the title on the Folder page (#69)
- Fixed context menu windows showing underneath the mini player
- Fixed `Add to queue (next)` adding songs to the wrong unshuffled index when shuffle is enabled
- Fixed local search on the root Folder page
- Fixed input picker dropdowns following the page on scroll
- Fixed the current playing song not highlighted when using `Add to queue` on an empty play queue
- Fixed artist list not using the `artistImageUrl` returned by Navidrome

## [0.4.1] - 2021-10-27

### Added

- Added links to the genre column on the list-view
- Added page forward/back buttons to main layout

### Changed

- Increase delay when completing mouse drag select in list view from `100ms` -> `200ms`
- Change casing for main application name `sonixd` -> `Sonixd`

### Fixed

- Fixed Linux media hotkey support (MPRIS)
  - Added commands for additional events `play` and `pause` (used by KDE's media player overlay)
  - Set status to `Playing` when initially starting a song
  - Set current song metadata when track automatically changes instead of only when it manually changes
- Fixed filtered link to Album List on the Album page
- Fixed filtered link to Album List on the Dashboard page
- Fixed font color for lists/tables in panels
  - Affects the search view song list and column selector list

## [0.4.0] - 2021-10-26

### Added

- Added music folder selector (#52)
- Added media hotkeys / MPRIS support for Linux (#50)
  - This is due to dbus overriding the global shortcuts that electron sends
- Added advanced column selector component
  - Drag-n-drop list
  - Individual resizable columns
- (Windows) Added tray (Thanks @ncarmic4) (#45)
  - Settings to minimize/exit to tray

### Changed

- Page selections are now persistent
  - Active tab on config page
  - Active tab on favorites page
  - Filter selector on album list page
- Playlists can now be saved after being sorted using column filters
- Folder view
  - Now shows all root folders in the list instead of in the input picker
  - Now shows music folders in the input picker
  - Now uses loader when switching pages
- Changed styling for various views/components
  - Look & Feel setting page now split up into multiple panels
  - Renamed context menu button `Remove from current` -> `Remove selected`
  - Page header titles width increased from `45%` -> `80%`
  - Renamed `Scan library` -> `Scan`
- All pages no longer refetch data when clicking back into the application

### Fixed

- Fixed shift-click multi select on a column-sorted list-view
- Fixed right-click context menu showing up behind all modals (#55)
- Fixed mini player showing up behind tag picker elements
- Fixed duration showing up as `NaN:NaN` when duration is null or invalid
- Fixed albums showing as a folder in Navidrome instances

## [0.3.0] - 2021-10-16

### Added

- Added folder browser (#1)
  - Added context menu button `View in folder`
  - Requires that your server has support for the original `/getIndexes` and `/getMusicDirectory` endpoints
- Added configurable row-hover highlight for list-view
- (Windows) Added playback controls in thumbnail toolbar (#32)
- (Windows/macOS) Added window size/position remembering on application close (#31)

### Changed

- Changed styling for various views/components
  - Tooltips added on grid-view card hover buttons
  - Mini-player removed rounded borders and increased opacity
  - Mini-player removed animation on open/close
  - Search bar now activated from button -> input on click / CTRL+F
  - Page header toolbar buttons styling consistency
  - Album list filter moved from right -> left
  - Reordered context menu button `Move selected to [...]`
  - Decreased horizontal width of expanded sidebar from 193px -> 165px

### Fixed

- Fixed duplicate scrobble requests when pause/resuming a song after the scrobble threshold (#30)
- Fixed genre column not applying in the song list-view
- Fixed default titlebar set on first run

## [0.2.1] - 2021-10-11

### Fixed

- Fixed using play buttons on the artist view not starting playback
- Fixed favoriting on horizontal scroll menu on dashboard/search views
- Fixed typo on default artist list viewtype
- Fixed artist image selection on artist view

## [0.2.0] - 2021-10-11

### Added

- Added setting to enable scrobbling playing/played tracks to your server (#17)
- Added setting to change between macOS and Windows styled titlebar (#23)
- Added app/build versions and update checker on the config page (#18)
- Added 'view in modal' button on the list-view context menu (#8)
- Added a persistent indicator on grid-view cards for favorited albums/artists (#7)
- Added buttons for 'Add to queue (next)' and 'Add to queue (later)' (#6)
- Added left/right scroll buttons to the horizontal scrolling menu (dashboard/search)
- Added last.fm link to artist page
- Added link to cache location to open in local file explorer
- Added reset to default for cache location
- Added additional tooltips
  - Grid-view card title and subtitle buttons
  - Cover art on the player bar
  - Header titles on album/artist pages

### Changed

- Changed starring logic on grid-view card to update local cache instead of refetch
- Changed styling for various views/components
  - Use dynamically sized hover buttons on grid-view cards depending on the card size
  - Decreased size of buttons on album/playlist/artist pages
  - Input picker text color changed from primary theme color to primary text color
  - Crossfade type config changed from radio buttons to input picker
  - Disconnect button color from red to default
  - Tooltip styling updated to better match default theme
  - Changed tag links to text links on album page
- Changed page header images to use cache (album/artist)
  - Artist image now falls back to last.fm if no local image

### Fixed

- Fixed song & image caching (#16)
- Fixed set default artist list view type on first startup

## [0.1.0] - 2021-10-06

### Added

- Initial release
