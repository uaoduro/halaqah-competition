(function(){
"use strict";
var S={};try{S=JSON.parse(localStorage.getItem('hc-data')||'{}')||{};}catch(e){S={};}
var LS_OK=true;try{localStorage.setItem('hc-t','1');localStorage.removeItem('hc-t');}catch(e){LS_OK=false;}
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
S.groups=S.groups||[];S.sessions=S.sessions||{};S.tests=S.tests||[];S.rules=S.rules||[];
var DEF_TITLE='مسابقة الحلقة الشهرية';
S.settings=Object.assign({title:DEF_TITLE,cal:'hijri',rank:'total'},S.settings||{});
var FONT='<meta name="theme-color" content="#f2f2f7"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default">';
var ART=null,capReady=false,ro=false,dirty=false,publishing=false,saving=false;
var COLORS=['#0f766e','#b45309','#7c3aed','#be123c','#1d4ed8','#4d7c0f','#0e7490','#a21caf'];
var DEF={a:'',b:1,ap:1,r:0,x:0,m:0,f:0,fr:0,ini:0,v:0};
var SB='https://imaguxksitjekaqlfpyc.supabase.co/rest/v1/rpc/',SBK='sb_publishable_X2bxbbBrb_pWlDHgZTu98g_sui_Zgjt';
var SY=null;try{SY=JSON.parse(localStorage.getItem('hc-sync')||'null');}catch(e){SY=null;}
var syT=null,syBusy=false,syAgain=false,syApplying=false;
function saveSY(){try{if(SY)localStorage.setItem('hc-sync',JSON.stringify(SY));else localStorage.removeItem('hc-sync');}catch(e){}}
function normS(){S.groups=S.groups||[];S.sessions=S.sessions||{};S.tests=S.tests||[];S.rules=S.rules||[];S.settings=Object.assign({title:DEF_TITLE,cal:'hijri',rank:'total'},S.settings||{});}
function rpc(fn,b){return fetch(SB+fn,{method:'POST',headers:{'apikey':SBK,'Content-Type':'application/json'},body:JSON.stringify(b)}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}
function newCode(){var A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',a=new Uint8Array(20),s='';crypto.getRandomValues(a);for(var i=0;i<20;i++)s+=A[a[i]%32];return s;}
function fmtCode(c){return String(c).replace(/(.{5})(?=.)/g,'$1-');}
function cleanCode(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
function schedSync(ms){if(!SY)return;clearTimeout(syT);syT=setTimeout(syncNow,ms==null?1500:ms);}
function syncMerge(L,R){R=R||{};var ids={},gid={};
 L.groups.forEach(function(g){gid[g.id]=g;g.students.forEach(function(s){ids[s.id]=1;});});
 (R.groups||[]).forEach(function(rg){var g=gid[rg.id];if(!g){g={id:rg.id,name:rg.name,students:[]};L.groups.push(g);gid[g.id]=g;}(rg.students||[]).forEach(function(rs){if(!ids[rs.id]){g.students.push(rs);ids[rs.id]=1;}});});
 Object.keys(R.sessions||{}).forEach(function(d){var rr=R.sessions[d]||{};Object.keys(rr).forEach(function(sid){if(!ids[sid])return;L.sessions[d]=L.sessions[d]||{};if(!L.sessions[d][sid])L.sessions[d][sid]=rr[sid];});});
 (R.tests||[]).forEach(function(x){if(ids[x.sid]&&!L.tests.some(function(y){return y.id===x.id||(y.sid===x.sid&&y.date===x.date&&+y.score===+x.score);}))L.tests.push(x);});
 (R.rules||[]).forEach(function(r){if(!L.rules.some(function(q){return q.id===r.id;}))L.rules.push(r);});
 var pv=(L.settings.pv||[]).slice();((R.settings||{}).pv||[]).forEach(function(q){if(!pv.some(function(z){return z.k===q.k&&z.from===q.from;}))pv.push(q);});
 if(pv.length){pv.sort(function(a,b){return a.from<b.from?-1:a.from>b.from?1:0;});L.settings.pv=pv;}
 return L;}
function applyS(D,remote){S=D||{};normS();syApplying=!!remote;saveLocal();syApplying=false;var ae=document.activeElement;if(!ae||!/INPUT|TEXTAREA|SELECT/.test(ae.tagName))render();}
function syncNow(){if(!SY||syBusy)return;if(!navigator.onLine){SY.err='offline';saveSY();updSync();return;}syBusy=true;SY.err=null;updSync();var d0=SY.dirty||0,p;
 if(d0)p=rpc('hc_push',{p_code:SY.code,p_data:S,p_base:SY.rev||null,p_create:!SY.rev}).then(function(r){
  if(r.ok){SY.rev=r.rev;SY.dirty=(SY.dirty===d0)?0:SY.dirty;SY.at=Date.now();if(SY.dirty)syAgain=true;else pushView();return;}
  if(r.conflict){applyS(syncMerge(S,r.data),false);SY.rev=r.rev;syAgain=true;return;}
  if(r.missing){SY.rev=0;syAgain=true;}});
 else p=rpc('hc_pull',{p_code:SY.code}).then(function(r){
  if(!r.found){SY.rev=0;SY.dirty=(SY.dirty||0)+1;syAgain=true;return;}
  if(r.rev>(SY.rev||0)&&!SY.dirty){applyS(r.data,true);SY.rev=r.rev;}else if(r.rev>(SY.rev||0)){syAgain=true;}
  SY.at=Date.now();});
 p.catch(function(e){SY.err=String(e&&e.message||e);}).then(function(){syBusy=false;saveSY();updSync();if(syAgain){syAgain=false;schedSync(300);}});}
function updSync(){if(UI&&UI.tab==='groups'){var ae=document.activeElement;if(!ae||!/INPUT|TEXTAREA|SELECT/.test(ae.tagName))render();}}
function ago(ts){var m=Math.round((Date.now()-ts)/60000);if(m<1)return t('الآن','just now');if(m<60)return t('قبل '+m+' دقيقة',m+' min ago');var h=Math.round(m/60);if(h<24)return t('قبل '+h+' س',h+' h ago');return esc(dateLong(ymd(new Date(ts))));}
function both(fn){var L0=LANG;LANG='ar';var a=fn();LANG='en';var e=fn();LANG=L0;return [a,e];}
function itemize(r,d){var P=PV(d),out=[],A=function(k){return adjOn(k,r)?(+((r.adj||{})[k])||0):0;},pr=r.a==='p'||r.a==='l';
 var add=function(k,ic,ar,en,v){out.push([k,ic,[ar,en],v]);};
 if(r.a==='p')add('p','⏱️','في الوقت','On time',P.on+A('p'));else if(r.a==='l')add('l','⏳','متأخر','Late',P.late+A('l'));else if(r.a==='u')add('u','🚫','غائب بدون عذر','Absent, no excuse',P.abs+A('u'));else if(r.a==='e')add('e','📝','غائب بعذر','Excused absence',0);
 CK.forEach(function(k){if(k!=='v'&&!pr)return;var n=+r[k]||0;if(!n)return;var sp=coreSpec(k);add(k+(n<0?'n':''),sp.icon,sp.nm[0]+(n<0?' (−)':''),sp.nm[1]+(n<0?' (−)':''),n*P[k]+A(k));});
 if(r.cx)Object.keys(r.cx).forEach(function(k){var q=(S.rules||[]).filter(function(z){return z.id===k;})[0];add(k,q?q.icon||'⭐':'⭐',q?q.name:'?',q?q.name:'?',(+r.cx[k]||0)+A(k));});
 return out;}
function hideDed(items){var neg=0,o=[];items.forEach(function(it){if(it[3]<0)neg+=it[3];else o.push(it);});if(neg)o.push(['ded','➖',['خصومات','Deductions'],neg]);return o;}
function viewPayload(){var showD=!!S.settings.showDed,avg=S.settings.rank==='avg',dates=Object.keys(S.sessions).concat(S.tests.map(function(x){return x.date;}));
 var months=monthList().slice(0,6).map(function(m){var dd=dates.filter(function(d){return monthKey(d)===m.k;}).sort()[0]||today();
  var M=compute(m.k);var gs=M.groups.slice().sort(function(a,b){return (avg?b.avg-a.avg:b.total-a.total);}).map(function(r){
   var st=r.stu.filter(function(o){return o.days||o.ach||!o.s.arc;}).sort(function(a,b){return b.total-a.total;}).map(function(o){var sum={},cls=[];
    Object.keys(S.sessions).filter(function(d){return monthKey(d)===m.k&&S.sessions[d][o.s.id];}).sort().forEach(function(d){var it=itemize(S.sessions[d][o.s.id],d),tot=it.reduce(function(a,b){return a+b[3];},0);
     it.forEach(function(x){var k=x[0];if(!sum[k])sum[k]=[x[1],x[2],0,0];sum[k][2]++;sum[k][3]+=x[3];});if(!showD)it=hideDed(it);cls.push([d,tot,it.map(function(x){return [x[1],x[2],x[3]];})]);});
    o.tests.forEach(function(x){var v=testPts(x.score,x.date,x.min);var k='test';if(!sum[k])sum[k]=['🌟',['اختبار التجاوز','Graduation test'],0,0];sum[k][2]++;sum[k][3]+=v;cls.push([x.date,v,[['🌟',['اختبار التجاوز ('+x.score+'%)','Graduation test ('+x.score+'%)'],v]]]);});
    cls.sort(function(a,b){return a[0]<b[0]?1:-1;});
    var sl=Object.keys(sum).map(function(k){return [sum[k][0],sum[k][1],sum[k][2],sum[k][3]];});
    if(!showD){var neg=0,cnt=0;sl=sl.filter(function(x){if(x[3]<0){neg+=x[3];cnt+=x[2];return false;}return true;});if(neg)sl.push(['➖',['خصومات','Deductions'],cnt,neg]);}
    sl.sort(function(a,b){return b[3]-a[3];});
    return {n:o.s.name,t:o.total,s:sl,c:cls};});
   return {n:r.g.name,c:r.color,t:r.total,a:r.avg,b:r.week,d:r.days,s:st};});
  return {k:m.k,l:both(function(){return monthLabel(dd);}),g:gs};});
 return {v:1,ti:both(title),at:Date.now(),avg:avg,showD:showD,cal:S.settings.cal,m:months};}
function pushView(){if(!SY||!S.settings.view)return;try{rpc('hc_view_put',{p_code:SY.code,p_data:viewPayload()}).catch(function(){});}catch(e){}}
function viewURL(c){return location.origin+location.pathname.replace(/[^\/]*$/,'')+'view.html#'+c;}
function viewSec(){var h='<div class="dz"><b>👁️ '+t('رابط العرض للطلاب','View link for students')+'</b><p class="muted small" style="margin:4px 0 8px">'+t('صفحة للعرض فقط: الترتيب، ومن حصل على ماذا. لا يمكن تعديل أي شيء منها، ورمز المزامنة لا يظهر فيها.','A view-only page: the ranking, and who earned what. Nothing can be changed from it, and the sync code isn’t in it.')+'</p>';
 if(!S.settings.view||!SY.view)return h+'<button class="btn" data-act="sy-view" style="width:100%">'+(S.settings.view?t('إظهار رابط العرض','Show the view link'):t('إنشاء رابط العرض','Create the view link'))+'</button></div>';
 var u=viewURL(SY.view);
 return h+'<div class="code small" style="word-break:break-all;margin-bottom:8px">'+esc(u)+'</div><div class="row"><button class="btn sm" data-act="sy-vcopy">'+t('نسخ الرابط','Copy link')+'</button>'+(navigator.share?'<button class="btn sm" data-act="sy-vshare">'+t('مشاركة','Share')+'</button>':'')+'</div>'+
  '<label class="f" style="margin-top:12px">'+t('تفاصيل الخصومات في صفحة العرض','Deduction details on the view page')+'</label><div class="radio"><button data-act="sy-ded" data-v="0" class="'+(!S.settings.showDed?'on':'')+'">'+t('مخفية (المجموع فقط)','Hidden (total only)')+'</button><button data-act="sy-ded" data-v="1" class="'+(S.settings.showDed?'on':'')+'">'+t('ظاهرة','Shown')+'</button></div></div>';}
function syncCard(){var h='<div class="card"><h2>☁️ '+t('المزامنة السحابية','Cloud sync')+'</h2>';
 var joinBox=function(lbl){return '<label class="f">'+lbl+'</label><div class="row" style="flex-wrap:nowrap"><input type="text" id="sy-in" dir="ltr" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" style="flex:1;min-width:0" class="code"><button class="btn pri" data-act="sy-join">'+t('ربط','Connect')+'</button></div>';};
 if(!SY){h+='<p class="muted small">'+t('تحفظ نسخة من البيانات على الإنترنت تلقائيًا بعد كل تغيير، وتُبقي الأجهزة متطابقة. تعمل بدون إنترنت وتُزامن عند عودته.','Saves a copy online automatically after every change and keeps devices in step. It still works offline and syncs when the internet is back.')+'</p>'+
  joinBox(t('١- عندك رمز من جهاز آخر؟ ألصقه هنا:','1. Have a code from another device? Paste it here:'))+
  '<label class="f" style="margin-top:16px">'+t('٢- أو ابدأ مزامنة جديدة لبيانات هذا الجهاز (يُنشئ رمزًا جديدًا):','2. Or start a new sync for this device’s data (creates a new code):')+'</label>'+
  '<button class="btn" data-act="sy-on" style="width:100%">'+t('بدء مزامنة جديدة','Start new sync')+'</button>';
  if(UI.syj)h+='<div class="banner" style="margin:12px 0 0">'+t('على هذا الجهاز بيانات بالفعل. ماذا تريد؟','This device already has data. What should happen?')+'<div class="row" style="margin-top:8px"><button class="btn pri" data-act="sy-comb">'+t('دمج الاثنين','Combine both')+'</button><button class="btn" data-act="sy-rep">'+t('استخدام نسخة السحابة فقط','Use the cloud copy only')+'</button><button class="btn" data-act="sy-cancel">'+t('إلغاء','Cancel')+'</button></div></div>';
  return h+'</div>';}
 var st=syBusy?'⏳ '+t('جارٍ المزامنة…','Syncing…'):SY.err==='offline'?'📴 '+t('بدون إنترنت — ستتم المزامنة عند الاتصال','Offline — will sync when connected'):SY.err?'⚠️ '+t('تعذّرت المزامنة، ستُعاد المحاولة','Couldn’t sync, will retry')+' <span class="muted small">('+esc(SY.err)+')</span>':SY.dirty?'⏳ '+t('بانتظار المزامنة','Waiting to sync'):SY.at?'✓ '+t('تمت المزامنة ','Synced ')+ago(SY.at):'';
 h+='<p style="margin:0 0 10px">'+st+'</p>'+
 (UI.syc?'<p class="muted small" style="margin:0 0 4px">'+t('رمز المزامنة — أدخله على الجهاز الآخر. أي شخص لديه الرمز يستطيع رؤية البيانات وتعديلها، فاحتفظ به لنفسك.','Sync code — enter it on the other device. Anyone with this code can see and change the data, so keep it to yourself.')+'</p><div class="row" style="flex-wrap:nowrap;align-items:center"><span class="code sp">'+fmtCode(SY.code)+'</span><button class="btn sm" data-act="sy-copy">'+t('نسخ','Copy')+'</button></div>':'<button class="btn sm" data-act="sy-show">🔑 '+t('إظهار رمز المزامنة','Show sync code')+'</button>')+
 viewSec()+'<details style="margin-top:12px"><summary class="small muted" style="cursor:pointer">'+t('استخدام رمز آخر','Use a different code')+'</summary><div style="margin-top:8px">'+joinBox(t('ألصق الرمز:','Paste the code:'))+(UI.syj?'<div class="banner" style="margin:12px 0 0">'+t('على هذا الجهاز بيانات بالفعل. ماذا تريد؟','This device already has data. What should happen?')+'<div class="row" style="margin-top:8px"><button class="btn pri" data-act="sy-comb">'+t('دمج الاثنين','Combine both')+'</button><button class="btn" data-act="sy-rep">'+t('استخدام نسخة السحابة فقط','Use the cloud copy only')+'</button><button class="btn" data-act="sy-cancel">'+t('إلغاء','Cancel')+'</button></div></div>':'')+'</div></details>'+
 '<div class="row" style="margin-top:12px"><button class="btn sp" data-act="sy-now">↻ '+t('مزامنة الآن','Sync now')+'</button><button class="btn danger" data-act="sy-off">'+t('إيقاف على هذا الجهاز','Turn off here')+'</button></div>'+
 (UI.syoff?'<div class="modal" data-act="sy-offc"><div class="card sheet" data-stop="1"><h2 style="margin:0 0 6px">'+t('إيقاف المزامنة على هذا الجهاز','Turn off sync on this device')+'</h2><p class="muted small" style="margin:0">'+t('النسخة السحابية والأجهزة الأخرى لن تتأثر. احتفظ بالرمز إذا أردت الرجوع:','The cloud copy and other devices aren’t affected. Keep the code if you may want to come back:')+'</p><div class="code" style="margin:10px 0">'+fmtCode(SY.code)+'</div>'+
 '<div class="row" style="margin-top:8px;flex-direction:column;align-items:stretch"><button class="btn" data-act="sy-offk">'+t('إيقاف مع إبقاء البيانات هنا','Turn off, keep the data here')+'</button><button class="btn danger" data-act="sy-offr">'+t('إيقاف وحذف البيانات من هذا الجهاز','Turn off and remove the data from this device')+'</button><button class="btn" data-act="sy-offc">'+t('إلغاء','Cancel')+'</button></div></div></div>':'');
 return h+'</div>';}

var PDEF={on:5,late:-1,abs:-2,b:3,ap:3,fr:1,ini:1,r:5,x:1,m:-1,f:1,v:-50,grp:5,test:10},PNEG={late:1,abs:1,v:1,m:1},_pvr=null,_pvc={};
function PV(d){var L=S.settings.pv;if(_pvr!==L){_pvr=L;_pvc={};}d=d||today();if(_pvc[d])return _pvc[d];var o=Object.assign({},PDEF);(L||[]).forEach(function(p){if(p.from<=d)o[p.k]=p.v;});return _pvc[d]=o;}
function pfmt(n){return n>0?'+'+n:n<0?'−'+Math.abs(n):'0';}
var app=document.getElementById('app');
var UI={lm:'rule',ro:{},tab:'log',sub:'past',month:null,date:null,gf:'all',open:{},og:{},os:{},arm:null,modal:null};
try{var sv=JSON.parse(sessionStorage.getItem('hc-ui')||'null');if(sv)Object.assign(UI,sv,{arm:null,modal:null});}catch(e){}
UI.og=UI.og||{};UI.os=UI.os||{};UI.ro=UI.ro||{};UI.lm=UI.lm||'rule';delete UI.cg;
function saveUI(){try{sessionStorage.setItem('hc-ui',JSON.stringify({lm:UI.lm,ro:UI.ro,rep:UI.rep,sub:UI.sub,tab:UI.tab,month:UI.month,date:UI.date,gf:UI.gf,open:UI.open,og:UI.og,os:UI.os}));}catch(e){}}

/* ---------- language ---------- */
var LANG='ar';
try{LANG=localStorage.getItem('hc-lang')||'ar';}catch(e){}
if(LANG!=='en')LANG='ar';
var THEME='auto';try{THEME=localStorage.getItem('hc-theme')||'auto';}catch(e){}
function applyTheme(){var r=document.documentElement;if(THEME==='auto')r.removeAttribute('data-theme');else r.setAttribute('data-theme',THEME);
 var dark=THEME==='dark'||(THEME==='auto'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);
 var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',dark?'#000000':'#f2f2f7');}
applyTheme();try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);}catch(e){}
function t(ar,en){return LANG==='en'?en:ar;}
function title(){return (LANG==='en'&&S.settings.title===DEF_TITLE)?'Monthly Halaqah Competition':S.settings.title;}

/* ---------- utils ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function uid(){return Math.random().toString(36).slice(2,9);}
function pad(n){return String(n).padStart(2,'0');}
function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function today(){return ymd(new Date());}
function toD(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2],12);}
function addDays(s,n){var d=toD(s);d.setDate(d.getDate()+n);return ymd(d);}
function sgn(n){return '<span class="num '+(n>0?'pos':n<0?'neg':'')+'">'+(n>0?'+':'')+n+'</span>';}
function N(n){return '<span class="num">'+n+'</span>';}
var hijriOK=true,HN,F={};
try{HN=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{year:'numeric',month:'numeric'});
if(HN.resolvedOptions().calendar.indexOf('islamic')<0)hijriOK=false;}catch(e){hijriOK=false;}
function fmt(kind){var k=LANG+kind;if(F[k])return F[k];var base=LANG==='en'?'en-GB':'ar-SA';var h=base+'-u-ca-islamic-umalqura-nu-latn',g=base+'-u-ca-gregory-nu-latn';
 var o={HL:[h,{month:'long',year:'numeric'}],HD:[h,{weekday:'long',day:'numeric',month:'long',year:'numeric'}],HS:[h,{day:'numeric',month:'long'}],GL:[g,{month:'long',year:'numeric'}],GD:[g,{day:'numeric',month:'long'}],GF:[g,{weekday:'long',day:'numeric',month:'long',year:'numeric'}]}[kind];
 return F[k]=new Intl.DateTimeFormat(o[0],o[1]);}
function useH(){return S.settings.cal==='hijri'&&hijriOK;}
function monthKey(s){if(useH()){var p=HN.formatToParts(toD(s));var y,m;p.forEach(function(x){if(x.type==='year')y=x.value;if(x.type==='month')m=x.value;});return 'h'+y+'-'+pad(+m);}return 'g'+s.slice(0,7);}
function monthLabel(s){return fmt(useH()?'HL':'GL').format(toD(s));}
function dateLong(s){var d=toD(s);return hijriOK?fmt('HD').format(d)+' · '+fmt('GD').format(d):fmt('GF').format(d);}
function weekKey(s){var d=toD(s);d.setDate(d.getDate()-d.getDay());return ymd(d);}
function testPts(sc,d,mn){sc=+sc;return sc>=(+mn||95)?PV(d).test:0;}
function tMin(){return +S.settings.testMin||95;}
function gBonus(g,d){var recs=S.sessions[d]||{},any=false,all=true,nr=0;g.students.forEach(function(s){var x=recs[s.id];if(!x)return;any=true;nr++;if(x.a!=='p'&&x.a!=='l')all=false;});return any&&all&&nr*2>=active(g).length?PV(d).grp:0;}
function recPts(r,d){var o={att:0,ba:0,rec:0,t:0};if(!r)return o;var P=PV(d);
 if(r.a==='u'){o.att=P.abs;}else if(r.a==='e'||!r.a){}else{o.att=r.a==='l'?P.late:P.on;o.ba=(+r.b||0)*P.b+(+r.ap||0)*P.ap+(+r.fr||0)*P.fr+(+r.ini||0)*P.ini+(+r.m||0)*P.m;o.rec=(+r.r||0)*P.r+(+r.x||0)*P.x+(+r.f||0)*P.f;}
 if(r.v)o.ba+=(+r.v||0)*P.v;if(r.cx)for(var ck in r.cx)o.ba+=(+r.cx[ck]||0);
 if(r.adj)for(var ak in r.adj){if(!adjOn(ak,r))continue;var an=+r.adj[ak]||0;if(ak==='p'||ak==='l'||ak==='u')o.att+=an;else if(ak==='r'||ak==='x'||ak==='f')o.rec+=an;else o.ba+=an;}
 o.t=o.att+o.ba+o.rec;return o;}
function cntBody(R,gs,recs){var sp=R[7],mn=sp.mode==='pm'?-5:0;return gs.map(function(g){var ci=S.groups.indexOf(g),act=active(g);if(!act.length)return '';
 return '<div class="ngl" style="--gc:'+COLORS[ci%COLORS.length]+'"><span class="dot"></span><bdi>'+esc(g.name)+'</bdi></div>'+act.map(function(s){var x=recs[s.id]||DEF,n=getVal(sp,x),ab=x.a==='e'||x.a==='u',tv=n*R[6];
  return '<div class="adjrow'+(ab?' dim':'')+'"><bdi class="sp">'+esc(s.name)+'</bdi><button class="stp" data-act="ex" data-k="'+sp.id+'" data-s="'+s.id+'" data-v="-1">−</button><b class="num adjv'+(tv>0?' pos':tv<0?' neg':'')+'">'+(n>0?'+'+n:n<0?'−'+(-n):'0')+'</b><button class="stp" data-act="ex" data-k="'+sp.id+'" data-s="'+s.id+'" data-v="1">+</button></div>';}).join('');}).join('');}
function rBase(id,x,P){if(CK.indexOf(id)>=0)return (+x[id]||0)*P[id];var m={p:P.on,l:P.late,u:P.abs};if(id in m)return m[id];return x.cx&&x.cx[id]!==undefined?+x.cx[id]:0;}
function aj(x,k){return x&&x.adj&&+x.adj[k]||0;}
function adjOn(k,r){var pr=r.a==='p'||r.a==='l';if(k==='p'||k==='l'||k==='u')return r.a===k;if(k==='v')return !!(+r.v);if(CK.indexOf(k)>=0)return pr&&(+r[k]||0)!==0;return !!(r.cx&&r.cx[k]!==undefined);}
function adjBody(R,gs,recs){var id=R[0],P=PV(UI.date),h='<p class="muted small" style="margin:0 0 8px">'+t('اضغط − أو + لتعديل نقاط هذا البند لطالب معيّن، مثلًا إذا سمّع نصف الدرس.','Tap − or + to change this rule’s points for one student, e.g. if they recited half the lesson.')+'</p>',n=0;
 gs.forEach(function(g){active(g).forEach(function(s){var x=recs[s.id]||DEF;var has=rVal(R,x)!==0;if(!has||!adjOn(id,x))return;n++;var b=rBase(id,x,P),a=aj(x,id);
  h+='<div class="adjrow"><bdi class="sp">'+esc(s.name)+'</bdi><button class="stp" data-act="adj" data-k="'+id+'" data-s="'+s.id+'" data-v="-1">−</button><b class="num adjv'+(a?' chg':'')+'">'+pfmt(b+a)+'</b><button class="stp" data-act="adj" data-k="'+id+'" data-s="'+s.id+'" data-v="1">+</button></div>';});});
 return n?h:h+'<p class="muted small">'+t('لا يوجد طلاب لديهم هذا البند بعد.','No students have this rule yet.')+'</p>';}

function findStu(id){var f=null;S.groups.forEach(function(g){g.students.forEach(function(s){if(s.id===id)f={s:s,g:g};});});return f;}
function active(g){return g.students.filter(function(s){return !s.arc;});}

/* ---------- scoring ---------- */
function monthList(){var m={};function add(d){var k=monthKey(d);if(!m[k]||d>m[k])m[k]=d;}
 add(today());Object.keys(S.sessions).forEach(add);S.tests.forEach(function(x){add(x.date);});
 return Object.keys(m).sort().reverse().map(function(k){return{k:k,label:monthLabel(m[k])};});}
function compute(mk){
 var byS={};var G=S.groups.map(function(g,i){var r={g:g,color:COLORS[i%COLORS.length],stu:[],att:0,ba:0,rec:0,ach:0,week:0,weeks:[],total:0,avg:0,n:active(g).length||g.students.length||1};
  g.students.forEach(function(s){var o={s:s,g:g,color:r.color,att:0,ba:0,rec:0,ach:0,total:0,days:0,tests:[]};byS[s.id]=o;r.stu.push(o);});return r;});
 Object.keys(S.sessions).forEach(function(d){if(monthKey(d)!==mk)return;var recs=S.sessions[d];
  Object.keys(recs).forEach(function(sid){var o=byS[sid];if(!o)return;var p=recPts(recs[sid],d);o.att+=p.att;o.ba+=p.ba;o.rec+=p.rec;o.days++;});});
 S.tests.forEach(function(x){if(monthKey(x.date)!==mk)return;var o=byS[x.sid];if(o){o.ach+=testPts(x.score,x.date,x.min);o.tests.push(x);}});
 var td=today();
 G.forEach(function(r){
   r.days=0;r.full=0;Object.keys(S.sessions).forEach(function(d){if(monthKey(d)!==mk)return;if(!r.g.students.some(function(s){return S.sessions[d][s.id];}))return;r.days++;var gb=gBonus(r.g,d);if(gb){r.full++;r.week+=gb;}});
  r.stu.forEach(function(o){o.total=o.att+o.ba+o.rec+o.ach;r.att+=o.att;r.ba+=o.ba;r.rec+=o.rec;r.ach+=o.ach;});
  r.total=r.att+r.ba+r.rec+r.ach+r.week;r.n=r.stu.filter(function(o){return o.days||o.ach;}).length||active(r.g).length||1;r.avg=Math.round(r.total/r.n*10)/10;
  r.stu.sort(function(a,b){return b.total-a.total;});});
 return {groups:G,byS:byS};}

/* ---------- render ---------- */
var STAR='<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><g fill="currentColor"><rect x="9" y="9" width="22" height="22" rx="2"/><rect x="9" y="9" width="22" height="22" rx="2" transform="rotate(45 20 20)"/></g><circle cx="20" cy="20" r="6" fill="var(--card)"/><circle cx="20" cy="20" r="3" fill="var(--gold)"/></svg>';
function tabs(){return [['board','🏆 '+t('الترتيب','Leaderboard')],['log','📝 '+t('تسجيل الحصة','Record class')],['past','🗂️ '+t('الحصص السابقة','Past classes')],['tests','🌟 '+t('اختبارات التجاوز','Graduation tests')],['groups','👥 '+t('المجموعات والإعدادات','Groups & settings')],['data','💾 '+t('النسخ والمزامنة','Backup & sync')],['rules','📊 '+t('القواعد','Rules')]];}
function render(){DEF=defRec();
 document.documentElement.lang=LANG;document.documentElement.dir=LANG==='en'?'ltr':'rtl';
 if(ro&&['log','past','tests','groups','data'].indexOf(UI.tab)>=0)UI.tab='board';
 var thIcon={auto:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',light:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',dark:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>'}[THEME];
 var h='<div class="scroller"><div class="wrap"><header class="top"><div class="brand">'+STAR+'<div><h1><bdi>'+esc(title())+'</bdi></h1><div class="sub">'+esc(dateLong(today()))+'</div></div></div><div class="hbtns">'+(ro?'<span class="badge">'+t('عرض فقط','View only')+'</span>':'')+'<button class="ibtn" data-act="theme" title="'+t('المظهر: ','Theme: ')+({auto:t('تلقائي','Auto'),light:t('فاتح','Light'),dark:t('داكن','Dark')})[THEME]+'">'+thIcon+'</button><button class="ibtn lang" data-act="lang" title="'+t('English','العربية')+'">'+(LANG==='en'?'ع':'EN')+'</button></div></header>';
 if(!LS_OK)h+='<div class="banner">'+t('تعذّر الوصول إلى التخزين على هذا الجهاز — لن تُحفظ البيانات. افتح التطبيق في Safari أو Chrome العادي.','Storage isn’t available on this device, so data won’t be saved. Open the app in regular Safari or Chrome.')+'</div>';
 if(false)h+='<div class="banner">'+t('وضع المعاينة: يمكنك التجربة، لكن التعديلات لن تُحفظ هنا. افتح الصفحة من رابطها للحفظ.','Preview mode: you can try things out, but changes won’t be saved here. Open the page from its link to save.')+'</div>';
 var subs=tabs().filter(function(x){return ro?(x[0]==='board'||x[0]==='rules'):(x[0]!=='log'&&x[0]!=='board');});
 var inSet=!ro&&UI.tab!=='log'&&UI.tab!=='board';if(!UI.sub||UI.sub==='board'||UI.sub==='log')UI.sub='past';
 if(inSet)h+='<nav class="tabs">'+subs.map(function(x){return '<button data-act="tab" data-v="'+x[0]+'" class="'+(UI.tab===x[0]?'on':'')+'">'+x[1]+'</button>';}).join('')+'</nav>';
 var TB=ro?[['board','🏆',t('الترتيب','Leaderboard'),UI.tab==='board'],['rules','📊',t('القواعد','Rules'),UI.tab==='rules']]:[['log','📝',t('تسجيل الحصة','Record class'),UI.tab==='log'],['board','🏆',t('الترتيب','Leaderboard'),UI.tab==='board'],[UI.sub,'⚙️',t('الإعدادات','Settings'),inSet]];
 var tabbar='<nav class="tabbar">'+TB.map(function(x){return '<button data-act="tab" data-v="'+x[0]+'" class="'+(x[3]?'on':'')+'"><span class="ti">'+x[1]+'</span><span>'+x[2]+'</span></button>';}).join('')+'</nav>';
 h+=({board:vBoard,log:vLog,past:vPast,tests:vTests,groups:vGroups,data:vData,rules:vRules})[UI.tab]();
 h+='</div></div>'+tabbar;
 if(dirty&&!ro)h+='<div class="savebar"><div><span class="muted small sp">'+t('لديك تغييرات غير محفوظة','You have unsaved changes')+'</span><button class="btn pri" data-act="save" '+(saving?'disabled':'')+'>'+(saving?t('جارٍ الحفظ…','Saving…'):t('حفظ التغييرات','Save changes'))+'</button></div></div>';
 if(UI.modal)h+='<div class="modal" data-act="closemodal"><div class="card" data-stop="1"><h2>'+esc(UI.modal.title)+'</h2><p class="muted small">'+t('حدّد النص وانسخه يدويًا:','Select the text and copy it manually:')+'</p><textarea readonly style="min-height:220px" dir="auto">'+esc(UI.modal.text)+'</textarea><div class="row" style="margin-top:10px"><span class="sp"></span><button class="btn" data-act="closemodal">'+t('إغلاق','Close')+'</button></div></div></div>';
 if(toastMsg)h+='<div class="toast">'+esc(toastMsg)+'</div>';
 var sc0=app.querySelector('.scroller'),st0=sc0?sc0.scrollTop:0;
 app.innerHTML=h;
 var sc1=app.querySelector('.scroller');if(sc1){sc1.scrollTop=resetScroll?0:st0;}resetScroll=false;
 if(UI.modal){var ta=app.querySelector('.modal textarea');if(ta){ta.focus();ta.select();}}
}
var toastMsg=null,toastT,resetScroll=false;
function toast(m){toastMsg=m;render();clearTimeout(toastT);toastT=setTimeout(function(){toastMsg=null;render();},2600);}
function monthSel(months){return '<select data-act="month">'+months.map(function(m){return '<option value="'+m.k+'" '+(m.k===UI.month?'selected':'')+'>'+esc(m.label)+'</option>';}).join('')+'</select>';}
function catNames(){return [t('الحضور','Attendance'),t('السلوك والمظهر والمبادرات','Conduct & extras'),t('التسميع','Recitation'),t('اختبار التجاوز','Graduation test'),'👥 '+t('حضور الجميع','Everyone present')];}

function vBoard(){
 if(!S.groups.length)return '<div class="card empty"><h2>'+t('أهلًا بك 👋','Welcome 👋')+'</h2><p class="muted">'+t('ابدأ بإضافة مجموعات الحلقة وأسماء الطلاب، ثم سجّل كل حصة لتظهر النتائج هنا تلقائيًا.','Start by adding your class groups and student names, then record each class and the results will appear here automatically.')+'</p>'+(ro?'':'<button class="btn pri" data-act="tab" data-v="groups">'+t('إضافة المجموعات','Add groups')+'</button>')+'</div>';
 var months=monthList();if(!months.some(function(m){return m.k===UI.month;}))UI.month=months[0].k;
 var C=compute(UI.month);var avg=S.settings.rank==='avg';
 var key=function(r){return avg?r.avg:r.total;};
 var R=C.groups.slice().sort(function(a,b){return key(b)-key(a);});
 var max=Math.max(1,Math.max.apply(null,R.map(key)));var cn=catNames();
 var h='<div class="row" style="margin-bottom:12px"><h2 style="margin:0">'+t('ترتيب المجموعات','Group rankings')+'</h2><span class="sp"></span>'+(UI.rep==='week'?'':monthSel(months))+'</div>'+repToggle()+'<div class="row" style="margin:-2px 0 12px"><button class="btn pri sp" data-act="shareimg">🖼️ '+(UI.rep==='week'?t('مشاركة صورة الأسبوع','Share week image'):t('مشاركة صورة النتائج','Share results image'))+'</button><button class="btn sp" data-act="sharetxt">💬 '+t('مشاركة كنص','Share as text')+'</button></div>';
 if(UI.rep==='week')return h+vWeek();
 if(avg)h+='<p class="muted small" style="margin-top:-4px">'+t('الترتيب حسب متوسط نقاط الطالب في كل مجموعة.','Ranked by average points per student in each group.')+'</p>';
 var prev=null,rk=0;
 R.forEach(function(r,i){var v=key(r);if(v!==prev){rk=i+1;prev=v;}
  var medal=rk===1?'🥇':rk===2?'🥈':rk===3?'🥉':rk;var open=UI.open[r.g.id];
  h+='<div class="card grp" style="--gc:'+r.color+'"><div class="grp-h" data-act="toggle" data-v="'+r.g.id+'"><div class="rank '+(rk===1?'r1':'')+'">'+medal+'</div><div class="sp"><div class="gname"><bdi>'+esc(r.g.name)+'</bdi></div><div class="muted small">'+N(active(r.g).length)+' '+t('طالب','students')+(avg?'':' · '+t('متوسط الطالب','avg per student')+' '+N(r.avg))+'</div></div><div style="text-align:center"><div class="total"><span class="num">'+v+'</span></div><small class="muted small">'+(avg?t('متوسط','average'):t('نقطة','points'))+'</small></div><span class="muted">'+(open?'▴':'▾')+'</span></div>';
  h+='<div class="bar"><i style="width:'+Math.max(0,v/max*100)+'%"></i></div>';
  if(open){
   if(r.days)h+='<div class="weeks"><span class="wk '+(r.full?'ok':'')+'">👥 '+t('حضور جميع الطلاب','Everyone present')+': '+N(r.full)+' / '+N(r.days)+' '+t('حصص','classes')+(r.full?' · <span class="num">+'+(r.full*5)+'</span>':'')+'</span></div>';
   h+='<div class="tblwrap"><table><thead><tr><th>'+t('الطالب','Student')+'</th><th class="n">'+t('الحصص','Classes')+'</th><th class="n">'+cn[0]+'</th><th class="n">'+cn[1]+'</th><th class="n">'+cn[2]+'</th><th class="n">'+cn[3]+'</th><th class="n">'+t('المجموع','Total')+'</th></tr></thead><tbody>'+
   r.stu.filter(function(o){return !o.s.arc||o.days;}).map(function(o){return '<tr><td><bdi>'+esc(o.s.name)+'</bdi>'+(o.s.arc?' <span class="muted small">('+t('مؤرشف','archived')+')</span>':'')+'</td><td class="n">'+N(o.days)+'</td><td class="n">'+sgn(o.att)+'</td><td class="n">'+sgn(o.ba)+'</td><td class="n">'+sgn(o.rec)+'</td><td class="n">'+sgn(o.ach)+'</td><td class="n"><b>'+sgn(o.total)+'</b></td></tr>';}).join('')+'</tbody></table></div>';}
  h+='</div>';});
 var top=Object.keys(C.byS).map(function(k){return C.byS[k];}).filter(function(o){return o.days||o.ach;}).sort(function(a,b){return b.total-a.total;}).slice(0,10);
 if(top.length)h+='<div class="card"><h2>⭐ '+t('أبرز الطلاب هذا الشهر','Top students this month')+'</h2><div class="toplist">'+top.map(function(o,i){return '<div style="--gc:'+o.color+'"><b class="num" style="width:24px">'+(i+1)+'</b><span class="dot"></span><span class="sp"><bdi>'+esc(o.s.name)+'</bdi> <span class="muted small">· <bdi>'+esc(o.g.name)+'</bdi></span>'+(o.tests.length?' 🌟':'')+'</span><b>'+sgn(o.total)+'</b></div>';}).join('')+'</div></div>';
 return h;}

function lastWeek(){var td=today();var ds=Object.keys(S.sessions).filter(function(d){return d<=td;}).sort();return ds.length?weekKey(ds[ds.length-1]):weekKey(td);}
function computeWeek(wk){
 var ds=Object.keys(S.sessions).filter(function(d){return weekKey(d)===wk;}).sort();
 var byS={},G=S.groups.map(function(g,i){var r={g:g,color:COLORS[i%COLORS.length],total:0,week:0,perfect:false,stu:[]};
  g.students.forEach(function(s){var o={s:s,g:g,total:0,days:0,ach:0};byS[s.id]=o;r.stu.push(o);});return r;});
 ds.forEach(function(d){var recs=S.sessions[d];Object.keys(recs).forEach(function(sid){var o=byS[sid];if(o){o.total+=recPts(recs[sid],d).t;o.days++;}});});
 S.tests.forEach(function(x){if(weekKey(x.date)!==wk)return;var o=byS[x.sid];if(o){var p=testPts(x.score,x.date,x.min);o.total+=p;o.ach+=p;}});
 G.forEach(function(r){r.full=0;ds.forEach(function(d){var gb=gBonus(r.g,d);if(gb){r.full++;r.week+=gb;}});
  r.total=r.week;r.stu.forEach(function(o){r.total+=o.total;});
  r.n=r.stu.filter(function(o){return o.days||o.ach;}).length||active(r.g).length||1;r.avg=Math.round(r.total/r.n*10)/10;});
 var f=ds[0]||wk,l=ds[ds.length-1]||addDays(wk,4);var F=fmt(useH()?'HS':'GD');
 return {groups:G,byS:byS,label:F.format(toD(f))+(l!==f?' – '+F.format(toD(l)):''),classes:ds.length};}
function bd(g,inP){var o={beh:0,rec:0,oth:0,add:0,ded:0};
 Object.keys(S.sessions).forEach(function(d){if(!inP(d))return;var recs=S.sessions[d];
  g.students.forEach(function(s){var r=recs[s.id];if(!r)return;
   var P=PV(d);if(r.a==='u')o.ded-=P.abs;else if(r.a==='l')o.ded-=P.late;
   if(r.a==='p'){o.oth+=P.on;}CK.forEach(function(k){if(k!=='v'&&r.a!=='p'&&r.a!=='l')return;var vv=(+r[k]||0)*P[k];if(!vv)return;if(vv<0)o.ded-=vv;else if(k==='b'||k==='ap')o.beh+=vv;else if(k==='r')o.rec+=vv;else if(k==='fr')o.oth+=vv;else o.add+=vv;});
   if(r.cx)for(var ck2 in r.cx){var cv2=+r.cx[ck2]||0,rq=(S.rules||[]).filter(function(q){return q.id===ck2;})[0],sc2=rq?rSec(rq):5;if(cv2<0)o.ded-=cv2;else if(sc2===3)o.beh+=cv2;else if(sc2===4)o.rec+=cv2;else if(sc2<=2)o.oth+=cv2;else o.add+=cv2;}if(r.adj)for(var ak2 in r.adj){if(!adjOn(ak2,r))continue;var an2=+r.adj[ak2]||0;if(ak2==='l'||ak2==='u'||ak2==='v')o.ded-=an2;else if(ak2==='b'||ak2==='ap')o.beh+=an2;else if(ak2==='r')o.rec+=an2;else if(ak2==='p'||ak2==='fr')o.oth+=an2;else if(ak2==='x'||ak2==='f'||ak2==='ini')o.add+=an2;else{var cq=(S.rules||[]).filter(function(q){return q.id===ak2;})[0];if(cq&&cq.pts<0)o.ded-=an2;else o.add+=an2;}}});
  o.oth+=gBonus(g,d);});
 S.tests.forEach(function(x){if(!inP(x.date))return;if(g.students.some(function(s){return s.id===x.sid;}))o.add+=testPts(x.score,x.date,x.min);});
 o.tot=o.beh+o.rec+o.oth+o.add-o.ded;return o;}
function reportModel(){var avg=S.settings.rank==='avg',M,sub,isW=UI.rep==='week';
 var inP;if(isW){var wk0=lastWeek();M=computeWeek(wk0);sub=t('نتائج الأسبوع: ','This week: ')+M.label;inP=function(d){return weekKey(d)===wk0;};}
 else{var months=monthList();var m=months.filter(function(x){return x.k===UI.month;})[0]||months[0];M=compute(m.k);sub=t('نتائج ','Results · ')+m.label;inP=function(d){return monthKey(d)===m.k;};}
 var key=function(r){return avg?r.avg:r.total;};
 var rows=M.groups.slice().sort(function(a,b){return key(b)-key(a);}).map(function(r){return {name:r.g.name,color:r.color,v:key(r),bonus:isW?r.week:0,bd:bd(r.g,inP),total:r.total};});
 var top=Object.keys(M.byS).map(function(k){return M.byS[k];}).filter(function(o){return o.days||o.ach;}).sort(function(a,b){return b.total-a.total;}).slice(0,3).map(function(o){return {n:o.s.name,g:o.g.name,v:o.total};});
 return {sub:sub,rows:rows,top:top,avg:avg,week:isW,classes:M.classes};}
function repToggle(){return '<div class="radio" style="margin-bottom:12px"><button data-act="rep" data-v="month" class="'+(UI.rep!=='week'?'on':'')+'">'+t('الشهر','Month')+'</button><button data-act="rep" data-v="week" class="'+(UI.rep==='week'?'on':'')+'">'+t('هذا الأسبوع','This week')+'</button></div>';}
function vWeek(){var M=reportModel();var medal=function(i){return i===0?'🥇':i===1?'🥈':i===2?'🥉':String(i+1);};
 var h='<div class="card"><h3 style="margin-bottom:4px">'+esc(M.sub)+'</h3><p class="muted small" style="margin:0 0 6px">'+N(M.classes)+' '+t('حصص','classes')+(M.avg?' · '+t('متوسط الطالب','avg per student'):'')+'</p>'+
 M.rows.map(function(r,i){return '<div class="prow" style="--gc:'+r.color+'"><b style="width:28px;text-align:center">'+medal(i)+'</b><span class="dot"></span><bdi class="sp">'+esc(r.name)+'</bdi>'+(r.bonus?'<span class="pill p">👥 <span class="num">+'+r.bonus+'</span></span>':'')+'<b>'+sgn(r.v)+'</b></div>';}).join('')+
 (M.rows.some(function(r){return r.bonus;})?'<p class="muted small" style="margin:8px 0 0">👥 '+t('حضور جميع طلاب المجموعة','Every student in the group present')+' <span class="num">(+'+PV().grp+')</span> '+t('لكل حصة','per class')+'</p>':'')+'</div>';
 if(M.top.length)h+='<div class="card"><h2>⭐ '+t('أبرز طلاب الأسبوع','Top students this week')+'</h2><div class="toplist">'+M.top.map(function(o,i){return '<div><b class="num" style="width:24px">'+(i+1)+'</b><span class="sp"><bdi>'+esc(o.n)+'</bdi> <span class="muted small">· <bdi>'+esc(o.g)+'</bdi></span></span><b>'+sgn(o.v)+'</b></div>';}).join('')+'</div></div>';
 return h;}
function waText(){var M=reportModel();
 var s='🏆 *'+title()+'*\n_'+M.sub+'_\n\n';
 M.rows.forEach(function(r,i){s+=(i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.')+' *'+r.name+'*: '+(M.avg?r.v+' ('+t('متوسط','average')+')':r.v+' '+t('نقطة','points'))+(r.bonus?' 👥':'')+'\n';});
 if(M.rows.some(function(r){return r.bonus;}))s+='\n👥 '+t('حضور جميع طلاب المجموعة (+'+PV().grp+' لكل حصة)','Every student in the group present (+'+PV().grp+' per class)')+'\n';
 if(M.top.length){s+='\n⭐ _'+(M.week?t('أبرز طلاب الأسبوع:','Top students this week:'):t('أبرز الطلاب:','Top students:'))+'_\n';M.top.forEach(function(o){s+='• '+o.n+' ('+o.g+'): '+o.v+'\n';});}
 return s+'\n'+t('بارك الله في الجميع 🌹','May Allah bless everyone 🌹');}
function norm(s){return String(s||'').replace(/[\u064B-\u0652\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').toLowerCase().trim();}
function searchHits(q){q=norm(q);if(!q)return [];var a=[];S.groups.forEach(function(g){active(g).forEach(function(s){var n=norm(s.name);var i=n.indexOf(q);if(i>=0)a.push({s:s,g:g,i:i});});});
 a.sort(function(x,y){return x.i-y.i||x.s.name.localeCompare(y.s.name,'ar');});return a.slice(0,8);}
function searchHTML(q){if(!norm(q))return '';var hits=searchHits(q);
 if(!hits.length)return '<div class="qres"><div class="qnone">'+t('لا يوجد طالب بهذا الاسم','No student with that name')+'</div></div>';
 return '<div class="qres">'+hits.map(function(h){return '<button class="qitem" data-act="pick" data-v="'+h.s.id+'"><bdi>'+esc(h.s.name)+'</bdi><span class="muted small"> · <bdi>'+esc(h.g.name)+'</bdi></span></button>';}).join('')+'</div>';}
var CORE=[
 ['r','📖',['التسميع','Recitation'],['التسميع (الدرس + الجنب + المراجعة)','Recitation (new lesson + recent + revision)'],'once',0,4],
 ['fr','🕌',['الصف الأول','First row'],['الصلاة في الصف الأول (لكل طالب)','Praying in the first row (per student)'],'once',0,2],
 ['f','🤝',['المتابعة مع الزميل','Following a partner'],['المتابعة بدقة مع الزميل','Following closely with a partner'],'once',0,4],
 ['ini','💡',['مبادرة','Initiative'],['عمل فيه قيمة مجتمعية أو أثر إيجابي','An act of community value or positive impact'],'once',0,5],
 ['x','➕',['درس إضافي','Extra lesson'],['تسميع درس إضافي (و − لدرس لم يكتمل)','Reciting an extra lesson (and − for a lesson not completed)'],'pm',0,4],
 ['m','➖',['خصم نقطة','Point deduction'],['خصم نقطة (لكل مرة)','Point deduction (each time)'],'cnt',0,4],
 ['b','😇',['السلوك','Behaviour'],['السلوك والانضباط والاحترام','Behaviour, discipline and respect'],'once',1,3],
 ['ap','👔',['المظهر','Appearance'],['الالتزام بالمظهر العام','Keeping to the dress code'],'once',1,3],
 ['v','⛔',['مخالفة جسيمة','Serious violation'],['ثبوت حالة غش أو كذب أو ما شابه','A proven case of cheating, lying or similar'],'once',0,7]];
var CK=CORE.map(function(c){return c[0];});
function coreDef(k){return CORE.filter(function(z){return z[0]===k;})[0];}
function coreSpec(k){var c=coreDef(k);if(!c)return null;var o=((S.settings.rc||{})[k])||{};
 return {id:k,core:1,icon:o.icon||c[1],nm:o.name?[o.name,o.name]:c[2],ln:o.name?[o.name,o.name]:c[3],mode:o.mode||c[4],auto:o.auto!=null?!!o.auto:!!c[5],sec:o.sec||c[6],hid:!!o.hid};}
function cxSpec(r){return {id:r.id,core:0,icon:r.icon||(r.pts>0?'⭐':'⚠️'),nm:[r.name,r.name],ln:[r.name,r.name],mode:r.mode||'once',auto:!!r.auto,sec:rSec(r),hid:!!r.arc,pts:r.pts};}
function specs(all){var a=CK.map(coreSpec).concat((S.rules||[]).map(cxSpec));return all?a:a.filter(function(s){return !s.hid;});}
function specOf(id){return specs(true).filter(function(s){return s.id===id;})[0];}
function getVal(sp,x){if(sp.core)return +x[sp.id]||0;var c=x.cx&&x.cx[sp.id];if(c===undefined)return 0;if(sp.mode==='once')return 1;return Math.round(c/(sp.pts||1))||0;}
function valPatch(sp,x,n){if(sp.core){var o={};o[sp.id]=n;return o;}var cc=Object.assign({},x.cx||{});if(n)cc[sp.id]=n*sp.pts;else delete cc[sp.id];return {cx:cc};}
function defRec(){var d={a:S.settings.attAuto?'p':'',b:0,ap:0,r:0,x:0,m:0,f:0,fr:0,ini:0,v:0};specs().forEach(function(sp){if(!sp.auto)return;if(sp.core)d[sp.id]=1;else{d.cx=d.cx||{};d.cx[sp.id]=sp.pts;}});return d;}
function defCopy(){return JSON.parse(JSON.stringify(DEF));}
var RLA=[['p','att','⏱️','في الوقت','On time'],['l','att','⏳','متأخر','Late'],['u','att','🚫','غائب بدون عذر','Absent, no excuse'],['e','att','📝','غائب بعذر','Absent, excused']];
function rulesAll(){var P=PV(UI.date),am={p:P.on,l:P.late,u:P.abs,e:0};
 var amk={p:'on',l:'late',u:'abs'};return RLA.map(function(R){var o=amk[R[0]]&&((S.settings.rc||{})[amk[R[0]]])||{};return [R[0],'att',o.icon||R[2],o.name||R[3],o.name||R[4],pfmt(am[R[0]]),am[R[0]]];}).concat(specs().map(function(sp){var pt=sp.core?P[sp.id]:sp.pts,ty=sp.auto&&sp.mode==='once'?'off':sp.mode==='once'?'on':'cnt';
  return [sp.id,ty,sp.icon,sp.nm[0],sp.nm[1],sp.mode==='pm'?'±'+Math.abs(pt):ty==='off'?pfmt(-pt):pfmt(pt),pt,sp];}));}
function ruleOf(id){return rulesAll().filter(function(R){return R[0]===id;})[0];}
function rVal(R,x){return R[7]?getVal(R[7],x):0;}
function rMarked(R,x){if(R[1]==='att')return x.a===R[0];var v=rVal(R,x);return R[1]==='off'?!v:v!==0;}
function rNeg(R){return R[1]!=='att'&&R[1]!=='off'&&R[6]<0;}
function ruleSections(){var A=rulesAll(),pick=function(f){return A.filter(f);};
 return [[t('الحضور','Attendance'),pick(function(R){return R[1]==='att';})],
  [t('نقاط إضافية — اضغط على من حققها','Extra points — tap who earned them'),pick(function(R){return (R[1]==='on'||R[1]==='cnt')&&R[6]>=0;})],
  [t('تُحسب للجميع — اضغط على من لم يحققها','Given to everyone — tap who missed it'),pick(function(R){return R[1]==='off';})],
  [t('خصومات','Deductions'),pick(rNeg)]];}
function cardChips(x,sid,d,neg){var P=PV(d);return specs().filter(function(sp){var p=sp.core?P[sp.id]:sp.pts;return neg?p<0:p>=0;}).map(function(sp){var p=sp.core?P[sp.id]:sp.pts,v=getVal(sp,x),nm=t(sp.nm[0],sp.nm[1]);
 if(sp.mode!=='once')return '<span class="stepper '+(v*p>0?'on':v*p<0?'bad':'')+'"><button data-act="ex" data-k="'+sp.id+'" data-s="'+sid+'" data-v="-1" aria-label="−">−</button><span>'+sp.icon+' <bdi>'+esc(nm)+'</bdi> '+N(v)+'</span><button data-act="ex" data-k="'+sp.id+'" data-s="'+sid+'" data-v="1" aria-label="+">+</button></span>';
 return '<button class="chip '+(v?(p<0?'bad':'on'):'')+'" data-act="rt" data-k="'+sp.id+'" data-s="'+sid+'">'+sp.icon+' <bdi>'+esc(nm)+'</bdi> <span class="num">'+pfmt(p)+'</span>'+(sp.id==='v'&&UI.arm==='v-'+sid?' · '+t('اضغط للتأكيد','tap to confirm'):'')+'</button>';}).join('');}
function cardFlags(x,d){var P=PV(d),f='',ab=!(x.a==='p'||x.a==='l');specs(true).forEach(function(sp){var p=sp.core?P[sp.id]:sp.pts,v=getVal(sp,x);if(ab&&sp.core&&sp.id!=='v')return;
 if(sp.auto&&!sp.hid){if(!v)f+='<span class="flag bad">'+sp.icon+' ✗</span>';return;}
 if(v){var tot=sp.core?v*p:(+x.cx[sp.id]||0);f+='<span class="flag'+(tot<0?' bad':'')+'">'+sp.icon+' '+(Math.abs(v)!==1?'×'+v+' ':'')+pfmt(tot)+'</span>';}});
 var asum=0;if(x.adj)Object.keys(x.adj).forEach(function(k){if(adjOn(k,x))asum+=+x.adj[k]||0;});if(asum)f+='<span class="flag'+(asum<0?' bad':'')+'">± '+pfmt(asum)+'</span>';return f;}
function ruleView(gs,recs){
 var h='';
 ruleSections().forEach(function(sec){if(!sec[1].length)return;
  h+='<div class="rsec">'+sec[0]+'</div><div class="card rlist">'+sec[1].map(function(R){return ruleRow(R,gs,recs);}).join('')+'</div>';});
 return h;}
function ruleRow(R,gs,recs){var id=R[0],ty=R[1],open=!!UI.ro[id],cnt=0,neg=rNeg(R),avail=0;
 var body=gs.map(function(g){var ci=S.groups.indexOf(g),act=active(g);if(!act.length)return '';
  return '<div class="ngl" style="--gc:'+COLORS[ci%COLORS.length]+'"><span class="dot"></span><bdi>'+esc(g.name)+'</bdi></div><div class="nchips">'+act.map(function(s){var x=recs[s.id]||DEF,m=rMarked(R,x);if(m)cnt++;
   var ab=x.a==='e'||x.a==='u',dim=ab&&ty!=='att'&&!neg,armed=id==='v'&&UI.arm==='v-'+s.id;if(!dim)avail++;
   var cls=!m?'':neg?'bad':(ty==='on'||ty==='cnt'||ty==='cx'||id==='p')?'on':id==='l'?'late':id==='e'?'exc':'bad';
   return '<button class="nchip '+cls+(dim?' dim':'')+(armed?' arm':'')+'" data-act="rt" data-k="'+id+'" data-s="'+s.id+'">'+(m&&!armed?'<span class="ck">✓</span>':'')+'<bdi>'+esc(s.name)+'</bdi>'+(ty==='cnt'&&(+x[id]||0)>1?' <span class="num">×'+x[id]+'</span>':'')+(armed?' · '+t('اضغط للتأكيد','tap to confirm'):'')+'</button>';}).join('')+'</div>';}).join('');if(ty==='cnt')body=cntBody(R,gs,recs);
 var sub=ty==='att'?t('اضغط على الطالب لتحديده، ومرة أخرى لإلغائه','Tap a student to mark them, again to undo'):id==='v'?t('اضغط مرتين للتأكيد','Tap twice to confirm'):ty==='off'?t('الجميع يحصل عليه — اضغط على من لم يحققه','Everyone gets it — tap who didn’t'):ty==='cnt'?(R[7]&&R[7].mode==='pm'?t('اضغط + لكل مرة، و − إذا لم يُنجَز','Tap + for each time, and − when it isn’t done'):t('اضغط + لكل مرة','Tap + for each time')):neg?t('اضغط على من يُخصم منه','Tap who loses the points'):t('اضغط على من حققه','Tap who did it');
 var pc=neg?'u':(ty==='on'||ty==='cnt'||ty==='cx'||id==='p')?'p':id==='l'?'l':id==='e'?'e':'u';
 var pcls=R[1]==='off'?'neg':R[6]>0?'pos':R[6]<0?'neg':'';
 var bulk='<div class="rbulk">'+(!neg&&cnt<avail?'<button class="btn sm" data-act="rall" data-k="'+id+'" data-v="sel">✓ '+t('تحديد الكل','Select all')+'</button>':'')+(cnt?'<button class="btn sm" data-act="rall" data-k="'+id+'" data-v="clr">✕ '+t('إلغاء تحديد الكل','Unselect all')+'</button>':'')+'</div>';
 return '<div class="rrow'+(open?' open':'')+'"><div class="rhead" data-act="rhead" data-v="'+id+'"><span class="ric">'+R[2]+'</span><span class="rname">'+esc(t(R[3],R[4]))+'</span><span class="rpts num '+pcls+'">'+R[5]+'</span><span class="sp"></span>'+(cnt?'<span class="pill '+pc+'">'+N(cnt)+'</span>':'')+'<span class="chev">'+(open?'▾':(LANG==='en'?'▸':'◂'))+'</span></div>'+(open?'<div class="rbody"><p class="muted small" style="margin:0 0 8px">'+sub+'</p>'+(UI.ra===id?adjBody(R,gs,recs):bulk+body)+(id!=='e'&&ty!=='cnt'&&(ty==='off'||cnt)?'<div class="rbulk" style="margin-top:10px"><button class="btn sm" data-act="radj" data-v="'+id+'">'+(UI.ra===id?'✓ '+t('تم','Done'):'± '+t('تعديل النقاط لطالب','Adjust a student’s points'))+'</button></div>':'')+'</div>':'')+'</div>';}
function pName(k){var N={on:['⏱️ عدم التأخر','⏱️ Arriving on time'],late:['⏳ خصم عن كل تأخير','⏳ Each late arrival'],abs:['🚫 غياب بدون عذر','🚫 Absence without excuse'],grp:['👥 حضور جميع طلاب المجموعة','👥 Every student in the group present'],fr:['🕌 الصلاة في الصف الأول','🕌 Praying in the first row'],b:['😇 السلوك والانضباط','😇 Behaviour and discipline'],ap:['👔 المظهر العام','👔 Dress code'],r:['📖 التسميع','📖 Recitation'],x:['➕ درس إضافي','➕ Extra lesson'],m:['➖ خصم نقطة','➖ Point deduction'],f:['🤝 المتابعة مع الزميل','🤝 Following a partner'],ini:['💡 مبادرة أو أثر إيجابي','💡 Initiative or positive impact'],test:['🌟 اختبار التجاوز (95% فأعلى)','🌟 Graduation test (95%+)'],v:['⛔ مخالفة جسيمة','⛔ Serious violation']}[k];return N?t(N[0],N[1]):k;}
function peSheet(){var k=UI.pe.k,isC=k.indexOf('c:')===0,r=isC?(S.rules||[]).filter(function(q){return q.id===k.slice(2);})[0]:null;if(isC&&!r)return '';
 var cur=isC?r.pts:PV()[k],neg=isC?cur<0:!!PNEG[k],nm=isC?esc((r.icon||'')+' '+r.name):pName(k),hist=isC?[]:(S.settings.pv||[]).filter(function(p){return p.k===k;});
 return '<div class="modal" data-act="pe-close"><div class="card sheet" data-stop="1"><div class="row" style="margin-bottom:2px"><h2 style="margin:0">'+nm+'</h2><span class="sp"></span><button class="ibtn" data-act="pe-close" aria-label="close">✕</button></div>'+
 '<p class="muted small" style="margin:0 0 10px">'+t('الآن: ','Now: ')+sgn(cur)+(k==='x'?' '+t('لكل درس','per lesson'):k==='m'?' '+t('لكل مرة','each time'):'')+'</p>'+
 '<label class="f">'+(neg?t('النقاط المخصومة','Points deducted'):t('النقاط','Points'))+'</label><div class="row" style="flex-wrap:nowrap;align-items:center;gap:8px"><b class="pfx '+(neg?'neg':'pos')+'">'+(neg?'−':'+')+'</b><input type="number" id="pe-v" value="'+Math.abs(cur)+'" min="'+(isC?1:0)+'" max="100" inputmode="numeric" style="width:110px"></div>'+
 '<p class="banner" style="margin:12px 0 0">'+t('يُطبَّق من اليوم (','Applies from today (')+esc(dateLong(today()))+t('). الحصص السابقة تبقى على نقاطها.','). Earlier classes keep their points.')+'</p>'+
 (hist.length?'<p class="muted small" style="margin:8px 0 0">'+t('التغييرات: ','Changes: ')+[pfmt(PDEF[k])].concat(hist.map(function(p){return pfmt(p.v)+' ('+t('من ','from ')+esc(dateLong(p.from))+')';})).join(' → ')+'</p>':'')+
 '<div class="row" style="margin-top:14px"><button class="btn pri sp" data-act="pe-save">'+t('حفظ','Save')+'</button><button class="btn" data-act="pe-close">'+t('إلغاء','Cancel')+'</button></div></div></div>';}
function ruleSheet(){var m=UI.mr,neg=!!m.neg;
 return '<div class="modal" data-act="mr-close"><div class="card sheet" data-stop="1"><div class="row" style="margin-bottom:6px"><h2 style="margin:0">'+t('بند جديد','New rule')+'</h2><span class="sp"></span><button class="ibtn" data-act="mr-close" aria-label="close">✕</button></div>'+
 '<label class="f">'+t('القسم','Section')+'</label><select id="mr-sec" data-act="mrsec" style="width:100%">'+SECS.map(function(s){return '<option value="'+s[0]+'"'+(s[0]===m.sec?' selected':'')+'>'+esc(t(s[1],s[2]))+'</option>';}).join('')+'</select>'+
 '<label class="f" style="margin-top:12px">'+t('النوع','Type')+'</label><div class="radio"><button data-act="mr-type" data-v="plus" class="'+(!neg?'on':'')+'">➕ '+t('مكافأة','Bonus')+'</button><button data-act="mr-type" data-v="minus" class="'+(neg?'on':'')+'">➖ '+t('خصم','Deduction')+'</button></div>'+
 '<label class="f" style="margin-top:12px">'+t('الرمز والاسم والنقاط','Emoji, name and points')+'</label><div class="row" style="flex-wrap:nowrap"><input type="text" id="mr-icon" value="'+esc(m.i||'')+'" placeholder="'+(neg?'⚠️':'⭐')+'" style="width:56px;text-align:center;flex:none"><input type="text" id="mr-name" dir="auto" value="'+esc(m.n||'')+'" placeholder="'+t('مثال: تحضير الدرس','e.g. Lesson prepared')+'" style="flex:1;min-width:0"><input type="number" id="mr-pts" value="'+esc(m.p||'')+'" min="1" max="100" inputmode="numeric" placeholder="'+t('نقاط','pts')+'" style="width:76px;flex:none"></div>'+
 '<p class="muted small" style="margin:10px 0 0">'+t('يظهر البند في «تسجيل الحصة» ويُحتسب من الآن فقط، ولا تتغير الحصص السابقة.','The rule appears in “Record class” and counts from now on; earlier classes don’t change.')+'</p>'+
 '<div class="row" style="margin-top:14px"><button class="btn pri sp" data-act="mr-add">'+t('إضافة البند','Add rule')+'</button><button class="btn" data-act="mr-close">'+t('إلغاء','Cancel')+'</button></div></div></div>';}
function mrKeep(){var g=function(id){var e=document.getElementById(id);return e?e.value:'';};if(UI.mr){UI.mr.i=g('mr-icon');UI.mr.n=g('mr-name');UI.mr.p=g('mr-pts');}}
function vLog(){
 if(!S.groups.length)return vBoard();
 if(!UI.date)UI.date=today();var d=UI.date;var recs=S.sessions[d]||{};
 var gs=S.groups.filter(function(g){return UI.gf==='all'||g.id===UI.gf;});if(!gs.length){UI.gf='all';gs=S.groups;}
 var en=LANG==='en';
 var h='<div class="card"><div class="row"><button class="btn sm" data-act="day" data-v="-1" title="'+t('اليوم السابق','Previous day')+'">'+(en?'←':'→')+'</button><input type="date" data-act="date" value="'+d+'"><button class="btn sm" data-act="day" data-v="1" title="'+t('اليوم التالي','Next day')+'">'+(en?'→':'←')+'</button><span class="muted small">'+esc(dateLong(d))+'</span><span class="sp"></span><select data-act="gf"><option value="all">'+t('كل المجموعات','All groups')+'</option>'+S.groups.map(function(g){return '<option value="'+g.id+'" '+(UI.gf===g.id?'selected':'')+'>'+esc(g.name)+'</option>';}).join('')+'</select><button class="btn sm" data-act="gall">'+(gs.every(function(g){return UI.og[g.id];})?t('طي المجموعات','Collapse groups'):t('فتح المجموعات','Expand groups'))+'</button></div>'+
 '<div class="search"><input type="search" id="q" autocomplete="off" enterkeyhint="search" placeholder="🔍 '+t('ابحث عن طالب…','Search for a student…')+'"><div id="qbox"></div></div>'+
 '<div class="radio" style="margin-top:12px"><button data-act="lm" data-v="stu" class="'+(UI.lm!=='rule'?'on':'')+'">👤 '+t('حسب الطالب','By student')+'</button><button data-act="lm" data-v="rule" class="'+(UI.lm==='rule'?'on':'')+'">📋 '+t('حسب البند','By rule')+'</button></div>'+
 (S.sessions[d]?'<p class="small muted" style="margin:8px 0 0">✓ '+t('هذه الحصة مسجّلة — يمكنك تعديلها.','This class is recorded — you can edit it.')+'</p>':'<p class="small muted" style="margin:8px 0 0">'+t('حصة جديدة. السلوك والمظهر يُحسبان تلقائيًا. حدّد الحضور ومن سمّع، ثم اضغط «حفظ الحصة».','New class. Behaviour and appearance are given automatically. Mark attendance and who recited, then tap “Save class”.')+'</p>')+'</div>';
 var lb2=lastBackup();if(!SY&&Object.keys(S.sessions).length>=3&&(!lb2||(new Date()-toD(lb2))/864e5>30))h+='<div class="banner row"><span class="sp">💾 '+t('لم تحفظ نسخة احتياطية منذ أكثر من شهر.','You haven’t saved a backup in over a month.')+'</span><button class="btn sm" data-act="backup">'+t('احفظ الآن','Back up now')+'</button></div>';
 var ATT=[['p',t('حاضر','Present')],['l',t('متأخر','Late')],['e',t('غائب بعذر','Excused')],['u',t('بدون عذر','Unexcused')]];
  var ATTN={'':t('لم يُحدَّد','Not marked'),p:t('في الوقت','On time'),l:t('متأخر','Late'),e:t('غائب بعذر','Excused'),u:t('غائب بدون عذر','Unexcused')};
 if(UI.lm==='rule')h+=ruleView(gs,recs);else gs.forEach(function(g){var ci=S.groups.indexOf(g);var act=active(g);var sum=0;var cnt={'':0,p:0,l:0,e:0,u:0};var gOpen=!!UI.og[g.id];
  var cards=act.map(function(s){var r=recs[s.id];var x=r||DEF;var p=recPts(x,d);sum+=p.t;cnt[x.a]++;var ab=x.a==='e'||x.a==='u';var so=!!UI.os[s.id];
   var flags=cardFlags(x,d);
   var head='<div class="stu-h" data-act="stog" data-v="'+s.id+'"><span class="nm"><bdi>'+esc(s.name)+'</bdi></span>'+(so?'':'<span class="pill '+x.a+'">'+ATTN[x.a]+'</span>'+flags)+'<span class="sp"></span><span class="pts">'+sgn(p.t)+'</span><span class="chev">'+(so?'▴':'▾')+'</span></div>';
   if(!so)return '<div id="stu-'+s.id+'" class="stu col '+(r?'':'new ')+'">'+head+'<div class="hint">'+t('اضغط على الاسم لفتح خيارات الطالب','Tap the name to open this student’s options')+'</div></div>';
   return '<div id="stu-'+s.id+'" class="stu '+(r?'':'new ')+(ab?'abs':'')+'">'+head+'<div class="hint">'+t('اختر حالة الحضور بضغطة · اضغط على أي خيار لتشغيله أو إلغائه (أخضر = نقاط، أحمر = خصم) · استخدم + و − للبنود المتكررة · اضغط على الاسم لطيّ البطاقة','Tap one attendance status · Tap an option to turn it on or off (green = points, red = deduction) · Use + and − for rules that repeat · Tap the name to fold the card')+'</div>'+
   '<div class="seg">'+ATT.map(function(a){return '<button class="'+a[0]+(x.a===a[0]?' on':'')+'" data-act="set" data-s="'+s.id+'" data-k="a" data-v="'+a[0]+'">'+a[1]+'</button>';}).join('')+'</div>'+
   '<div class="chips">'+cardChips(x,s.id,d,false)+'</div><div class="chips" style="margin-top:8px">'+cardChips(x,s.id,d,true)+'</div></div>';}).join('');
  var allIn=act.length&&!(cnt.e+cnt.u);if(allIn)sum+=PV(UI.date).grp;
  var summ='<span class="gsum">'+(allIn?'<span class="pill p">👥 <span class="num">+'+PV(UI.date).grp+'</span></span>':'')+'<span class="pill p">'+N(cnt.p)+' '+t('في الوقت','on time')+'</span>'+(cnt.l?'<span class="pill l">'+N(cnt.l)+' '+t('متأخر','late')+'</span>':'')+(cnt.e+cnt.u?'<span class="pill u">'+N(cnt.e+cnt.u)+' '+t('غائب','absent')+'</span>':'')+'</span>';
  var allOpen=act.length&&act.every(function(s){return UI.os[s.id];});
  h+='<div class="card grp" style="--gc:'+COLORS[ci%COLORS.length]+'"><div class="row ghead" data-act="gtog" data-v="'+g.id+'"><span class="chev">'+(gOpen?'▾':(LANG==='en'?'▸':'◂'))+'</span><h3><bdi>'+esc(g.name)+'</bdi></h3><span class="muted small">'+sgn(sum)+'</span>'+summ+'<span class="sp"></span>'+(gOpen&&act.length?'<button class="btn sm" data-act="sall" data-v="'+g.id+'">'+(allOpen?t('طي الطلاب','Collapse students'):t('فتح الطلاب','Expand students'))+'</button><button class="btn sm" data-act="allp" data-v="'+g.id+'">'+t('الكل حاضر في الوقت','All on time')+'</button>':'')+'</div>'+
  (!gOpen?'':act.length?'<div class="stus">'+cards+'</div>':'<p class="muted">'+t('لا يوجد طلاب في هذه المجموعة.','No students in this group.')+'</p>')+'</div>';});
 var svd=gs.some(function(g){return active(g).length;})&&gs.every(function(g){return active(g).every(function(s){return !!(recs[s.id]&&recs[s.id].a);});})&&UI.cdirty!==d;h+='<div class="row" style="margin-bottom:14px">'+(svd?'<button class="btn saved" disabled>✓ '+t('تم الحفظ','Saved')+'</button>':'<button class="btn pri" data-act="savesess">💾 '+t('حفظ الحصة','Save class')+'</button>')+(gs.some(function(g){return g.students.some(function(s){return recs[s.id];});})?'<button class="btn danger '+(UI.arm==='del-'+d?'arm':'')+'" data-act="delsess">'+(UI.arm==='del-'+d?t('اضغط مرة أخرى للتأكيد','Tap again to confirm'):'↺ '+(UI.gf==='all'?t('إعادة ضبط الحصة','Reset this class'):t('إعادة ضبط المجموعة','Reset this group')))+'</button>':'')+'</div>';
 h+='<p class="muted small">'+t('لعرض الحصص السابقة أو تعديلها افتح تبويب «الحصص السابقة».','To view or edit earlier classes, open the “Past classes” tab.')+'</p>';
 return h;}

function vPast(){
 if(!S.groups.length)return vBoard();
 var months=monthList();if(!months.some(function(m){return m.k===UI.month;}))UI.month=months[0].k;
 var ds=Object.keys(S.sessions).filter(function(d){return monthKey(d)===UI.month;}).sort().reverse();
 var tot={n:0,p:0,l:0,ab:0,pts:0};
 var cards=ds.map(function(d){var recs=S.sessions[d];var st=0;
  var rows=S.groups.map(function(g,ci){var c={p:0,l:0,e:0,u:0},pts=0,n=0;
   g.students.forEach(function(s){var r=recs[s.id];if(!r)return;n++;c[r.a]++;pts+=recPts(r,d).t;});
   pts+=gBonus(g,d);if(!n)return '';st+=pts;tot.n+=n;tot.p+=c.p;tot.l+=c.l;tot.ab+=c.e+c.u;
   return '<div class="prow" style="--gc:'+COLORS[ci%COLORS.length]+'"><span class="dot"></span><bdi class="sp">'+esc(g.name)+'</bdi><span class="gsum"><span class="pill p">'+N(c.p)+' '+t('في الوقت','on time')+'</span>'+(c.l?'<span class="pill l">'+N(c.l)+' '+t('متأخر','late')+'</span>':'')+(c.e+c.u?'<span class="pill u">'+N(c.e+c.u)+' '+t('غائب','absent')+'</span>':'')+'</span><b>'+sgn(pts)+'</b></div>';}).join('');
  tot.pts+=st;
  return '<div class="card"><div class="row"><h3>'+esc(dateLong(d))+'</h3><span class="sp"></span><span class="muted small">'+t('المجموع','Total')+' '+sgn(st)+'</span><button class="btn sm" data-act="goto" data-v="'+d+'">✏️ '+t('فتح وتعديل','Open & edit')+'</button></div><div class="prows">'+rows+'</div></div>';}).join('');
 var pct=tot.n?Math.round(tot.p/tot.n*100):0;
 var h='<div class="row" style="margin-bottom:12px"><h2 style="margin:0">'+t('الحصص السابقة','Past classes')+'</h2><span class="sp"></span>'+monthSel(months)+'</div>';
 if(!ds.length)return h+'<div class="card empty"><p class="muted">'+t('لا توجد حصص مسجّلة في هذا الشهر.','No classes recorded this month.')+'</p></div>';
 return h+cards;}

function vTests(){
 if(!S.groups.length)return vBoard();
 var months=monthList();if(!months.some(function(m){return m.k===UI.month;}))UI.month=months[0].k;
 var h='<div class="card"><h2>'+t('تسجيل اختبار تجاوز','Record a graduation test')+'</h2><p class="muted small" style="margin-top:-6px">'+t('نجاح '+tMin()+'% فأعلى: '+pfmt(PV().test)+' (أقل من ذلك يُسجّل بدون نقاط)','Pass at '+tMin()+'% or above: '+pfmt(PV().test)+' (below that is recorded with no points)')+'</p><div class="row"><select id="t-s" style="flex:2;min-width:180px"><option value="">'+t('اختر الطالب…','Choose student…')+'</option>'+S.groups.map(function(g){return '<optgroup label="'+esc(g.name)+'">'+active(g).map(function(s){return '<option value="'+s.id+'">'+esc(s.name)+'</option>';}).join('')+'</optgroup>';}).join('')+'</select><input type="date" id="t-d" value="'+today()+'"><input type="number" id="t-p" min="0" max="100" placeholder="'+t('الدرجة %','Score %')+'" style="width:110px"><button class="btn pri" data-act="addtest">'+t('إضافة','Add')+'</button></div></div>';
 var list=S.tests.filter(function(x){return monthKey(x.date)===UI.month;}).sort(function(a,b){return a.date<b.date?1:-1;});
 h+='<div class="card"><div class="row" style="margin-bottom:8px"><h2 style="margin:0">'+t('الاختبارات المسجّلة','Recorded tests')+'</h2><span class="sp"></span>'+monthSel(months)+'</div>'+(list.length?'<ul class="list">'+list.map(function(x){var f=findStu(x.sid);return '<li><span class="sp"><b><bdi>'+esc(f?f.s.name:'—')+'</bdi></b> <span class="muted small">· <bdi>'+esc(f?f.g.name:'')+'</bdi> · '+esc(dateLong(x.date))+'</span></span><span class="num">'+x.score+'%</span><b>'+sgn(testPts(x.score,x.date,x.min))+'</b><button class="btn sm danger" data-act="deltest" data-v="'+x.id+'">'+t('حذف','Delete')+'</button></li>';}).join('')+'</ul>':'<p class="muted">'+t('لا توجد اختبارات في هذا الشهر.','No tests this month.')+'</p>')+'</div>';
 return h;}

function vGroups(){UI.gs=UI.gs||{};
 var h='<div class="card"><h2>'+t('إعدادات المسابقة','Competition settings')+'</h2><div class="grid2"><div><label class="f">'+t('اسم المسابقة','Competition name')+'</label><input type="text" dir="auto" data-act="title" value="'+esc(S.settings.title)+'" style="width:100%"></div><div><label class="f">'+t('التقويم الشهري','Monthly calendar')+'</label><div class="radio"><button class="'+(S.settings.cal==='hijri'?'on':'')+'" data-act="cal" data-v="hijri">'+t('هجري (أم القرى)','Hijri (Umm al-Qura)')+'</button><button class="'+(S.settings.cal==='greg'?'on':'')+'" data-act="cal" data-v="greg">'+t('ميلادي','Gregorian')+'</button></div></div>'+
 '<div><label class="f">'+t('طريقة الترتيب','Ranking method')+'</label><div class="radio"><button class="'+(S.settings.rank==='total'?'on':'')+'" data-act="rank" data-v="total">'+t('مجموع النقاط','Total points')+'</button><button class="'+(S.settings.rank==='avg'?'on':'')+'" data-act="rank" data-v="avg">'+t('متوسط الطالب','Average per student')+'</button></div><p class="muted small" style="margin:4px 0 0">'+t('«متوسط الطالب» أعدل إذا اختلفت أعداد الطلاب بين المجموعات.','“Average per student” is fairer if groups have different numbers of students.')+'</p></div></div></div>';
 S.groups.forEach(function(g,i){var gop=!!UI.gs[g.id];h+='<div class="card grp'+(gop?' open':'')+'" style="--gc:'+COLORS[i%COLORS.length]+'"><div class="ghead" data-act="gset" data-v="'+g.id+'"><span class="gdot"></span><b class="sp"><bdi>'+esc(g.name)+'</bdi></b><span class="muted small">'+N(active(g).length)+' '+t('طالب','students')+'</span><span class="chev">'+(gop?'▾':(LANG==='en'?'▸':'◂'))+'</span></div>';if(!gop){h+='</div>';return;}h+='<div class="row"><input type="text" dir="auto" data-act="gname" data-v="'+g.id+'" value="'+esc(g.name)+'" style="font-weight:700;flex:1;min-width:160px"><button class="btn sm danger '+(UI.arm==='g-'+g.id?'arm':'')+'" data-act="delg" data-v="'+g.id+'">'+(UI.arm==='g-'+g.id?t('تأكيد حذف المجموعة؟','Confirm delete group?'):t('حذف المجموعة','Delete group'))+'</button></div>'+
  '<div class="schips">'+(g.students.length?g.students.map(function(s){return '<button class="schip '+(s.arc?'arc':'')+'" data-act="sopen" data-v="'+s.id+'"><bdi>'+esc(s.name)+'</bdi><span class="sed">✎</span></button>';}).join(''):'<span class="muted small">'+t('لا يوجد طلاب بعد','No students yet')+'</span>')+'</div>'+
  '<textarea id="add-'+g.id+'" dir="auto" placeholder="'+t('أضف طلابًا — اسم في كل سطر','Add students — one name per line')+'" style="min-height:60px"></textarea><div class="row" style="margin-top:6px"><button class="btn sm" data-act="addstu" data-v="'+g.id+'">'+t('إضافة الطلاب','Add students')+'</button><span class="muted small">'+t('اضغط على اسم الطالب لتعديله أو نقله.','Tap a student to rename or move them.')+'</span></div></div>';});
 h+='<div class="card"><h2>➕ '+t('مجموعة جديدة','New group')+'</h2><input type="text" dir="auto" id="ng-name" placeholder="'+t('اسم المجموعة (مثال: مجموعة أبي بكر)','Group name (e.g. Abu Bakr group)')+'" style="width:100%"><label class="f">'+t('أسماء الطلاب (اسم في كل سطر)','Student names (one per line)')+'</label><textarea id="ng-stu" dir="auto"></textarea><div class="row" style="margin-top:8px"><button class="btn pri" data-act="addg">'+t('إضافة المجموعة','Add group')+'</button></div></div>';
 return h+(UI.sm?stuSheet():'');}
function vData(){var h=syncCard();
 var lb=lastBackup();
 h+='<div class="card"><h2>💾 '+t('النسخ الاحتياطي','Backup')+'</h2><p class="muted small">'+t('البيانات محفوظة على هذا الجهاز فقط. احفظ نسخة احتياطية كل شهر (في الملفات أو أرسلها لنفسك في واتساب) حتى لا تضيع إذا تغيّر الجهاز.','Data is stored on this device only. Save a backup every month (to Files, or send it to yourself on WhatsApp) so nothing is lost if the phone changes.')+'</p><p class="small">'+t('آخر نسخة احتياطية: ','Last backup: ')+'<b>'+(lb?esc(dateLong(lb)):t('لا يوجد','never'))+'</b></p><div class="row"><button class="btn pri sp" data-act="backup">⬇️ '+t('حفظ نسخة احتياطية','Save backup file')+'</button><label class="btn sp" style="text-align:center;display:flex;align-items:center;justify-content:center">⬆️ '+t('استعادة من ملف','Restore from file')+'<input type="file" accept=".json,application/json" data-act="restore" style="display:none"></label></div>'+
 '<label class="btn" style="margin-top:8px;display:flex;align-items:center;justify-content:center;text-align:center">➕ '+t('استيراد حصص سابقة (بدون حذف)','Import past classes (keeps everything)')+'<input type="file" accept=".json,application/json" data-act="importf" style="display:none"></label>'+
 '<p class="muted small" style="margin:8px 0 0">'+t('«استعادة» تستبدل كل البيانات. «استيراد» يضيف الحصص والطلاب من الملف ويُبقي كل ما على هذا الجهاز كما هو.','“Restore” replaces all data. “Import” adds the classes and students from the file and keeps everything on this device as it is.')+'</p>'+
 (UI.pendImp?'<div class="banner" style="margin:12px 0 0">'+t('سيُضاف من الملف: ','From the file, this will add: ')+N(UI.pendImp.c.r)+' '+t('سجل حصة','class records')+' · '+N(UI.pendImp.c.t)+' '+t('اختبار','tests')+' · '+N(UI.pendImp.c.s)+' '+t('طالب جديد','new students')+' · '+N(UI.pendImp.c.g)+' '+t('مجموعة جديدة','new groups')+(UI.pendImp.c.k?'<br>'+N(UI.pendImp.c.k)+' '+t('سجل موجود مسبقًا على هذا الجهاز سيبقى كما هو.','records already on this device will stay as they are.'):'')+'<div class="row" style="margin-top:8px"><button class="btn pri" data-act="importok">'+t('إضافة','Add')+'</button><button class="btn" data-act="importcancel">'+t('إلغاء','Cancel')+'</button></div></div>':'')+
 (UI.pending?'<div class="banner" style="margin:12px 0 0">'+t('الملف يحتوي على ','The file has ')+N(UI.pending.groups.length)+' '+t('مجموعات و','groups and ')+N(Object.keys(UI.pending.sessions||{}).length)+' '+t('حصص. سيستبدل البيانات الحالية.',' classes. It will replace the current data.')+'<div class="row" style="margin-top:8px"><button class="btn danger arm" data-act="restoreok">'+t('استبدال البيانات','Replace data')+'</button><button class="btn" data-act="restorecancel">'+t('إلغاء','Cancel')+'</button></div></div>':'')+'</div>';
  return h;}
function smKeep(){var e=document.getElementById('sm-name');if(e&&UI.sm)UI.sm.n=e.value;}
function stuSheet(){var m=UI.sm,f=findStu(m.id);if(!f)return '';var s=f.s,cur=f.g,o=compute(monthKey(today())).byS[s.id],pts=o?o.total:0,tg=m.g||cur.id,tgn=(S.groups.filter(function(x){return x.id===tg;})[0]||cur).name;
 var h='<div class="modal" data-act="sm-close"><div class="card sheet" data-stop="1"><div class="row" style="margin-bottom:2px"><h2 style="margin:0"><bdi>'+esc(s.name)+'</bdi></h2><span class="sp"></span><button class="ibtn" data-act="sm-close" aria-label="close">✕</button></div>'+
 '<p class="muted small" style="margin:0 0 10px"><bdi>'+esc(cur.name)+'</bdi> · '+t('هذا الشهر: ','This month: ')+sgn(pts)+'</p>'+
 '<label class="f">'+t('الاسم','Name')+'</label><input type="text" id="sm-name" dir="auto" value="'+esc(m.n!=null?m.n:s.name)+'" style="width:100%">'+
 '<label class="f" style="margin-top:12px">'+t('المجموعة','Group')+'</label><div class="gpick">'+S.groups.map(function(g,i){return '<button class="'+(g.id===tg?'on':'')+'" style="--gc:'+COLORS[i%COLORS.length]+'" data-act="sm-g" data-v="'+g.id+'"><bdi>'+esc(g.name)+'</bdi></button>';}).join('')+'</div>'+
 (tg!==cur.id?'<p class="banner" style="margin:10px 0 0">'+t('ينتقل الطالب بكل نقاطه وسجلاته (كل الأشهر). هذا الشهر: ','The student moves with all their points and records (every month). This month: ')+'<b>'+sgn(pts)+'</b> '+t('تنتقل من','move from')+' <bdi>'+esc(cur.name)+'</bdi> '+t('إلى','to')+' <bdi>'+esc(tgn)+'</bdi>.</p>':'')+
 '<div class="row" style="margin-top:14px"><button class="btn pri sp" data-act="sm-save">'+(tg!==cur.id?t('حفظ ونقل','Save & move'):t('حفظ','Save'))+'</button><button class="btn" data-act="sm-close">'+t('إلغاء','Cancel')+'</button></div><div class="dz">';
 if(s.arc)h+='<p class="muted small" style="margin:0 0 8px">'+t('هذا الطالب مُزال ولا يظهر في التسجيل.','This student is removed and doesn’t appear in recording.')+'</p><button class="btn" data-act="sm-restore">↺ '+t('إعادة الطالب','Restore student')+'</button>';
 else if(!m.del)h+='<button class="linkd" data-act="sm-del">'+t('إزالة الطالب…','Remove student…')+'</button>';
 else h+='<p class="small" style="margin:0 0 8px">'+t('لن يظهر في تسجيل الحصص. تبقى نقاطه السابقة محسوبة لمجموعته، ويمكن إعادته لاحقًا. للتأكيد اكتب اسمه:','They won’t appear in recording any more. Their past points stay with their group, and they can be restored later. To confirm, type their name:')+'</p><input type="text" id="sm-conf" dir="auto" placeholder="'+esc(s.name)+'" style="width:100%"><div class="row" style="margin-top:8px"><button class="btn danger arm sp" data-act="sm-delok">'+t('إزالة','Remove')+'</button><button class="btn" data-act="sm-delno">'+t('تراجع','Keep')+'</button></div>';
 return h+'</div></div></div>';}

var SECS=[[1,'١- الحضور والانضباط','1. Attendance & punctuality'],[2,'٢- العبادة والصف الأول','2. Worship & the first row'],[3,'٣- السلوك والمظهر','3. Behaviour & appearance'],[4,'٤- التسميع والإتقان','4. Recitation & mastery'],[5,'٥- المبادرات والأثر الإيجابي','5. Initiatives & positive impact'],[6,'٦- الإنجاز الكبير','6. Major achievement'],[7,'٧- المخالفات الجسيمة','7. Serious violations']];
function rSec(r){return r.sec||(r.pts<0?7:5);}
function spName(k){var o=((S.settings.rc||{})[k])||{},z=SPK[k];if(o.name)return o.name;if(k==='test')return t('اختبار التجاوز (نجاح '+tMin()+'% فأعلى)','Graduation test (pass at '+tMin()+'% or above)');return t(z[1][0],z[1][1]);}
function spIcon(k){var o=((S.settings.rc||{})[k])||{};return o.icon||SPK[k][0];}
var SPK={grp:['👥',['حضور جميع الطلاب (للمجموعة في كل حصة)','Every student present (group, per class)']],abs:['🚫',['غياب بدون عذر','Absence without excuse']],on:['⏱️',['عدم التأخر','Arriving on time']],late:['⏳',['خصم عن كل تأخير','Each late arrival']],test:['🌟',['اختبار التجاوز (نجاح 95% فأعلى)','Graduation test (pass at 95% or above)']]};
function vRules(){var ed=!!UI.re,P=PV(),nt=function(a){return '<p class="muted small" style="margin:4px 0 0">'+a+'</p>';};
 var badge=function(sp){var b=[];if(sp.auto)b.push(t('تلقائي للجميع','automatic'));if(sp.mode==='cnt')b.push(t('يتكرر','repeats'));if(sp.mode==='pm')b.push(t('+ و −','+ and −'));if(!sp.core)b.push(t('مضاف','added'));return b.length?' <span class="tag">'+b.join(' · ')+'</span>':'';};
 var row=function(k,icon,name,v,extra,hid){return '<div class="r'+(hid?' rhid':'')+(ed?' redit':'')+'"'+(ed?' data-act="ed-open" data-v="'+k+'"':'')+'><span>'+icon+' <bdi>'+esc(name)+'</bdi>'+(extra||'')+'</span><span class="rend"><b>'+(hid?t('مخفي','hidden'):sgn(v))+'</b>'+(ed?'<span class="sed">✎</span>':'')+'</span></div>';};
 var special={1:['grp','abs','on','late'],6:['test']},notes={5:nt(t('سواء داخل الحلقة أو خارجها أثناء الدوام، ويقيّمها المعلم','Inside the halaqah or outside it during class hours, judged by the teacher')),7:nt(t('وأنتم محشومين بإذن الله','And you are above that, in shā’ Allāh'))};
 var h='<div class="card rules"><div class="row" style="margin-bottom:4px"><h2 style="margin:0">📊 '+t('توزيع نقاط تقييم المجموعات','Group points system')+'</h2><span class="sp"></span><button class="btn sm'+(ed?' pri':'')+'" data-act="redit">'+(ed?'✓ '+t('تم','Done'):'✎ '+t('تعديل البنود','Edit rules'))+'</button></div>'+
  (ed?'<p class="banner small" style="margin:8px 0 0">'+t('اضغط على أي بند لتعديله: الاسم، النقاط، طريقة التسجيل، ومن يحصل عليه. التغييرات تُطبَّق من اليوم، والحصص السابقة لا تتغير.','Tap any rule to edit it: name, points, how it’s marked and who gets it. Changes apply from today; earlier classes don’t change.')+'</p>':'');
 var all=specs(true);
 SECS.forEach(function(sc){var n=sc[0];h+='<h3>'+t(sc[1],sc[2])+'</h3>';
  (special[n]||[]).forEach(function(k){h+=row(k,spIcon(k),spName(k),P[k],k==='on'&&S.settings.attAuto?' <span class="tag">'+t('تلقائي للجميع','automatic')+'</span>':'');});
  all.filter(function(sp){return sp.sec===n&&(ed||!sp.hid);}).forEach(function(sp){h+=row(sp.id,sp.icon,t(sp.ln[0],sp.ln[1]),sp.core?P[sp.id]:sp.pts,badge(sp),sp.hid);});
  h+=notes[n]||'';
  if(ed)h+='<button class="addr" data-act="ed-new" data-v="'+n+'">＋ '+t('إضافة بند هنا','Add a rule here')+'</button>';});
 h+='<p class="muted small" style="margin-top:14px">'+t('ملاحظات التطبيق: الغائب (بعذر أو بدونه) لا تُحتسب له بقية النقاط. الغياب بعذر صفر نقاط. المتأخر يُطبَّق عليه خصم التأخير ولا يأخذ نقاط عدم التأخر. تحصل المجموعة على مكافأة الحضور الكامل في كل حصة يحضرها جميع طلابها (المتأخر يُعدّ حاضرًا). المخالفة الجسيمة تُحتسب في كل الأحوال.','How the app applies these: an absent student (excused or not) gets no other points. An excused absence is 0. A late student gets the late deduction and does not get the on-time points. A group gets the full-attendance bonus for each class where all its students attend (late counts as present). A serious violation counts in every case.')+'</p></div>';
 return h+(UI.ed?ruleEditor():'');}
function edInit(k,sec){var P=PV();if(k==='new')return {k:k,d:{n:'',i:'',p:'',neg:sec===7,mode:'once',auto:false,sec:sec}};
 if(SPK[k]){var v=P[k],o0=((S.settings.rc||{})[k])||{};return {k:k,d:{n:o0.name||'',i:o0.icon||'',p:Math.abs(v),neg:v<0,auto:!!S.settings.attAuto,tm:tMin()}};}
 var sp=specOf(k),v2=sp.core?P[k]:sp.pts,ov=sp.core?((S.settings.rc||{})[k]||{}):null;
 return {k:k,d:{n:sp.core?(ov.name||''):sp.nm[0],i:sp.core?(ov.icon||''):sp.icon,p:Math.abs(v2),neg:v2<0,mode:sp.mode,auto:sp.auto,sec:sp.sec,hid:sp.hid}};}
function edKeep(){var e=UI.ed;if(!e)return;var g=function(id){var x=document.getElementById(id);return x?x.value:null;};var n=g('ed-n'),i=g('ed-i'),p=g('ed-p'),s=g('ed-s'),tm=g('ed-tm');if(tm!==null)e.d.tm=tm;if(n!==null)e.d.n=n;if(i!==null)e.d.i=i;if(p!==null)e.d.p=p;if(s!==null)e.d.sec=+s;}
function opt(act,val,on,ic,ti,ds,dis){return '<button class="opt'+(on?' on':'')+(dis?' dis':'')+'" data-act="'+act+'" data-v="'+val+'"'+(dis?' disabled':'')+'><span class="oic">'+ic+'</span><span class="otx"><b>'+ti+'</b><span>'+ds+'</span></span><span class="ock">'+(on?'●':'○')+'</span></button>';}
function ruleEditor(){var e=UI.ed,d=e.d,k=e.k,isNew=k==='new',spk=SPK[k],sp=(isNew||spk)?null:specOf(k),cd=sp&&sp.core?coreDef(k):null;
 var icon=spk?(d.i||spk[0]):(d.i||(cd?cd[1]:(d.neg?'⚠️':'⭐'))),name=spk?(d.n||(k==='test'?t('اختبار التجاوز','Graduation test'):t(spk[1][0],spk[1][1]))):(d.n||(cd?t(cd[2][0],cd[2][1]):t('بند جديد','New rule'))),pv=(+d.p||0)*(d.neg?-1:1);
 var h='<div class="modal" data-act="ed-close"><div class="card sheet" data-stop="1"><div class="row" style="margin-bottom:6px"><h2 style="margin:0">'+(isNew?t('بند جديد','New rule'):t('تعديل البند','Edit rule'))+'</h2><span class="sp"></span><button class="ibtn" data-act="ed-close" aria-label="close">✕</button></div>'+
  '<div class="preview"><span style="font-size:22px">'+esc(icon)+'</span><b class="sp"><bdi>'+esc(name)+'</bdi></b><span class="pill '+(pv<0?'u':'p')+'">'+pfmt(pv)+'</span></div>';
 if(spk){h+='<p class="muted small" style="margin:0 0 4px">'+t('بند ثابت في النظام: يمكنك تغيير اسمه ورمزه ونقاطه'+(k==='on'?' ومن يحصل عليه':k==='test'?' والدرجة المطلوبة':'')+'.','A built-in rule: you can change its name, emoji and points'+(k==='on'?', and who gets it':k==='test'?', and the score needed':'')+'.')+'</p>';}
 h+='<div class="edh">١. '+t('الاسم والرمز','Name and emoji')+'</div><div class="row" style="flex-wrap:nowrap"><input type="text" id="ed-i" value="'+esc(d.i||'')+'" placeholder="'+esc(spk?spk[0]:cd?cd[1]:(d.neg?'⚠️':'⭐'))+'" style="width:56px;text-align:center;flex:none"><input type="text" id="ed-n" dir="auto" value="'+esc(d.n||'')+'" placeholder="'+esc(spk?(k==='test'?t('اختبار التجاوز','Graduation test'):t(spk[1][0],spk[1][1])):cd?t(cd[2][0],cd[2][1]):t('مثال: تحضير الدرس','e.g. Lesson prepared'))+'" style="flex:1;min-width:0"></div>';
 h+='<div class="edh">٢. '+t('النقاط','Points')+'</div><div class="row" style="flex-wrap:nowrap;align-items:stretch"><div class="radio" style="flex:1"><button data-act="ed-neg" data-v="0" class="'+(!d.neg?'on':'')+'">➕ '+t('مكافأة','Bonus')+'</button><button data-act="ed-neg" data-v="1" class="'+(d.neg?'on':'')+'">➖ '+t('خصم','Deduction')+'</button></div><input type="number" id="ed-p" value="'+esc(d.p)+'" min="0" max="100" inputmode="numeric" style="width:80px;flex:none;text-align:center"></div>';
 if(k==='on')h+='<div class="edh">٣. '+t('من يحصل عليه؟','Who gets it?')+'</div>'+opt('ed-auto','0',!d.auto,'✋',t('المعلم يحدد الحضور','The teacher marks attendance'),t('كل طالب يبدأ «لم يُحدَّد»، وتحدد الحاضر والمتأخر والغائب.','Every student starts as “Not marked”; you mark present, late or absent.'))+opt('ed-auto','1',d.auto,'⚡',t('الجميع في الوقت تلقائيًا','Everyone on time, automatically'),t('كل طالب يبدأ «في الوقت»، وتحدد فقط المتأخر والغائب.','Every student starts as “On time”; you only mark who was late or absent.'));
 if(k==='test')h+='<div class="edh">٣. '+t('الدرجة المطلوبة للنقاط','Score needed for the points')+'</div><div class="row" style="flex-wrap:nowrap;align-items:center;gap:8px"><input type="number" id="ed-tm" value="'+esc(d.tm)+'" min="1" max="100" inputmode="numeric" style="width:90px;text-align:center"><span>%  '+t('فأعلى','or above')+'</span></div>';
 if(!spk){
  h+='<div class="edh">٣. '+t('كيف يُسجَّل؟','How is it marked?')+'</div>'+
   opt('ed-mode','once',d.mode==='once','✓',t('مرة واحدة في الحصة','Once per class'),t('تضغط على الطالب: إما حصل عليه أو لا.','Tap the student: they got it or not.'))+
   opt('ed-mode','cnt',d.mode==='cnt','🔢',t('يتكرر','Can repeat'),t('اضغط + لكل مرة، مثل درسين إضافيين.','Tap + for each time, e.g. two extra lessons.'))+
   opt('ed-mode','pm',d.mode==='pm','±',t('زيادة أو نقص','Up or down'),t('+ لكل مرة، و − إذا لم يُنجَز، مثل درس لم يكتمل.','+ for each time, and − when it isn’t done, e.g. a lesson not completed.'));
  h+='<div class="edh">٤. '+t('من يحصل عليه؟','Who gets it?')+'</div>'+
   opt('ed-auto','0',!d.auto,'✋',t('المعلم يحدده','The teacher marks it'),t('يحصل عليه فقط من تضغط عليه.','Only the students you tap get it.'))+
   opt('ed-auto','1',d.auto,'⚡',t('الجميع تلقائيًا','Everyone, automatically'),d.neg?t('كل طالب حاضر يُخصم منه تلقائيًا، وتضغط على من لا ينطبق عليه.','Every present student gets this deduction; you tap those it doesn’t apply to.'):d.mode!=='once'?t('كل طالب حاضر يبدأ بمرة واحدة، وتستخدم + و − للتعديل.','Every present student starts with one; use + and − to change it.'):t('كل طالب حاضر يحصل عليه، وتضغط على من لم يحققه.','Every present student gets it; you tap those who missed it.'));
  h+='<div class="edh">٥. '+t('القسم','Section')+'</div><select id="ed-s" style="width:100%">'+SECS.map(function(s){return '<option value="'+s[0]+'"'+(s[0]===d.sec?' selected':'')+'>'+esc(t(s[1],s[2]))+'</option>';}).join('')+'</select>';}
 h+='<p class="banner small" style="margin:14px 0 0">'+t('يُطبَّق من اليوم. الحصص السابقة تبقى كما هي.','Applies from today. Earlier classes stay as they are.')+'</p>'+
  '<div class="row" style="margin-top:14px"><button class="btn pri sp" data-act="ed-save">'+(isNew?t('إضافة البند','Add rule'):t('حفظ','Save'))+'</button><button class="btn" data-act="ed-close">'+t('إلغاء','Cancel')+'</button></div>';
 if(sp)h+='<div class="dz">'+(sp.core?'<button class="linkd" data-act="ed-hide">'+(d.hid?'↺ '+t('إظهار هذا البند مرة أخرى','Show this rule again'):t('إخفاء هذا البند','Hide this rule'))+'</button><p class="muted small" style="margin:4px 0 0">'+t('البند المخفي لا يظهر في التسجيل، ونقاطه السابقة تبقى.','A hidden rule doesn’t appear when recording; its past points stay.')+'</p>':
  (e.del?'<p class="small" style="margin:0 0 8px">'+t('سيُحذف البند من التسجيل، وتبقى نقاطه السابقة. متأكد؟','The rule will be removed from recording; its past points stay. Sure?')+'</p><div class="row"><button class="btn danger arm sp" data-act="ed-del">'+t('حذف البند','Delete rule')+'</button><button class="btn" data-act="ed-delno">'+t('تراجع','Keep')+'</button></div>':'<button class="linkd" data-act="ed-del">'+t('حذف هذا البند…','Delete this rule…')+'</button>'))+'</div>';
 return h+'</div></div>';}


/* ---------- actions ---------- */
function touch(){if(UI&&UI.tab==='log')UI.cdirty=UI.date;saveLocal();}
function saveLocal(){try{localStorage.setItem('hc-data',JSON.stringify(S));}catch(e){toast(t('تعذّر الحفظ على الجهاز','Couldn’t save on this device'));}if(SY&&!syApplying){SY.dirty=(SY.dirty||0)+1;saveSY();schedSync();}}
function setRec(sid,patch){var d=UI.date;S.sessions[d]=S.sessions[d]||{};var cur=S.sessions[d][sid]||defCopy();S.sessions[d][sid]=Object.assign(cur,patch);touch();}
function shownGroups(){return S.groups.filter(function(g){return UI.gf==='all'||g.id===UI.gf;});}
function persist(msg){saveLocal();saveUI();toast(msg||t('تم الحفظ ✓','Saved ✓'));}

function doMerge(T,d){var c={g:0,s:0,r:0,k:0,t:0},map={};T.rules=T.rules||[];(d.rules||[]).forEach(function(r){if(!T.rules.some(function(q){return q.id===r.id;}))T.rules.push(r);});
 (d.groups||[]).forEach(function(fg){var g=T.groups.filter(function(x){return x.id===fg.id;})[0]||T.groups.filter(function(x){return norm(x.name)===norm(fg.name);})[0];
  if(!g){g={id:fg.id,name:fg.name,students:[]};T.groups.push(g);c.g++;}
  (fg.students||[]).forEach(function(fs){var s=g.students.filter(function(x){return x.id===fs.id;})[0]||g.students.filter(function(x){return norm(x.name)===norm(fs.name);})[0];
   if(!s){var clash=T.groups.some(function(gg){return gg.students.some(function(x){return x.id===fs.id;});});s={id:clash?uid():fs.id,name:fs.name};if(fs.arc)s.arc=1;g.students.push(s);c.s++;}
   map[fs.id]=s.id;});});
 Object.keys(d.sessions||{}).forEach(function(dt){var recs=d.sessions[dt]||{};Object.keys(recs).forEach(function(sid){var lid=map[sid];if(!lid)return;T.sessions[dt]=T.sessions[dt]||{};if(T.sessions[dt][lid]){c.k++;return;}T.sessions[dt][lid]=recs[sid];c.r++;});});
 (d.tests||[]).forEach(function(x){var lid=map[x.sid];if(!lid)return;if(T.tests.some(function(y){return y.sid===lid&&y.date===x.date&&+y.score===+x.score;}))return;T.tests.push({id:uid(),sid:lid,date:x.date,score:x.score});c.t++;});
 return c;}
function lastBackup(){try{return localStorage.getItem('hc-lastbackup');}catch(e){return null;}}
function dataURLtoFile(u,name){var p=u.split(','),mime=p[0].match(/:(.*?);/)[1],b=atob(p[1]),n=b.length,a=new Uint8Array(n);while(n--)a[n]=b.charCodeAt(n);return new File([a],name,{type:mime});}
function shareFile(file,ttl,onDone){
 try{if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:ttl}).then(onDone,function(e){if(e&&e.name!=='AbortError')dl(file);});return;}}catch(e){}
 dl(file);if(onDone)onDone();}
function dl(file){var u=URL.createObjectURL(file);var a=document.createElement('a');a.href=u;a.download=file.name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(u);a.remove();},1500);}
function doBackup(){var name='halaqah-backup-'+today()+'.json';var f=new File([JSON.stringify(S)],name,{type:'application/json'});
 shareFile(f,t('نسخة احتياطية','Backup'),function(){try{localStorage.setItem('hc-lastbackup',today());}catch(e){}toast(t('تم حفظ النسخة الاحتياطية ✓','Backup saved ✓'));});}
function shareText(s){try{if(navigator.share){navigator.share({text:s}).catch(function(){});return;}}catch(e){}copyText(t('نتائج المسابقة','Competition results'),s);}
function shareImage(){var c=drawReport();shareFile(dataURLtoFile(c.toDataURL('image/png'),'results.png'),t('نتائج المسابقة','Competition results'));}
function drawReport(){
 var M=reportModel();var R=M.rows,top=M.top,avg=M.avg;
 var W=1080,rowH=132,tRow=62,tblH=R.length?96+68+R.length*tRow+40:0,H=330+R.length*rowH+tblH+(top.length?110+top.length*76:0)+(M.week&&R.some(function(r){return r.bonus;})?60:0)+90;
 var c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');var rtl=LANG!=='en';
 var F=function(w,s){return w+' '+s+'px -apple-system,"SF Arabic","SF Pro Display","Noto Sans Arabic","Segoe UI",Tahoma,sans-serif';};
 x.fillStyle='#0f5d4a';x.fillRect(0,0,W,H);
 x.fillStyle='#f2f2f7';rr(x,40,250,W-80,H-290,40);x.fill();
 x.direction=rtl?'rtl':'ltr';var S0=rtl?W-80:80,E0=rtl?80:W-80,al=rtl?'right':'left',ar=rtl?'left':'right';
 x.fillStyle='#fff';x.textAlign=al;x.font=F('800',62);x.fillText(title(),S0,120,W-160);
 x.font=F('500',38);x.fillStyle='rgba(255,255,255,.8)';x.fillText(M.sub,S0,186,W-160);
 var max=Math.max(1,Math.max.apply(null,R.map(function(r){return r.v;})));
 R.forEach(function(r,i){var y=290+i*rowH;var v=r.v;
  x.fillStyle='#fff';rr(x,70,y,W-140,rowH-20,28);x.fill();
  x.font=F('400',54);x.textAlign='center';x.fillStyle='#1c1c1e';x.fillText(i<3?['🥇','🥈','🥉'][i]:String(i+1),rtl?W-140:140,y+76);
  x.textAlign=al;x.font=F('700',42);x.fillStyle='#1c1c1e';x.fillText(r.name+(r.bonus?'  👥':''),rtl?W-200:200,y+62,600);
  x.fillStyle='#ececf0';rr(x,rtl?260:200,y+84,W-460,12,6);x.fill();
  x.fillStyle=r.color;var bw=Math.max(12,(W-460)*Math.max(0,v)/max);rr(x,rtl?260+(W-460)-bw:200,y+84,bw,12,6);x.fill();
  x.textAlign=ar;x.font=F('800',52);x.fillStyle='#0f5d4a';x.fillText(String(v),rtl?110:W-110,y+70);
  x.font=F('500',24);x.fillStyle='#6e6e73';x.fillText(avg?t('متوسط','avg'):t('نقطة','pts'),rtl?110:W-110,y+100);});
 var y=290+R.length*rowH+30;
 if(M.week&&R.some(function(r){return r.bonus;})){x.textAlign=al;x.font=F('500',28);x.fillStyle='#6e6e73';x.fillText('👥 '+t('حضور جميع طلاب المجموعة: +'+PV().grp+' لكل حصة','Every student in the group present: +'+PV().grp+' per class'),S0,y+20,W-160);y+=60;}
 if(R.length){x.textAlign=al;x.font=F('700',40);x.fillStyle='#1c1c1e';x.fillText('📋 '+t('تفاصيل النقاط','Points breakdown'),S0,y+44);y+=76;
  var tx=70,tw=W-140,nameW=250,cw=(tw-nameW-16)/6,hh=68,th=hh+R.length*tRow;
  x.fillStyle='#fff';rr(x,tx,y,tw,th,24);x.fill();
  x.save();rr(x,tx,y,tw,th,24);x.clip();x.fillStyle='#0f5d4a';x.fillRect(tx,y,tw,hh);
  R.forEach(function(r,i){if(i%2){x.fillStyle='#f6f6f9';x.fillRect(tx,y+hh+i*tRow,tw,tRow);}});x.restore();
  var cx=function(k){return rtl?(tx+tw-nameW-(k-0.5)*cw):(tx+nameW+(k-0.5)*cw);};var nx=rtl?tx+tw-28:tx+28;
  var heads=[t('السلوك','Conduct'),t('التسميع','Recite'),t('أخرى','Other'),t('إضافية','Extra'),t('خصم','Deduct'),t('المجموع','Total')];
  x.fillStyle='#fff';x.font=F('700',26);x.textAlign=al;x.fillText(t('المجموعة','Group'),nx,y+43);
  x.textAlign='center';heads.forEach(function(h,k){x.fillText(h,cx(k+1),y+43,cw-8);});
  R.forEach(function(r,i){var yy=y+hh+i*tRow+41,b=r.bd;
   x.textAlign=al;x.font=F('700',28);x.fillStyle='#1c1c1e';x.fillText(r.name,nx,yy,nameW-36);
   x.textAlign='center';x.font=F('500',30);
   [[b.beh,'#1c1c1e'],[b.rec,'#1c1c1e'],[b.oth,'#1c1c1e'],[b.add,'#0f7a5c'],[b.ded,'#d1342b']].forEach(function(p,k){x.fillStyle=p[1];x.fillText(String(p[0]),cx(k+1),yy);});
   x.font=F('800',32);x.fillStyle='#0f5d4a';x.fillText(String(b.tot),cx(6),yy);});
  y+=th+40;}
 if(top.length){x.textAlign=al;x.font=F('700',40);x.fillStyle='#1c1c1e';x.fillText('⭐ '+(M.week?t('أبرز طلاب الأسبوع','Top students this week'):t('أبرز الطلاب','Top students')),S0,y+40);
  top.forEach(function(o,i){var yy=y+100+i*76;x.textAlign=al;x.font=F('600',36);x.fillStyle='#1c1c1e';x.fillText((i+1)+'. '+o.n,S0,yy,560);
   x.font=F('400',28);x.fillStyle='#6e6e73';x.textAlign=ar;x.fillText(o.g+'  ·  '+o.v,E0,yy,330);});}
 x.textAlign='center';x.font=F('500',28);x.fillStyle='#6e6e73';x.fillText(t('بارك الله في الجميع 🌹','May Allah bless everyone 🌹'),W/2,H-70);
 return c;}
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();}
function copyText(ttl,text){var done=function(){toast(t('تم النسخ ✓','Copied ✓'));},fail=function(){UI.modal={title:ttl,text:text};render();};
 try{navigator.clipboard.writeText(text).then(done,fail);}catch(e){fail();}}
function splitNames(v){return v.split(/\n|،|,/).map(function(x){return x.trim();}).filter(Boolean);}

app.addEventListener('click',function(ev){
 var el=ev.target.closest('[data-act]');if(!el)return;
 if(ev.target.closest('[data-stop]')&&el.classList.contains('modal'))return;
 var a=el.dataset.act,v=el.dataset.v,s=el.dataset.s;
 if(el.tagName==='SELECT'||el.tagName==='INPUT')return;
 if(a!=='delsess'&&a!=='delg'&&a!=='rt'&&a!=='delrule'&&a!=='sy-off')UI.arm=null;
 switch(a){
 case 'theme':THEME={auto:'light',light:'dark',dark:'auto'}[THEME];try{localStorage.setItem('hc-theme',THEME);}catch(e){}applyTheme();toast(t('المظهر: ','Theme: ')+({auto:t('تلقائي (حسب الجهاز)','Auto (follows device)'),light:t('فاتح','Light'),dark:t('داكن','Dark')})[THEME]);return;
 case 'lang':LANG=LANG==='en'?'ar':'en';try{localStorage.setItem('hc-lang',LANG);}catch(e){}break;
 case 'tab':UI.tab=v;if(v!=='log'&&v!=='board')UI.sub=v;saveUI();resetScroll=true;break;
 case 'rep':UI.rep=v;saveUI();break;
 case 'lm':UI.lm=v;saveUI();break;
 case 'rall':var RA=ruleOf(el.dataset.k);if(!RA)return;var sel=v==='sel';if(sel&&rNeg(RA))return;shownGroups().forEach(function(gA){active(gA).forEach(function(st){var x=(S.sessions[UI.date]||{})[st.id]||DEF;if(sel&&(x.a==='e'||x.a==='u')&&RA[1]!=='att')return;if(sel&&RA[1]==='att'&&x.a)return;if(rMarked(RA,x)===sel)return;
   if(RA[1]==='att')setRec(st.id,{a:sel?RA[0]:''});else if(RA[1]==='off')setRec(st.id,valPatch(RA[7],x,sel?0:1));else setRec(st.id,valPatch(RA[7],x,sel?1:0));});});UI.arm=null;break;
 case 'sopen':UI.sm={id:v};break;
 case 'sm-close':UI.sm=null;break;
 case 'sm-g':smKeep();UI.sm.g=v;break;
 case 'sm-del':smKeep();UI.sm.del=true;break;
 case 'sm-delno':UI.sm.del=false;break;
 case 'sm-delok':var fd=findStu(UI.sm.id),cv=(document.getElementById('sm-conf')||{}).value||'';if(!fd||!cv.trim()||norm(cv).trim()!==norm(fd.s.name).trim()){toast(t('اكتب اسم الطالب كما هو للتأكيد','Type the student’s name exactly to confirm'));return;}fd.s.arc=1;UI.sm=null;touch();toast(t('أُزيل الطالب','Student removed'));break;
 case 'sm-restore':var fr=findStu(UI.sm.id);if(fr)delete fr.s.arc;UI.sm=null;touch();toast(t('أُعيد الطالب ✓','Student restored ✓'));break;
 case 'sm-save':smKeep();var fs=findStu(UI.sm.id);if(!fs){UI.sm=null;break;}var nn=String(UI.sm.n==null?fs.s.name:UI.sm.n).trim();if(!nn){toast(t('اكتب اسم الطالب','Enter a name'));return;}var chg=false;if(nn!==fs.s.name){fs.s.name=nn;chg=true;}var tgt=S.groups.filter(function(x){return x.id===UI.sm.g;})[0];if(tgt&&tgt!==fs.g){fs.g.students=fs.g.students.filter(function(x){return x.id!==fs.s.id;});tgt.students.push(fs.s);chg=true;}UI.sm=null;if(chg){touch();toast(tgt&&tgt!==fs.g?t('نُقل الطالب ✓','Student moved ✓'):t('تم الحفظ ✓','Saved ✓'));}break;
 case 'pe-open':UI.pe={k:v};break;
 case 'pe-close':UI.pe=null;break;
 case 'pe-save':var pk=UI.pe.k,pin=document.getElementById('pe-v'),pn=Math.round(+(pin?pin.value:NaN)),pc=pk.indexOf('c:')===0,td=today();if(!(pn>=(pc?1:0)&&pn<=100)){toast(pc?t('اكتب رقمًا من 1 إلى 100','Enter a number from 1 to 100'):t('اكتب رقمًا من 0 إلى 100','Enter a number from 0 to 100'));return;}
  if(pc){var rc=(S.rules||[]).filter(function(q){return q.id===pk.slice(2);})[0];if(rc){var nv=rc.pts<0?-pn:pn;if(nv!==rc.pts){rc.pts=nv;Object.keys(S.sessions).forEach(function(dd){if(dd<td)return;var rs=S.sessions[dd];Object.keys(rs).forEach(function(q){if(rs[q].cx&&rs[q].cx[rc.id]!==undefined)rs[q].cx[rc.id]=nv;});});touch();toast(t('تم تغيير النقاط من اليوم ✓','Points changed from today ✓'));}}}
  else{var nv2=PNEG[pk]?-pn:pn;if(nv2!==PV()[pk]){S.settings.pv=(S.settings.pv||[]).filter(function(p){return !(p.k===pk&&p.from===td);}).concat([{k:pk,v:nv2,from:td}]);touch();toast(t('تم تغيير النقاط من اليوم ✓','Points changed from today ✓'));}}
  UI.pe=null;break;
 case 'sy-on':if(!S.groups.length&&!Object.keys(S.sessions).length){toast(t('هذا الجهاز فارغ — ألصق رمز الجهاز الآخر في الخانة رقم ١','This device is empty — paste the code from your other device in box 1'));return;}SY={code:newCode(),rev:0,dirty:1};saveSY();UI.syc=true;syncNow();break;
 case 'sy-show':UI.syc=!UI.syc;break;
 case 'sy-copy':try{navigator.clipboard.writeText(fmtCode(SY.code)).then(function(){toast(t('نُسخ الرمز ✓','Code copied ✓'));});}catch(e){}return;
 case 'sy-now':if(SY){SY.err=null;syncNow();}return;
 case 'sy-off':UI.syoff=true;break;
 case 'sy-offc':UI.syoff=false;break;
 case 'sy-offk':SY=null;saveSY();UI.syoff=false;UI.syc=false;toast(t('أُوقفت المزامنة، والبيانات باقية على هذا الجهاز','Sync is off; the data stays on this device'));break;
 case 'sy-offr':clearTimeout(syT);SY=null;saveSY();UI.syoff=false;UI.syc=false;UI.og={};UI.os={};UI.gs={};UI.gf='all';UI.month=null;applyS({},true);toast(t('أُوقفت المزامنة وحُذفت البيانات من هذا الجهاز','Sync is off and this device is now empty'));break;
 case 'sy-cancel':UI.syj=null;break;
 case 'sy-join':var jc=cleanCode((document.getElementById('sy-in')||{}).value);if(SY&&jc===SY.code){toast(t('هذا الجهاز مربوط بهذا الرمز بالفعل ✓','This device already uses this code ✓'));return;}if(jc.length!==20){toast(t('الرمز يتكون من 20 حرفًا ورقمًا','The code has 20 letters and digits'));return;}if(!navigator.onLine){toast(t('يحتاج الربط إلى إنترنت','Connecting needs the internet'));return;}
  rpc('hc_pull',{p_code:jc}).then(function(r){if(!r.found){toast(t('لا توجد بيانات لهذا الرمز','No data found for this code'));return;}
   if(!Object.keys(S.sessions).length&&!S.groups.length){SY={code:jc,rev:r.rev,dirty:0,at:Date.now()};saveSY();applyS(r.data,true);toast(t('تم الربط ✓','Connected ✓'));}
   else{UI.syj={code:jc,rev:r.rev,data:r.data};render();}}).catch(function(){toast(t('تعذّر الاتصال، حاول مرة أخرى','Couldn’t connect, try again'));});return;
 case 'sy-rep':var jr=UI.syj;UI.syj=null;SY={code:jr.code,rev:jr.rev,dirty:0,at:Date.now()};saveSY();applyS(jr.data,true);toast(t('تم الربط ✓','Connected ✓'));return;
 case 'sy-comb':var jm=UI.syj;UI.syj=null;SY={code:jm.code,rev:jm.rev,dirty:1};saveSY();applyS(syncMerge(S,jm.data),false);toast(t('تم الدمج والربط ✓','Combined and connected ✓'));return;
 case 'gset':UI.gs=UI.gs||{};UI.gs[v]=!UI.gs[v];break;
 case 'radj':UI.ra=UI.ra===v?null:v;break;
 case 'adj':var ak=el.dataset.k,as=el.dataset.s,dv=+v,cr4=(S.sessions[UI.date]||{})[as]||DEF,b4=rBase(ak,cr4,PV(UI.date)),A4=Object.assign({},cr4.adj||{}),n4=(A4[ak]||0)+dv,lim=Math.abs(b4)||1;if(n4>lim||n4<-lim){toast(t('هذا أقصى تعديل لهذا البند','That’s the most this rule can be adjusted'));return;}if(n4)A4[ak]=n4;else delete A4[ak];setRec(as,{adj:A4});break;
 case 'sy-view':if(!SY)return;if(!SY.rev){toast(t('انتظر حتى تكتمل المزامنة ثم حاول مرة أخرى','Wait for the sync to finish, then try again'));return;}rpc('hc_view_code',{p_code:SY.code}).then(function(c){SY.view=c;saveSY();if(!S.settings.view){S.settings.view=true;touch();}pushView();render();}).catch(function(){toast(t('تعذّر الاتصال، حاول مرة أخرى','Couldn’t connect, try again'));});return;
 case 'sy-vcopy':try{navigator.clipboard.writeText(viewURL(SY.view)).then(function(){toast(t('نُسخ الرابط ✓','Link copied ✓'));});}catch(e){}return;
 case 'sy-vshare':try{navigator.share({title:title(),url:viewURL(SY.view)});}catch(e){}return;
 case 'sy-ded':S.settings.showDed=v==='1';touch();break;
 case 'ed-open':UI.ed=edInit(v);break;
 case 'ed-new':UI.ed=edInit('new',+v);break;
 case 'ed-close':UI.ed=null;break;
 case 'ed-neg':edKeep();UI.ed.d.neg=v==='1';break;
 case 'ed-mode':edKeep();UI.ed.d.mode=v;break;
 case 'ed-auto':edKeep();UI.ed.d.auto=v==='1';break;
 case 'ed-delno':UI.ed.del=false;break;
 case 'ed-del':if(UI.ed.del){(S.rules||[]).forEach(function(q){if(q.id===UI.ed.k)q.arc=1;});UI.ed=null;touch();toast(t('حُذف البند','Rule deleted'));}else{edKeep();UI.ed.del=true;}break;
 case 'ed-hide':var hk=UI.ed.k,rc0=Object.assign({},S.settings.rc||{});rc0[hk]=Object.assign({},rc0[hk]||{});if(rc0[hk].hid)delete rc0[hk].hid;else rc0[hk].hid=1;S.settings.rc=rc0;UI.ed=null;touch();toast(rc0[hk].hid?t('أُخفي البند','Rule hidden'):t('أُظهر البند','Rule shown again'));break;
 case 'ed-save':edKeep();var E=UI.ed,Dd=E.d,ek2=E.k,isC=!SPK[ek2]&&ek2!=='new'&&CK.indexOf(ek2)<0,pp=Math.round(+Dd.p),td2=today();
  if(!(pp>=(ek2==='new'||isC?1:0)&&pp<=100)){toast(t('اكتب عدد النقاط (من 1 إلى 100)','Enter the points (1 to 100)'));return;}
  var sv=Dd.neg?-pp:pp,pvSet=function(k){if(sv!==PV()[k])S.settings.pv=(S.settings.pv||[]).filter(function(p){return !(p.k===k&&p.from===td2);}).concat([{k:k,v:sv,from:td2}]);};
  if(SPK[ek2]){if(ek2==='test'){var tmv=Math.round(+Dd.tm);if(!(tmv>=1&&tmv<=100)){toast(t('اكتب درجة من 1 إلى 100','Enter a score from 1 to 100'));return;}S.settings.testMin=tmv;}if(ek2==='on')S.settings.attAuto=!!Dd.auto;var rcs=Object.assign({},S.settings.rc||{}),os={};if((Dd.n||'').trim())os.name=Dd.n.trim();if((Dd.i||'').trim())os.icon=Dd.i.trim();if(Object.keys(os).length)rcs[ek2]=os;else delete rcs[ek2];S.settings.rc=rcs;pvSet(ek2);}
  else if(ek2==='new'){var nm2=(Dd.n||'').trim();if(!nm2){toast(t('اكتب اسم البند','Enter a rule name'));return;}S.rules=S.rules||[];S.rules.push({id:'c'+uid(),name:nm2,icon:(Dd.i||'').trim()||(Dd.neg?'⚠️':'⭐'),pts:sv,sec:Dd.sec,mode:Dd.mode,auto:!!Dd.auto});}
  else if(!isC){var cd2=coreDef(ek2),o9={},prev=(S.settings.rc||{})[ek2]||{};if((Dd.n||'').trim())o9.name=Dd.n.trim();if((Dd.i||'').trim())o9.icon=Dd.i.trim();if(Dd.mode!==cd2[4])o9.mode=Dd.mode;if(!!Dd.auto!==!!cd2[5])o9.auto=Dd.auto?1:0;if(Dd.sec!==cd2[6])o9.sec=Dd.sec;if(prev.hid)o9.hid=1;var rc1=Object.assign({},S.settings.rc||{});if(Object.keys(o9).length)rc1[ek2]=o9;else delete rc1[ek2];S.settings.rc=rc1;pvSet(ek2);}
  else{var rq=(S.rules||[]).filter(function(q){return q.id===ek2;})[0];if(rq){var nm3=(Dd.n||'').trim();if(!nm3){toast(t('اكتب اسم البند','Enter a rule name'));return;}rq.name=nm3;rq.icon=(Dd.i||'').trim()||rq.icon;rq.sec=Dd.sec;rq.mode=Dd.mode;rq.auto=!!Dd.auto;
   if(sv!==rq.pts){var old=rq.pts;rq.pts=sv;Object.keys(S.sessions).forEach(function(dd){if(dd<td2)return;var rs=S.sessions[dd];Object.keys(rs).forEach(function(q){var c=rs[q].cx;if(c&&c[rq.id]!==undefined){var n=rq.mode==='once'?1:Math.round(c[rq.id]/old)||1;c[rq.id]=n*sv;}});});}}}
  UI.ed=null;touch();toast(t('حُفظ البند ✓','Rule saved ✓'));break;
 case 'redit':UI.re=!UI.re;UI.mr=null;UI.ed=null;UI.arm=null;break;
 case 'addr-open':UI.mr={sec:+v,neg:+v===7};break;
 case 'mr-close':UI.mr=null;break;
 case 'mr-type':mrKeep();UI.mr.neg=v==='minus';break;
 case 'mr-add':mrKeep();var mm=UI.mr,nm1=(mm.n||'').trim(),pp1=Math.round(+mm.p);if(!nm1||!(pp1>0)){toast(t('اكتب اسم البند وعدد النقاط','Enter a rule name and points'));return;}pp1=Math.min(100,pp1);S.rules=S.rules||[];S.rules.push({id:'c'+uid(),name:nm1,icon:(mm.i||'').trim()||(mm.neg?'⚠️':'⭐'),pts:mm.neg?-pp1:pp1,sec:mm.sec});UI.mr=null;touch();toast(t('أُضيف البند ✓','Rule added ✓'));return;
 case 'delrule':if(UI.arm==='r-'+v){(S.rules||[]).forEach(function(q){if(q.id===v)q.arc=1;});UI.arm=null;touch();}else UI.arm='r-'+v;break;
 case 'rhead':var wasO=UI.ro[v];UI.ro={};if(!wasO)UI.ro[v]=1;saveUI();break;
 case 'rt':var rk=el.dataset.k,RD=ruleOf(rk),cr=(S.sessions[UI.date]||{})[s]||DEF;if(!RD)return;
  if(RD[1]==='att'){setRec(s,{a:cr.a===rk?'':rk});}
  else if(rk==='v'&&RD[1]==='on'){if(+cr.v){setRec(s,{v:0});UI.arm=null;}else if(UI.arm==='v-'+s){setRec(s,{v:1});UI.arm=null;}else{UI.arm='v-'+s;}}
  else{var spr=RD[7];setRec(s,valPatch(spr,cr,getVal(spr,cr)?0:1));}
  var nr5=(S.sessions[UI.date]||{})[s];if(nr5&&nr5.adj&&nr5.adj[rk]!==undefined&&!adjOn(rk,nr5)){delete nr5.adj[rk];touch();}
  if(rk!=='v')UI.arm=null;break;
 case 'pick':var pf=findStu(v);if(!pf)return;UI.lm='stu';UI.og[pf.g.id]=1;UI.os[v]=1;if(UI.gf!=='all'&&UI.gf!==pf.g.id)UI.gf='all';saveUI();render();setTimeout(function(){var ce=document.getElementById('stu-'+v);if(ce){ce.scrollIntoView({block:'center',behavior:'smooth'});ce.classList.add('flash');setTimeout(function(){ce.classList.remove('flash');},1800);}},40);return;
 case 'toggle':UI.open[v]=!UI.open[v];saveUI();break;
 case 'save':persist();return;
 case 'closemodal':UI.modal=null;break;
 case 'copywa':copyText(t('نتائج المسابقة','Competition results'),waText());return;
 case 'backup':doBackup();return;
 case 'shareimg':shareImage();return;
 case 'sharetxt':shareText(waText());return;
 case 'restoreok':if(UI.pending){S=UI.pending;S.groups=S.groups||[];S.rules=S.rules||[];S.sessions=S.sessions||{};S.tests=S.tests||[];S.settings=Object.assign({title:DEF_TITLE,cal:'hijri',rank:'total'},S.settings||{});UI.pending=null;UI.month=null;persist(t('تمت الاستعادة ✓','Restored ✓'));}break;
 case 'restorecancel':UI.pending=null;break;
 case 'importok':if(UI.pendImp){S=UI.pendImp.T;var ic=UI.pendImp.c;UI.pendImp=null;UI.month=null;persist(t('تمت الإضافة ✓ ','Added ✓ ')+ic.r+' '+t('سجل','records'));}break;
 case 'importcancel':UI.pendImp=null;break;
 case 'day':UI.date=addDays(UI.date||today(),+v);saveUI();break;
 case 'goto':UI.date=v;UI.tab='log';saveUI();resetScroll=true;break;
 case 'set':setRec(s,{a:v});break;
 case 'tg':var cur=(S.sessions[UI.date]||{})[s]||DEF;var o={};var cv=cur[el.dataset.k];if(el.dataset.k==='pc'&&cv===undefined)cv=1;o[el.dataset.k]=cv?0:1;setRec(s,o);break;
 case 'ex':var c2=(S.sessions[UI.date]||{})[s]||DEF,ek=el.dataset.k||'x',spx=specOf(ek);if(!spx)return;setRec(s,valPatch(spx,c2,Math.min(20,Math.max(spx.mode==='pm'?-5:0,getVal(spx,c2)+(+v)))));break;
 case 'gtog':if(ev.target.closest('button')&&ev.target.closest('button')!==el)return;if(UI.og[v])delete UI.og[v];else UI.og[v]=1;saveUI();break;
 case 'stog':if(UI.os[v])delete UI.os[v];else UI.os[v]=1;saveUI();break;
 case 'gall':var go=shownGroups().every(function(g){return UI.og[g.id];});shownGroups().forEach(function(g){if(go)delete UI.og[g.id];else UI.og[g.id]=1;});saveUI();break;
 case 'sall':var sg=S.groups.filter(function(x){return x.id===v;})[0];var so=active(sg).every(function(st){return UI.os[st.id];});active(sg).forEach(function(st){if(so)delete UI.os[st.id];else UI.os[st.id]=1;});saveUI();break;
 case 'allp':var g=S.groups.filter(function(x){return x.id===v;})[0];if(g)active(g).forEach(function(st){var xr=(S.sessions[UI.date]||{})[st.id];if(!xr||!xr.a)setRec(st.id,{a:'p'});});break;
 case 'savesess':var d=UI.date;S.sessions[d]=S.sessions[d]||{};shownGroups().forEach(function(g){active(g).forEach(function(st){if(!S.sessions[d][st.id])S.sessions[d][st.id]=defCopy();});});UI.cdirty=null;var unm=0;shownGroups().forEach(function(g){active(g).forEach(function(st){if(!S.sessions[d][st.id].a)unm++;});});persist(unm?t('حُفظت الحصة — '+unm+' طالب بدون حضور محدَّد','Class saved — '+unm+' student(s) have no attendance marked'):t('تم حفظ الحصة ✓','Class saved ✓'));render();return;
 case 'delsess':if(UI.arm==='del-'+UI.date){var dd=UI.date;shownGroups().forEach(function(g){g.students.forEach(function(st){if(S.sessions[dd])delete S.sessions[dd][st.id];});});if(S.sessions[dd]&&!Object.keys(S.sessions[dd]).length)delete S.sessions[dd];UI.arm=null;touch();toast(t('تمت إعادة الضبط — عادت العلامات الافتراضية','Reset — back to the default marks'));return;}else UI.arm='del-'+UI.date;break;
 case 'addtest':var sid=document.getElementById('t-s').value,td=document.getElementById('t-d').value,sc=document.getElementById('t-p').value;
  if(!sid||!td||sc===''){toast(t('اختر الطالب واكتب الدرجة','Choose a student and enter the score'));return;}sc=Math.max(0,Math.min(100,+sc));S.tests.push({id:uid(),sid:sid,date:td,score:sc,min:tMin()});UI.month=monthKey(td);touch();break;
 case 'deltest':S.tests=S.tests.filter(function(x){return x.id!==v;});touch();break;
 case 'cal':S.settings.cal=v;UI.month=null;touch();break;
 case 'rank':S.settings.rank=v;touch();break;
 case 'addg':var nm=document.getElementById('ng-name').value.trim();if(!nm){toast(t('اكتب اسم المجموعة','Enter a group name'));return;}
  S.groups.push({id:uid(),name:nm,students:splitNames(document.getElementById('ng-stu').value).map(function(n){return{id:uid(),name:n};})});touch();break;
 case 'addstu':var gg=S.groups.filter(function(x){return x.id===v;})[0];var ls=splitNames(document.getElementById('add-'+v).value);
  if(!ls.length)return;ls.forEach(function(n){gg.students.push({id:uid(),name:n});});touch();break;
 case 'arc':case 'unarc':var f=findStu(v);if(f){if(a==='arc')f.s.arc=1;else delete f.s.arc;touch();}break;
 case 'delg':if(UI.arm==='g-'+v){S.groups=S.groups.filter(function(x){return x.id!==v;});UI.arm=null;touch();}else UI.arm='g-'+v;break;
 }
 render();});
app.addEventListener('input',function(ev){var el=ev.target;if(el.id!=='q')return;var box=document.getElementById('qbox');if(box)box.innerHTML=searchHTML(el.value);});
app.addEventListener('keydown',function(ev){if(ev.target.id==='q'&&ev.key==='Escape'){ev.target.value='';var box=document.getElementById('qbox');if(box)box.innerHTML='';}});
app.addEventListener('change',function(ev){var el=ev.target;var a=el.dataset.act;if(!a)return;
 if(a==='mrsec'){mrKeep();UI.mr.sec=+el.value;if(UI.mr.sec===7)UI.mr.neg=true;render();return;}
 if(a==='importf'){var f2=el.files&&el.files[0];if(!f2)return;var rd2=new FileReader();rd2.onload=function(){try{var d=JSON.parse(rd2.result);if(!d||!Array.isArray(d.groups))throw 0;var T=JSON.parse(JSON.stringify(S));var c=doMerge(T,d);UI.pendImp={T:T,c:c};UI.pending=null;render();}catch(e){toast(t('هذا الملف ليس نسخة احتياطية صالحة','That file isn’t a valid backup'));}};rd2.readAsText(f2);el.value='';return;}
 if(a==='restore'){var f=el.files&&el.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){try{var d=JSON.parse(rd.result);if(!d||!Array.isArray(d.groups))throw 0;UI.pending=d;render();}catch(e){toast(t('هذا الملف ليس نسخة احتياطية صالحة','That file isn’t a valid backup'));}};rd.readAsText(f);el.value='';return;}
 if(a==='month'){UI.month=el.value;saveUI();}
 else if(a==='date'){if(el.value)UI.date=el.value;saveUI();}
 else if(a==='gf'){UI.gf=el.value;saveUI();}
 else if(a==='title'){S.settings.title=el.value.trim()||DEF_TITLE;touch();}
 else if(a==='gname'){var g=S.groups.filter(function(x){return x.id===el.dataset.v;})[0];if(g&&el.value.trim()){g.name=el.value.trim();touch();}}
 else return;
 render();});

capReady=true;
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
window.addEventListener('online',function(){schedSync(200);});document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')schedSync(200);});setInterval(function(){if(document.visibilityState==='visible')schedSync(0);},60000);
render();schedSync(400);
})();
