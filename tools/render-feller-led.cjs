// node tools/render-feller-led.cjs [carpeta de salida]
// SNAPSHOTS_ONLY=1 captura seis vistas sin exportar el video.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const STILLS=[60,159,285,417,505,630];
(async () => {
 const output=path.resolve(process.argv[2] || 'exports/feller-led/v2');
 fs.mkdirSync(output,{recursive:true});
 const root=path.resolve(__dirname,'../public/feller-led');
 const server=http.createServer((req,res)=>{
  let pathname;try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
  fs.readFile(file,(err,data)=>{
   if(err){res.writeHead(404);return res.end()}
   const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'};
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);
  });
 });
 let browser,ff;
 try {
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1088,height:768},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?capture=1');
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});
  const meta=await page.evaluate(()=>window.PROMO);
  if(!meta || meta.width!==1088 || meta.height!==768)throw Error('Formato de promo inválido');
  const fonts=await page.evaluate(()=>({heading:document.fonts.check('800 96px "Fira Sans"'),body:document.fonts.check('400 28px Saira')}));
  if(!fonts.heading||!fonts.body)throw Error('Faltan tipografías de la trivia');
  const total=meta.duration*meta.fps;
  let done,stderr='';
  if(!process.env.SNAPSHOTS_ONLY){
   ff=spawn('ffmpeg',['-y','-f','image2pipe','-vcodec','png','-r',String(meta.fps),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(output,'feller-promo-v2-1088x768.mp4')],{stdio:['pipe','ignore','pipe']});
   ff.stderr.on('data',d=>stderr+=d);done=once(ff,'close');
  }
  for(const frame of process.env.SNAPSHOTS_ONLY?STILLS:Array.from({length:total},(_,i)=>i)){
   await page.evaluate(t=>window.renderAt(t),frame/meta.fps);
   const png=await page.screenshot({type:'png'});
   if(STILLS.includes(frame))fs.writeFileSync(path.join(output,`vista-${frame}.png`),png);
   if(ff && !ff.stdin.write(png))await once(ff.stdin,'drain');
   if(frame%180===0)console.log(`Capturados ${frame}/${total} cuadros`);
  }
  if(ff){ff.stdin.end();const [code]=await done;if(code!==0)throw Error(stderr)}
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(output,'formato.json'),JSON.stringify({...meta,fontsVerified:fonts},null,2)+'\n');
  console.log((ff?'Video y vistas':'Vistas')+' generados en '+output+'; tipografías y recursos verificados.');
 } finally {
  if(ff&&!ff.stdin.destroyed)ff.stdin.destroy();
  if(ff&&ff.exitCode===null)ff.kill();
  if(browser)await browser.close();
  server.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
