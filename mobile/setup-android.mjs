// Run after `npx cap add android`: adds Sour Player's own Android code (media notification, Android
// Auto, updates), its permissions, icon, version and release signing to the generated project.
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const android = path.join(here, 'android');
const app = path.join(android, 'app');
const main = path.join(app, 'src', 'main');

const edit = (file, change) => {
    const before = fs.readFileSync(file, 'utf8');
    const after = change(before);
    if (after === before) throw new Error(`Nothing changed in ${file}`);
    fs.writeFileSync(file, after);
};

// Java code and resources
const javaDir = path.join(main, 'java', 'com', 'anjalo', 'sourplayer');
fs.mkdirSync(javaDir, { recursive: true });
for (const f of fs.readdirSync(path.join(here, 'native', 'java'))) {
    fs.copyFileSync(path.join(here, 'native', 'java', f), path.join(javaDir, f));
}
fs.mkdirSync(path.join(main, 'res', 'xml'), { recursive: true });
for (const f of fs.readdirSync(path.join(here, 'native', 'res', 'xml'))) {
    fs.copyFileSync(path.join(here, 'native', 'res', 'xml', f), path.join(main, 'res', 'xml', f));
}

// the app icon (the same one as the desktop app)
const icon = path.join(here, '..', 'assets', 'icons', '512x512.png');
for (const dir of fs.readdirSync(path.join(main, 'res'))) {
    if (dir.startsWith('mipmap-anydpi')) {
        fs.rmSync(path.join(main, 'res', dir), { force: true, recursive: true });
    } else if (dir.startsWith('mipmap-')) {
        for (const name of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
            fs.copyFileSync(icon, path.join(main, 'res', dir, name));
        }
    }
}

// permissions, the media service, the media button receiver and Android Auto
edit(path.join(main, 'AndroidManifest.xml'), (s) =>
    s
        .replace(
            '<uses-permission android:name="android.permission.INTERNET" />',
            [
                '<uses-permission android:name="android.permission.INTERNET" />',
                '    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
                '    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />',
                '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
                '    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />',
                '    <uses-permission android:name="android.permission.WAKE_LOCK" />',
            ].join('\n'),
        )
        .replace('<application', '<application\n        android:usesCleartextTraffic="true"')
        .replace(
            '</application>',
            [
                '    <service',
                '            android:name=".SourMediaService"',
                '            android:exported="true"',
                '            android:foregroundServiceType="mediaPlayback">',
                '            <intent-filter>',
                '                <action android:name="android.media.browse.MediaBrowserService" />',
                '                <action android:name="android.intent.action.MEDIA_BUTTON" />',
                '            </intent-filter>',
                '        </service>',
                '        <receiver',
                '            android:name="androidx.media.session.MediaButtonReceiver"',
                '            android:exported="true">',
                '            <intent-filter>',
                '                <action android:name="android.intent.action.MEDIA_BUTTON" />',
                '            </intent-filter>',
                '        </receiver>',
                '        <meta-data',
                '            android:name="com.google.android.gms.car.application"',
                '            android:resource="@xml/automotive_app_desc" />',
                '    </application>',
            ].join('\n'),
        ),
);

// version, the media library and release signing (the keystore comes from the build's secrets)
const version = process.env.SOUR_VERSION || '0.1.0b';
const code = process.env.SOUR_VERSION_CODE || '1';
edit(path.join(app, 'build.gradle'), (s) =>
    s
        .replace(/versionCode \d+/, `versionCode ${code}`)
        .replace(/versionName "[^"]*"/, `versionName "${version}"`)
        .replace(
            /buildTypes \{\s*release \{/,
            [
                'signingConfigs {',
                '        release {',
                '            storeFile file(System.getenv("SOUR_KEYSTORE") ?: "missing.p12")',
                '            storePassword System.getenv("SOUR_KEYSTORE_PASSWORD")',
                '            keyAlias System.getenv("SOUR_KEY_ALIAS") ?: "sour"',
                '            keyPassword System.getenv("SOUR_KEYSTORE_PASSWORD")',
                '            storeType "pkcs12"',
                '        }',
                '    }',
                '    buildTypes {',
                '        release {',
                '            signingConfig signingConfigs.release',
            ].join('\n'),
        )
        .replace(
            /dependencies \{/,
            'dependencies {\n    implementation "androidx.media:media:1.7.0"',
        ),
);

console.log(`Sour Player ${version} (${code}) is set up for Android`);
