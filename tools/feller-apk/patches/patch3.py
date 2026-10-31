import json
s=open('/tmp/new/app.js',encoding='utf8').read()
def rep(old,new,count=1):
    global s
    n=s.count(old); assert n==count,(n,old[:80]); s=s.replace(old,new)
def J(v): return json.dumps(v,ensure_ascii=False)
def el(tag,props=None,kids=None):
    p=",".join(f'{J(k)}:{v}' for k,v in (props or {}).items())
    if kids is None: return f'c.jsx({J(tag)},{{{p}}})'
    return f'c.jsxs({J(tag)},{{{p}{"," if p else ""}children:[{",".join(kids)}]}})'
def grad(id_,stops,kind='radial',attrs=None):
    t='radialGradient' if kind=='radial' else 'linearGradient'
    return el(t,{'id':J(id_),**(attrs or {})},[el('stop',{'offset':J(o),'stopColor':J(c),**({'stopOpacity':J(op)} if op is not None else {})}) for o,c,op in stops])

EGG='M50 4C72 4 94 52 94 82C94 108 74 122 50 122C26 122 6 108 6 82C6 52 28 4 50 4Z'
# ---- huevos decorativos realistas (blancos y marrones, sin cara) ----
cols=[('#fbf7ef','#ebe0cc','#bfae92'),('#d9a273','#b97a4c','#8a5230'),('#fbf7ef','#ebe0cc','#bfae92'),('#d9a273','#b97a4c','#8a5230'),('#fbf7ef','#ebe0cc','#bfae92'),('#d9a273','#b97a4c','#8a5230'),('#fbf7ef','#ebe0cc','#bfae92')]
FLEGGS='function FlEggs({n:e=6}){const t='+J(cols)+',r=[-9,6,-4,10,-7,5,-10];return c.jsx("div",{className:"egg-row","aria-hidden":"true",children:Array.from({length:e},(i,k)=>{const a=t[k%t.length],id="flg"+k;return c.jsxs("svg",{viewBox:"0 0 100 132",className:"egg-row__egg",style:{transform:`rotate(${r[k%r.length]}deg)`},children:[c.jsxs("defs",{children:[c.jsxs("radialGradient",{id:id,cx:"34%",cy:"28%",r:"85%",children:[c.jsx("stop",{offset:"0",stopColor:a[0]}),c.jsx("stop",{offset:".55",stopColor:a[1]}),c.jsx("stop",{offset:"1",stopColor:a[2]})]}),c.jsxs("radialGradient",{id:id+"h",cx:"50%",cy:"50%",r:"50%",children:[c.jsx("stop",{offset:"0",stopColor:"#fff",stopOpacity:".85"}),c.jsx("stop",{offset:"1",stopColor:"#fff",stopOpacity:"0"})]})]}),c.jsx("ellipse",{cx:"52",cy:"126",rx:"34",ry:"5",fill:"#00000040"}),c.jsx("path",{d:'+J(EGG)+',fill:`url(#${id})`}),c.jsx("ellipse",{cx:"35",cy:"40",rx:"10",ry:"19",fill:`url(#${id}h)`,transform:"rotate(18 35 40)"})]},k)})})}'
a=s.index('function FlEggs('); b=s.index('function FlEggDrop(')
s=s[:a]+FLEGGS+s[b:]

# ---- huevo que cae y se rompe (SVG) ----
shells=[ # (path, dx, dy, rot, delay)
 ('M-4 6C-2-6 14-12 26-8L22-1L28 5C20 14 4 16-4 6Z',-120,-70,-200),
 ('M0 4C6-8 24-8 32 0L26 4L30 12C20 18 4 14 0 4Z',-60,-120,160),
 ('M-6 2C0-10 18-10 24-2L20 4L24 10C14 16-2 12-6 2Z',30,-130,-120),
 ('M0 6C4-6 20-10 30-2L24 3L28 11C18 16 4 14 0 6Z',100,-90,230),
 ('M-3 3C3-7 17-9 24-1L20 5L25 9C15 15 1 11-3 3Z',140,-40,90),
 ('M-5 5C-1-4 12-8 20-3L17 3L21 8C12 12-1 11-5 5Z',-160,-30,-70)]
shard_defs=grad('flShell',[('0','#fffaf0',None),('.6','#eadbc3',None),('1','#c9b18a',None)],'linear',{'x1':J('0'),'y1':J('0'),'x2':J('1'),'y2':J('1')})
shard_els=[el('g',{'className':J('eggfx__shard'),'style':'{"--dx":"%dpx","--dy":"%dpx","--r":"%ddeg","--d":"%ss"}'%(dx,dy,r,'0')},
   [el('path',{'d':J(p),'fill':J('url(#flShell)'),'stroke':J('#a88f68'),'strokeWidth':J('.8')}),el('path',{'d':J(p),'fill':J('#ffffff'),'opacity':J('.35'),'transform':J('translate(1.5 2) scale(.8)')})]) for p,dx,dy,r in shells]
