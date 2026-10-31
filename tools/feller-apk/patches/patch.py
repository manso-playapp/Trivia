import re,sys
s=open('/tmp/orig/app.js',encoding='utf8').read()
def rep(old,new,count=1):
    global s
    n=s.count(old)
    assert n==count,(n,old[:80])
    s=s.replace(old,new)

# A. textos y umbral por defecto
rep('attractTitle:"Trivia",attractCta:"Tocá para jugar"','attractTitle:"¿Cuánto sabés del huevo?",attractCta:"¡Jugá ahora!"',2)
rep('registerTitle:"Antes de comenzar, ¡contanos quién sos!"','registerTitle:"PARA COMPLETAR"',2)
rep('bigCelebrationAt:4,wrongAnimation:"casi"},$k','bigCelebrationAt:3,wrongAnimation:"casi"},$k')  # pack por defecto: fácil 3/5
rep('bigCelebrationAt:4,idleResetSeconds','bigCelebrationAt:3,idleResetSeconds')

# B. formulario: solo nombre y localidad
a=s.index('function Sy({onDone:e}){'); b=s.index('const Ae=()=>{}')
SY='''function Sy({onDone:e}){const{texts:t}=Rt(),[n,r]=j.useState(""),[i,s]=j.useState(""),[d,h]=j.useState(!1),m=()=>{ot.tap(),h(!0),!(!n.trim()||!i.trim())&&e({name:n.trim().slice(0,30),city:i.trim().slice(0,40),email:"",phone:"",consent:!1})};return c.jsxs("div",{className:"screen register",children:[c.jsx(xr,{size:64}),c.jsxs(ye.div,{className:"card register__card",initial:{y:40,opacity:0},animate:{y:0,opacity:1},transition:{type:"spring",stiffness:140,damping:16},children:[c.jsx("h2",{className:"card__title",children:t.registerTitle}),c.jsxs("label",{className:"field",children:[c.jsx("span",{children:"Nombre"}),c.jsx("input",{value:n,maxLength:30,autoComplete:"off",onChange:f=>r(f.target.value),className:d&&!n.trim()?"is-bad":""})]}),c.jsxs("label",{className:"field",children:[c.jsx("span",{children:"Localidad"}),c.jsx("input",{value:i,maxLength:40,autoComplete:"off",onChange:f=>s(f.target.value),className:d&&!i.trim()?"is-bad":""})]}),d&&(!n.trim()||!i.trim())&&c.jsx("p",{className:"field__error",children:"Completá nombre y localidad."}),c.jsx("div",{className:"register__actions",children:c.jsx("button",{type:"button",className:"btn btn--primary",onClick:m,children:"¡Jugar!"})})]}),c.jsx("div",{className:"register__chick",children:c.jsx(Ye,{pose:"peck",size:"min(110px, 18cqw)"})}),c.jsx(FlEggs,{n:7})]})}'''
s=s[:a]+SY+s[b:]
rep('const _l={name:"",email:"",phone:"",consent:!1}','const _l={name:"",city:"",email:"",phone:"",consent:!1}')
rep('name:l.name,email:l.email,phone:l.phone','name:l.name,city:l.city??"",email:l.email,phone:l.phone')
rep('"nombre","mail"','"nombre","localidad","mail"')
rep('r.name,r.email,r.phone','r.name,r.city??"",r.email,r.phone')

# C. explicación opcional en la planilla de preguntas
rep('u=i("activa");','u=i("activa"),xe=i("explicacion");')
rep('correct:f,active:y})}),{questions:d','correct:f,active:y,explanation:v(xe)})}),{questions:d')
rep('Columnas: id, pregunta, opcion_a, opcion_b, opcion_c, correcta (A, B o C), activa (si/no).','Columnas: id, pregunta, opcion_a, opcion_b, opcion_c, correcta (A, B o C), activa (si/no), explicacion (opcional: se muestra si se equivoca).')

# D. huevos blancos y de color (decoración)
EG='''function FlEggs({n:e=7}){const t=["#ffffff","#f4b942","#ffffff","#7fd1c4","#ffffff","#f29bb2","#ffffff"];return c.jsx("div",{className:"egg-row","aria-hidden":"true",children:Array.from({length:e},(r,i)=>c.jsxs("svg",{viewBox:"0 0 40 50",className:"egg-row__egg",style:{animationDelay:`${i*.15}s`},children:[c.jsx("ellipse",{cx:"20",cy:"28",rx:"16",ry:"20",fill:t[i%t.length],stroke:"#00000026",strokeWidth:"1.5"}),i%3===0&&c.jsxs(c.Fragment,{children:[c.jsx("circle",{cx:"14",cy:"26",r:"2",fill:"#333"}),c.jsx("circle",{cx:"26",cy:"26",r:"2",fill:"#333"}),c.jsx("path",{d:"M15 34q5 4 10 0",stroke:"#333",strokeWidth:"2",fill:"none",strokeLinecap:"round"})]})]},i))})}function FlEggDrop(){return c.jsxs(c.Fragment,{children:[c.jsx("div",{className:"egg-drop","aria-hidden":"true",children:c.jsxs("svg",{viewBox:"0 0 40 50",children:[c.jsx("ellipse",{cx:"20",cy:"28",rx:"16",ry:"20",fill:"#fff",stroke:"#00000026",strokeWidth:"1.5"}),c.jsx("circle",{cx:"14",cy:"26",r:"2",fill:"#333"}),c.jsx("circle",{cx:"26",cy:"26",r:"2",fill:"#333"}),c.jsx("path",{d:"M15 36q5 -4 10 0",stroke:"#333",strokeWidth:"2",fill:"none",strokeLinecap:"round"})]})}),c.jsx("div",{className:"egg-splat","aria-hidden":"true",children:"🍳"})]})}'''
rep('function Tl({name:e,correct:t,total:n,score:r,onNext:i}){',EG+'function Tl({name:e,correct:t,total:n,score:r,onNext:i}){')

