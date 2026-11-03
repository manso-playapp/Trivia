# Cambios aplicados al bundle despues de la v0.12 (ya incluidos en preview/pollito/assets/).
# Documentacion: reproduce los cambios sobre el bundle anterior.
#   python3 patch7.py <app.js> <app.css>
import sys
js, css = sys.argv[1], sys.argv[2]

s = open(js, encoding='utf8').read()

# 1) La portada usa el .png de assets (hero-pollitos): la foto nueva se publica con ese nombre.
old = 'new URL("hero-pollitos-portada.jpg",import.meta.url)'
new = 'new URL("hero-pollitos-BYSwqALi.png",import.meta.url)'
if old in s:
    s = s.replace(old, new)

# 2) Contador de premios automatico: al terminar la partida suma 1 a settings.premiosEntregados
#    si "Premios" esta activo y los aciertos alcanzan bigCelebrationAt (misma condicion que
#    muestra "Te llevas premio" en la pantalla final). Se guarda con rC (config en localStorage).
old = 'x(b.id),s("final")},[p,d.length,e.settings.deviceName,l])'
new = ('x(b.id),e.settings.premiosActivos&&b.correct>=e.settings.bigCelebrationAt&&(()=>{'
       'const Pz={...e,settings:{...e.settings,premiosEntregados:(e.settings.premiosEntregados??0)+1}};'
       't(Pz),rC(Pz)})(),s("final")},[p,d.length,e,l])')
if old in s:
    s = s.replace(old, new)
open(js, 'w', encoding='utf8').write(s)

# 3) CSS: la foto de portada (vertical) queda dentro del panel blanco, recortada con sus diagonales.
c = open(css, encoding='utf8').read()
rule = ('.attract--a .attract__hero{position:absolute;left:0;top:0;width:100%;height:calc(100% + 9cqw);'
        'max-width:none;margin:0;object-fit:cover;object-position:center 22%;'
        'clip-path:polygon(0 calc(32% + 5cqw),100% calc(32% - 10.8cqw),100% calc(95% - 16.5cqw),0 calc(95% - .7cqw))}')
if rule not in c:
    c += '\n' + rule + '\n'
open(css, 'w', encoding='utf8').write(c)
print('ok')
