"""Writes mobile/sidestore.json, the SideStore / AltStore source for Sour Player for iPhone.

Run after publishing an ios-v<version> release:
    python mobile/sidestore-source.py <version> <build> <path to the .ipa> "<what's new>"

People add the source once in SideStore (Sources > +):
https://raw.githubusercontent.com/Urmomnumber1/feishin/hermes-music-video/mobile/sidestore.json
and SideStore offers every new version as an update.
"""
import datetime
import json
import os
import sys

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'sidestore.json')
version, build, ipa, notes = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
raw = 'https://raw.githubusercontent.com/Urmomnumber1/feishin/hermes-music-video'

source = json.load(open(out, encoding='utf-8')) if os.path.exists(out) else {
    'name': 'Sour Player',
    'identifier': 'com.anjalo.sourplayer.source',
    'subtitle': 'The music player for Hermes Music',
    'sourceURL': f'{raw}/mobile/sidestore.json',
    'iconURL': f'{raw}/assets/icons/ios-1024.png',
    'tintColor': '#5058CC',
    'apps': [{
        'name': 'Sour Player',
        'bundleIdentifier': 'com.anjalo.sourplayer',
        'developerName': 'Anjalo',
        'subtitle': 'The music player for Hermes Music',
        'localizedDescription': 'Play your Navidrome / Hermes Music library on your iPhone: lock screen and '
                                'Control Center controls, AirPods buttons, background playback, offline '
                                'playlists, the Sour Stage, profiles, listen along and Group Play.',
        'iconURL': f'{raw}/assets/icons/ios-1024.png',
        'tintColor': '#5058CC',
        'category': 'entertainment',
        'appPermissions': {
            'entitlements': [],
            'privacy': {
                'NSLocalNetworkUsageDescription': 'Sour Player connects to your music server and Hermes Music on your home network.',
            },
        },
        'versions': [],
    }],
    'news': [],
}

app = source['apps'][0]
app['versions'] = [v for v in app['versions'] if v['version'] != version]
app['versions'].insert(0, {
    'version': version,
    'buildVersion': str(build),
    'date': datetime.date.today().isoformat(),
    'localizedDescription': notes,
    'downloadURL': f'https://github.com/Urmomnumber1/feishin/releases/download/ios-v{version}/Sour-Player-{version}.ipa',
    'size': os.path.getsize(ipa),
    'minOSVersion': '15.0',
})
json.dump(source, open(out, 'w', encoding='utf-8', newline='\n'), indent=2, ensure_ascii=False)
print('wrote', out)
