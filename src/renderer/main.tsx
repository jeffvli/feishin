// Select the surface before importing App: auxiliary windows must never mount AudioPlayers.
if (new URLSearchParams(window.location.search).get('desktopLyrics') === '1' && window.api) {
    void import('./features/lyrics/desktop-lyrics-window');
} else if (
    new URLSearchParams(window.location.search).get('desktopLyricsSettings') === '1' &&
    window.api
) {
    void import('./features/lyrics/desktop-lyrics-settings-window');
} else {
    void import('./app-entry');
}
