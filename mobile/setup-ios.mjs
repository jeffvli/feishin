// Run after `npx cap add ios` (on a Mac): adds Sour Player's iPhone code (lock screen controls,
// notifications, offline songs...), background audio, local network access for your music server,
// the app name and icon to the generated Xcode project.
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const app = path.join(here, 'ios', 'App', 'App');

const edit = (file, change) => {
    const before = fs.readFileSync(file, 'utf8');
    const after = change(before);
    if (after === before) throw new Error(`Nothing changed in ${file}`);
    fs.writeFileSync(file, after);
};

// `node setup-ios.mjs --after-sync`: the copied capacitor.config.json lets the app move to your Hermes
// Music address (and back to the welcome screen) instead of opening it in Safari
if (process.argv.includes('--after-sync')) {
    const cfg = path.join(app, 'capacitor.config.json');
    const json = JSON.parse(fs.readFileSync(cfg, 'utf8'));
    json.server = { ...(json.server || {}), allowNavigation: ['*'] };
    fs.writeFileSync(cfg, JSON.stringify(json, null, 2));
    console.log('iPhone app may navigate to the Hermes Music address');
    process.exit(0);
}

// the plugin and the view controller that registers it live in AppDelegate.swift (already part of the
// Xcode target, so the project file doesn't need editing)
const swift = fs.readFileSync(path.join(here, 'native-ios', 'SourMedia.swift'), 'utf8');
edit(path.join(app, 'AppDelegate.swift'), (s) => {
    const imports = swift.match(/^import .*$/gm) ?? [];
    const missing = imports.filter((line) => !s.includes(line));
    const body = swift.replace(/^import .*$\n?/gm, '');
    return `${missing.join('\n')}\n${s}\n${body}`;
});

// the storyboard's bridge view controller becomes ours
edit(path.join(app, 'Base.lproj', 'Main.storyboard'), (s) =>
    s.replace(/customClass="CAPBridgeViewController" customModule="Capacitor"/, 'customClass="SourBridgeViewController" customModule="App" customModuleProvider="target"'),
);

// Info.plist: plays in the background, can reach a music server on the home network over http,
// the name under the icon
const extra = `
	<key>UIBackgroundModes</key>
	<array>
		<string>audio</string>
	</array>
	<key>NSAppTransportSecurity</key>
	<dict>
		<key>NSAllowsArbitraryLoads</key>
		<true/>
		<key>NSAllowsLocalNetworking</key>
		<true/>
	</dict>
	<key>NSLocalNetworkUsageDescription</key>
	<string>Sour Player connects to your music server and Hermes Music on your home network.</string>
	<key>LSApplicationQueriesSchemes</key>
	<array>
		<string>shazam</string>
	</array>
	<key>ITSAppUsesNonExemptEncryption</key>
	<false/>
`;
edit(path.join(app, 'Info.plist'), (s) =>
    s
        .replace(/<key>CFBundleDisplayName<\/key>\s*<string>[^<]*<\/string>/, '<key>CFBundleDisplayName</key>\n\t<string>Sour Player</string>')
        .replace(/<\/dict>\s*<\/plist>\s*$/, `${extra}</dict>\n</plist>\n`),
);

// the app icon (iOS wants one 1024x1024 picture without transparency; it rounds the corners itself)
const iconDir = path.join(app, 'Assets.xcassets', 'AppIcon.appiconset');
const iconSrc = path.join(here, '..', 'assets', 'icons', 'ios-1024.png');
if (fs.existsSync(iconSrc) && fs.existsSync(iconDir)) {
    for (const f of fs.readdirSync(iconDir)) if (f.endsWith('.png')) fs.copyFileSync(iconSrc, path.join(iconDir, f));
}

console.log('Sour Player is set up for iPhone');
