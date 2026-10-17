package com.anjalo.sourplayer;

import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

// Quick Settings tile: play/pause Sour Player from the swipe-down panel
public class SourPlayTile extends TileService {

    @Override
    public void onStartListening() {
        Tile tile = getQsTile();
        if (tile == null) return;
        SourMediaService.NowPlaying n = SourMediaService.now;
        tile.setState(n.playing ? Tile.STATE_ACTIVE : Tile.STATE_INACTIVE);
        tile.setLabel(n.title.isEmpty() ? "Sour Player" : n.title);
        tile.updateTile();
    }

    @Override
    public void onClick() {
        if (SourMediaPlugin.instance == null) {
            SourRequestTile.openApp(this, "open");
            return;
        }
        SourMediaPlugin.send(SourMediaService.now.playing ? "pause" : "play", null);
        Tile tile = getQsTile();
        if (tile != null) {
            tile.setState(SourMediaService.now.playing ? Tile.STATE_INACTIVE : Tile.STATE_ACTIVE);
            tile.updateTile();
        }
    }
}
