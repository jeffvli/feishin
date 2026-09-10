package club.srvr.feishin

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.widget.Toast
import org.json.JSONObject

class AndroidBridge(
    private val context: Context,
    private val onTrackUpdate: (title: String, artist: String, album: String, artworkUrl: String) -> Unit,
    private val onPlaybackStateChange: (isPlaying: Boolean, positionMs: Long, durationMs: Long) -> Unit
) {

    @JavascriptInterface
    fun updateTrackInfo(title: String, artist: String, album: String, artworkUrl: String) {
        onTrackUpdate(title, artist, album, artworkUrl)
    }

    @JavascriptInterface
    fun setPlaybackState(isPlaying: Boolean, positionMs: Long, durationMs: Long) {
        onPlaybackStateChange(isPlaying, positionMs, durationMs)
    }

    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun hapticFeedback() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator?.vibrate(
                    VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(20)
                }
            }
        } catch (e: Exception) {
            // Ignore haptic failures
        }
    }

    @JavascriptInterface
    fun getDeviceInfo(): String {
        val info = JSONObject().apply {
            put("platform", "android")
            put("androidVersion", Build.VERSION.RELEASE)
            put("sdkInt", Build.VERSION.SDK_INT)
            put("model", Build.MODEL)
            put("manufacturer", Build.MANUFACTURER)
            put("appVersion", "1.15.1-android-poc")
        }
        return info.toString()
    }
}
