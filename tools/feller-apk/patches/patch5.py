s=open('/tmp/new/app.js',encoding='utf8').read()
def rep(old,new,count=1):
    global s
    n=s.count(old); assert n==count,(n,old[:80]); s=s.replace(old,new)
rep('function Tl({name:e,correct:t,total:n,onNext:i}){const{settings:o}=Rt(),','function Tl({name:e,correct:t,total:n,onNext:i}){const{settings:o,texts:s}=Rt(),')
rep('children:["¡GANASTE!",e?` ${e}`:""]}),c.jsx("p",{className:"final__prize",children:"Te llevás un premio"}),c.jsxs("p",{className:"final__hits",children:[t," de ",n," respuestas correctas"]})',
    'children:[s.congrats,e?`, ${e}`:"","!"]}),c.jsxs("p",{className:"final__prize",children:[t,"/",n," respuestas correctas"]})')
rep('children:[t," de ",n]}),c.jsx("p",{className:"final__prize",children:"respuestas correctas"}),c.jsx("p",{className:"final__thanks",children:"¡Gracias por jugar!"})','children:[t,"/",n]}),c.jsx("p",{className:"final__prize",children:"respuestas correctas"}),c.jsx("p",{className:"final__thanks",children:s.thanks})')
rep('a&&c.jsx(FlEggs,{n:7}),','')
open('/tmp/new/app.js','w',encoding='utf8').write(s); print('ok')
