(function(){
"use strict";
var S={};try{S=JSON.parse(localStorage.getItem('hc-data')||'{}')||{};}catch(e){S={};}
var LS_OK=true;try{localStorage.setItem('hc-t','1');localStorage.removeItem('hc-t');}catch(e){LS_OK=false;}
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
S.groups=S.groups||[];S.sessions=S.sessions||{};S.tests=S.tests||[];
var DEF_TITLE='مسابقة الحلقة الشهرية';
S.settings=Object.assign({title:DEF_TITLE,cal:'hijri',rank:'total'},S.settings||{});
var FONT='<meta name="theme-color" content="#f2f2f7"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default">';
var ART=null,capReady=false,ro=false,dirty=false,publishing=false,saving=false;
var COLORS=['#0f766e','#b45309','#7c3aed','#be123c','#1d4ed8','#4d7c0f','#0e7490','#a21caf'];
var DEF={a:'p',b:1,ap:1,r:1,x:0,f:0,fr:0,ini:0,v:0};
var app=document.getElementById('app');
var UI={tab:'log',sub:'past',month:null,date:null,gf:'all',open:{},og:{},os:{},arm:null,modal:null};
try{var sv=JSON.parse(sessionStorage.getItem('hc-ui')||'null');if(sv)Object.assign(UI,sv,{arm:null,modal:null});}catch(e){}
UI.og=UI.og||{};UI.os=UI.os||{};delete UI.cg;
function saveUI(){try{sessionStorage.setItem('hc-ui',JSON.stringify({rep:UI.rep,sub:UI.sub,tab:UI.tab,month:UI.month,date:UI.date,gf:UI.gf,open:UI.open,og:UI.og,os:UI.os}));}catch(e){}}

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
function testPts(sc){sc=+sc;return sc>=95?10:0;}
function gBonus(g,d){var recs=S.sessions[d]||{},any=false,all=true;g.students.forEach(function(s){var x=recs[s.id];if(!x)return;any=true;if(x.a!=='p'&&x.a!=='l')all=false;});return any&&all?5:0;}
function recPts(r){var o={att:0,ba:0,rec:0,t:0};if(!r)return o;
 if(r.a==='u'){o.att=-2;}else if(r.a==='e'){}else{o.att=r.a==='l'?-1:5;o.ba=(r.b?3:0)+(r.ap?3:0)+(r.fr?1:0)+(r.ini?1:0);o.rec=(r.r?5:0)+(+r.x||0)+(r.f?1:0);}
 if(r.v)o.ba-=50;
 o.t=o.att+o.ba+o.rec;return o;}
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
  Object.keys(recs).forEach(function(sid){var o=byS[sid];if(!o)return;var p=recPts(recs[sid]);o.att+=p.att;o.ba+=p.ba;o.rec+=p.rec;o.days++;});});
 S.tests.forEach(function(x){if(monthKey(x.date)!==mk)return;var o=byS[x.sid];if(o){o.ach+=testPts(x.score);o.tests.push(x);}});
 var td=today();
 G.forEach(function(r){
   r.days=0;r.full=0;Object.keys(S.sessions).forEach(function(d){if(monthKey(d)!==mk)return;if(!r.g.students.some(function(s){return S.sessions[d][s.id];}))return;r.days++;var gb=gBonus(r.g,d);if(gb){r.full++;r.week+=gb;}});
  r.stu.forEach(function(o){o.total=o.att+o.ba+o.rec+o.ach;r.att+=o.att;r.ba+=o.ba;r.rec+=o.rec;r.ach+=o.ach;});
  r.total=r.att+r.ba+r.rec+r.ach+r.week;r.n=r.stu.filter(function(o){return o.days||o.ach;}).length||active(r.g).length||1;r.avg=Math.round(r.total/r.n*10)/10;
  r.stu.sort(function(a,b){return b.total-a.total;});});
 return {groups:G,byS:byS};}

