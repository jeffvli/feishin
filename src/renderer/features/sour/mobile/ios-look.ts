// iPhone / iPad (the SideStore app or the Home Screen web app): the iOS look (ios.css, under
// .sour-ios) and no zooming in when a text box is tapped. Runs as soon as the app loads.
export const isIphone = () =>
    (window as any).Capacitor?.getPlatform?.() === 'ios' ||
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

if (typeof window !== 'undefined' && isIphone()) {
    document.documentElement.classList.add('sour-ios');
    // iOS zooms into any text box with text under 16px (ios.css makes them 16px too); the app is
    // laid out for the screen, so pinch-zooming the whole page isn't needed either
    const viewport = document.querySelector('meta[name="viewport"]');
    viewport?.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
    );
}
