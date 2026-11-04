// node tools/render-feller-vertical.cjs [carpeta de salida]
// --high exporta al doble de resolución; --check valida y captura vistas sin video.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const args=process.argv.slice(2);
const HIGH=args.includes('--high')||process.env.QUALITY==='high';
const CHECK=args.includes('--check')||Boolean(process.env.SNAPSHOTS_ONLY);
const SCALE=HIGH?2:1;
const OUTPUT_NAME=HIGH?'feller-promo-3-preguntas-1088x1536-90s-alta.mp4':'feller-promo-3-preguntas-544x768-90s.mp4';
const STILLS=[0,60,360,570,705,990,1200,1335,1620,1830,1965,2190,2370,2699];
(async () => {
 const output=path.resolve(args.find(arg=>!arg.startsWith('--')) || (HIGH?'exports/feller-led/alta-90s':'exports/feller-led/tres-preguntas-90s'));
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
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:544,height:768},deviceScaleFactor:SCALE});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/vertical/index.html?capture=1');
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});
  const meta=await page.evaluate(()=>window.PROMO);
  if(!meta || meta.width!==544 || meta.height!==768)throw Error('Formato de promo inválido');
  const fonts=await page.evaluate(()=>({heading:document.fonts.check('800 53px Fira'),body:document.fonts.check('400 28px Saira')}));
  if(!fonts.heading||!fonts.body)throw Error('Faltan tipografías de la trivia');
  const examples=[];
  for(const second of [19,40,61]){
   await page.evaluate(t=>window.renderAt(t),second);
   examples.push(await page.evaluate(()=>{const e=document.querySelector('.option.selected');return {question:document.querySelector('#question h2').textContent,answer:e?.textContent,color:e?getComputedStyle(e).backgroundColor:null,textColor:e?getComputedStyle(e).color:null}}));
  }
  if(new Set(examples.map(e=>e.question)).size!==3 || examples.some(e=>e.color!=='rgb(237, 50, 55)'||e.textColor!=='rgb(255, 255, 255)'))throw Error('Falló la verificación de preguntas y colores del juego');
  const total=meta.cycleDuration*meta.fps;
  await page.evaluate(()=>window.renderAt(0));
  const first=await page.screenshot({type:'png'});
  await page.evaluate(t=>window.renderAt(t),meta.cycleDuration);
  const last=await page.screenshot({type:'png'});
  if(!first.equals(last))throw Error('El último cuadro no coincide con el primero');
  fs.writeFileSync(path.join(output,'primer-fotograma.png'),first);
  fs.writeFileSync(path.join(output,'ultimo-fotograma.png'),last);
  let done,stderr='';
  if(!CHECK){
   ff=spawn('ffmpeg',['-y','-f','image2pipe','-vcodec',HIGH?'png':'mjpeg','-r',String(meta.fps),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf',HIGH?'16':'18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(output,'secuencia-90s.mp4')],{stdio:['pipe','ignore','pipe']});
   ff.stderr.on('data',d=>stderr+=d);done=once(ff,'close');
  }
  for(const frame of CHECK?STILLS:Array.from({length:total},(_,i)=>i)){
   await page.evaluate(t=>window.renderAt(t),frame/(total-1)*meta.cycleDuration);
   if(STILLS.includes(frame))fs.writeFileSync(path.join(output,`vista-${frame}.png`),await page.screenshot({type:'png'}));
   const captured=ff?await page.screenshot(HIGH?{type:'png'}:{type:'jpeg',quality:95}):null;
   if(ff && !ff.stdin.write(captured))await once(ff.stdin,'drain');
   if(frame%180===0)console.log(`Capturados ${frame}/${total} cuadros`);
  }
  if(ff){ff.stdin.end();const [code]=await done;if(code!==0)throw Error(stderr)}
  if(errors.length)throw Error(errors.join('\n'));
  if(ff){
   const repeated=spawn('ffmpeg',['-y','-stream_loop',String(meta.repeats-1),'-i',path.join(output,'secuencia-90s.mp4'),'-t',String(meta.duration),'-an','-c','copy','-movflags','+faststart',path.join(output,OUTPUT_NAME)],{stdio:['ignore','ignore','pipe']});
   let log='';repeated.stderr.on('data',d=>log+=d);const [code]=await once(repeated,'close');if(code!==0)throw Error(log);
  }
  fs.writeFileSync(path.join(output,'formato.json'),JSON.stringify({...meta,exportWidth:meta.width*SCALE,exportHeight:meta.height*SCALE,quality:HIGH?'high':'native',fileName:OUTPUT_NAME,fontsVerified:fonts,examplesVerified:examples,loopFramesMatch:true},null,2)+'\n');
  console.log((ff?'Video y vistas':'Vistas')+' generados en '+output+'; tipografías y recursos verificados.');
 } finally {
  if(ff&&!ff.stdin.destroyed)ff.stdin.destroy();
  if(ff&&ff.exitCode===null)ff.kill();
  if(browser)await browser.close();
  server.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