/* ---------- render ---------- */
var STAR='<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><g fill="currentColor"><rect x="9" y="9" width="22" height="22" rx="2"/><rect x="9" y="9" width="22" height="22" rx="2" transform="rotate(45 20 20)"/></g><circle cx="20" cy="20" r="6" fill="var(--card)"/><circle cx="20" cy="20" r="3" fill="var(--gold)"/></svg>';
function tabs(){return [['board','🏆 '+t('الترتيب','Leaderboard')],['log','📝 '+t('تسجيل الحصة','Record class')],['past','🗂️ '+t('الحصص السابقة','Past classes')],['tests','🌟 '+t('اختبارات التجاوز','Graduation tests')],['groups','👥 '+t('المجموعات والإعدادات','Groups & settings')],['rules','📊 '+t('القواعد','Rules')]];}
function render(){
 document.documentElement.lang=LANG;document.documentElement.dir=LANG==='en'?'ltr':'rtl';
 if(ro&&['log','past','tests','groups'].indexOf(UI.tab)>=0)UI.tab='board';
 var thIcon={auto:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',light:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',dark:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>'}[THEME];
 var h='<div class="scroller"><div class="wrap"><header class="top"><div class="brand">'+STAR+'<div><h1><bdi>'+esc(title())+'</bdi></h1><div class="sub">'+esc(dateLong(today()))+'</div></div></div><div class="hbtns">'+(ro?'<span class="badge">'+t('عرض فقط','View only')+'</span>':'')+'<button class="ibtn" data-act="theme" title="'+t('المظهر: ','Theme: ')+({auto:t('تلقائي','Auto'),light:t('فاتح','Light'),dark:t('داكن','Dark')})[THEME]+'">'+thIcon+'</button><button class="ibtn lang" data-act="lang" title="'+t('English','العربية')+'">'+(LANG==='en'?'ع':'EN')+'</button></div></header>';
 if(!LS_OK)h+='<div class="banner">'+t('تعذّر الوصول إلى التخزين على هذا الجهاز — لن تُحفظ البيانات. افتح التطبيق في Safari أو Chrome العادي.','Storage isn’t available on this device, so data won’t be saved. Open the app in regular Safari or Chrome.')+'</div>';
 if(false)h+='<div class="banner">'+t('وضع المعاينة: يمكنك التجربة، لكن التعديلات لن تُحفظ هنا. افتح الصفحة من رابطها للحفظ.','Preview mode: you can try things out, but changes won’t be saved here. Open the page from its link to save.')+'</div>';
 var subs=tabs().filter(function(x){return ro?(x[0]==='board'||x[0]==='rules'):(x[0]!=='log'&&x[0]!=='board');});
 var inSet=!ro&&UI.tab!=='log'&&UI.tab!=='board';if(!UI.sub||UI.sub==='board'||UI.sub==='log')UI.sub='past';
 if(inSet)h+='<nav class="tabs">'+subs.map(function(x){return '<button data-act="tab" data-v="'+x[0]+'" class="'+(UI.tab===x[0]?'on':'')+'">'+x[1]+'</button>';}).join('')+'</nav>';
 var TB=ro?[['board','🏆',t('الترتيب','Leaderboard'),UI.tab==='board'],['rules','📊',t('القواعد','Rules'),UI.tab==='rules']]:[['log','📝',t('تسجيل الحصة','Record class'),UI.tab==='log'],['board','🏆',t('الترتيب','Leaderboard'),UI.tab==='board'],[UI.sub,'⚙️',t('الإعدادات','Settings'),inSet]];
 var tabbar='<nav class="tabbar">'+TB.map(function(x){return '<button data-act="tab" data-v="'+x[0]+'" class="'+(x[3]?'on':'')+'"><span class="ti">'+x[1]+'</span><span>'+x[2]+'</span></button>';}).join('')+'</nav>';
 h+=({board:vBoard,log:vLog,past:vPast,tests:vTests,groups:vGroups,rules:vRules})[UI.tab]();
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
 ds.forEach(function(d){var recs=S.sessions[d];Object.keys(recs).forEach(function(sid){var o=byS[sid];if(o){o.total+=recPts(recs[sid]).t;o.days++;}});});
 S.tests.forEach(function(x){if(weekKey(x.date)!==wk)return;var o=byS[x.sid];if(o){var p=testPts(x.score);o.total+=p;o.ach+=p;}});
 G.forEach(function(r){r.full=0;ds.forEach(function(d){var gb=gBonus(r.g,d);if(gb){r.full++;r.week+=gb;}});
  r.total=r.week;r.stu.forEach(function(o){r.total+=o.total;});
  r.n=r.stu.filter(function(o){return o.days||o.ach;}).length||active(r.g).length||1;r.avg=Math.round(r.total/r.n*10)/10;});
 var f=ds[0]||wk,l=ds[ds.length-1]||addDays(wk,4);var F=fmt(useH()?'HS':'GD');
 return {groups:G,byS:byS,label:F.format(toD(f))+(l!==f?' – '+F.format(toD(l)):''),classes:ds.length};}
function bd(g,inP){var o={beh:0,rec:0,oth:0,add:0,ded:0};
 Object.keys(S.sessions).forEach(function(d){if(!inP(d))return;var recs=S.sessions[d];
  g.students.forEach(function(s){var r=recs[s.id];if(!r)return;
   if(r.a==='u')o.ded+=2;else if(r.a==='l')o.ded+=1;
   if(r.a==='p'||r.a==='l'){if(r.a==='p')o.oth+=5;o.beh+=(r.b?3:0)+(r.ap?3:0);o.rec+=r.r?5:0;o.oth+=r.fr?1:0;o.add+=(+r.x||0)+(r.f?1:0)+(r.ini?1:0);}
   if(r.v)o.ded+=50;});
  o.oth+=gBonus(g,d);});
 S.tests.forEach(function(x){if(!inP(x.date))return;if(g.students.some(function(s){return s.id===x.sid;}))o.add+=testPts(x.score);});
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
 (M.rows.some(function(r){return r.bonus;})?'<p class="muted small" style="margin:8px 0 0">👥 '+t('حضور جميع طلاب المجموعة','Every student in the group present')+' <span class="num">(+5)</span> '+t('لكل حصة','per class')+'</p>':'')+'</div>';
 if(M.top.length)h+='<div class="card"><h2>⭐ '+t('أبرز طلاب الأسبوع','Top students this week')+'</h2><div class="toplist">'+M.top.map(function(o,i){return '<div><b class="num" style="width:24px">'+(i+1)+'</b><span class="sp"><bdi>'+esc(o.n)+'</bdi> <span class="muted small">· <bdi>'+esc(o.g)+'</bdi></span></span><b>'+sgn(o.v)+'</b></div>';}).join('')+'</div></div>';
 return h;}
function waText(){var M=reportModel();
 var s='🏆 *'+title()+'*\n_'+M.sub+'_\n\n';
 M.rows.forEach(function(r,i){s+=(i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.')+' *'+r.name+'*: '+(M.avg?r.v+' ('+t('متوسط','average')+')':r.v+' '+t('نقطة','points'))+(r.bonus?' 👥':'')+'\n';});
 if(M.rows.some(function(r){return r.bonus;}))s+='\n👥 '+t('حضور جميع طلاب المجموعة (+5 لكل حصة)','Every student in the group present (+5 per class)')+'\n';
 if(M.top.length){s+='\n⭐ _'+(M.week?t('أبرز طلاب الأسبوع:','Top students this week:'):t('أبرز الطلاب:','Top students:'))+'_\n';M.top.forEach(function(o){s+='• '+o.n+' ('+o.g+'): '+o.v+'\n';});}
 return s+'\n'+t('بارك الله في الجميع 🌹','May Allah bless everyone 🌹');}
function norm(s){return String(s||'').replace(/[ً-ْٰـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').toLowerCase().trim();}
function searchHits(q){q=norm(q);if(!q)return [];var a=[];S.groups.forEach(function(g){active(g).forEach(function(s){var n=norm(s.name);var i=n.indexOf(q);if(i>=0)a.push({s:s,g:g,i:i});});});
 a.sort(function(x,y){return x.i-y.i||x.s.name.localeCompare(y.s.name,'ar');});return a.slice(0,8);}
function searchHTML(q){if(!norm(q))return '';var hits=searchHits(q);
 if(!hits.length)return '<div class="qres"><div class="qnone">'+t('لا يوجد طالب بهذا الاسم','No student with that name')+'</div></div>';
 return '<div class="qres">'+hits.map(function(h){return '<button class="qitem" data-act="pick" data-v="'+h.s.id+'"><bdi>'+esc(h.s.name)+'</bdi><span class="muted small"> · <bdi>'+esc(h.g.name)+'</bdi></span></button>';}).join('')+'</div>';}
function vLog(){
 if(!S.groups.length)return vBoard();
 if(!UI.date)UI.date=today();var d=UI.date;var recs=S.sessions[d]||{};
 var gs=S.groups.filter(function(g){return UI.gf==='all'||g.id===UI.gf;});if(!gs.length){UI.gf='all';gs=S.groups;}
 var en=LANG==='en';
 var h='<div class="card"><div class="row"><button class="btn sm" data-act="day" data-v="-1" title="'+t('اليوم السابق','Previous day')+'">'+(en?'←':'→')+'</button><input type="date" data-act="date" value="'+d+'"><button class="btn sm" data-act="day" data-v="1" title="'+t('اليوم التالي','Next day')+'">'+(en?'→':'←')+'</button><span class="muted small">'+esc(dateLong(d))+'</span><span class="sp"></span><select data-act="gf"><option value="all">'+t('كل المجموعات','All groups')+'</option>'+S.groups.map(function(g){return '<option value="'+g.id+'" '+(UI.gf===g.id?'selected':'')+'>'+esc(g.name)+'</option>';}).join('')+'</select><button class="btn sm" data-act="gall">'+(gs.every(function(g){return UI.og[g.id];})?t('طي المجموعات','Collapse groups'):t('فتح المجموعات','Expand groups'))+'</button></div>'+
 '<div class="search"><input type="search" id="q" autocomplete="off" enterkeyhint="search" placeholder="🔍 '+t('ابحث عن طالب…','Search for a student…')+'"><div id="qbox"></div></div>'+
 (S.sessions[d]?'<p class="small muted" style="margin:8px 0 0">✓ '+t('هذه الحصة مسجّلة — يمكنك تعديلها.','This class is recorded — you can edit it.')+'</p>':'<p class="small muted" style="margin:8px 0 0">'+t('حصة جديدة. الإعداد الافتراضي: حاضر في الوقت مع السلوك والمظهر والتسميع. عدّل فقط ما يختلف ثم اضغط «حفظ الحصة».','New class. Everyone starts as on time, with behaviour, appearance and recitation earned. Change only what’s different, then tap “Save class”.')+'</p>')+'</div>';
 var lb2=lastBackup();if(Object.keys(S.sessions).length>=3&&(!lb2||(new Date()-toD(lb2))/864e5>30))h+='<div class="banner row"><span class="sp">💾 '+t('لم تحفظ نسخة احتياطية منذ أكثر من شهر.','You haven’t saved a backup in over a month.')+'</span><button class="btn sm" data-act="backup">'+t('احفظ الآن','Back up now')+'</button></div>';
 var ATT=[['p',t('حاضر','Present')],['l',t('متأخر','Late')],['e',t('غائب بعذر','Excused')],['u',t('بدون عذر','Unexcused')]];
  var ATTN={p:t('في الوقت','On time'),l:t('متأخر','Late'),e:t('غائب بعذر','Excused'),u:t('غائب بدون عذر','Unexcused')};
 gs.forEach(function(g){var ci=S.groups.indexOf(g);var act=active(g);var sum=0;var cnt={p:0,l:0,e:0,u:0};var gOpen=!!UI.og[g.id];
  var cards=act.map(function(s){var r=recs[s.id];var x=r||DEF;var p=recPts(x);sum+=p.t;cnt[x.a]++;var ab=x.a==='e'||x.a==='u';var so=!!UI.os[s.id];
   var flags='';if(!ab){if(!x.b)flags+='<span class="flag bad">😇 ✗</span>';if(!x.ap)flags+='<span class="flag bad">👔 ✗</span>';if(x.fr)flags+='<span class="flag">🕌 +1</span>';if(x.ini)flags+='<span class="flag">💡 +1</span>';if(!x.r)flags+='<span class="flag bad">📖 ✗</span>';if(x.f)flags+='<span class="flag">🤝 +1</span>';if(x.x)flags+='<span class="flag">➕ '+x.x+'</span>';}if(x.v)flags+='<span class="flag bad">⛔ −50</span>';
   var head='<div class="stu-h" data-act="stog" data-v="'+s.id+'"><span class="nm"><bdi>'+esc(s.name)+'</bdi></span>'+(so?'':'<span class="pill '+x.a+'">'+ATTN[x.a]+'</span>'+flags)+'<span class="sp"></span><span class="pts">'+sgn(p.t)+'</span><span class="chev">'+(so?'▴':'▾')+'</span></div>';
   if(!so)return '<div id="stu-'+s.id+'" class="stu col '+(r?'':'new ')+'">'+head+'<div class="hint">'+t('اضغط على الاسم لفتح خيارات الطالب','Tap the name to open this student’s options')+'</div></div>';
   return '<div id="stu-'+s.id+'" class="stu '+(r?'':'new ')+(ab?'abs':'')+'">'+head+'<div class="hint">'+t('اختر حالة الحضور بضغطة · اضغط على أي خيار مرة لإلغائه ومرة أخرى لإعادته (أخضر = نقاط، أحمر = خصم) · استخدم + و − للدروس الإضافية · اضغط على الاسم لطيّ البطاقة','Tap one attendance status · Tap any option once to turn it off, again to turn it back on (green = points, red = deduction) · Use + and − for extra lessons · Tap the name to fold the card')+'</div>'+
   '<div class="seg">'+ATT.map(function(a){return '<button class="'+a[0]+(x.a===a[0]?' on':'')+'" data-act="set" data-s="'+s.id+'" data-k="a" data-v="'+a[0]+'">'+a[1]+'</button>';}).join('')+'</div>'+
   '<div class="chips"><button class="chip '+(x.b?'on':'')+'" data-act="tg" data-s="'+s.id+'" data-k="b">😇 '+t('السلوك','Behaviour')+' +3</button>'+
   '<button class="chip '+(x.ap?'on':'')+'" data-act="tg" data-s="'+s.id+'" data-k="ap">👔 '+t('المظهر','Appearance')+' +3</button>'+
   '<button class="chip '+(x.fr?'on':'')+'" data-act="tg" data-s="'+s.id+'" data-k="fr">🕌 '+t('الصف الأول','First row')+' +1</button>'+
   '<button class="chip '+(x.r?'on':'')+'" data-act="tg" data-s="'+s.id+'" data-k="r">📖 '+t('التسميع','Recitation')+' +5</button>'+
   '<button class="chip '+(x.f?'on':'')+'" data-act="tg" data-s="'+s.id+'" data-k="f">🤝 '+t('المتابعة','Partner')+' +1</button>'+
   '<button class="chip '+(x.ini?'on':'')+'" data-act="tg" data-s="'+s.id+'" data-k="ini">💡 '+t('مبادرة','Initiative')+' +1</button>'+
   '<span class="stepper '+(x.x?'on':'')+'"><button data-act="ex" data-s="'+s.id+'" data-v="-1" aria-label="−">−</button><span>➕ '+t('درس إضافي','Extra lesson')+' '+N(x.x||0)+'</span><button data-act="ex" data-s="'+s.id+'" data-v="1" aria-label="+">+</button></span></div>'+
   '<div class="chips" style="margin-top:8px"><button class="chip '+(x.v?'bad':'')+'" data-act="tg" data-s="'+s.id+'" data-k="v">⛔ '+t('مخالفة جسيمة','Serious violation')+' −50</button></div></div>';}).join('');
  var allIn=act.length&&!(cnt.e+cnt.u);if(allIn)sum+=5;
  var summ='<span class="gsum">'+(allIn?'<span class="pill p">👥 <span class="num">+5</span></span>':'')+'<span class="pill p">'+N(cnt.p)+' '+t('في الوقت','on time')+'</span>'+(cnt.l?'<span class="pill l">'+N(cnt.l)+' '+t('متأخر','late')+'</span>':'')+(cnt.e+cnt.u?'<span class="pill u">'+N(cnt.e+cnt.u)+' '+t('غائب','absent')+'</span>':'')+'</span>';
  var allOpen=act.length&&act.every(function(s){return UI.os[s.id];});
  h+='<div class="card grp" style="--gc:'+COLORS[ci%COLORS.length]+'"><div class="row ghead" data-act="gtog" data-v="'+g.id+'"><span class="chev">'+(gOpen?'▾':(LANG==='en'?'▸':'◂'))+'</span><h3><bdi>'+esc(g.name)+'</bdi></h3><span class="muted small">'+sgn(sum)+'</span>'+summ+'<span class="sp"></span>'+(gOpen&&act.length?'<button class="btn sm" data-act="sall" data-v="'+g.id+'">'+(allOpen?t('طي الطلاب','Collapse students'):t('فتح الطلاب','Expand students'))+'</button><button class="btn sm" data-act="allp" data-v="'+g.id+'">'+t('الكل حاضر في الوقت','All on time')+'</button>':'')+'</div>'+
  (!gOpen?'':act.length?'<div class="stus">'+cards+'</div>':'<p class="muted">'+t('لا يوجد طلاب في هذه المجموعة.','No students in this group.')+'</p>')+'</div>';});
 h+='<div class="row" style="margin-bottom:14px"><button class="btn pri" data-act="savesess">💾 '+t('حفظ الحصة','Save class')+'</button>'+(S.sessions[d]?'<button class="btn danger '+(UI.arm==='del-'+d?'arm':'')+'" data-act="delsess">'+(UI.arm==='del-'+d?t('اضغط مرة أخرى لتأكيد الحذف','Tap again to confirm delete'):t('حذف هذه الحصة','Delete this class'))+'</button>':'')+'</div>';
 h+='<p class="muted small">'+t('لعرض الحصص السابقة أو تعديلها افتح تبويب «الحصص السابقة».','To view or edit earlier classes, open the “Past classes” tab.')+'</p>';
 return h;}

function vPast(){
 if(!S.groups.length)return vBoard();
 var months=monthList();if(!months.some(function(m){return m.k===UI.month;}))UI.month=months[0].k;
 var ds=Object.keys(S.sessions).filter(function(d){return monthKey(d)===UI.month;}).sort().reverse();
 var tot={n:0,p:0,l:0,ab:0,pts:0};
 var cards=ds.map(function(d){var recs=S.sessions[d];var st=0;
  var rows=S.groups.map(function(g,ci){var c={p:0,l:0,e:0,u:0},pts=0,n=0;
   g.students.forEach(function(s){var r=recs[s.id];if(!r)return;n++;c[r.a]++;pts+=recPts(r).t;});
   if(n&&!(c.e+c.u))pts+=5;if(!n)return '';st+=pts;tot.n+=n;tot.p+=c.p;tot.l+=c.l;tot.ab+=c.e+c.u;
   return '<div class="prow" style="--gc:'+COLORS[ci%COLORS.length]+'"><span class="dot"></span><bdi class="sp">'+esc(g.name)+'</bdi><span class="gsum"><span class="pill p">'+N(c.p)+' '+t('في الوقت','on time')+'</span>'+(c.l?'<span class="pill l">'+N(c.l)+' '+t('متأخر','late')+'</span>':'')+(c.e+c.u?'<span class="pill u">'+N(c.e+c.u)+' '+t('غائب','absent')+'</span>':'')+'</span><b>'+sgn(pts)+'</b></div>';}).join('');
  tot.pts+=st;
  return '<div class="card"><div class="row"><h3>'+esc(dateLong(d))+'</h3><span class="sp"></span><span class="muted small">'+t('المجموع','Total')+' '+sgn(st)+'</span><button class="btn sm" data-act="goto" data-v="'+d+'">✏️ '+t('فتح وتعديل','Open & edit')+'</button></div><div class="prows">'+rows+'</div></div>';}).join('');
 var pct=tot.n?Math.round(tot.p/tot.n*100):0;
 var h='<div class="row" style="margin-bottom:12px"><h2 style="margin:0">'+t('الحصص السابقة','Past classes')+'</h2><span class="sp"></span>'+monthSel(months)+'</div>';
 if(!ds.length)return h+'<div class="card empty"><p class="muted">'+t('لا توجد حصص مسجّلة في هذا الشهر.','No classes recorded this month.')+'</p></div>';
 h+='<div class="cats" style="margin-bottom:14px"><div class="cat"><b>'+N(ds.length)+'</b><span>'+t('حصص','classes')+'</span></div><div class="cat"><b>'+N(pct)+'%</b><span>'+t('حضور في الوقت','on-time attendance')+'</span></div><div class="cat"><b>'+N(tot.l)+'</b><span>'+t('حالات تأخر','late arrivals')+'</span></div><div class="cat"><b>'+N(tot.ab)+'</b><span>'+t('حالات غياب','absences')+'</span></div><div class="cat"><b>'+sgn(tot.pts)+'</b><span>'+t('نقاط الحصص','class points')+'</span></div></div>';
 return h+cards;}

function vTests(){
 if(!S.groups.length)return vBoard();
 var months=monthList();if(!months.some(function(m){return m.k===UI.month;}))UI.month=months[0].k;
 var h='<div class="card"><h2>'+t('تسجيل اختبار تجاوز','Record a graduation test')+'</h2><p class="muted small" style="margin-top:-6px">'+t('نجاح 95% فأعلى: +10 (أقل من 95% يُسجّل بدون نقاط)','Pass at 95% or above: +10 (below 95% is recorded with no points)')+'</p><div class="row"><select id="t-s" style="flex:2;min-width:180px"><option value="">'+t('اختر الطالب…','Choose student…')+'</option>'+S.groups.map(function(g){return '<optgroup label="'+esc(g.name)+'">'+active(g).map(function(s){return '<option value="'+s.id+'">'+esc(s.name)+'</option>';}).join('')+'</optgroup>';}).join('')+'</select><input type="date" id="t-d" value="'+today()+'"><input type="number" id="t-p" min="0" max="100" placeholder="'+t('الدرجة %','Score %')+'" style="width:110px"><button class="btn pri" data-act="addtest">'+t('إضافة','Add')+'</button></div></div>';
 var list=S.tests.filter(function(x){return monthKey(x.date)===UI.month;}).sort(function(a,b){return a.date<b.date?1:-1;});
 h+='<div class="card"><div class="row" style="margin-bottom:8px"><h2 style="margin:0">'+t('الاختبارات المسجّلة','Recorded tests')+'</h2><span class="sp"></span>'+monthSel(months)+'</div>'+(list.length?'<ul class="list">'+list.map(function(x){var f=findStu(x.sid);return '<li><span class="sp"><b><bdi>'+esc(f?f.s.name:'—')+'</bdi></b> <span class="muted small">· <bdi>'+esc(f?f.g.name:'')+'</bdi> · '+esc(dateLong(x.date))+'</span></span><span class="num">'+x.score+'%</span><b>'+sgn(testPts(x.score))+'</b><button class="btn sm danger" data-act="deltest" data-v="'+x.id+'">'+t('حذف','Delete')+'</button></li>';}).join('')+'</ul>':'<p class="muted">'+t('لا توجد اختبارات في هذا الشهر.','No tests this month.')+'</p>')+'</div>';
 return h;}

function vGroups(){
 var h='<div class="card"><h2>'+t('إعدادات المسابقة','Competition settings')+'</h2><div class="grid2"><div><label class="f">'+t('اسم المسابقة','Competition name')+'</label><input type="text" dir="auto" data-act="title" value="'+esc(S.settings.title)+'" style="width:100%"></div><div><label class="f">'+t('التقويم الشهري','Monthly calendar')+'</label><div class="radio"><button class="'+(S.settings.cal==='hijri'?'on':'')+'" data-act="cal" data-v="hijri">'+t('هجري (أم القرى)','Hijri (Umm al-Qura)')+'</button><button class="'+(S.settings.cal==='greg'?'on':'')+'" data-act="cal" data-v="greg">'+t('ميلادي','Gregorian')+'</button></div></div>'+
 '<div><label class="f">'+t('طريقة الترتيب','Ranking method')+'</label><div class="radio"><button class="'+(S.settings.rank==='total'?'on':'')+'" data-act="rank" data-v="total">'+t('مجموع النقاط','Total points')+'</button><button class="'+(S.settings.rank==='avg'?'on':'')+'" data-act="rank" data-v="avg">'+t('متوسط الطالب','Average per student')+'</button></div><p class="muted small" style="margin:4px 0 0">'+t('«متوسط الطالب» أعدل إذا اختلفت أعداد الطلاب بين المجموعات.','“Average per student” is fairer if groups have different numbers of students.')+'</p></div></div></div>';
 S.groups.forEach(function(g,i){h+='<div class="card grp" style="--gc:'+COLORS[i%COLORS.length]+'"><div class="row"><input type="text" dir="auto" data-act="gname" data-v="'+g.id+'" value="'+esc(g.name)+'" style="font-weight:700;flex:1;min-width:160px"><button class="btn sm danger '+(UI.arm==='g-'+g.id?'arm':'')+'" data-act="delg" data-v="'+g.id+'">'+(UI.arm==='g-'+g.id?t('تأكيد حذف المجموعة؟','Confirm delete group?'):t('حذف المجموعة','Delete group'))+'</button></div>'+
  '<div class="schips">'+(g.students.length?g.students.map(function(s){return '<span class="schip '+(s.arc?'arc':'')+'"><bdi>'+esc(s.name)+'</bdi>'+(s.arc?'<button data-act="unarc" data-v="'+s.id+'" title="'+t('إعادة','Restore')+'">↺</button>':'<button data-act="arc" data-v="'+s.id+'" title="'+t('إزالة من المجموعة','Remove from group')+'">×</button>')+'</span>';}).join(''):'<span class="muted small">'+t('لا يوجد طلاب بعد','No students yet')+'</span>')+'</div>'+
  '<textarea id="add-'+g.id+'" dir="auto" placeholder="'+t('أضف طلابًا — اسم في كل سطر','Add students — one name per line')+'" style="min-height:60px"></textarea><div class="row" style="margin-top:6px"><button class="btn sm" data-act="addstu" data-v="'+g.id+'">'+t('إضافة الطلاب','Add students')+'</button><span class="muted small">'+t('الطالب المُزال يبقى في سجلات الأشهر السابقة.','A removed student stays in past months’ records.')+'</span></div></div>';});
 h+='<div class="card"><h2>➕ '+t('مجموعة جديدة','New group')+'</h2><input type="text" dir="auto" id="ng-name" placeholder="'+t('اسم المجموعة (مثال: مجموعة أبي بكر)','Group name (e.g. Abu Bakr group)')+'" style="width:100%"><label class="f">'+t('أسماء الطلاب (اسم في كل سطر)','Student names (one per line)')+'</label><textarea id="ng-stu" dir="auto"></textarea><div class="row" style="margin-top:8px"><button class="btn pri" data-act="addg">'+t('إضافة المجموعة','Add group')+'</button></div></div>';
 var lb=lastBackup();
 h+='<div class="card"><h2>💾 '+t('النسخ الاحتياطي','Backup')+'</h2><p class="muted small">'+t('البيانات محفوظة على هذا الجهاز فقط. احفظ نسخة احتياطية كل شهر (في الملفات أو أرسلها لنفسك في واتساب) حتى لا تضيع إذا تغيّر الجهاز.','Data is stored on this device only. Save a backup every month (to Files, or send it to yourself on WhatsApp) so nothing is lost if the phone changes.')+'</p><p class="small">'+t('آخر نسخة احتياطية: ','Last backup: ')+'<b>'+(lb?esc(dateLong(lb)):t('لا يوجد','never'))+'</b></p><div class="row"><button class="btn pri sp" data-act="backup">⬇️ '+t('حفظ نسخة احتياطية','Save backup file')+'</button><label class="btn sp" style="text-align:center;display:flex;align-items:center;justify-content:center">⬆️ '+t('استعادة من ملف','Restore from file')+'<input type="file" accept=".json,application/json" data-act="restore" style="display:none"></label></div>'+
 (UI.pending?'<div class="banner" style="margin:12px 0 0">'+t('الملف يحتوي على ','The file has ')+N(UI.pending.groups.length)+' '+t('مجموعات و','groups and ')+N(Object.keys(UI.pending.sessions||{}).length)+' '+t('حصص. سيستبدل البيانات الحالية.',' classes. It will replace the current data.')+'<div class="row" style="margin-top:8px"><button class="btn danger arm" data-act="restoreok">'+t('استبدال البيانات','Replace data')+'</button><button class="btn" data-act="restorecancel">'+t('إلغاء','Cancel')+'</button></div></div>':'')+'</div>';
 return h;}

function vRules(){var rr=function(a,b){return '<div class="r"><span>'+a+'</span><b>'+b+'</b></div>';};var nt=function(a){return '<p class="muted small" style="margin:4px 0 0">'+a+'</p>';};
 return '<div class="card rules"><h2>📊 '+t('توزيع نقاط تقييم المجموعات','Group points system')+'</h2>'+
 '<h3>'+t('١- الحضور والانضباط','1. Attendance & punctuality')+'</h3>'+rr('👥 '+t('حضور جميع الطلاب (للمجموعة في كل حصة)','Every student present (group, per class)'),sgn(5))+rr('🚫 '+t('غياب بدون عذر','Absence without excuse'),sgn(-2))+rr('⏱️ '+t('عدم التأخر','Arriving on time'),sgn(5))+rr('⏳ '+t('خصم عن كل تأخير','Each late arrival'),sgn(-1))+
 '<h3>'+t('٢- العبادة والصف الأول','2. Worship & the first row')+'</h3>'+rr('🕌 '+t('الصلاة في الصف الأول (لكل طالب)','Praying in the first row (per student)'),sgn(1))+
 '<h3>'+t('٣- السلوك والمظهر','3. Behaviour & appearance')+'</h3>'+rr('😇 '+t('السلوك والانضباط والاحترام','Behaviour, discipline and respect'),sgn(3))+rr('👔 '+t('الالتزام بالمظهر العام','Keeping to the dress code'),sgn(3))+
 '<h3>'+t('٤- التسميع والإتقان','4. Recitation & mastery')+'</h3>'+rr('📖 '+t('التسميع (الدرس + الجنب + المراجعة)','Recitation (new lesson + recent + revision)'),sgn(5))+rr('➕ '+t('تسميع درس إضافي','Reciting an extra lesson'),sgn(1))+rr('🤝 '+t('المتابعة بدقة مع الزميل','Following closely with a partner'),sgn(1))+
 '<h3>'+t('٥- المبادرات والأثر الإيجابي','5. Initiatives & positive impact')+'</h3>'+rr('💡 '+t('عمل فيه قيمة مجتمعية أو أثر إيجابي','An act of community value or positive impact'),sgn(1))+nt(t('سواء داخل الحلقة أو خارجها أثناء الدوام، ويقيّمها المعلم','Inside the halaqah or outside it during class hours, judged by the teacher'))+
 '<h3>'+t('٦- الإنجاز الكبير','6. Major achievement')+'</h3>'+rr('🌟 '+t('اختبار التجاوز (نجاح 95% فأعلى)','Graduation test (pass at 95% or above)'),sgn(10))+
 '<h3>'+t('٧- المخالفات الجسيمة','7. Serious violations')+'</h3>'+rr('⛔ '+t('ثبوت حالة غش أو كذب أو ما شابه','A proven case of cheating, lying or similar'),sgn(-50))+nt(t('وأنتم محشومين بإذن الله','And you are above that, in shā’ Allāh'))+
 '<p class="muted small" style="margin-top:14px">'+t('ملاحظات التطبيق: الغائب (بعذر أو بدونه) لا تُحتسب له بقية النقاط. الغياب بعذر صفر نقاط. المتأخر يُخصم عنه نقطة ولا يأخذ نقاط عدم التأخر. تحصل المجموعة على +5 في كل حصة يحضرها جميع طلابها (المتأخر يُعدّ حاضرًا). المخالفة الجسيمة تُحتسب في كل الأحوال.','How the app applies these: an absent student (excused or not) gets no other points. An excused absence is 0. A late student loses 1 point and does not get the on-time points. A group gets +5 for each class where all its students attend (late counts as present). A serious violation counts in every case.')+'</p></div>';}

/* ---------- actions ---------- */
function touch(){saveLocal();}
function saveLocal(){try{localStorage.setItem('hc-data',JSON.stringify(S));}catch(e){toast(t('تعذّر الحفظ على الجهاز','Couldn’t save on this device'));}}
function setRec(sid,patch){var d=UI.date;S.sessions[d]=S.sessions[d]||{};var cur=S.sessions[d][sid]||Object.assign({},DEF);S.sessions[d][sid]=Object.assign(cur,patch);touch();}
function shownGroups(){return S.groups.filter(function(g){return UI.gf==='all'||g.id===UI.gf;});}
function persist(msg){saveLocal();saveUI();toast(msg||t('تم الحفظ ✓','Saved ✓'));}

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
 if(M.week&&R.some(function(r){return r.bonus;})){x.textAlign=al;x.font=F('500',28);x.fillStyle='#6e6e73';x.fillText('👥 '+t('حضور جميع طلاب المجموعة: +5 لكل حصة','Every student in the group present: +5 per class'),S0,y+20,W-160);y+=60;}
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
 if(a!=='delsess'&&a!=='delg')UI.arm=null;
 switch(a){
 case 'theme':THEME={auto:'light',light:'dark',dark:'auto'}[THEME];try{localStorage.setItem('hc-theme',THEME);}catch(e){}applyTheme();toast(t('المظهر: ','Theme: ')+({auto:t('تلقائي (حسب الجهاز)','Auto (follows device)'),light:t('فاتح','Light'),dark:t('داكن','Dark')})[THEME]);return;
 case 'lang':LANG=LANG==='en'?'ar':'en';try{localStorage.setItem('hc-lang',LANG);}catch(e){}break;
 case 'tab':UI.tab=v;if(v!=='log'&&v!=='board')UI.sub=v;saveUI();resetScroll=true;break;
 case 'rep':UI.rep=v;saveUI();break;
 case 'pick':var pf=findStu(v);if(!pf)return;UI.og[pf.g.id]=1;UI.os[v]=1;if(UI.gf!=='all'&&UI.gf!==pf.g.id)UI.gf='all';saveUI();render();setTimeout(function(){var ce=document.getElementById('stu-'+v);if(ce){ce.scrollIntoView({block:'center',behavior:'smooth'});ce.classList.add('flash');setTimeout(function(){ce.classList.remove('flash');},1800);}},40);return;
 case 'toggle':UI.open[v]=!UI.open[v];saveUI();break;
 case 'save':persist();return;
 case 'closemodal':UI.modal=null;break;
 case 'copywa':copyText(t('نتائج المسابقة','Competition results'),waText());return;
 case 'backup':doBackup();return;
 case 'shareimg':shareImage();return;
 case 'sharetxt':shareText(waText());return;
 case 'restoreok':if(UI.pending){S=UI.pending;S.groups=S.groups||[];S.sessions=S.sessions||{};S.tests=S.tests||[];S.settings=Object.assign({title:DEF_TITLE,cal:'hijri',rank:'total'},S.settings||{});UI.pending=null;UI.month=null;persist(t('تمت الاستعادة ✓','Restored ✓'));}break;
 case 'restorecancel':UI.pending=null;break;
 case 'day':UI.date=addDays(UI.date||today(),+v);saveUI();break;
 case 'goto':UI.date=v;UI.tab='log';saveUI();resetScroll=true;break;
 case 'set':setRec(s,{a:v});break;
 case 'tg':var cur=(S.sessions[UI.date]||{})[s]||DEF;var o={};var cv=cur[el.dataset.k];if(el.dataset.k==='pc'&&cv===undefined)cv=1;o[el.dataset.k]=cv?0:1;setRec(s,o);break;
 case 'ex':var c2=(S.sessions[UI.date]||{})[s]||DEF;setRec(s,{x:Math.max(0,(+c2.x||0)+(+v))});break;
 case 'gtog':if(ev.target.closest('button')&&ev.target.closest('button')!==el)return;if(UI.og[v])delete UI.og[v];else UI.og[v]=1;saveUI();break;
 case 'stog':if(UI.os[v])delete UI.os[v];else UI.os[v]=1;saveUI();break;
 case 'gall':var go=shownGroups().every(function(g){return UI.og[g.id];});shownGroups().forEach(function(g){if(go)delete UI.og[g.id];else UI.og[g.id]=1;});saveUI();break;
 case 'sall':var sg=S.groups.filter(function(x){return x.id===v;})[0];var so=active(sg).every(function(st){return UI.os[st.id];});active(sg).forEach(function(st){if(so)delete UI.os[st.id];else UI.os[st.id]=1;});saveUI();break;
 case 'allp':var g=S.groups.filter(function(x){return x.id===v;})[0];if(g)active(g).forEach(function(st){setRec(st.id,{a:'p'});});break;
 case 'savesess':var d=UI.date;S.sessions[d]=S.sessions[d]||{};shownGroups().forEach(function(g){active(g).forEach(function(st){if(!S.sessions[d][st.id])S.sessions[d][st.id]=Object.assign({},DEF);});});persist(t('تم حفظ الحصة ✓','Class saved ✓'));render();return;
 case 'delsess':if(UI.arm==='del-'+UI.date){delete S.sessions[UI.date];UI.arm=null;touch();}else UI.arm='del-'+UI.date;break;
 case 'addtest':var sid=document.getElementById('t-s').value,td=document.getElementById('t-d').value,sc=document.getElementById('t-p').value;
  if(!sid||!td||sc===''){toast(t('اختر الطالب واكتب الدرجة','Choose a student and enter the score'));return;}sc=Math.max(0,Math.min(100,+sc));S.tests.push({id:uid(),sid:sid,date:td,score:sc});UI.month=monthKey(td);touch();break;
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
render();
})();
