package com.anjalo.sourplayer;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.support.v4.media.session.PlaybackStateCompat;
import android.view.View;
import android.widget.RemoteViews;

import androidx.media.session.MediaButtonReceiver;

// Home screen widget: the cover, the song, play/pause and skip, and what friends are playing.
// Filled from what the media service last showed.
public class SourWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, build(context));
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, SourWidget.class));
        if (ids.length == 0) return;
        RemoteViews views = build(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    private static RemoteViews build(Context context) {
        SourMediaService.NowPlaying n = SourMediaService.now;
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.sour_widget);
        v.setTextViewText(R.id.widget_title, n.title.isEmpty() ? "Sour Player" : n.title);
        v.setTextViewText(R.id.widget_artist, n.title.isEmpty() ? "Tap to open" : n.artist);
        v.setTextViewText(R.id.widget_friends, n.friends);
        v.setViewVisibility(R.id.widget_friends, n.friends.isEmpty() ? View.GONE : View.VISIBLE);
        if (SourMediaService.lastArt != null) v.setImageViewBitmap(R.id.widget_cover, SourMediaService.lastArt);
        else v.setImageViewResource(R.id.widget_cover, R.mipmap.ic_launcher);
        v.setImageViewResource(R.id.widget_play, n.playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play);
        v.setOnClickPendingIntent(R.id.widget_prev, MediaButtonReceiver.buildMediaButtonPendingIntent(context, PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS));
        v.setOnClickPendingIntent(R.id.widget_play, MediaButtonReceiver.buildMediaButtonPendingIntent(context, PlaybackStateCompat.ACTION_PLAY_PAUSE));
        v.setOnClickPendingIntent(R.id.widget_next, MediaButtonReceiver.buildMediaButtonPendingIntent(context, PlaybackStateCompat.ACTION_SKIP_TO_NEXT));
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (open != null) {
            PendingIntent tap = PendingIntent.getActivity(context, 2, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            v.setOnClickPendingIntent(R.id.widget_cover, tap);
            v.setOnClickPendingIntent(R.id.widget_text, tap);
        }
        return v;
    }
}
