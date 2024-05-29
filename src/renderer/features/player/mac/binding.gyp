{
  "targets": [
    {
      "target_name": "NowPlayingManager",
      "sources": ["NowPlayingManager.swift"],
      "include_dirs": ["<!(node -e \"require('nan')\")"],
      "xcode_settings": {
        "SWIFT_VERSION": "5.0",
        "OTHER_SWIFT_FLAGS": ["-import-objc-header", "NowPlayingManager.h"]
      },
      "conditions": [
        ["OS=='mac'", { "settings": { "frameworks": ["AppKit", "MediaPlayer"] } }]
      ]
    }
  ]
}
