package club.srvr.feishin

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import club.srvr.feishin.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: SharedPreferences

    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    companion object {
        private const val PREFS_NAME = "feishin_prefs"
        private const val KEY_SERVER_URL = "server_url"
        private const val DEFAULT_SERVER_URL = "https://feishin.srvr.club/"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge layout
        WindowCompat.setDecorFitsSystemWindows(window, false)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        setupWindowInsets()
        setupMediaServiceListener()
        setupWebView()
        setupPullToRefresh()
        setupErrorView()
        setupBackNavigation()

        loadServer()
    }

    private fun setupWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.rootLayout) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(0, systemBars.top, 0, systemBars.bottom)
            insets
        }
    }

    private fun getServerUrl(): String {
        return prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
    }

    private fun setServerUrl(url: String) {
        var cleanUrl = url.trim()
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = "https://$cleanUrl"
        }
        if (!cleanUrl.endsWith("/")) {
            cleanUrl = "$cleanUrl/"
        }
        prefs.edit().putString(KEY_SERVER_URL, cleanUrl).apply()
        loadServer()
    }

    private fun loadServer() {
        val url = getServerUrl()
        binding.errorLayout.visibility = View.GONE
        binding.webView.visibility = View.VISIBLE
        binding.progressBar.visibility = View.VISIBLE
        binding.progressBar.progress = 10
        binding.webView.loadUrl(url)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(binding.webView, true)

        binding.webView.apply {
            // Hardware acceleration
            setLayerType(View.LAYER_TYPE_HARDWARE, null)

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true

                // Hyper-performance optimizations for large virtualized libraries
                setOffscreenPreRaster(true)
                setRenderPriority(WebSettings.RenderPriority.HIGH)
                cacheMode = WebSettings.LOAD_DEFAULT

                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

                useWideViewPort = true
                loadWithOverviewMode = true
                builtInZoomControls = false
                displayZoomControls = false

                allowFileAccess = false
                allowContentAccess = true

                userAgentString = "${userAgentString} FeishinAndroid/1.15.1"
            }

            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = View.OVER_SCROLL_IF_CONTENT_SCROLLS

            // Register native bridge
            addJavascriptInterface(
                AndroidBridge(
                    this@MainActivity,
                    onTrackUpdate = { title, artist, album, artworkUrl ->
                        runOnUiThread {
                            updateMediaMetadata(title, artist, album, artworkUrl, isPlaying = true)
                        }
                    },
                    onPlaybackStateChange = { isPlaying, _, _ ->
                        runOnUiThread {
                            updatePlaybackState(isPlaying)
                        }
                    }
                ),
                "AndroidBridge"
            )

            webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    binding.progressBar.visibility = View.VISIBLE
                    binding.errorLayout.visibility = View.GONE
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false
                    cookieManager.flush()

                    // Inject MediaSession and performance bridge
                    injectFeishinIntegrationScript()
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    if (request?.isForMainFrame == true) {
                        binding.progressBar.visibility = View.GONE
                        binding.swipeRefresh.isRefreshing = false
                        binding.webView.visibility = View.GONE
                        binding.errorLayout.visibility = View.VISIBLE
                        binding.errorDetailsText.text = "Connection error (${error?.errorCode}): ${error?.description}"
                    }
                }

                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val targetUrl = request?.url?.toString() ?: return false
                    val serverHost = Uri.parse(getServerUrl()).host ?: ""

                    // Keep same server and Cloudflare Access inside WebView
                    if (targetUrl.contains(serverHost) ||
                        targetUrl.contains("cloudflareaccess.com") ||
                        targetUrl.contains("cloudflare.com") ||
                        targetUrl.contains("accounts.google.com")
                    ) {
                        return false
                    }

                    // External URLs (e.g. Last.fm, MusicBrainz) launch external browser
                    return try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(targetUrl)))
                        true
                    } catch (e: Exception) {
                        false
                    }
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    super.onProgressChanged(view, newProgress)
                    if (newProgress < 100) {
                        binding.progressBar.visibility = View.VISIBLE
                        binding.progressBar.progress = newProgress
                    } else {
                        binding.progressBar.visibility = View.GONE
                    }
                }

                override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                    if (customView != null) {
                        callback?.onCustomViewHidden()
                        return
                    }
                    customView = view
                    customViewCallback = callback
                    binding.customViewContainer.addView(
                        view,
                        FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                    )
                    binding.customViewContainer.visibility = View.VISIBLE
                    binding.swipeRefresh.visibility = View.GONE
                }

                override fun onHideCustomView() {
                    if (customView == null) return
                    binding.customViewContainer.removeView(customView)
                    customView = null
                    customViewCallback?.onCustomViewHidden()
                    customViewCallback = null
                    binding.customViewContainer.visibility = View.GONE
                    binding.swipeRefresh.visibility = View.VISIBLE
                }
            }
        }
    }

    private fun injectFeishinIntegrationScript() {
        val script = """
            (function() {
                if (window.__feishinAndroidInjected) return;
                window.__feishinAndroidInjected = true;

                // Hook navigator.mediaSession to bridge metadata to native Android notification
                if (navigator.mediaSession) {
                    var origSetMetadata = Object.getOwnPropertyDescriptor(MediaSession.prototype, 'metadata');
                    if (origSetMetadata && origSetMetadata.set) {
                        var origSetter = origSetMetadata.set;
                        Object.defineProperty(navigator.mediaSession, 'metadata', {
                            set: function(val) {
                                origSetter.call(this, val);
                                if (val && window.AndroidBridge) {
                                    var title = val.title || '';
                                    var artist = val.artist || '';
                                    var album = val.album || '';
                                    var art = '';
                                    if (val.artwork && val.artwork.length > 0) {
                                        art = val.artwork[val.artwork.length - 1].src || '';
                                    }
                                    window.AndroidBridge.updateTrackInfo(title, artist, album, art);
                                }
                            },
                            get: origSetMetadata.get,
                            configurable: true
                        });
                    }

                    var origSetPlaybackState = Object.getOwnPropertyDescriptor(MediaSession.prototype, 'playbackState');
                    if (origSetPlaybackState && origSetPlaybackState.set) {
                        var origPlaybackSetter = origSetPlaybackState.set;
                        Object.defineProperty(navigator.mediaSession, 'playbackState', {
                            set: function(val) {
                                origPlaybackSetter.call(this, val);
                                if (window.AndroidBridge) {
                                    window.AndroidBridge.setPlaybackState(val === 'playing', 0, 0);
                                }
                            },
                            get: origSetPlaybackState.get,
                            configurable: true
                        });
                    }
                }

                // Inject CSS optimization for large virtual lists
                var style = document.createElement('style');
                style.innerHTML = `
                    * { -webkit-tap-highlight-color: transparent !important; }
                    .fs-item-table-list, [data-virtualized="true"] {
                        will-change: transform;
                        contain: content;
                    }
                `;
                document.head.appendChild(style);
            })();
        """.trimIndent()

        binding.webView.evaluateJavascript(script, null)
    }

    private fun setupPullToRefresh() {
        binding.swipeRefresh.setColorSchemeResources(R.color.feishin_accent)
        binding.swipeRefresh.setProgressBackgroundColorSchemeResource(R.color.feishin_surface)
        binding.swipeRefresh.setOnRefreshListener {
            binding.webView.reload()
        }
    }

    private fun setupErrorView() {
        binding.btnRetry.setOnClickListener {
            loadServer()
        }
        binding.btnChangeServer.setOnClickListener {
            showServerUrlDialog()
        }
        binding.errorLayout.setOnLongClickListener {
            showServerUrlDialog()
            true
        }
    }

    private fun showServerUrlDialog() {
        val input = EditText(this).apply {
            setText(getServerUrl())
            setSelection(text.length)
            hint = getString(R.string.server_url_hint)
            setTextColor(getColor(R.color.feishin_text_primary))
            setHintTextColor(getColor(R.color.feishin_text_secondary))
        }

        AlertDialog.Builder(this)
            .setTitle(R.string.change_server)
            .setView(input)
            .setPositiveButton(R.string.save) { _, _ ->
                val newUrl = input.text.toString()
                if (newUrl.isNotBlank()) {
                    setServerUrl(newUrl)
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun setupMediaServiceListener() {
        FeishinMediaService.mediaActionListener = { action ->
            runOnUiThread {
                when (action) {
                    FeishinMediaService.ACTION_PLAY -> {
                        binding.webView.evaluateJavascript(
                            """
                            (function() {
                                var btn = document.querySelector('button[aria-label*="Play" i]') ||
                                          document.querySelector('[data-action="play"]');
                                if (btn) { btn.click(); return; }
                                var aud = document.querySelector('audio');
                                if (aud) aud.play();
                            })();
                            """.trimIndent(),
                            null
                        )
                    }
                    FeishinMediaService.ACTION_PAUSE -> {
                        binding.webView.evaluateJavascript(
                            """
                            (function() {
                                var btn = document.querySelector('button[aria-label*="Pause" i]') ||
                                          document.querySelector('[data-action="pause"]');
                                if (btn) { btn.click(); return; }
                                var aud = document.querySelector('audio');
                                if (aud) aud.pause();
                            })();
                            """.trimIndent(),
                            null
                        )
                    }
                    FeishinMediaService.ACTION_NEXT -> {
                        binding.webView.evaluateJavascript(
                            """
                            (function() {
                                var btn = document.querySelector('button[aria-label*="Next" i]') ||
                                          document.querySelector('[data-action="next"]');
                                if (btn) btn.click();
                            })();
                            """.trimIndent(),
                            null
                        )
                    }
                    FeishinMediaService.ACTION_PREV -> {
                        binding.webView.evaluateJavascript(
                            """
                            (function() {
                                var btn = document.querySelector('button[aria-label*="Previous" i]') ||
                                          document.querySelector('[data-action="prev"]');
                                if (btn) btn.click();
                            })();
                            """.trimIndent(),
                            null
                        )
                    }
                }
            }
        }
    }

    private fun updateMediaMetadata(title: String, artist: String, album: String, artworkUrl: String, isPlaying: Boolean) {
        val serviceIntent = Intent(this, FeishinMediaService::class.java).apply {
            action = FeishinMediaService.ACTION_UPDATE_TRACK
            putExtra(FeishinMediaService.EXTRA_TITLE, title)
            putExtra(FeishinMediaService.EXTRA_ARTIST, artist)
            putExtra(FeishinMediaService.EXTRA_ALBUM, album)
            putExtra(FeishinMediaService.EXTRA_ARTWORK_URL, artworkUrl)
            putExtra(FeishinMediaService.EXTRA_IS_PLAYING, isPlaying)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    private fun updatePlaybackState(isPlaying: Boolean) {
        val serviceIntent = Intent(this, FeishinMediaService::class.java).apply {
            action = if (isPlaying) FeishinMediaService.ACTION_PLAY else FeishinMediaService.ACTION_PAUSE
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (customView != null) {
                    binding.webView.webChromeClient?.onHideCustomView()
                } else if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    // Send app to background without killing media playback
                    moveTaskToBack(true)
                }
            }
        })
    }

    override fun onPause() {
        super.onPause()
        CookieManager.getInstance().flush()
    }

    override fun onDestroy() {
        super.onDestroy()
        binding.webView.destroy()
    }
}
