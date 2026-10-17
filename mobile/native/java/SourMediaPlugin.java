package com.anjalo.sourplayer;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

// The web app's way into Android: what's playing (for the notification, lock screen and Android
// Auto), the queue (Android Auto's Up next) and app updates (download the new APK, then install).
@CapacitorPlugin(
    name = "SourMedia",
    permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) }
)
public class SourMediaPlugin extends Plugin {

    static SourMediaPlugin instance;
    private boolean askedForNotifications = false;

    @Override
    public void load() {
        instance = this;
    }

    // the notification, lock screen, headset or car asked for something
    static void send(String action, JSObject extra) {
        SourMediaPlugin plugin = instance;
        if (plugin == null) return;
        JSObject data = extra == null ? new JSObject() : extra;
        data.put("action", action);
        plugin.notifyListeners("action", data);
    }

    @PluginMethod
    public void update(PluginCall call) {
        SourMediaService.NowPlaying now = new SourMediaService.NowPlaying();
        now.title = call.getString("title", "");
        now.artist = call.getString("artist", "");
        now.album = call.getString("album", "");
        now.art = call.getString("art", "");
        now.duration = (long) (call.getDouble("duration", 0.0) * 1000);
        now.position = (long) (call.getDouble("position", 0.0) * 1000);
        now.playing = call.getBoolean("playing", false);
        // Android 13+: the media notification needs permission (asked once, the first time music plays)
        if (now.playing && !askedForNotifications && Build.VERSION.SDK_INT >= 33) {
            askedForNotifications = true;
            if (getActivity() != null && getPermissionState("notifications") != com.getcapacitor.PermissionState.GRANTED) {
                androidx.core.app.ActivityCompat.requestPermissions(getActivity(), new String[] { Manifest.permission.POST_NOTIFICATIONS }, 4711);
            }
        }
        SourMediaService.show(getContext(), now);
        call.resolve();
    }

    @PluginMethod
    public void setQueue(PluginCall call) {
        JSArray items = call.getArray("items", new JSArray());
        List<SourMediaService.QueueItem> queue = new ArrayList<>();
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.optJSONObject(i);
            if (item == null) continue;
            SourMediaService.QueueItem q = new SourMediaService.QueueItem();
            q.index = i;
            q.title = item.optString("title", "");
            q.artist = item.optString("artist", "");
            q.art = item.optString("art", "");
            queue.add(q);
        }
        SourMediaService.setQueue(queue);
        call.resolve();
    }

    @PluginMethod
    public void info(PluginCall call) {
        JSObject result = new JSObject();
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            result.put("version", info.versionName);
        } catch (Exception e) {
            result.put("version", "0");
        }
        call.resolve(result);
    }

    private File updateFile() {
        File dir = new File(getContext().getCacheDir(), "updates");
        dir.mkdirs();
        return new File(dir, "sour-player.apk");
    }

    @PluginMethod
    public void downloadUpdate(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !url.startsWith("https://")) {
            call.reject("No update link");
            return;
        }
        new Thread(() -> {
            File target = updateFile();
            File part = new File(target.getPath() + ".part");
            try {
                HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setConnectTimeout(20000);
                conn.setReadTimeout(60000);
                long total = conn.getContentLengthLong();
                try (InputStream in = conn.getInputStream(); FileOutputStream out = new FileOutputStream(part)) {
                    byte[] buffer = new byte[65536];
                    long done = 0;
                    int lastPercent = -1;
                    int n;
                    while ((n = in.read(buffer)) > 0) {
                        out.write(buffer, 0, n);
                        done += n;
                        int percent = total > 0 ? (int) (done * 100 / total) : 0;
                        if (percent != lastPercent) {
                            lastPercent = percent;
                            JSObject progress = new JSObject();
                            progress.put("percent", percent);
                            notifyListeners("update", progress);
                        }
                    }
                }
                if (target.exists()) target.delete();
                if (!part.renameTo(target)) throw new Exception("Could not save the update");
                call.resolve();
            } catch (Exception e) {
                part.delete();
                call.reject("The update didn't download: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void installUpdate(PluginCall call) {
        File apk = updateFile();
        if (!apk.exists()) {
            call.reject("No update downloaded");
            return;
        }
        // Android 8+: the first time, the user allows Sour Player to install apps
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent allow = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
            allow.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(allow);
            call.resolve();
            return;
        }
        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
        Intent install = new Intent(Intent.ACTION_VIEW);
        install.setDataAndType(uri, "application/vnd.android.package-archive");
        install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(install);
        call.resolve();
    }
}
