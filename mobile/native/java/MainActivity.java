package com.anjalo.sourplayer;

import android.os.Bundle;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SourMediaPlugin.class);
        super.onCreate(savedInstanceState);
        // Back goes back a page; on the first page it hides the app instead of closing it, so the
        // music keeps playing
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView web = getBridge() == null ? null : getBridge().getWebView();
                if (web != null && web.canGoBack()) web.goBack();
                else moveTaskToBack(true);
            }
        });
    }

    @Override
    public void onPause() {
        super.onPause();
        // keep the web app (and its audio) running while the screen is off or another app is open
        if (getBridge() != null && getBridge().getWebView() != null) getBridge().getWebView().resumeTimers();
    }
}