# E. final: GANASTE / gracias, sin ranking ni puntos
a=s.index('function Tl({name:e,correct:t,total:n,score:r,onNext:i}){'); b=s.index('function BC({to:e})')
TL='''function Tl({name:e,correct:t,total:n,onNext:i}){const{settings:o}=Rt(),a=t>=o.bigCelebrationAt,l=Co();return j.useEffect(()=>{if(l)return;ot.celebrate();const u=window.setTimeout(i,2e4);return()=>window.clearTimeout(u)},[i,l]),c.jsxs("div",{className:"screen final",onClick:i,children:[a?c.jsxs(c.Fragment,{children:[c.jsxs(ye.h1,{className:"final__title final__title--win",initial:{scale:.5,opacity:0},animate:{scale:1,opacity:1},transition:{type:"spring",stiffness:180,damping:12},children:["¡GANASTE!",e?` ${e}`:""]}),c.jsx("p",{className:"final__prize",children:"Te llevás un premio"}),c.jsxs("p",{className:"final__hits",children:[t," de ",n," respuestas correctas"]})]}):c.jsxs(c.Fragment,{children:[c.jsxs(ye.h1,{className:"final__title",initial:{scale:.5,opacity:0},animate:{scale:1,opacity:1},transition:{type:"spring",stiffness:180,damping:12},children:[t," de ",n]}),c.jsx("p",{className:"final__prize",children:"respuestas correctas"}),c.jsx("p",{className:"final__thanks",children:"¡Gracias por jugar!"})]}),c.jsx(Ye,{pose:"hop",size:a?"min(34cqw, 210px)":"min(28cqw, 170px)"}),a&&c.jsx(FlEggs,{n:7}),c.jsxs("p",{className:"final__frase",children:["Desde el origen,",c.jsx("br",{}),"potenciamos el valor",c.jsx("br",{}),"de un superalimento"]}),c.jsx(xr,{size:70}),c.jsx("span",{className:"final__tap",children:"Tocá para volver a empezar"}),a?c.jsxs(c.Fragment,{children:[c.jsx(xy,{}),c.jsx(fc,{count:10,size:104,seed:5}),c.jsx(qf,{count:44})]}):c.jsx(qf,{count:12,seed:5})]})}'''
s=s[:a]+TL+s[b:]
rep('S=j.useCallback(()=>s("ranking"),[])','S=j.useCallback(()=>m(),[m])')

# F. feedback: acierto grande y error educativo
rep('u==="correct"&&c.jsxs(ye.div,{className:"feedback feedback--ok",initial:{scale:.4,opacity:0},animate:{scale:1,opacity:1},transition:{type:"spring",stiffness:260,damping:14},children:[c.jsx("span",{className:"feedback__mark",children:"✓"}),c.jsx("span",{children:"¡Correcto!"})]})',
    'u==="correct"&&c.jsxs(ye.div,{className:"feedback feedback--ok feedback--big",initial:{scale:.3,opacity:0},animate:{scale:1,opacity:1},transition:{type:"spring",stiffness:260,damping:12},children:[c.jsx("span",{className:"feedback__hop",children:c.jsx(Ye,{pose:"hop",size:"min(22cqh, 170px)"})}),c.jsx("span",{children:"¡Correcto!"})]})')
rep('u==="correct"&&c.jsxs(c.Fragment,{children:[c.jsx(xy,{}),c.jsx(fc,{count:8,size:100})]})','u==="correct"&&c.jsxs(c.Fragment,{children:[c.jsx(xy,{}),c.jsx(fc,{count:8,size:100}),c.jsx(qf,{count:40})]})')
rep('u==="wrong"&&(o.wrongAnimation==="timido"?c.jsx(YC,{}):c.jsx(QC,{}))','u==="wrong"&&(o.wrongAnimation==="timido"?c.jsx(YC,{}):c.jsx(QC,{q:e}))')
rep('c.jsx(Ye,{pose:"surprised",size:"min(14cqh, 120px)"}),c.jsx(cc,{children:"¡Se acabó el tiempo!"})]})','c.jsx(Ye,{pose:"surprised",size:"min(14cqh, 120px)"}),c.jsx(cc,{children:"¡Se acabó el tiempo!"}),c.jsx(FlExplain,{q:e})]})')
a=s.index('function QC(){'); b=s.index('function YC(){')
QC='''function FlExplain({q:e}){return c.jsxs("div",{className:"explain",children:[c.jsxs("p",{children:["La respuesta correcta es ",c.jsx("b",{children:e.options[e.correct]})]}),e.explanation&&c.jsx("p",{children:e.explanation})]})}function QC({q:e}){return c.jsxs(ye.div,{className:"feedback feedback--wrong feedback--big",initial:{scale:.6,opacity:0},animate:{scale:1,opacity:1},transition:{type:"spring",stiffness:240,damping:15},children:[c.jsx(FlEggDrop,{}),c.jsxs("div",{className:"feedback__row",children:[c.jsx("span",{className:"feedback__sad",children:c.jsx(Ye,{pose:"surprised",size:"min(17cqh, 140px)"})}),c.jsx(cc,{children:"¡Casi!"})]}),e&&c.jsx(FlExplain,{q:e})]})}'''
s=s[:a]+QC+s[b:]
# el tiempo de espera tras fallar sube para poder leer la explicación
rep('u==="correct"?3200:2300','u==="correct"?3200:5200')
open('/tmp/new/app.js','w',encoding='utf8').write(s)
print('ok',len(s))