puddle='M-92-28C-98-52-62-68-36-60C-20-80 24-78 38-58C70-66 100-46 90-22C102-2 70 14 44 8C30 26-10 24-22 10C-52 24-98 8-92-28Z'
splat_kids=[
 el('defs',None,[
   grad('flWhite',[('0','#ffffff','.95'),('.65','#fbfaf6','.82'),('1','#dfe8ec','.62')],'radial',{'cx':J('40%'),'cy':J('32%'),'r':J('75%')}),
   grad('flYolk',[('0','#ffe58a',None),('.4','#ffbf1f',None),('1','#e57f00',None)],'radial',{'cx':J('36%'),'cy':J('30%'),'r':J('80%')}),
   grad('flTrail',[('0','#fff','0'),('.28','#fff','.42'),('1','#fff','.18')],'linear',{'x1':J('0'),'y1':J('0'),'x2':J('0'),'y2':J('1')}),
   shard_defs]),
 el('g',{'className':J('eggfx__puddle')},[
   el('path',{'d':J(puddle),'fill':J('url(#flWhite)'),'stroke':J('#0000001a'),'strokeWidth':J('1.5')}),
   el('path',{'d':J('M-70-30C-66-46-44-54-24-50'),'stroke':J('#fff'),'strokeWidth':J('5'),'strokeLinecap':J('round'),'fill':J('none'),'opacity':J('.9')})]),
 el('path',{'className':J('eggfx__drip eggfx__drip--a'),'d':J('M-52 6C-52 30-48 66-44 82C-40 94-30 94-28 82C-24 62-28 30-26 6Z'),'fill':J('url(#flWhite)')}),
 el('path',{'className':J('eggfx__drip eggfx__drip--b'),'d':J('M52 4C52 22 56 44 58 54C60 62 68 62 68 54C70 38 70 20 70 4Z'),'fill':J('url(#flWhite)')}),
 el('path',{'className':J('eggfx__trail'),'d':J('M-40-4C-40-14 40-14 40-4C46 40 42 90 38 108C32 124-32 124-38 108C-42 90-46 40-40-4Z'),'fill':J('url(#flTrail)')}),
 el('g',{'className':J('eggfx__yolk')},[
   el('ellipse',{'cx':J('0'),'cy':J('-34'),'rx':J('30'),'ry':J('27'),'fill':J('url(#flYolk)'),'stroke':J('#c26a00'),'strokeWidth':J('1')}),
   el('ellipse',{'cx':J('-10'),'cy':J('-44'),'rx':J('9'),'ry':J('5.5'),'fill':J('#fff'),'opacity':J('.85'),'transform':J('rotate(-24 -10 -44)')})]),
]+shard_els
egg_svg=el('svg',{'className':J('eggfx__egg'),'viewBox':J('0 0 100 126')},[
  el('defs',None,[grad('flEgg',[('0','#fffdf8',None),('.5','#f1e4cb',None),('1','#c4a67c',None)],'radial',{'cx':J('36%'),'cy':J('30%'),'r':J('80%')}),
                  grad('flHi',[('0','#fff','.95'),('1','#fff','0')],'radial',{'cx':J('50%'),'cy':J('50%'),'r':J('50%')})]),
  el('path',{'d':J(EGG),'fill':J('url(#flEgg)')}),
  el('ellipse',{'cx':J('36'),'cy':J('40'),'rx':J('11'),'ry':J('20'),'fill':J('url(#flHi)'),'transform':J('rotate(18 36 40)')}),
  el('circle',{'cx':J('62'),'cy':J('88'),'r':J('1.6'),'fill':J('#a98a5e'),'opacity':J('.5')}),
  el('circle',{'cx':J('44'),'cy':J('100'),'r':J('1.2'),'fill':J('#a98a5e'),'opacity':J('.5')})])
DROP='function FlEggDrop(){return '+el('div',{'className':J('eggfx'),'aria-hidden':J('true')},[
  el('div',{'className':J('eggfx__shadow')}), egg_svg,
  el('svg',{'className':J('eggfx__splat'),'viewBox':J('-150 -80 300 260')},splat_kids)])+'}'
a=s.index('function FlEggDrop('); b=s.index('function FlSadChick(')
s=s[:a]+DROP+s[b:]

# el huevo se dibuja a nivel pantalla (no dentro del cartel animado)
rep('c.jsxs(ye.div,{className:"feedback feedback--wrong feedback--big",initial:{scale:.6,opacity:0},animate:{scale:1,opacity:1},transition:{type:"spring",stiffness:240,damping:15},children:[c.jsx(FlEggDrop,{}),','c.jsxs(ye.div,{className:"feedback feedback--wrong feedback--big",initial:{scale:.6,opacity:0},animate:{scale:1,opacity:1},transition:{type:"spring",stiffness:240,damping:15},children:[')
rep('u==="correct"&&c.jsxs(c.Fragment,{children:[c.jsx(xy,{}),','u==="wrong"&&c.jsx(FlEggDrop,{}),u==="correct"&&c.jsxs(c.Fragment,{children:[c.jsx(xy,{}),')
rep('u==="correct"?3200:5200','u==="correct"?3200:6400')
# formulario sin huevos
rep(',c.jsx(FlEggs,{n:7})]})}const Ae',']})}const Ae')
# final: frase como firma de marca
rep('c.jsxs("p",{className:"final__frase",children:["Desde el origen,",c.jsx("br",{}),"potenciamos el valor",c.jsx("br",{}),"de un superalimento"]}),c.jsx(xr,{size:70}),',
    'c.jsxs("div",{className:"final__brand",children:[c.jsxs("p",{className:"final__frase",children:["Desde el origen,",c.jsx("br",{}),"potenciamos el valor",c.jsx("br",{}),"de un superalimento"]}),c.jsx("span",{className:"final__rule"}),c.jsx(xr,{size:78,light:!0})]}),')
rep('u==="asking"&&c.jsxs("div",{className:"fl-idle",children:[c.jsx(Ye,{pose:"idle",size:"min(13cqh, 110px)"}),c.jsx(FlEggs,{n:6})]})','u==="asking"&&c.jsx(Ye,{pose:"idle",size:"min(15cqh, 120px)"})')
open('/tmp/new/app.js','w',encoding='utf8').write(s); print('ok',len(s))
