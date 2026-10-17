package com.anjalo.sourplayer;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.media.AudioDeviceCallback;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanner;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

// The web app's way into Android: what's playing (notification, lock screen, widget, Android Auto),
// the queue (Android Auto's Up next), app updates, offline songs, notifications, QR codes, shared
// links, Quick Settings tiles, and headphones or the car connecting.
@CapacitorPlugin(
    name = "SourMedia",
    permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) }
)
public class SourMediaPlugin extends Plugin {

    static SourMediaPlugin instance;
    // something opened the app (a shared link, a tile) before the web app was listening
    static JSObject pendingIntent;
    private boolean askedForNotifications = false;
    private static final String UPDATES_CHANNEL = "updates";

    @Override
    public void load() {
        instance = this;
        watchAudioDevices();
    }

    // the notification, lock screen, headset, widget, tile or car asked for something
    static void send(String action, JSObject extra) {
        SourMediaPlugin plugin = instance;
        if (plugin == null) return;
        JSObject data = extra == null ? new JSObject() : extra;
        data.put("action", action);
        plugin.notifyListeners("action", data);
    }

    // a link shared to Sour Player, or a Quick Settings tile
    static void handleIntent(Intent intent) {
        if (intent == null) return;
        JSObject data = null;
        if (Intent.ACTION_SEND.equals(intent.getAction()) && "text/plain".equals(intent.getType())) {
            String text = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (text != null && !text.isEmpty()) {
                data = new JSObject();
                data.put("type", "share");
                data.put("text", text);
            }
        } else if (intent.hasExtra("sour_action")) {
            data = new JSObject();
            data.put("type", intent.getStringExtra("sour_action"));
            intent.removeExtra("sour_action");
        }
        if (data == null) return;
        pendingIntent = data;
        if (instance != null) instance.notifyListeners("intent", data);
    }

    // the web app asks once it's listening (covers links shared while the app was closed)
    @PluginMethod
    public void takeIntent(PluginCall call) {
        JSObject result = new JSObject();
        if (pendingIntent != null) result.put("intent", pendingIntent);
        pendingIntent = null;
        call.resolve(result);
    }

