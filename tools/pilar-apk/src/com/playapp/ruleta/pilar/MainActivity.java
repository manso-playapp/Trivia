package com.playapp.ruleta.pilar;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.PointerIcon;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Contenedor mínimo: muestra la ruleta web empaquetada, a pantalla completa y sin red. */
public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        web.setBackgroundColor(0xFF0A0716);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setSupportZoom(false);
        s.setTextZoom(100);
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Puente(this), "Android");
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        if (Build.VERSION.SDK_INT >= 24) web.setPointerIcon(PointerIcon.getSystemIcon(this, PointerIcon.TYPE_NULL));
        setContentView(web);
        web.loadUrl("file:///android_asset/pilar/index.html");
        web.requestFocus();
    }

    private void inmersivo() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public void onWindowFocusChanged(boolean foco) {
        super.onWindowFocusChanged(foco);
        if (foco) inmersivo();
    }

    @Override
    protected void onResume() {
        super.onResume();
        inmersivo();
        web.onResume();
    }

    /** El botón "atrás" del control no cierra el juego (para salir: botón Home). */
    @Override
    public boolean onKeyDown(int code, KeyEvent ev) {
        if (code == KeyEvent.KEYCODE_BACK) return true;
        return super.onKeyDown(code, ev);
    }

    /** Marcos táctiles que el sistema toma como mouse: avisa a la web dónde quedó el puntero. */
    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent ev) {
        int a = ev.getActionMasked();
        if (a == MotionEvent.ACTION_HOVER_MOVE || a == MotionEvent.ACTION_HOVER_ENTER) {
            float d = getResources().getDisplayMetrics().density;
            web.evaluateJavascript("window.__puntero&&__puntero(" + (ev.getX() / d) + "," + (ev.getY() / d) + ")", null);
        }
        return super.dispatchGenericMotionEvent(ev);
    }
}
