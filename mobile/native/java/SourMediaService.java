package com.anjalo.sourplayer;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.v4.media.MediaBrowserCompat;
import android.support.v4.media.MediaDescriptionCompat;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.media.MediaBrowserServiceCompat;
import androidx.media.session.MediaButtonReceiver;

import com.getcapacitor.JSObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

// Keeps Sour Player playing with the screen off and shows it everywhere Android shows music: the
// media notification, the lock screen, headset and Bluetooth buttons, and Android Auto (where the
// queue is browsable as "Up next"). The music itself plays in the web app; this only mirrors it.
public class SourMediaService extends MediaBrowserServiceCompat {

    static class NowPlaying {
        String title = "", artist = "", album = "", art = "", lyric = "", friends = "";
        long duration, position;
        boolean playing;
    }

    static class QueueItem {
        int index;
        String title = "", artist = "", art = "";
    }

    private static final String CHANNEL = "playback";
    private static final int NOTIFICATION_ID = 1;
    private static final String ROOT = "root";
    private static final String UP_NEXT = "up-next";

    private static SourMediaService running;
    static NowPlaying now = new NowPlaying();
    static Bitmap lastArt;
    private static List<QueueItem> queue = new ArrayList<>();

    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService images = Executors.newSingleThreadExecutor();
    private MediaSessionCompat session;
    private String artUrl = "";
    private Bitmap artBitmap;
    private boolean foreground = false;

    // called by the plugin with what's playing now
    static void show(Context context, NowPlaying playing) {
        now = playing;
        SourMediaService service = running;
        if (service != null) {
            service.main.post(service::refresh);
            return;
        }
        if (!playing.playing) return;
        try {
            ContextCompat.startForegroundService(context, new Intent(context, SourMediaService.class));
        } catch (Exception ignored) {
            // Android refuses to start it from the background; it starts the next time the app is open
        }
    }

    static void setQueue(List<QueueItem> items) {
        queue = items;
        SourMediaService service = running;
        if (service != null) service.main.post(() -> service.notifyChildrenChanged(UP_NEXT));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        running = this;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26 && manager.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Now playing", NotificationManager.IMPORTANCE_LOW);
            channel.setShowBadge(false);
            manager.createNotificationChannel(channel);
        }
        session = new MediaSessionCompat(this, "SourPlayer");
        session.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { SourMediaPlugin.send("play", null); }
            @Override public void onPause() { SourMediaPlugin.send("pause", null); }
            @Override public void onSkipToNext() { SourMediaPlugin.send("next", null); }
            @Override public void onSkipToPrevious() { SourMediaPlugin.send("previous", null); }
            @Override public void onStop() { SourMediaPlugin.send("pause", null); }

            @Override
            public void onSeekTo(long pos) {
                JSObject data = new JSObject();
                data.put("position", pos / 1000.0);
                SourMediaPlugin.send("seek", data);
            }

            @Override
            public void onPlayFromMediaId(String mediaId, Bundle extras) {
                if (mediaId == null || !mediaId.startsWith("q:")) return;
                JSObject data = new JSObject();
                data.put("index", Integer.parseInt(mediaId.substring(2)));
                SourMediaPlugin.send("playIndex", data);
            }

            @Override
            public void onPlayFromSearch(String query, Bundle extras) {
                JSObject data = new JSObject();
                data.put("query", query == null ? "" : query);
                SourMediaPlugin.send("search", data);
            }