    private void askForNotifications() {
        if (askedForNotifications || Build.VERSION.SDK_INT < 33 || getActivity() == null) return;
        askedForNotifications = true;
        if (getPermissionState("notifications") != PermissionState.GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), new String[] { Manifest.permission.POST_NOTIFICATIONS }, 4711);
        }
    }

    @PluginMethod
    public void update(PluginCall call) {
        SourMediaService.NowPlaying now = new SourMediaService.NowPlaying();
        now.title = call.getString("title", "");
        now.artist = call.getString("artist", "");
        now.album = call.getString("album", "");
        now.art = call.getString("art", "");
        now.lyric = call.getString("lyric", "");
        now.friends = call.getString("friends", "");
        now.duration = (long) (call.getDouble("duration", 0.0) * 1000);
        now.position = (long) (call.getDouble("position", 0.0) * 1000);
        now.playing = call.getBoolean("playing", false);
        if (now.playing) askForNotifications();
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
            result.put("code", Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode);
        } catch (Exception e) {
            result.put("version", "0");
            result.put("code", 0);
        }
        call.resolve(result);
    }

    // ---- notifications (a request finished, a friend started Group Play, a new release)

    @PluginMethod
    public void notify(PluginCall call) {
        askForNotifications();
        NotificationManager manager = getContext().getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26 && manager.getNotificationChannel(UPDATES_CHANNEL) == null) {
            manager.createNotificationChannel(new NotificationChannel(UPDATES_CHANNEL, "Requests and friends", NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent open = getContext().getPackageManager().getLaunchIntentForPackage(getContext().getPackageName());
        PendingIntent tap = open == null ? null : PendingIntent.getActivity(getContext(), 1, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder b = new NotificationCompat.Builder(getContext(), UPDATES_CHANNEL)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle(call.getString("title", "Sour Player"))
            .setContentText(call.getString("text", ""))
            .setAutoCancel(true);
        if (tap != null) b.setContentIntent(tap);
        try {
            manager.notify(1000 + (call.getString("id", "").hashCode() & 0xffff), b.build());
        } catch (SecurityException ignored) {
            // notifications turned off for the app
        }
        call.resolve();
    }

    // ---- network (data saver, offline downloads on Wi-Fi only)

    @PluginMethod
    public void network(PluginCall call) {
        JSObject result = new JSObject();
        String type = "none";
        try {
            ConnectivityManager cm = getContext().getSystemService(ConnectivityManager.class);
            NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork());
            if (caps != null) {
                if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) || caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) type = "wifi";
                else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) type = "cellular";
                else type = "other";
            }
        } catch (Exception ignored) {
            // unknown
        }
        result.put("type", type);
        call.resolve(result);
    }

    // ---- offline songs (kept in the app's own storage)

    private File offlineDir() {
        File dir = new File(getContext().getFilesDir(), "offline");
        dir.mkdirs();
        return dir;
    }

    private static String safe(String id) {
        return id.replaceAll("[^A-Za-z0-9_-]", "_");
    }

    @PluginMethod
    public void saveOffline(PluginCall call) {
        String id = call.getString("id");
        String url = call.getString("url");
        String ext = call.getString("ext", "mp3").replaceAll("[^A-Za-z0-9]", "");
        if (id == null || url == null) {
            call.reject("Missing song");
            return;
        }
        new Thread(() -> {
            File target = new File(offlineDir(), safe(id) + "." + ext);
            File part = new File(target.getPath() + ".part");
            try {
                HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
                conn.setConnectTimeout(20000);
                conn.setReadTimeout(60000);
                try (InputStream in = conn.getInputStream(); FileOutputStream out = new FileOutputStream(part)) {
                    byte[] buffer = new byte[65536];
                    int n;
                    while ((n = in.read(buffer)) > 0) out.write(buffer, 0, n);
                }
                if (target.exists()) target.delete();
                if (!part.renameTo(target)) throw new Exception("Could not save it");
                JSObject result = new JSObject();
                result.put("path", target.getAbsolutePath());
                result.put("size", target.length());
                call.resolve(result);
            } catch (Exception e) {
                part.delete();
                call.reject("Download failed: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void listOffline(PluginCall call) {
        JSArray list = new JSArray();
        File[] files = offlineDir().listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.getName().endsWith(".part")) continue;
                JSObject item = new JSObject();
                String name = f.getName();
                item.put("file", name.contains(".") ? name.substring(0, name.lastIndexOf('.')) : name);
                item.put("path", f.getAbsolutePath());
                item.put("size", f.length());
                list.put(item);
            }
        }
        JSObject result = new JSObject();
        result.put("files", list);
        call.resolve(result);
    }

    @PluginMethod
    public void removeOffline(PluginCall call) {
        String id = call.getString("id", "");
        File[] files = offlineDir().listFiles();
        if (files != null) for (File f : files) if (f.getName().startsWith(safe(id) + ".")) f.delete();
        call.resolve();
    }

    @PluginMethod
    public void clearOffline(PluginCall call) {
        File[] files = offlineDir().listFiles();
        if (files != null) for (File f : files) f.delete();
        call.resolve();
    }

    // ---- QR codes (listen along and Group Play invites)

    @PluginMethod
    public void qr(PluginCall call) {
        try {
            int size = 600;
            BitMatrix m = new QRCodeWriter().encode(call.getString("text", ""), BarcodeFormat.QR_CODE, size, size);
            Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            for (int x = 0; x < size; x++) for (int y = 0; y < size; y++) bmp.setPixel(x, y, m.get(x, y) ? Color.BLACK : Color.WHITE);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
            JSObject result = new JSObject();
            result.put("image", "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Couldn't make the code");
        }
    }

    @PluginMethod
    public void scanQr(PluginCall call) {
        GmsBarcodeScanner scanner = GmsBarcodeScanning.getClient(getContext());
        scanner.startScan()
            .addOnSuccessListener((barcode) -> {
                JSObject result = new JSObject();
                result.put("text", barcode.getRawValue());
                call.resolve(result);
            })
            .addOnCanceledListener(() -> call.reject("cancelled"))
            .addOnFailureListener((e) -> call.reject("The scanner isn't available on this phone"));
    }

    // ---- "What's playing?": the phone's own song recognition (Google or Shazam)

    @PluginMethod
    public void musicSearch(PluginCall call) {
        Intent[] tries = {
            new Intent("com.google.android.googlequicksearchbox.MUSIC_SEARCH"),
            getContext().getPackageManager().getLaunchIntentForPackage("com.shazam.android"),
        };
        for (Intent intent : tries) {
            if (intent == null) continue;
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getContext().startActivity(intent);
                call.resolve();
                return;
            } catch (Exception ignored) {
                // try the next one
            }
        }
        call.reject("No song recognition on this phone (install Shazam, or use the Google app)");
    }

    // ---- headphones, Bluetooth and the car

    private boolean devicesListed = false;

    private void watchAudioDevices() {
        AudioManager audio = getContext().getSystemService(AudioManager.class);
        audio.registerAudioDeviceCallback(new AudioDeviceCallback() {
            @Override
            public void onAudioDevicesAdded(AudioDeviceInfo[] devices) {
                // the first call lists what's already connected: not a new connection
                if (!devicesListed) {
                    devicesListed = true;
                    return;
                }
                report(devices, true);
            }

            @Override
            public void onAudioDevicesRemoved(AudioDeviceInfo[] devices) {
                report(devices, false);
            }
        }, null);
        // unplugged headphones / Bluetooth gone: pause like every music app
        IntentFilter noisy = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                send("noisy", null);
            }
        };
        if (Build.VERSION.SDK_INT >= 33) getContext().registerReceiver(receiver, noisy, Context.RECEIVER_NOT_EXPORTED);
        else getContext().registerReceiver(receiver, noisy);
    }

    private void report(AudioDeviceInfo[] devices, boolean connected) {
        for (AudioDeviceInfo d : devices) {
            if (!d.isSink()) continue;
            int t = d.getType();
            boolean bluetooth = t == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP;
            boolean wired = t == AudioDeviceInfo.TYPE_WIRED_HEADPHONES || t == AudioDeviceInfo.TYPE_WIRED_HEADSET || t == AudioDeviceInfo.TYPE_USB_HEADSET;
            if (!bluetooth && !wired) continue;
            JSObject data = new JSObject();
            data.put("connected", connected);
            data.put("bluetooth", bluetooth);
            data.put("name", String.valueOf(d.getProductName()));
            notifyListeners("device", data);
        }
    }

    // ---- icon packs

    @PluginMethod
    public void setIcon(PluginCall call) {
        String pack = call.getString("pack", "classic");
        String[] packs = { "classic", "lime", "grapefruit", "blueberry", "grape", "gold", "mono", "negative", "pixel" };
        boolean known = false;
        for (String p : packs) known |= p.equals(pack);
        if (!known) pack = "classic";
        PackageManager pm = getContext().getPackageManager();
        for (String p : packs) {
            ComponentName alias = new ComponentName(
                getContext().getPackageName(),
                "com.anjalo.sourplayer.Icon" + Character.toUpperCase(p.charAt(0)) + p.substring(1)
            );
            int state = p.equals(pack) ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
            if (pm.getComponentEnabledSetting(alias) != state) pm.setComponentEnabledSetting(alias, state, PackageManager.DONT_KILL_APP);
        }
        call.resolve();
    }

    // ---- app updates

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
