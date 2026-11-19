# Ruleta táctil offline — Pilar XV

Tercer tipo de juego del repo: **ruleta para pantalla táctil, sin internet**. Primer cliente: fiesta de quince de Pilar.
No usa Next ni Supabase: es una web estática en `public/pilar/` que se empaqueta como app Android.

## Brief

- Televisor Samsung de 50" **en vertical**, con marco táctil USB. Sin internet ni señal de celular en el lugar.
- El juego corre en un **Fire TV Stick 4K** conectado al HDMI; el televisor es solo la pantalla.
- La persona toca y gira, sin cargar datos. Siempre gana un premio.
- Premios: 35 bolsas, 20 botellas, 25 remeras, 25 pilusos (105 en total).
- Estética: atardecer violeta y rosa con arco, logo "Pilar XV".

## Archivos

| Ruta | Qué es |
| --- | --- |
| `public/pilar/config.js` | Premios, cantidades, colores, orden de gajos y PIN. Es lo único que hace falta tocar para otro evento. |
| `public/pilar/index.html`, `style.css`, `app.js` | El juego. Lienzo fijo de 1080×1920 que se escala y rota solo. |
| `public/pilar/assets/` | Logo vectorial, fondo y tipografía Playfair Display (licencia OFL incluida). |
| `public/pilar/ruleta-pilar-xv.apk` | Instalador para Fire TV / Android, ya firmado. |
| `tools/pilar-apk/` | Contenedor Android mínimo, `build.sh` para rearmar la APK y fuentes del fondo y del ícono. |

## Cómo funciona

- **Sorteo**: cada premio pesa según el stock que le queda, así se agotan de forma pareja. Cuando un premio llega a cero no vuelve a salir. Con todo en cero, el botón avisa que se entregaron todos los premios.
- **Stock**: se guarda en el dispositivo y sobrevive a apagar y prender. Se descuenta al iniciar el giro.
- **Orientación**: el Fire TV siempre emite en horizontal. En el primer arranque el juego muestra tres carteles; se toca el que se lee derecho y queda guardado.
- **Panel de operador**: mantener apretado el logo 3 segundos, PIN `1234`. Muestra lo que queda y lo entregado, permite corregir cantidades, deshacer el último giro, apagar el sonido, reorientar y reiniciar el stock.
- **Control remoto**: el botón central gira y cierra el cartel de premio. Arriba cinco veces abre el PIN. El botón Atrás no cierra el juego; se sale con Home.

## Montaje

1. Fire TV al HDMI del televisor.
2. Cable OTG en "Y" (micro-USB con entrada de corriente) en el Fire TV: la corriente a una pata, el marco táctil a la otra.
3. Abrir "Ruleta Pilar XV" desde Configuración → Aplicaciones → Administrar aplicaciones instaladas → Iniciar aplicación (sin internet, el inicio del Fire TV puede no mostrarla).

## Instalación en el Fire TV (hacerla antes, con wifi)

1. Configuración → Mi Fire TV → Opciones para desarrolladores → activar "Apps de origen desconocido". Si no aparece el menú, entrar en Acerca de y apretar siete veces sobre el nombre del dispositivo.
2. Instalar la app "Downloader" desde la tienda de Amazon, abrirla y escribir la dirección de la APK. Alternativa sin tipear: copiar la APK a un pen drive, conectarlo con el cable OTG y abrirla con un explorador de archivos instalado desde la tienda.
3. Aceptar la instalación y abrir.

## Rearmar la APK

```bash
SDK=<carpeta con build-tools 34 y plataforma 34> KEYSTORE=<pilar-test.keystore> tools/pilar-apk/build.sh salida.apk
```

La clave `pilar-test.keystore` (alias `pilar`, contraseña `android`, de prueba) no está en el repo: se entregó como archivo en la sesión. Con otra clave hay que desinstalar la app antes de instalar la nueva, y eso borra el stock guardado.

## Estado

- Verificado en navegador: giro, coincidencia entre gajo y premio anunciado, reparto exacto de los 105 premios, panel, rotación a 90° con toques.
- **No se probó en un Fire TV real.** Falta confirmar ahí: que el marco táctil responda por el cable OTG, la fluidez del giro y el sonido.
- Plan B si el táctil no responde en el Fire TV: la misma APK en una TV box Android con puertos USB.
