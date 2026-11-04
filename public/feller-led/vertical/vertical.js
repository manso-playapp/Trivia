/* Promo de 90 s con tres ejemplos distintos y línea de tiempo continua. */
const $=id=>document.getElementById(id),clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-Math.pow(1-clamp(x),3),smooth=x=>{x=clamp(x);return x*x*(3-2*x)},spring=x=>{x=clamp(x);return 1-Math.pow(1-x,3)*Math.cos(x*8)};
window.PROMO={width:544,height:768,fps:30,duration:90,cycleDuration:90,repeats:1,safeMargin:48,version:'tres-preguntas',questionCount:3,correctColor:'#ED3237',fonts:{heading:'Fira Sans',body:'Saira'}};
const QUESTIONS=[
 {text:'¿Cuántos gramos<br>de proteína aporta<br>un huevo?',options:['6 gramos','8 gramos','12 gramos'],correct:0,title:'6 gramos',detail:'de proteína en un huevo'},
 {text:'¿Cuánto pesa<br>un huevo<br>promedio?',options:['40 gramos','60 gramos','80 gramos'],correct:1,title:'60 gramos',detail:'es el peso promedio'},
 {text:'¿De qué está hecha<br>principalmente<br>la cáscara?',options:['Proteína','Hierro','Calcio'],correct:2,title:'Calcio',detail:'Es el principal componente.'}
];
let questionIndex=-1,inviteVariant=-1;
let serial=0;const art=name=>TRIVIA_ART[name].replace(/flg/g,'vertical'+(++serial)+'-');
document.querySelectorAll('[data-art]').forEach(e=>e.innerHTML=art(e.dataset.art));
$('flying-chicks').innerHTML=Array.from({length:6},()=>'<div>'+art('chick')+'</div>').join('');
$('texture-eggs').innerHTML=Array.from({length:7},(_,i)=>`<svg viewBox="0 0 100 132" style="left:${i%2?477:-35}px;top:${100+i*109}px"><path d="M50 4C72 4 94 52 94 82C94 108 74 126 50 126C26 126 6 108 6 82C6 52 28 4 50 4Z" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M30 44Q35 27 42 24" fill="none" stroke="#fff" stroke-width="2"/></svg>`).join('');
$('confetti').innerHTML=Array.from({length:48},(_,i)=>`<i style="left:${i*73%496}px;background:${['#fff','#F7E9A8','#E6D282'][i%3]};border-radius:${i%4===0?'50%':'0'}"></i>`).join('');
const chickNodes=[...document.querySelectorAll('[data-art="chick"]')],eggs=[...document.querySelectorAll('.egg-row svg')],conf=[...$('confetti').children],fly=[...$('flying-chicks').children];
const inviteTitle=$('invitation').querySelector('h2');
function words(el,lines){el.innerHTML=lines.map(line=>'<span class="line">'+line.split(' ').map(w=>`<span class="word">${w}</span>`).join(' ')+'</span>').join('')}
words(inviteTitle,['¡Jugá por','premios!']);let titleMode='';
function visible(id,on){$(id).style.visibility=on?'visible':'hidden';$(id).setAttribute('aria-hidden',!on)}
function entrance(el,age,delay=0,axis='y',distance=35){const a=(age-delay)/.5;el.style.opacity=ease(a);el.style.transform=`translate${axis.toUpperCase()}(${(1-ease(a))*distance}px) scale(${.75+.25*spring(a)})`}
function kinetic(el,age,exit){[...el.querySelectorAll('.word')].forEach((e,i)=>{const v=(age-i*.085)/.58,p=spring(v),out=smooth(exit-i*.075);e.style.opacity=ease(v)*(1-out);e.style.transform=`translate(${(1-ease(v))*(i%2?-95:95)}px,${(1-ease(v))*38-out*70}px) rotate(${(1-ease(v))*(i%2?9:-9)}deg) scale(${.58+.42*p})`;e.style.filter=`blur(${(1-ease(v))*5}px)`})}
window.renderAt=function(time){
 const absolute=((time%90)+90)%90;
 // 6 s de apertura; tres bloques de 15 s de pregunta + 6 s de festejo;
 // 18 s de invitación y 3 s para regresar a la portada.
 let t,index=0;
 if(absolute<6)t=absolute/2;
 else if(absolute<69){index=Math.floor((absolute-6)/21);const local=(absolute-6)%21;t=local<15?3+local/3:8+(local-15)/2.4}
 else if(absolute<87)t=10.5+(absolute-69)/6;
 else t=13.5+(absolute-87)/2;
 const phase=absolute*2*Math.PI/15,returning=t>=13.5;
 const current=QUESTIONS[index];
 if(index!==questionIndex){
  $('question-count').textContent='EJEMPLO '+(index+1)+' DE 3';
  $('question').querySelector('h2').innerHTML=current.text;
  document.querySelectorAll('.option').forEach((el,i)=>{el.innerHTML='<span>'+['A','B','C'][i]+'</span>'+current.options[i]+'<i></i>'});
  $('success').querySelector('strong').textContent=current.title;
  $('success').querySelector('p').textContent=current.detail;
  questionIndex=index;
 }
 const demo=t>=3&&t<8,correct=t>=8&&t<10.5;
 const iq=absolute>=69?absolute-69:t-10.5;
 const invitationPage=absolute>=69&&absolute<87?Math.floor((absolute-69)/6):0;
 if(invitationPage!==inviteVariant){words(inviteTitle,invitationPage===1?['¡Vení al','stand!']:['¡Jugá por','premios!']);inviteVariant=invitationPage}
 const inviteOpacity=ease(iq/.23)*(1-smooth((t-13.38)/.42));
 const gameOpacity=t<10.5?1:returning?ease((t-13.65)/.38):1-ease(iq/.23);
 visible('game',gameOpacity>0);$('game').style.opacity=gameOpacity;visible('invitation',inviteOpacity>0);$('invitation').style.opacity=inviteOpacity;
 const mode=demo?'demo':correct?'correct':'hook',age=demo?t-3:correct?t-8:t<3?t+.4:t-14.6;
 if(titleMode!==mode){words($('headline'),demo?['Así se juega']:correct?['¡Correcto!']:['¿Cuánto sabés','del huevo?']);titleMode=mode}
 kinetic($('headline'),age,mode==='hook'&&!returning?(t-2.5)/.38:mode==='demo'?(t-7.7)/.35:mode==='correct'?(t-10.2)/.3:-1);
 $('headline').style.transform=`scale(${1+.01*Math.sin(phase*6)})`;
 // La tablet entra desde abajo, gira entre planos y sale hacia un lateral.
 const entry=returning?ease((t-13.7)/.7):1;
 const exit=t>=10.12&&t<13.5?ease((t-10.12)/.65):0;
 const turn=demo?Math.sin(clamp((t-3)/.65)*Math.PI):correct?Math.sin(clamp((t-8)/.5)*Math.PI):0;
 $('device').style.transform=`perspective(1000px) translate(${exit*-420}px,${(demo||correct?-22:0)+(1-entry)*480+Math.sin(phase*6)*5}px) rotate(${Math.sin(phase*4)*1.25+(1-entry)*12-exit*15}deg) rotateY(${turn*17}deg) scale(${1-exit*.16+turn*.025})`;
 $('caption').textContent=demo?'Elegí tu respuesta.':correct?'¡Sumás un acierto!':'¡Vení a jugar al stand!';
 const capAge=demo?t-3:correct?t-8:returning?t-13.8:t+.7;entrance($('caption'),capAge,.25,'x',-75);
 const coverOpacity=demo?1-ease((t-2.95)/.3):correct?0:1;
 visible('cover',coverOpacity>0);$('cover').style.opacity=coverOpacity;$('cover').style.transform=`translateX(${demo?-ease((t-2.95)/.3)*280:0}px)`;
 visible('question',demo);$('question').style.opacity=ease((t-3)/.25);$('question').style.transform=`translateX(${(1-ease((t-3)/.42))*290}px)`;
 visible('success',correct);$('success').style.opacity=ease((t-8)/.18);$('success').style.transform=`scale(${.4+.6*spring((t-8)/.55)}) rotate(${(1-ease((t-8)/.45))*-12}deg)`;
 const qt=t-3,pick=demo&&qt>=4.08;const sec=Math.max(1,15-Math.floor(Math.max(0,qt*3)));$('seconds').textContent=sec;
 const tick=qt*3-Math.floor(qt*3);$('seconds').style.transform=`scale(${1+.21*(1-ease(tick/.25))})`;
 $('time-left').style.transform=`scaleX(${clamp(1-qt/5)})`;
 document.querySelectorAll('.option').forEach((e,i)=>{const enter=(qt-.25-i*.16)/.5;const selected=pick&&i===current.correct;e.classList.toggle('selected',selected);e.querySelector('span').innerHTML=selected?'<svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M3 10L8 15L17 4" stroke="currentColor" stroke-width="2.5"/></svg>':['A','B','C'][i];const pulse=selected?Math.sin(clamp((qt-4.08)/.48)*Math.PI)*.06:0;e.style.opacity=ease(enter)*(pick&&i!==current.correct?.45:1);e.style.transform=`translateX(${(1-ease(enter))*270}px) rotateY(${(1-ease(enter))*-28}deg) scale(${1+pulse})`});
 const tap=clamp((qt-3.79)/.9);$('tap').style.top=(500+current.correct*49)+'px';$('tap').style.opacity=demo&&qt>3.79&&qt<4.69?Math.sin(tap*Math.PI):0;$('tap').style.transform=`translate(${-tap*31}px,${tap*12}px) scale(${.45+tap*2})`;
 // Textura en movimiento continuo; siete huevos dibujados flotan por los laterales.
 $('pattern').style.transform=`translate(${Math.sin(phase)*95}px,${Math.sin(phase*2)*70}px) rotate(${Math.sin(phase)*5}deg)`;
 $('dots').style.transform=`translate(${Math.sin(phase*2)*35}px,${Math.cos(phase)*32}px) rotate(${Math.sin(phase)*6}deg)`;
 [...$('texture-eggs').children].forEach((e,i)=>{e.style.transform=`translate(${Math.sin(phase*3+i)*28}px,${Math.sin(phase*2+i)*52}px) rotate(${Math.sin(phase*2+i)*25}deg)`;e.style.opacity=.09+.07*(1+Math.sin(phase*3+i))/2});
 const shimmer=(absolute%3.75)/3.75;$('shine').style.transform=`translateX(${(shimmer-.5)*720}px)`;$('shine').style.opacity=Math.pow(Math.sin(shimmer*Math.PI),3)*.6;
 document.querySelector('header').style.transform=`translateY(${Math.sin(phase*3)*3}px)`;
 // Título de cierre por palabras, con entrada escalonada y salida hacia arriba.
 kinetic(inviteTitle,(iq%6)-.06,Math.max((t-13.08)/.4,((iq%6)-5.4)/.45));
 const kicker=$('invitation').querySelector('.kicker'),sub=$('invitation').querySelector('p'),cta=$('invitation').querySelector('.cta');
 entrance(kicker,iq,0,'x',-90);entrance(sub,iq,.28,'y',60);entrance(cta,iq,.5,'y',100);
 const endExit=smooth((t-13.2)/.35);cta.style.transform+=` translateX(${endExit*400}px) scale(${1+Math.max(0,Math.sin(iq*7))*.045})`;sub.style.transform+=` translateX(${-endExit*230}px)`;
 cta.querySelector('.arrow').style.transform=`translateX(${Math.sin(phase*15)*6}px)`;
 chickNodes.forEach((e,i)=>{const hop=Math.pow(Math.max(0,Math.sin(phase*15+i*.6)),2);const end=e.classList.contains('end-chick');const entryEnd=end?1-ease((iq-.25)/.65):0;const lift=end?24:correct?17:11;e.style.opacity=end?ease((iq-.25)/.3):1;e.style.transform=`translateY(${-hop*lift+entryEnd*160}px) rotate(${Math.sin(phase*9+i)*5+entryEnd*25}deg) scale(${1-entryEnd*.4})`;const flap=Math.sin(phase*30+i)*29;e.querySelector('.chick__wing--l').style.transform=`rotate(${flap}deg)`;e.querySelector('.chick__wing--r').style.transform=`rotate(${-flap}deg)`});
 eggs.forEach((e,i)=>{const en=(iq-.4-i*.08)/.5;e.style.opacity=ease(en);e.style.transform=`translateY(${(1-spring(en))*120+Math.sin(phase*12+i)*7}px) rotate(${Math.sin(phase*9+i)*12}deg)`});
 const ct=(t-8)*2.4;const burst=correct?clamp(ct/.7):1;$('burst').style.opacity=correct?(1-burst)*.85:0;$('burst').style.transform=`scale(${.2+burst*1.65})`;
 $('score-pop').style.opacity=correct?ease(ct/.17)*(1-smooth((ct-1.3)/.5)):0;$('score-pop').style.transform=`translateY(${-Math.max(0,ct)*48}px) scale(${.25+.75*spring(ct/.4)}) rotate(${(1-ease(ct/.5))*20}deg)`;
 fly.forEach((e,i)=>{const v=clamp((ct-.08-i*.055)/1.35),angle=-Math.PI+(i/5)*Math.PI;const active=correct&&ct>i*.055;e.style.opacity=active?Math.sin(v*Math.PI)*.85:0;e.style.transform=`translate(${Math.cos(angle)*v*315}px,${Math.sin(angle)*v*280+v*v*170}px) rotate(${v*(i%2?-70:70)}deg) scale(${.35+v*.5})`});
 const celebrate=correct||inviteOpacity>0;$('confetti').style.visibility=celebrate?'visible':'hidden';$('confetti').style.opacity=correct?1:inviteOpacity;
 conf.forEach((e,i)=>e.style.transform=`translateY(${((absolute*190+i*71)%730)-70}px) rotate(${absolute*160+i*37}deg)`);
 $('rays').style.opacity=correct?.55*ease(ct/.2)*(1-smooth((ct-1.9)/.6)):0;$('rays').style.transform=`rotate(${absolute*22}deg) scale(${1+Math.sin(phase*12)*.06})`;
};
function resize(){const s=Math.min(innerWidth/544,innerHeight/768);$('stage').style.transform=`scale(${s})`;$('stage').style.left=(innerWidth-544*s)/2+'px';$('stage').style.top=(innerHeight-768*s)/2+'px'}addEventListener('resize',resize);resize();renderAt(0);if(!new URLSearchParams(location.search).has('capture')){const start=performance.now();requestAnimationFrame(function tick(now){renderAt((now-start)/1000);requestAnimationFrame(tick)})}
