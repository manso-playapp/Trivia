s=open('/tmp/new/app.js',encoding='utf8').read()
def rep(old,new,count=1):
    global s
    n=s.count(old); assert n==count,(n,old[:80]); s=s.replace(old,new)
# clase "is-feedback" en la pantalla de pregunta cuando ya se respondió
rep('return c.jsxs("div",{className:"screen question",children:[c.jsxs("div",{className:"question__top"','return c.jsxs("div",{className:`screen question ${u!=="asking"?"is-feedback":""}`,children:[c.jsxs("div",{className:"question__top"')
# el huevo mide dónde está el cartel y cae justo encima
rep('function FlEggDrop(){return c.jsxs("div",{"className":"eggfx","aria-hidden":"true",children:[',
    'function FlEggDrop(){const r=j.useRef(null);j.useEffect(()=>{const t=window.setTimeout(()=>{const e=r.current,o=document.querySelector(".feedback__row");if(!e)return;const q=o?o.getBoundingClientRect():null,k=document.querySelector(".question__card"),kb=k?k.getBoundingClientRect().bottom:0,y=q?Math.min(q.top+10,Math.max(kb+40,(kb+q.top)/2+22)):window.innerHeight*.8;e.style.setProperty("--land",Math.max(220,Math.min(y,window.innerHeight*.9))+"px"),e.classList.add("is-go")},450);return()=>window.clearTimeout(t)},[]);return c.jsxs("div",{ref:r,"className":"eggfx","aria-hidden":"true",children:[')
rep('u==="correct"?3200:6400','u==="correct"?3200:6900')
rep('c.jsxs("p",{children:["La respuesta correcta es ",c.jsx("b",{children:e.options[e.correct]})]})','c.jsx("p",{children:e.options[e.correct].length>42?c.jsxs(c.Fragment,{children:["La respuesta correcta es la opción ",c.jsx("b",{children:["A","B","C","D"][e.correct]})]}):c.jsxs(c.Fragment,{children:["La respuesta correcta es ",c.jsx("b",{children:e.options[e.correct]})]})})')
open('/tmp/new/app.js','w',encoding='utf8').write(s); print('ok')
