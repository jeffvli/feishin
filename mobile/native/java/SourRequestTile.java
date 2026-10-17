package com.anjalo.sourplayer;

import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.TileService;

// Quick Settings tile: opens Sour Player straight into "Request music"
public class SourRequestTile extends TileService {

    @Override
    public void onClick() {
        openApp(this, "request");
    }

    @SuppressLint("StartActivityAndCollapseDeprecated")
    static void openApp(TileService tile, String action) {
        Intent intent = new Intent(tile, MainActivity.class);
        intent.putExtra("sour_action", action);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (Build.VERSION.SDK_INT >= 34) {
            tile.startActivityAndCollapse(PendingIntent.getActivity(tile, 3, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        } else {
            tile.startActivityAndCollapse(intent);
        }
    }
}
