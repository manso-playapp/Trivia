// Conserva el dibujo y los colores del artefacto Trivia del Pollito.
const fs=require('node:fs');const path=require('node:path');const c=require('react/jsx-runtime');const {renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'..');const s=fs.readFileSync(path.join(root,'preview/pollito/assets/index-CQe1EuY2.js'),'utf8');
const theme={body:'#F7E9A8',bodyShade:'#E6D282',beak:'#F0A050',legs:'#E89A4E',eye:'#262628',cheek:'#F2C29A',headScale:1,eyeScale:.95};
const out={};for(const [name,fn,props] of [['chick','Ye',{size:260,pose:'hop'}],['walking','zC',{size:180,walking:true}],['eggs','FlEggs',{n:7}]]){
const start=s.indexOf('function '+fn+'(');if(start<0)throw Error('Ilustración no encontrada: '+fn);const end=s.indexOf('function ',start+10);const source=s.slice(start,end);const component=Function('c','Rt',source+';return '+fn)(c,()=>({chick:theme}));out[name]=renderToStaticMarkup(c.jsx(component,props));}
fs.writeFileSync(path.join(root,'public/feller-led/assets/trivia-art.js'),'// SVG originales extraídos del artefacto del repo.\nwindow.TRIVIA_ART='+JSON.stringify(out)+';\n');
