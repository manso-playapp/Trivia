package com.playapp.ruleta.pilar;

import android.content.Context;
import android.webkit.JavascriptInterface;
import java.io.File;
import java.io.FileOutputStream;

/** Lo usa "Exportar" del panel: guarda el CSV en la carpeta de archivos de la app y devuelve la ruta. */
public class Puente {
    private final Context ctx;

    public Puente(Context c) { ctx = c; }

    @JavascriptInterface
    public String guardar(String nombre, String texto) throws Exception {
        File dir = ctx.getExternalFilesDir(null);
        if (dir == null) dir = ctx.getFilesDir();
        File f = new File(dir, new File(nombre).getName());
        FileOutputStream o = new FileOutputStream(f);
        o.write(new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF });
        o.write(texto.getBytes("UTF-8"));
        o.close();
        return f.getAbsolutePath();
    }

    /** Para el diagnóstico en pantalla: versión de Android y dispositivos de entrada conectados. */
    @JavascriptInterface
    public String info() {
        StringBuilder s = new StringBuilder("API " + android.os.Build.VERSION.SDK_INT);
        for (int id : android.view.InputDevice.getDeviceIds()) {
            android.view.InputDevice dev = android.view.InputDevice.getDevice(id);
            if (dev != null && !dev.isVirtual())
                s.append("<br>").append(dev.getName().replace("<", "")).append(" f").append(Integer.toHexString(dev.getSources()));
        }
        return s.toString();
    }
}