            @Override
            public void onSkipToQueueItem(long id) {
                JSObject data = new JSObject();
                data.put("index", (int) id);
                SourMediaPlugin.send("playIndex", data);
            }
        });
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (open != null) {
            session.setSessionActivity(PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        }
        session.setActive(true);
        setSessionToken(session.getSessionToken());
        refresh();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        MediaButtonReceiver.handleIntent(session, intent);
        refresh();
        return START_NOT_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // the app was swiped away: the music stopped with it
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        running = null;
        session.setActive(false);
        session.release();
        images.shutdownNow();
        super.onDestroy();
    }

    private void refresh() {
        NowPlaying n = now;
        if (!n.art.equals(artUrl)) {
            artUrl = n.art;
            artBitmap = null;
            String url = n.art;
            if (url.startsWith("http")) {
                images.submit(() -> {
                    Bitmap bitmap = download(url);
                    main.post(() -> {
                        if (url.equals(artUrl)) {
                            artBitmap = bitmap;
                            refresh();
                        }
                    });
                });
            }
        }
        MediaMetadataCompat.Builder meta = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, n.title)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, n.artist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, n.album)
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, n.duration > 0 ? n.duration : -1);
        if (artBitmap != null) meta.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, artBitmap);
        if (!n.art.isEmpty()) meta.putString(MediaMetadataCompat.METADATA_KEY_ALBUM_ART_URI, n.art);
        session.setMetadata(meta.build());
        session.setPlaybackState(new PlaybackStateCompat.Builder()
            .setActions(PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE | PlaybackStateCompat.ACTION_PLAY_PAUSE
                | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                | PlaybackStateCompat.ACTION_SEEK_TO | PlaybackStateCompat.ACTION_PLAY_FROM_MEDIA_ID
                | PlaybackStateCompat.ACTION_SKIP_TO_QUEUE_ITEM | PlaybackStateCompat.ACTION_STOP
                | PlaybackStateCompat.ACTION_PLAY_FROM_SEARCH)
            .setState(n.playing ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED, n.position, n.playing ? 1f : 0f)
            .build());

        lastArt = artBitmap;
        SourWidget.updateAll(this);
        Notification notification = buildNotification(n);
        if (n.playing) {
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
                } else {
                    startForeground(NOTIFICATION_ID, notification);
                }
                foreground = true;
            } catch (Exception ignored) {
                getSystemService(NotificationManager.class).notify(NOTIFICATION_ID, notification);
            }
        } else {
            if (foreground) {
                // paused: the notification stays (and can be swiped away), Android may stop the service
                stopForeground(false);
                foreground = false;
            }
            if (!n.title.isEmpty()) getSystemService(NotificationManager.class).notify(NOTIFICATION_ID, notification);
        }
    }

    private Notification buildNotification(NowPlaying n) {
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL)
            .setContentTitle(n.title.isEmpty() ? "Sour Player" : n.title)
            .setContentText(n.lyric.isEmpty() ? n.artist : n.lyric)
            .setSubText(n.album)
            .setLargeIcon(artBitmap)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(session.getController().getSessionActivity())
            .setDeleteIntent(MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_STOP))
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .setOngoing(n.playing)
            .addAction(android.R.drawable.ic_media_previous, "Previous",
                MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS))
            .addAction(n.playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, n.playing ? "Pause" : "Play",
                MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_PLAY_PAUSE))
            .addAction(android.R.drawable.ic_media_next, "Next",
                MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_SKIP_TO_NEXT))
            .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(session.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2));
        return b.build();
    }

    private static Bitmap download(String url) {
        try {
            HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);
            try (InputStream in = conn.getInputStream()) {
                Bitmap bitmap = BitmapFactory.decodeStream(in);
                if (bitmap == null) return null;
                int max = 512;
                if (bitmap.getWidth() > max || bitmap.getHeight() > max) {
                    float scale = Math.min(max / (float) bitmap.getWidth(), max / (float) bitmap.getHeight());
                    bitmap = Bitmap.createScaledBitmap(bitmap, Math.round(bitmap.getWidth() * scale), Math.round(bitmap.getHeight() * scale), true);
                }
                return bitmap;
            }
        } catch (Exception e) {
            return null;
        }
    }

    // Android Auto (and other media browsers): one list, Up next, with the queue in it
    @Nullable
    @Override
    public BrowserRoot onGetRoot(@NonNull String clientPackageName, int clientUid, @Nullable Bundle rootHints) {
        return new BrowserRoot(ROOT, null);
    }

    @Override
    public void onLoadChildren(@NonNull String parentId, @NonNull Result<List<MediaBrowserCompat.MediaItem>> result) {
        List<MediaBrowserCompat.MediaItem> items = new ArrayList<>();
        if (ROOT.equals(parentId)) {
            items.add(new MediaBrowserCompat.MediaItem(new MediaDescriptionCompat.Builder()
                .setMediaId(UP_NEXT)
                .setTitle("Up next")
                .setSubtitle(queue.size() + " songs")
                .build(), MediaBrowserCompat.MediaItem.FLAG_BROWSABLE));
        } else if (UP_NEXT.equals(parentId)) {
            for (QueueItem q : queue) {
                MediaDescriptionCompat.Builder d = new MediaDescriptionCompat.Builder()
                    .setMediaId("q:" + q.index)
                    .setTitle(q.title)
                    .setSubtitle(q.artist);
                if (q.art.startsWith("http")) d.setIconUri(Uri.parse(q.art));
                items.add(new MediaBrowserCompat.MediaItem(d.build(), MediaBrowserCompat.MediaItem.FLAG_PLAYABLE));
            }
        }
        result.sendResult(items);
    }
}
