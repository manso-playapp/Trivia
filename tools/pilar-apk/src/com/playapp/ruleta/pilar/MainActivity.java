package com.playapp.ruleta.pilar;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import java.io.File;
import java.io.FileOutputStream;
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
        web.addJavascriptInterface(new Puente(), "Android");
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
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

    /** Lo usa "Exportar" del panel: guarda el CSV en la carpeta de archivos de la app y devuelve la ruta. */
    public class Puente {
        @JavascriptInterface
        public String guardar(String nombre, String texto) throws Exception {
            File dir = getExternalFilesDir(null);
            if (dir == null) dir = getFilesDir();
            File f = new File(dir, new File(nombre).getName());
            FileOutputStream o = new FileOutputStream(f);
            o.write(new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF });
            o.write(texto.getBytes("UTF-8"));
            o.close();
            return f.getAbsolutePath();
        }
    }
}
