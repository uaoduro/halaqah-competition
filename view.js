(function(){
'use strict';
var SB='https://imaguxksitjekaqlfpyc.supabase.co/rest/v1/rpc/',SBK='sb_publishable_X2bxbbBrb_pWlDHgZTu98g_sui_Zgjt';
var CODE=(location.hash.slice(1)||new URLSearchParams(location.search).get('c')||'').trim();
var LANG='ar';try{LANG=localStorage.getItem('hc-view-lang')||'ar';}catch(e){}
var D=null,AT=null,ERR=null,LOADING=true;
var U={mi:0,og:-1,os:null,mode:{}};
var box=document.getElementById('v');
try{var c0=JSON.parse(localStorage.getItem('hc-view-'+CODE)||'null');if(c0){D=c0.d;AT=c0.at;LOADING=false;}}catch(e){}

function t(ar,en){return LANG==='en'?en:ar;}
function L(p){return p&&p.length?(LANG==='en'?p[1]:p[0]):'';}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function num(n){n=Math.round(n*10)/10;return n>0?'+'+n:n<0?'−'+Math.abs(n):'0';}
function cls(n){return n>0?'pos':n<0?'neg':'';}
function dt(s){var p=s.split('-'),d=new Date(+p[0],+p[1]-1,+p[2],12);var base=LANG==='en'?'en-GB':'ar-SA',cal=D&&D.cal==='hijri'?'islamic-umalqura':'gregory';
 try{return new Intl.DateTimeFormat(base+'-u-ca-'+cal+'-nu-latn',{weekday:'long',day:'numeric',month:'long'}).format(d);}catch(e){return s;}}
function ago(ts){if(!ts)return '';var m=Math.round((Date.now()-new Date(ts).getTime())/60000);if(m<1)return t('الآن','just now');if(m<60)return t('قبل '+m+' دقيقة',m+' min ago');var h=Math.round(m/60);if(h<24)return t('قبل '+h+' ساعة',h+' h ago');var d=Math.round(h/24);return t('قبل '+d+' يوم',d+' days ago');}

function load(){if(!CODE){ERR='nocode';LOADING=false;render();return;}
 fetch(SB+'hc_view',{method:'POST',headers:{'apikey':SBK,'Content-Type':'application/json'},body:JSON.stringify({p_view:CODE})})
 .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
 .then(function(r){LOADING=false;if(!r.found){if(!D)ERR='missing';render();return;}ERR=null;D=r.data;AT=r.at;try{localStorage.setItem('hc-view-'+CODE,JSON.stringify({d:D,at:AT}));}catch(e){}render();})
 .catch(function(){LOADING=false;if(!D)ERR='net';render();});}

function render(){
 document.documentElement.lang=LANG;document.documentElement.dir=LANG==='en'?'ltr':'rtl';
 var h='';
 if(!D){h='<div class="card" style="margin-top:30px;text-align:center"><p>'+(LOADING?t('جارٍ التحميل…','Loading…'):ERR==='nocode'?t('الرابط غير مكتمل.','This link is incomplete.'):ERR==='missing'?t('لا توجد نتائج لهذا الرابط.','No results for this link.'):t('تعذّر الاتصال. تأكد من الإنترنت ثم حاول مرة أخرى.','Couldn’t connect. Check the internet and try again.'))+'</p></div>';box.innerHTML=h;return;}
 document.title=L(D.ti);
 h+='<div class="vh"><h1>'+esc(L(D.ti))+'</h1><button class="vbtn" data-a="lang">'+(LANG==='en'?'ع':'EN')+'</button></div>';
 var M=D.m||[];if(U.mi>=M.length)U.mi=0;
 if(M.length>1)h+='<div class="mchips">'+M.map(function(m,i){return '<button data-a="mon" data-v="'+i+'" class="'+(i===U.mi?'on':'')+'">'+esc(L(m.l))+'</button>';}).join('')+'</div>';
 var m=M[U.mi];
 if(!m){box.innerHTML=h+'<div class="card">'+t('لا توجد نتائج بعد.','No results yet.')+'</div>';return;}
 if(M.length<=1)h+='<p class="muted small" style="margin:-6px 2px 12px">'+esc(L(m.l))+'</p>';
 m.g.forEach(function(g,i){var open=U.og===i,score=D.avg?g.a:g.t;
  h+='<div class="gcard" style="--gc:'+esc(g.c)+'"><div class="grow" data-a="g" data-v="'+i+'"><span class="rk">'+(['🥇','🥈','🥉'][i]||(i+1))+'</span><span class="gn"><bdi>'+esc(g.n)+'</bdi><div class="gsub">'+g.s.length+' '+t('طالب','students')+(D.avg?' · '+t('المجموع ','total ')+num(g.t):'')+'</div></span><span class="gt">'+num(score)+(D.avg?'<div class="gsub">'+t('متوسط','avg')+'</div>':'')+'</span><span class="chev">'+(open?'▾':(LANG==='en'?'▸':'◂'))+'</span></div>';
  if(open){h+='<div class="gbody">';if(g.b)h+='<div class="bonus">👥 '+t('مكافأة حضور الجميع: ','Full-attendance bonus: ')+'<b class="pos">'+num(g.b)+'</b></div>';
   g.s.forEach(function(s,j){var key=i+':'+j,so=U.os===key,md=U.mode[key]||'sum';
    h+='<div class="srow" data-a="s" data-v="'+key+'"><span class="nm"><bdi>'+esc(s.n)+'</bdi></span><b class="'+cls(s.t)+'">'+num(s.t)+'</b><span class="chev">'+(so?'▾':(LANG==='en'?'▸':'◂'))+'</span></div>';
    if(so){h+='<div class="sdet"><div class="seg"><button data-a="md" data-v="'+key+'|sum" class="'+(md==='sum'?'on':'')+'">'+t('مجموع الشهر','Month totals')+'</button><button data-a="md" data-v="'+key+'|cls" class="'+(md==='cls'?'on':'')+'">'+t('حصة بحصة','Class by class')+'</button></div>';
     if(md==='sum'){h+=s.s.length?s.s.map(function(x){return '<div class="it"><span class="ic">'+x[0]+'</span><span class="lb">'+esc(L(x[1]))+(x[2]>1?' <span class="ct">×'+x[2]+'</span>':'')+'</span><b class="'+cls(x[3])+'">'+num(x[3])+'</b></div>';}).join(''):'<p class="muted small">'+t('لا توجد نقاط بعد.','No points yet.')+'</p>';}
     else{var cs=s.c.slice().sort(function(x,y){return x[0]<y[0]?1:-1;}),all=U.all===key,shown=all?cs:cs.slice(0,6);
      h+=cs.length?'<p class="muted small" style="margin:2px 2px 6px">'+t('اضغط على أي حصة لرؤية تفاصيلها','Tap a class to see its details')+'</p>'+shown.map(function(c){var ck=key+'|'+c[0],co=U.oc===ck;return '<div class="cls'+(co?' open':'')+'"><div class="cd" data-a="c" data-v="'+ck+'"><span>'+esc(dt(c[0]))+'</span><span class="'+cls(c[1])+'">'+num(c[1])+' <span class="chev">'+(co?'▾':(LANG==='en'?'▸':'◂'))+'</span></span></div>'+(co?c[2].map(function(x){return '<div class="it"><span class="ic">'+x[0]+'</span><span class="lb">'+esc(L(x[1]))+'</span><span class="'+cls(x[2])+'">'+num(x[2])+'</span></div>';}).join(''):'')+'</div>';}).join('')+(cs.length>6&&!all?'<button class="vmore" data-a="all" data-v="'+key+'">'+t('عرض كل الحصص ('+cs.length+')','Show all classes ('+cs.length+')')+'</button>':''):'<p class="muted small">'+t('لا توجد حصص بعد.','No classes yet.')+'</p>';}
     h+='</div>';}});
   h+='</div>';}
  h+='</div>';});
 h+='<p class="note">👁️ '+t('صفحة للعرض فقط','View only')+(AT?' · '+t('آخر تحديث ','Updated ')+ago(AT):'')+(D.showD?'':'<br>'+t('تفاصيل الخصومات مخفية، ويظهر مجموعها فقط.','Deduction details are hidden; only their total is shown.'))+'</p>';
 box.innerHTML=h;}

box.addEventListener('click',function(ev){var el=ev.target.closest('[data-a]');if(!el)return;var a=el.dataset.a,v=el.dataset.v;
 if(a==='lang'){LANG=LANG==='en'?'ar':'en';try{localStorage.setItem('hc-view-lang',LANG);}catch(e){}}
 else if(a==='mon'){U.mi=+v;U.og=-1;U.os=null;}
 else if(a==='g'){U.og=U.og===+v?-1:+v;U.os=null;}
 else if(a==='s'){U.os=U.os===v?null:v;}
 else if(a==='md'){var p=v.split('|');U.mode[p[0]]=p[1];}
 else if(a==='c'){U.oc=U.oc===v?null:v;}
 else if(a==='all'){U.all=v;}
 render();});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')load();});
setInterval(function(){if(document.visibilityState==='visible')load();},60000);
render();load();
})();
