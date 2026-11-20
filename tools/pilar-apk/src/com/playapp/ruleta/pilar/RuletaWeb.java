package com.playapp.ruleta.pilar;

import android.view.MotionEvent;
import android.webkit.WebView;

/** WebView que avisa a la actividad cuando recibe movimiento de un puntero capturado. */
public class RuletaWeb extends WebView {
    private final MainActivity act;

    public RuletaWeb(MainActivity a) { super(a); act = a; setFocusable(true); setFocusableInTouchMode(true); }

    @Override
    public boolean onCapturedPointerEvent(MotionEvent ev) {
        act.avisar("C", ev);
        return true;
    }
}
