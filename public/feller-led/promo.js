/* Promo determinista: misma animación en el navegador y en cada cuadro exportado. */
const $=id=>document.getElementById(id),clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-Math.pow(1-clamp(x),3),smooth=x=>{x=clamp(x);return x*x*(3-2*x)},pop=x=>{x=clamp(x);return 1-Math.pow(1-x,3)*Math.cos(x*8)},DURATION=24;
const SHOTS=[['hook',0,4.4,false],['countdown',4.4,6.8,true],['quiz',6.8,12.4,false],['correct',12.4,15.4,true],['challenge',15.4,18,false],['invitation',18,24,false]];
window.PROMO={duration:DURATION,width:1088,height:768,fps:30,fonts:{heading:'Fira Sans',body:'Saira'}};
let serial=0;
function art(name){return window.TRIVIA_ART[name].replace(/flg/g,'egg'+(++serial)+'-')}
document.querySelectorAll('[data-art]').forEach(e=>e.innerHTML=art(e.dataset.art));
$('quiz-egg').innerHTML=art('eggs');$('quiz-egg').innerHTML=$('quiz-egg').querySelector('svg').outerHTML;
$('parade').innerHTML=Array.from({length:9},()=>'<div>'+art('walking')+'</div>').join('');
const colors=['#ED3237','#E6D282','#727376','#F7E9A8'];
$('confetti').innerHTML=Array.from({length:58},(_,i)=>`<i style="left:${i*73%1088}px;background:${colors[i%colors.length]};border-radius:${i%3===0?'50%':'1px'}"></i>`).join('');
const chicks=[...document.querySelectorAll('[data-bounce]')],eggs=[...document.querySelectorAll('.eggline svg')],conf=[...$('confetti').children];
function paint(time){
 const t=((time%DURATION)+DURATION)%DURATION;const shot=SHOTS.find(s=>t>=s[1]&&t<s[2]);const [id,start,stop,cream]=shot;const q=t-start;const el=$(id);
 $('stage').classList.toggle('cream',cream);SHOTS.forEach(s=>{$(s[0]).style.visibility=s[0]===id?'visible':'hidden';$(s[0]).setAttribute('aria-hidden',s[0]!==id)});
 el.querySelectorAll('[data-enter]').forEach(node=>{const v=(q-Number(node.dataset.enter))/.55;node.style.opacity=ease(v);node.style.transform=`translate(${(1-ease(v))*65}px,0) scale(${.94+.06*pop(v)})`});
 $('pattern').style.transform=`translateX(${-t*13}px)`;$('film-progress').style.transform=`scaleX(${t/DURATION})`;
 chicks.forEach((e,i)=>{const hop=Math.pow(Math.max(0,Math.sin(t*5+i*1.6)),2);e.style.transform=`translateY(${-hop*23}px) rotate(${Math.sin(t*3+i)*4}deg) scale(${1+.018*Math.sin(t*5)})`;const l=e.querySelector('.chick__wing--l'),r=e.querySelector('.chick__wing--r');if(l)l.style.transform=`rotate(${Math.sin(t*9+i)*19}deg)`;if(r)r.style.transform=`rotate(${-Math.sin(t*9+i)*19}deg)`;const eye=e.querySelector('.chick__eyes');if(eye)eye.style.transform=`scaleY(${t%3.1>2.95?.14:1})`});
 eggs.forEach((e,i)=>e.style.transform=`translateY(${Math.sin(t*3.2+i*.8)*7}px) rotate(${Math.sin(t*2+i)*9}deg)`);
 $('hook-halo').style.transform=`scale(${1+.035*Math.sin(t*3)})`;$('hook-halo').style.opacity=.6+.3*Math.sin(t*2);
 const walk=$('hook').querySelector('.orbit');walk.style.transform=`translateX(${Math.sin(t*1.5)*20}px) translateY(${-Math.abs(Math.sin(t*8))*5}px)`;
 const n=Math.min(2,Math.floor((t-4.4)/.8)),phase=((t-4.4)%.8+.8)%.8;$('count-number').textContent=3-n;$('count-number').style.transform=`scale(${.65+.35*pop(phase/.42)}) rotate(${(1-ease(phase/.35))*-12}deg)`;
 const qt=t-6.8,pick=qt>=4.85;$('seconds').textContent=Math.max(1,5-Math.floor(Math.max(0,qt)));$('time-progress').style.transform=`scaleX(${clamp(1-qt/5.4)})`;
 ['a','b','c'].forEach((a,i)=>{$('answer-'+a).classList.toggle('selected',pick&&i===0);$('answer-'+a).style.opacity=pick&&i!==0?.6:ease((qt-(.15+i*.14))/.55)});
 if(pick)$('answer-a').style.transform=`scale(${1+.045*Math.sin(clamp((qt-4.85)/.7)*Math.PI)})`;
 $('quiz-egg').style.transform=`translateY(${Math.sin(t*3.3)*10}px) rotate(${Math.sin(t*1.8)*9}deg)`;
 const tap=clamp((qt-4.45)/.65);$('tap').style.opacity=qt>4.45&&qt<5.35?Math.sin(tap*Math.PI):0;$('tap').style.transform=`scale(${.6+tap*.8}) translate(${-tap*50}px,${tap*15}px)`;
 const ct=t-12.4;$('correct').querySelector('h2').style.transform=`translateY(${(1-ease(ct/.45))*50}px) scale(${.75+.25*pop(ct/.65)})`;
 const act=t-15.4,word=Math.min(2,Math.max(0,Math.floor(act/(2.6/3)))),ap=(act%(2.6/3))/(2.6/3);$('action-word').textContent=['PENSÁ.','ELEGÍ.','¡JUGÁ!'][word];$('action-word').style.transform=`scale(${.76+.24*pop(ap/.46)}) rotate(${Math.sin(ap*Math.PI)*-3}deg)`;
 [...document.querySelectorAll('.abc span')].forEach((e,i)=>{const on=i===word;e.style.background=on?'#F7E9A8':'#fff';e.style.transform=`translateY(${on?-12:0}px) rotate(${on?-4:3}deg)`});
 [...$('parade').children].forEach((e,i)=>{e.style.left=((i*150+t*80)%1400-140)+'px';e.style.transform=`translateY(${-Math.abs(Math.sin(t*9+i))*8}px)`;e.querySelectorAll('.cs__leg').forEach((g,j)=>g.style.transform=`rotate(${Math.sin(t*11+i+j*Math.PI)*26}deg)`)});
 const confOn=id==='correct'||id==='invitation';$('confetti').style.display=confOn?'block':'none';conf.forEach((e,i)=>{e.style.transform=`translateY(${((q*170+i*91)%650)-50}px) rotate(${q*100+i*29}deg)`;if(id==='invitation')e.style.background=['#fff','#F7E9A8','#E6D282'][i%3];else e.style.background=colors[i%4]});
 let distance=10;[0,4.4,6.8,12.4,15.4,18,24].forEach(b=>{const delta=t-b;if(Math.abs(delta)<Math.abs(distance))distance=delta});
 const wiping=Math.abs(distance)<.24;$('wipe').style.display=wiping?'block':'none';if(wiping)$('wipe').style.transform=`translateX(${distance/.24*2350}px) rotate(12deg)`;
}
window.renderAt=paint;
function resize(){const s=Math.min(innerWidth/1088,innerHeight/768);$('stage').style.transform=`scale(${s})`;$('stage').style.left=(innerWidth-1088*s)/2+'px';$('stage').style.top=(innerHeight-768*s)/2+'px'}addEventListener('resize',resize);resize();
paint(0);if(!new URLSearchParams(location.search).has('capture')){const start=performance.now();requestAnimationFrame(function tick(now){paint((now-start)/1000);requestAnimationFrame(tick)})}
