package com.playapp.ruleta.pilar;

import android.view.MotionEvent;
import android.webkit.WebView;

/** WebView que avisa a la actividad cuando recibe movimiento de un puntero capturado. */
public class RuletaWeb extends WebView implements Runnable {
    private final MainActivity act;

    public RuletaWeb(MainActivity a) { super(a); act = a; setFocusable(true); setFocusableInTouchMode(true); }

    @Override
    public boolean onCapturedPointerEvent(MotionEvent ev) {
        act.avisar("C", ev);
        return true;
    }

    /** Muestra el teclado en pantalla (se ejecuta en el hilo de la interfaz). */
    @Override
    public void run() {
        android.view.inputmethod.InputMethodManager imm =
            (android.view.inputmethod.InputMethodManager) act.getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
        requestFocus();
        if (imm != null) imm.showSoftInput(this, android.view.inputmethod.InputMethodManager.SHOW_FORCED);
    }
}
