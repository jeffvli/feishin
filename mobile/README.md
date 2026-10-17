# Sour Player for Android

The web build of Sour Player inside an Android app (Capacitor), plus a small native part in
`native/`: the media notification and lock screen controls, headset buttons, Android Auto (the queue
shows as Up next) and self-updates from the `mobile-v...` GitHub releases.

The Android project is generated on every build (`.github/workflows/sour-android.yml`):

1. `SOUR_MOBILE=1 pnpm run build:web` at the top of the repo
2. here: `npm install`, `npx cap add android`, `node setup-android.mjs`, `npx cap sync android`
3. `cd android && ./gradlew assembleRelease`

## Signing

Every version has to be signed with the same key, or Android refuses to install it over the old one.
The build reads it from two repository secrets:

- `SOUR_KEYSTORE`: the `.p12` key file, base64 encoded
- `SOUR_KEYSTORE_PASSWORD`: its password (the key alias is `sour`)
