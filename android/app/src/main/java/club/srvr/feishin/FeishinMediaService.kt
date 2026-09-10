package club.srvr.feishin

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import androidx.media.app.NotificationCompat.MediaStyle
import java.net.URL
import kotlin.concurrent.thread

class FeishinMediaService : Service() {

    private val binder = LocalBinder()
    private var mediaSession: MediaSessionCompat? = null
    private var wakeLock: PowerManager.WakeLock? = null

    private var currentTitle = "Feishin"
    private var currentArtist = "Playing Music"
    private var currentAlbum = ""
    private var currentArtworkUrl = ""
    private var currentArtworkBitmap: Bitmap? = null
    private var isPlaying = false

    companion object {
        const val NOTIFICATION_ID = 1001

        const val ACTION_PLAY = "club.srvr.feishin.ACTION_PLAY"
        const val ACTION_PAUSE = "club.srvr.feishin.ACTION_PAUSE"
        const val ACTION_NEXT = "club.srvr.feishin.ACTION_NEXT"
        const val ACTION_PREV = "club.srvr.feishin.ACTION_PREV"
        const val ACTION_STOP = "club.srvr.feishin.ACTION_STOP"
        const val ACTION_UPDATE_TRACK = "club.srvr.feishin.ACTION_UPDATE_TRACK"

        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_ARTIST = "extra_artist"
        const val EXTRA_ALBUM = "extra_album"
        const val EXTRA_ARTWORK_URL = "extra_artwork_url"
        const val EXTRA_IS_PLAYING = "extra_is_playing"

        var mediaActionListener: ((action: String) -> Unit)? = null
    }

    inner class LocalBinder : Binder() {
        fun getService(): FeishinMediaService = this@FeishinMediaService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()

        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Feishin:PlaybackWakeLock")

        initMediaSession()
    }

    private fun initMediaSession() {
        mediaSession = MediaSessionCompat(this, "FeishinMediaSession").apply {
            setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS)

            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    mediaActionListener?.invoke(ACTION_PLAY)
                    updatePlaybackState(true)
                }

                override fun onPause() {
                    mediaActionListener?.invoke(ACTION_PAUSE)
                    updatePlaybackState(false)
                }

                override fun onSkipToNext() {
                    mediaActionListener?.invoke(ACTION_NEXT)
                }

                override fun onSkipToPrevious() {
                    mediaActionListener?.invoke(ACTION_PREV)
                }

                override fun onStop() {
                    mediaActionListener?.invoke(ACTION_STOP)
                    stopForegroundService()
                }
            })

            isActive = true
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_PLAY -> {
                mediaActionListener?.invoke(ACTION_PLAY)
                updatePlaybackState(true)
            }
            ACTION_PAUSE -> {
                mediaActionListener?.invoke(ACTION_PAUSE)
                updatePlaybackState(false)
            }
            ACTION_NEXT -> mediaActionListener?.invoke(ACTION_NEXT)
            ACTION_PREV -> mediaActionListener?.invoke(ACTION_PREV)
            ACTION_STOP -> stopForegroundService()
            ACTION_UPDATE_TRACK -> {
                currentTitle = intent.getStringExtra(EXTRA_TITLE) ?: currentTitle
                currentArtist = intent.getStringExtra(EXTRA_ARTIST) ?: currentArtist
                currentAlbum = intent.getStringExtra(EXTRA_ALBUM) ?: currentAlbum
                val artworkUrl = intent.getStringExtra(EXTRA_ARTWORK_URL) ?: ""
                val playing = intent.getBooleanExtra(EXTRA_IS_PLAYING, isPlaying)

                if (artworkUrl != currentArtworkUrl && artworkUrl.isNotEmpty()) {
                    currentArtworkUrl = artworkUrl
                    loadArtworkAsync(artworkUrl)
                }

                updatePlaybackState(playing)
            }
        }
        return START_NOT_STICKY
    }

    fun updateTrackMetadata(title: String, artist: String, album: String, artworkUrl: String, playing: Boolean) {
        currentTitle = title
        currentArtist = artist
        currentAlbum = album
        isPlaying = playing

        if (artworkUrl != currentArtworkUrl && artworkUrl.isNotEmpty()) {
            currentArtworkUrl = artworkUrl
            loadArtworkAsync(artworkUrl)
        } else {
            refreshNotification()
        }
        updatePlaybackState(playing)
    }

    private fun loadArtworkAsync(urlStr: String) {
        thread {
            try {
                val url = URL(urlStr)
                val bitmap = BitmapFactory.decodeStream(url.openConnection().getInputStream())
                currentArtworkBitmap = bitmap
                refreshNotification()
            } catch (e: Exception) {
                currentArtworkBitmap = null
                refreshNotification()
            }
        }
    }

    private fun updatePlaybackState(playing: Boolean) {
        isPlaying = playing
        val state = if (playing) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
        val actions = PlaybackStateCompat.ACTION_PLAY or
                PlaybackStateCompat.ACTION_PAUSE or
                PlaybackStateCompat.ACTION_PLAY_PAUSE or
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                PlaybackStateCompat.ACTION_STOP

        mediaSession?.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                .build()
        )

        mediaSession?.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, currentAlbum)
                .putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, currentArtworkBitmap)
                .build()
        )

        if (playing) {
            acquireWakeLock()
        } else {
            releaseWakeLock()
        }

        refreshNotification()
    }

    private fun refreshNotification() {
        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun buildNotification(): Notification {
        val contentIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val prevIntent = PendingIntent.getService(
            this,
            1,
            Intent(this, FeishinMediaService::class.java).apply { action = ACTION_PREV },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val playPauseAction = if (isPlaying) {
            val pauseIntent = PendingIntent.getService(
                this,
                2,
                Intent(this, FeishinMediaService::class.java).apply { action = ACTION_PAUSE },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            NotificationCompat.Action.Builder(
                android.R.drawable.ic_media_pause,
                "Pause",
                pauseIntent
            ).build()
        } else {
            val playIntent = PendingIntent.getService(
                this,
                2,
                Intent(this, FeishinMediaService::class.java).apply { action = ACTION_PLAY },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            NotificationCompat.Action.Builder(
                android.R.drawable.ic_media_play,
                "Play",
                playIntent
            ).build()
        }

        val nextIntent = PendingIntent.getService(
            this,
            3,
            Intent(this, FeishinMediaService::class.java).apply { action = ACTION_NEXT },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, FeishinApp.PLAYBACK_CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSubText(currentAlbum.ifEmpty { null })
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(contentIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .addAction(android.R.drawable.ic_media_previous, "Previous", prevIntent)
            .addAction(playPauseAction)
            .addAction(android.R.drawable.ic_media_next, "Next", nextIntent)
            .setStyle(
                MediaStyle()
                    .setMediaSession(mediaSession?.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2)
            )

        if (currentArtworkBitmap != null) {
            builder.setLargeIcon(currentArtworkBitmap)
        }

        return builder.build()
    }

    private fun acquireWakeLock() {
        if (wakeLock?.isHeld != true) {
            wakeLock?.acquire(12 * 60 * 60 * 1000L) // max 12 hours
        }
    }

    private fun releaseWakeLock() {
        if (wakeLock?.isHeld == true) {
            wakeLock?.release()
        }
    }

    private fun stopForegroundService() {
        releaseWakeLock()
        mediaSession?.isActive = false
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        stopForegroundService()
        mediaSession?.release()
        super.onDestroy()
    }
}
