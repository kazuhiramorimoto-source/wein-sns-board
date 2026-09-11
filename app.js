var B = window.BOARD;
var SCHOOL_SET={"HERO'ZZ":1,"CREATOR'ZZ":1,"RVA":1,"AI+":1,"MERISE":1};
var LOGOS={
 "HERO'ZZ":{src:'logos/herozz.png',fit:'fcontain',bg:'#ffffff'},
 "CREATOR'ZZ":{src:'logos/creatorzz.png',fit:'fcontain',bg:'#14294f'},
 "RVA":{src:'logos/rva.jpg',fit:'fcover',bg:'#131c33'},
 "AI+":{src:'logos/aiplus.jpg',fit:'fcover',bg:'#eef6fb'},
 "REAL VALUE":{src:'logos/realvalue.png',fit:'fcontain',bg:'#ffffff'},
 "LASTCALL":{src:'logos/lastcall.jpg',fit:'fcover',bg:'#111111'},
 "ねぶたちゃん":{src:'logos/nebuta.jpg',fit:'fcover',bg:'#ffffff',sq:1},
 "星乃リア":{src:'logos/hoshinoria.jpg',fit:'fcover',bg:'#ffffff',sq:1}
};
function logoTile(name,h,seg,w){
 var L=LOGOS[name];
 if(L){var lw=L.sq?h:(w||Math.round(h*2.6));return '<span class="ltile '+L.fit+'" style="height:'+h+'px;width:'+lw+'px;background:'+L.bg+(L.sq?';border-radius:50%':'')+'"><img src="'+L.src+'" alt="'+esc(name)+'" loading="lazy"></span>';}
 return '<span class="ltile mono'+(seg==='talent'?' tl':'')+'" style="height:'+h+'px;width:'+h+'px;font-size:'+Math.round(h*0.44)+'px">'+esc(name.charAt(0))+'</span>';
}
B.sched.forEach(function(c){ if(!c.seg) c.seg = SCHOOL_SET[c.name]?'school':'talent'; });
var curTab='schools', schedMode='week', curCase='ALL', kpiSeg='all', curSchool=null;
var kpiView='card', kpiFilter='', kpiSort='asc';
var calCur=null, daySel=null, weekCur=null;
var INF=(B.infoma&&B.infoma.air)?B.infoma:{air:[],prog:[]};
var infShow=true, draftShow=false, infCase='ALL', infMode='cal', infCal=null, infDaySel=null;
var STATUS_COLORS={'撮影':'#FCE5CD','編集':'#FFF2CC','修正中':'#F4CCCC','社内確認中':'#D9D2E9','納品':'#CFE2F3','投稿済':'#D9D9D9','企画/台本':'#DDEBF7','企画':'#E7F0FA','台本':'#DDEBF7','共通':'#ECEFF3',
  '台本FIX済':'#D9EAD3','確認OK':'#D9EAD3','完成':'#D9EAD3','初稿待ち':'#FFF2CC','制作中':'#FFF2CC','校正確認中':'#D9D2E9','未着手':'#F4CCCC'};
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function $(id){return document.getElementById(id);}
function svgw(p){return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';}
var IC={
 school: svgw('<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 21v-4h6v4M8.5 7.5h1.5M14 7.5h1.5M8.5 11.5h1.5M14 11.5h1.5M8.5 15.5h1.5M14 15.5h1.5"/>'),
 cal: svgw('<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
 chart: svgw('<path d="M4 20v-8M10 20V5M16 20v-5M21 20.5H3"/>'),
 all: svgw('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3.6 3.2 14.4 0 18M12 3c-3.2 3.6-3.2 14.4 0 18"/>'),
 users: svgw('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.6"/><path d="M16 14.4c3 .3 5.5 2.4 5.5 5.6"/>'),
 list: svgw('<path d="M8.5 6h12M8.5 12h12M8.5 18h12M3.8 6h.01M3.8 12h.01M3.8 18h.01"/>'),
 chevL: svgw('<path d="M14.5 6l-6 6 6 6"/>'),
 chevR: svgw('<path d="M9.5 6l6 6-6 6"/>'),
 tv: svgw('<rect x="2.5" y="7.5" width="19" height="13" rx="2"/><path d="M8 3l4 4.5L16 3"/>'),
 week: svgw('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M9 10v9M15 10v9"/>')
};
function infAlertCls(a){ return a==='超過'?'bad':(a==='要注意'||a==='注意')?'warn':(a==='完了'||a==='OK')?'good':'none'; }


/* 制作ステージ＝シートの「状況」。企画→台本→撮影→編集→(修正中/社内確認中)→納品→投稿済 */
var STAGE_IDX={'企画':0,'企画/台本':0,'台本':1,'撮影':2,'編集':3,'修正中':4,'社内確認中':4,'納品':5,'投稿済':6};
var STAGE_MAX=6;
function stageIdx(st){ var i=STAGE_IDX[st]; return i===undefined?-1:i; }
/* 進捗チェック：枠の中の1文字で段階が読めるようにする（塗り具合では伝わらなかった） */
var STAGE_CHK={'企画':['s-plan','企'],'企画/台本':['s-plan','企'],'台本':['s-plan','台'],
  '撮影':['s-prog','撮'],'編集':['s-prog','編'],'修正中':['s-prog','修'],'社内確認中':['s-prog','確'],
  '納品':['s-wait','✓'],'投稿済':['s-done','✓']};
var CHK_TIP={'s-todo':'未着手（状況が未入力）','s-plan':'着手前','s-prog':'制作中','s-wait':'納品＝投稿待ち','s-done':'投稿済＝完了'};
function chkHtml(st){
  var c=STAGE_CHK[st];
  if(!c) return '<span class="chk s-todo" title="状況が未設定"></span>';
  var tip=(c[0]==='s-prog'||c[0]==='s-plan')?(st+'（'+(c[0]==='s-plan'?'着手前':'制作中')+'）'):CHK_TIP[c[0]];
  return '<span class="chk '+c[0]+'" title="'+esc(tip)+'">'+c[1]+'</span>';
}
/* FIXまでのスケジュール：初稿→納品→投稿。済みは✓、期日を過ぎて未達は赤 */
function stepsHtml(o){
  var i=stageIdx(o.status), t0=new Date(); t0.setHours(0,0,0,0);
  var ms=[['初稿',o.draft,i>=4],['納品',o.deliver,i>=5],['投稿',o.date,i>=6]];
  var out=ms.map(function(m){
    if(!m[1]) return '';
    var d=pd(m[1]), late=(!m[2]&&d&&d<t0);
    return '<span class="ms'+(m[2]?' ok':'')+(late?' late':'')+'" title="'+m[0]+' '+esc(m[1])+(m[2]?'（完了）':late?'（期日超過）':'')+'">'+
      '<i class="msb">'+(m[2]?'✓':'')+'</i>'+m[0]+' <b>'+esc(m[1])+'</b></span>';
  }).filter(Boolean).join('');
  return out?'<span class="msrow">'+out+'</span>':'';
}

function stag(st,extra){var c=STATUS_COLORS[st]||'#ECEFF3';var fg=st==='投稿済'?'#606060':'#3d3d3d';
  return '<span class="stag" style="background:'+c+';color:'+fg+'">'+esc(st||'予定')+(extra||'')+'</span>';}
function mediaBadge(m){
  if(m==='X投稿')return '<span class="mb mb-x">X</span>';
  if(m==='ロング動画')return '<span class="mb mb-yt">ロング</span>';
  if(m==='ショート動画')return '<span class="mb mb-sh">ショート</span>';
  return m?'<span class="mb">'+esc(m)+'</span>':'';}
function pd(s){var m=/^(\d{1,2})\/(\d{1,2})/.exec(String(s||'').trim());if(!m)return null;return new Date(B.year,+m[1]-1,+m[2]);}
function linkChips(ls){ if(!ls||!ls.length) return ''; return ls.map(function(l){ return '<a class="lchip" href="'+esc(l[1])+'" target="_blank" rel="noopener">'+esc(l[0])+'</a>'; }).join(''); }

function isAgg(){ return curCase==='ALL'||curCase==='SCHOOL'||curCase==='TALENT'; }
function allRows(){
  var out=[];
  B.sched.forEach(function(c){
    if(curCase==='SCHOOL' && c.seg!=='school') return;
    if(curCase==='TALENT' && c.seg!=='talent') return;
    if(!isAgg() && c.name!==curCase) return;
    c.rows.forEach(function(r){ out.push({sc:c.name,seg:c.seg,date:r[0],time:r[1],title:r[2],media:r[3],status:r[4],editor:r[5],draft:r[6]||'',links:r[7]||[],deliver:r[8]||''}); });
  });
  return out;
}

function render(){
  $('subline').textContent = B.updated+' 時点のスナップショット';
  var tabs=[{k:'schools',l:IC.school+'スクール'},{k:'sched',l:IC.cal+'スケジュール'},{k:'infoma',l:IC.tv+'インフォマ'},{k:'kpi',l:IC.chart+'KPI進捗'}];
  $('tabs').innerHTML=tabs.map(function(t){return '<button type="button" class="'+(curTab===t.k?'on':'')+'" onclick="goTab(\''+t.k+'\')">'+t.l+'</button>';}).join('');
  if(document.body&&document.body.classList) document.body.classList.toggle('wideview',curTab==='sched'||curTab==='infoma');
  renderSide();
  if(curTab==='schools') renderSchools();
  else if(curTab==='sched') renderSched();
  else if(curTab==='infoma') renderInfoma();
  else renderKpi();
}
function goTab(t){ curTab=t; curSchool=null; render(); window.scrollTo(0,0); }
function goSchool(n){ curTab='schools'; curSchool=n; render(); window.scrollTo(0,0); }
function renderSide(){
  var el=$('side'); if(!el) return;
  function nb(on,click,inner){ return '<button type="button" class="'+(on?'on':'')+'" onclick="'+click+'">'+inner+'</button>'; }
  var h='<div class="sidebrand"><img class="bmark" src="logos/yoake-mark.png" alt="YOAKE" width="96" height="37">'+
    '<span class="bt">スクール横串<br>オーガニック</span></div>';
  h+='<div class="snav"><div class="nl">メニュー</div>'+
    nb(curTab==='schools'&&!curSchool,"goTab('schools')",IC.school+'<span class="tx">スクールハブ</span>')+
    nb(curTab==='sched',"goTab('sched')",IC.cal+'<span class="tx">スケジュール</span>')+
    nb(curTab==='infoma',"goTab('infoma')",IC.tv+'<span class="tx">インフォマ</span>')+
    nb(curTab==='kpi',"goTab('kpi')",IC.chart+'<span class="tx">KPI進捗</span>')+'</div>';
  function grp(label,seg){
    var btns='';
    B.sched.forEach(function(c){ if(c.seg!==seg) return;
      btns+=nb(curTab==='schools'&&curSchool===c.name,"goSchool('"+c.name.replace(/'/g,"\\'")+"')",logoTile(c.name,18,c.seg,40)+'<span class="tx">'+esc(c.name)+'</span>');
    });
    return '<div class="snav"><div class="nl">'+label+'</div>'+btns+'</div>';
  }
  h+=grp('スクール','school')+grp('非スクール','talent');
  el.innerHTML=h;
}

/* 予定リストを日付でまとめて並べる。items=[{d:Date,time,main,meta,right}]
   time を省略（null/undefined）すると時刻カラムごと出さない（放送予定など） */
function agendaHtml(items){
  if(!items.length) return '';
  var t0=new Date(); t0.setHours(0,0,0,0);
  var cnt={};
  function key(d){ return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate(); }
  items.forEach(function(it){ cnt[key(it.d)]=(cnt[key(it.d)]||0)+1; });
  var out='',last='';
  items.forEach(function(it){
    var k=key(it.d);
    if(k!==last){
      if(last) out+='</div></div>';
      var wd=it.d.getDay(), diff=Math.round((it.d-t0)/86400000);
      out+='<div class="agday"><div class="agdh'+(wd===0?' sun':wd===6?' sat':'')+'">'+
        '<span class="agdd">'+(it.d.getMonth()+1)+'/'+it.d.getDate()+'</span>'+
        '<span class="agdw">'+'日月火水木金土'.charAt(wd)+'</span>'+
        (diff===0?'<span class="agtoday">今日</span>':diff===1?'<span class="agsoon">明日</span>':'')+
        (cnt[k]>1?'<span class="agdn">'+cnt[k]+'件</span>':'')+
        '</div><div class="agitems">';
      last=k;
    }
    out+='<div class="agrow">'+
      (it.time===null||it.time===undefined?'':'<span class="agtime'+(it.time?'':' none')+'">'+esc(it.time||'時刻未定')+'</span>')+
      '<div class="agmain"><div class="agt">'+it.main+'</div>'+
      (it.meta?'<div class="agmeta">'+it.meta+'</div>':'')+'</div>'+
      (it.right?'<span class="agst">'+it.right+'</span>':'')+'</div>';
  });
  return out+'</div></div>';
}
function metaJoin(parts){ return parts.filter(Boolean).join('<span class="sep">·</span>'); }

/* ---------- スクールハブ ---------- */
function schoolKpi(name){ var hit=null; B.kpi.forEach(function(k){ if(k.name===name) hit=k; }); return hit; }
function schoolAch(kc){ if(!kc) return null; var pr=[];
  kc.kpis.forEach(function(k){ var t=numv(k[1]),pace=numv(k[2]),a=numv(k[3]); if(t&&pace&&a!==null) pr.push(Math.min(a/pace,3)); });
  return pr.length?Math.round(pr.reduce(function(x,y){return x+y;},0)/pr.length*100):null; }
function openSchoolIdx(i){ curSchool=B.sched[i].name; curTab='schools'; render(); }
function openCal(i){ curCase=B.sched[i].name; curTab='sched'; schedMode='cal'; curSchool=null; render(); }
function sh3(t){ return '<div class="sec-h3"><h3>'+t+'</h3><span class="line"></span></div>'; }
function schoolMonthAch(kc){ if(!kc) return null; var ar=[];
  kc.kpis.forEach(function(k){ var t=numv(k[1]),a=numv(k[3]); if(t&&a!==null) ar.push(Math.min(a/t,1)); });
  return ar.length?Math.round(ar.reduce(function(x,y){return x+y;},0)/ar.length*100):null; }
function renderSchools(){
  if(curSchool) return renderSchoolDetail();
  var t0=new Date(); t0.setHours(0,0,0,0);
  function card(c,i){
    var kc=schoolKpi(c.name);
    var pace=schoolAch(kc), month=schoolMonthAch(kc);
    var pst=pace===null?'none':pace>=100?'good':pace>=60?'warn':'bad';
    var up=c.rows.filter(function(r){ var d=pd(r[0]); return d&&d>=t0; }).length;
    var inf=INF.air.filter(function(a){ var d=pd(a[0]); return a[1]===c.name&&d&&d>=t0; }).length;
    return '<div class="scard '+(c.seg==='talent'?'tl':'sc')+'" onclick="openSchoolIdx('+i+')"><div class="sn2">'+logoTile(c.name,34,c.seg,88)+esc(c.name)+
      '<span class="sctag'+(c.seg==='talent'?' tl':'')+'" style="margin-left:auto">'+(c.seg==='talent'?'非スクール':'スクール')+'</span></div>'+
      '<div class="statrow">'+
      '<span class="stat '+pst+'"><span class="sl">現時点達成率</span><span class="sv c-'+pst+'">'+(pace===null?'—':pace+'%')+'</span></span>'+
      '<span class="stat"><span class="sl">月間達成率</span><span class="sv" style="color:var(--ink)">'+(month===null?'—':month+'%')+'</span></span></div>'+
      '<div class="steaser">今後の投稿 '+up+'件'+(inf?' ／ <b style="color:#7E22CE">インフォマ放送 '+inf+'件</b>':'')+' ／ タップで詳細</div></div>';
  }
  var sHtml='', tHtml='';
  B.sched.forEach(function(c,i){ if(c.seg==='school') sHtml+=card(c,i); else tHtml+=card(c,i); });
  $('view').innerHTML=sh3('スクール')+'<div class="sgrid">'+sHtml+'</div>'+
    sh3('非スクール（タレント・案件）')+'<div class="sgrid">'+tHtml+'</div>'+
    '<p class="note"><b>現時点達成率</b>＝現在実績÷今日までのペース目標／<b>月間達成率</b>＝現在実績÷月間目標（いずれも各KPIの平均）。スクール5校はコンセプト設計付き。</p>';
}
function renderSchoolDetail(){
  var name=curSchool, sc=null, idx=0;
  B.sched.forEach(function(c,i){ if(c.name===name){ sc=c; idx=i; } });
  if(!sc){ curSchool=null; return renderSchools(); }
  var kc=schoolKpi(name), con=(B.concepts||{})[name]||[];
  var pace=schoolAch(kc), month=schoolMonthAch(kc);
  var pst=pace===null?'none':pace>=100?'good':pace>=60?'warn':'bad';
  var head='<div class="sd-head"><button class="btn" type="button" onclick="curSchool=null;render()">← 一覧</button>'+logoTile(name,42,sc.seg,108)+'<h2>'+esc(name)+'</h2>'+
    '<span class="kovwrap" style="text-align:left"><span class="kovlbl">現時点達成率</span><span class="kov c-'+pst+'" style="font-size:19px">'+(pace===null?'—':pace+'%')+'</span></span>'+
    '<span class="kovwrap" style="text-align:left"><span class="kovlbl">月間達成率</span><span class="kov" style="font-size:19px;color:var(--ink)">'+(month===null?'—':month+'%')+'</span></span>'+
    '<span class="spacer"></span><button class="btn" type="button" onclick="openCal('+idx+')">'+IC.cal+'カレンダーで見る</button></div>';
  var conceptHtml=con.length
    ? '<div class="concept-g">'+con.map(function(c,i){
        var lines=String(c[1]).split('\n');
        var full=(lines.length>1)||String(c[1]).length>90;
        var body;
        if(i!==0&&lines.length>1){
          body=lines.map(function(l){
            var m=/^([^＝]{1,16})＝(.+)$/.exec(l);
            return m?'<div class="mrow"><b>'+esc(m[1])+'</b><span>'+esc(m[2])+'</span></div>'
                    :'<div class="mrow"><span>'+esc(l)+'</span></div>';
          }).join('');
        } else {
          body='<div class="cb">'+esc(c[1])+'</div>';
        }
        return '<div class="cbox'+(i===0?' hero':(full?' full':''))+'"><div class="ci">'+esc(c[0])+'</div>'+body+'</div>';
      }).join('')+'</div>'
    : '<p class="note">この案件のコンセプト設計は準備中です。</p>';
  var kpiHtml=kc?'<div class="kgrid">'+kpiCardHtml(kc)+'</div>':'<p class="note">KPIは未設定です。</p>';
  var t0=new Date(); t0.setHours(0,0,0,0);
  var up=[], und=[];
  sc.rows.forEach(function(r){ var d=pd(r[0]); if(!d){ und.push(r); return; } if(d>=t0) up.push([d,r]); });
  up.sort(function(a,b){ return a[0]-b[0]; });
  var rows=agendaHtml(up.slice(0,12).map(function(x){ var d=x[0], r=x[1];
    return { d:d, time:timeChip(r[1]),
      main:mediaBadge(r[3])+' '+esc(r[2])+linkChips(r[7]),
      meta:metaJoin([ r[5]?'<b>担当</b>'+esc(r[5]):'', r[4]?'<b>状況</b>'+esc(r[4]):'' ])+
           stepsHtml({draft:r[6],deliver:r[8]||'',date:r[0],status:r[4]}),
      right:chkHtml(r[4])+(r[4]?stag(r[4]):'') };
  }));
  var undRows=und.length?'<div class="agday"><div class="agdh"><span class="agdd" style="font-size:13px">日付未定</span>'+
    '<span class="agdn">'+und.length+'件</span></div><div class="agitems">'+
    und.map(function(r){
      return '<div class="agrow"><div class="agmain"><div class="agt">'+mediaBadge(r[3])+' '+esc(r[2])+linkChips(r[7])+'</div>'+
        (r[5]?'<div class="agmeta"><b>担当</b>'+esc(r[5])+'</div>':'')+'</div>'+
        '<span class="agst">'+(r[4]?stag(r[4]):'')+'</span></div>';
    }).join('')+'</div></div>':'';
  var schedHtml='<div class="panel" style="padding:4px 16px 12px">'+
    (rows||'<p class="note" style="margin:10px 0">今後の投稿予定はまだ入っていません。</p>')+undRows+
    (up.length>12?'<p class="note" style="margin:10px 0 2px">ほか '+(up.length-12)+' 件は上の「カレンダーで見る」から。</p>':'')+'</div>';
  var infAir=infDated(INF.air.filter(function(a){ return a[1]===name; })).filter(function(x){ return x.d>=t0; });
  var infPr=INF.prog.filter(function(p){ return p[2]===name; });
  var infHtml='';
  if(infAir.length||infPr.length){
    infHtml='<div class="panel" style="padding:4px 16px 12px">'+
      (infAir.length?infAirList(infAir.slice(0,12),true):'<p class="note" style="margin:8px 0">今後の放送予定はまだ入っていません。</p>')+
      (infAir.length>12?'<p class="note" style="margin:6px 0 0">ほか '+(infAir.length-12)+' 件は「インフォマ」タブから。</p>':'')+
      (infPr.length?'<div class="grp-h2" style="padding:12px 0 4px">台本・配信の進行</div>'+infPr.map(function(p){
        return '<div class="fixrow"><span class="tc num">'+esc(p[3]||'未定')+'</span>'+
          '<div class="fx"><span class="ibadge'+(p[0]==='配信'?' k2':'')+'">'+esc(p[0])+'</span>'+esc(p[1]||'（番組未定）')+
          (p[5]?'<small>／ '+esc(p[5])+'</small>':'')+(p[6]?'<small>／ 期限 '+esc(p[6])+'</small>':'')+'</div>'+
          (p[4]?stag(p[4]):'')+'<span class="ialert a-'+infAlertCls(p[7])+'">'+esc(p[7]||'—')+'</span></div>';
      }).join(''):'')+'</div>';
  }
  $('view').innerHTML=head+cvTiles(kc)+
    '<div class="detgrid">'+
      '<div class="dcol">'+sh3('KPI進捗 — 現時点達成率（今日までのペース目標比）')+kpiHtml+
        (infHtml?sh3('インフォマ — 放送予定・台本/配信の進行')+infHtml:'')+'</div>'+
      '<div class="dcol">'+sh3('今後の投稿スケジュール — 期日が近い順')+schedHtml+'</div>'+
    '</div>'+
    sh3('コンセプト設計')+conceptHtml;
}
function cvTiles(kc){
  if(!kc) return '';
  var out='';
  kc.kpis.forEach(function(k){
    if(!/LINE|面談|契約/.test(k[0])) return;
    var t=numv(k[1]),pace=numv(k[2]),a=numv(k[3]);
    var st=kst(t,pace,a);
    var pct=(pace&&a!==null)?Math.round(a/pace*100)+'%':'—';
    out+='<div class="kt cvt"><span class="ktl">'+esc(k[0].replace('（オーガニック）','').replace(/（.+?）/,''))+'</span>'+
      '<span class="ktv">'+(a===null?'—':a.toLocaleString())+'<small class="ktt">/月間 '+(t===null?'—':t.toLocaleString())+'</small></span>'+
      '<span class="ktp c-'+st+'">現時点 '+pct+'</span></div>';
  });
  return out?'<div class="ktiles" style="margin:12px 0 6px">'+out+'</div>':'';
}

function setCase(i){ curCase = (i==='ALL'||i==='SCHOOL'||i==='TALENT')?i:B.sched[i].name; renderSched(); }
function calShift(n){ calCur.m+=n; if(calCur.m<0){calCur.m=11;calCur.y--;} if(calCur.m>11){calCur.m=0;calCur.y++;} daySel=null; renderSched(); }
function calToday(){ var t=new Date(); calCur={y:t.getFullYear(),m:t.getMonth()}; daySel=null; renderSched(); }

function renderSched(){
  if(!calCur){ var t=new Date(); calCur={y:B.year,m:t.getMonth()}; }
  function segBtns(seg){
    return B.sched.map(function(c,i){ if(c.seg!==seg) return '';
      return '<button type="button" class="'+(c.seg==='talent'?'tl':'sc')+(curCase===c.name?' on':'')+'" onclick="setCase('+i+')">'+esc(c.name)+'</button>'; }).join('');
  }
  var segAll='<span class="switch">'+
    '<button type="button" class="'+(curCase==='ALL'?'on':'')+'" onclick="setCase(\'ALL\')">'+IC.all+'すべて</button>'+
    '<button type="button" class="'+(curCase==='SCHOOL'?'on':'')+'" onclick="setCase(\'SCHOOL\')">'+IC.school+'スクール全体</button>'+
    '<button type="button" class="'+(curCase==='TALENT'?'on':'')+'" onclick="setCase(\'TALENT\')">'+IC.users+'非スクール全体</button></span>';
  var mode='<span class="switch">'+
    '<button type="button" class="'+(schedMode==='week'?'on':'')+'" onclick="schedMode=\'week\';daySel=null;renderSched()">'+IC.week+'週</button>'+
    '<button type="button" class="'+(schedMode==='cal'?'on':'')+'" onclick="schedMode=\'cal\';daySel=null;renderSched()">'+IC.cal+'月</button>'+
    '<button type="button" class="'+(schedMode==='list'?'on':'')+'" onclick="schedMode=\'list\';daySel=null;renderSched()">'+IC.list+'リスト</button></span>';
  var infBtn='<span class="switch"><button type="button" class="tl'+(infShow?' on':'')+'" onclick="infShow=!infShow;renderSched()">'+IC.tv+'インフォマ放送 '+(infShow?'表示中':'非表示')+'</button>'+
    '<button type="button" class="'+(draftShow?'on':'')+'" onclick="draftShow=!draftShow;renderSched()">初稿締切 '+(draftShow?'表示中':'非表示')+'</button></span>';
  var rows=allRows();
  var body = schedMode==='week' ? weekHtml(rows)
           : schedMode==='cal'  ? calHtml(rows)
           : (listHtml(rows)+(infShow?infListHtml():''));
  var dayp = (schedMode==='list') ? '' : dayPanelHtml(rows);
  $('view').innerHTML=watchHtml()+'<div class="panel"><div class="bar">'+segAll+mode+infBtn+'</div>'+
    '<div class="bar" style="padding-top:8px;padding-bottom:8px"><span class="segrow"><span class="seglbl">スクール</span><span class="switch">'+segBtns('school')+'</span></span></div>'+
    '<div class="bar" style="padding-top:8px;padding-bottom:8px"><span class="segrow"><span class="seglbl">非スクール</span><span class="switch">'+segBtns('talent')+'</span></span></div>'+'<div class="bar" style="padding-top:8px;padding-bottom:8px;row-gap:6px"><span class="seglbl">色＝制作状況</span>'+
    '<span class="stag" style="background:#E7F0FA">企画</span><span class="stag" style="background:#DDEBF7">台本</span><span class="stag" style="background:#FCE5CD">撮影</span><span class="stag" style="background:#FFF2CC">編集</span><span class="stag" style="background:#F4CCCC">修正中</span><span class="stag" style="background:#D9D2E9">社内確認中</span><span class="stag" style="background:#CFE2F3">納品=投稿待ち</span><span class="stag" style="background:#D9D9D9;color:#606060">投稿済=完了</span><span class="stag" style="background:transparent;border:1.5px dashed var(--border-strong);color:var(--ink-2)"><span class="dlabel" style="margin-right:4px">初稿</span>点線＝初稿締切</span><span class="stag" style="background:#F6EEFF;box-shadow:inset 0 0 0 1.5px #a855f7;color:#4c1d95"><span class="ibadge" style="margin-right:4px">放送</span>紫枠＝インフォマ放送</span></div>'+
    '<div class="bar" style="padding-top:8px;padding-bottom:8px;row-gap:8px"><span class="seglbl">進捗チェック</span>'+
    '<span class="lgi">'+chkHtml('')+'未入力</span>'+
    '<span class="lgi">'+chkHtml('企画')+'企画</span>'+
    '<span class="lgi">'+chkHtml('台本')+'台本</span>'+
    '<span class="lgi">'+chkHtml('撮影')+'撮影中</span>'+
    '<span class="lgi">'+chkHtml('編集')+'編集中</span>'+
    '<span class="lgi">'+chkHtml('修正中')+'修正中</span>'+
    '<span class="lgi">'+chkHtml('社内確認中')+'社内確認中</span>'+
    '<span class="lgi">'+chkHtml('納品')+'納品＝投稿待ち</span>'+
    '<span class="lgi">'+chkHtml('投稿済')+'投稿済＝完了</span></div>'+body+'</div>'+dayp+
    '<p class="note">チップの<b>塗り色＝制作状況</b>（運用スケジュールシートの「状況」と同じ色）、<b>左端の縦線＝スクール／案件</b>の色です。<br>'+
    'カレンダーのマスは1件1行で表示し、<b>日付をクリックすると担当・媒体・投稿リンクまで含めた詳細</b>がその下に開きます（4件以上の日は「＋ほか◯件」）。</p>';
}

/* 変更監視：毎朝のスナップショット比較で「前日にあって今日は無い」行・リンク・完パケを表示
   （シートには一切書き込まない。編集者はシートの「版の履歴」／セル右クリック「編集履歴を表示」で確認） */
var WKIND={row:'行が消えた',link:'リンクが消えた',pack:'完パケが消えた',rename:'タイトル変更'};
function watchHtml(){
  var W=B.watch; if(!W) return '';
  var items=(W.items||[]).filter(function(it){
    if(curCase==='ALL') return true;
    if(curCase==='SCHOOL') return !!SCHOOL_SET[it.case];
    if(curCase==='TALENT') return !SCHOOL_SET[it.case];
    return it.case===curCase;
  });
  var head='<div class="bar wbar"><span class="seglbl">変更監視</span>'+
    '<b>前日'+(W.prevDate?'（'+esc(W.prevDate.slice(5).replace('-','/'))+'）':'')+'との比較で消えた行・リンク</b>'+
    '<span class="wcount'+(items.length?' has':'')+'">'+(W.prevDate?items.length+'件':'初回のため比較なし')+'</span>'+
    (W.at?'<span class="wat">確認 '+esc(W.at.replace(/^\d{4}-/,'').replace('-','/').replace(' JST',''))+'</span>':'')+'</div>';
  var body;
  if(W.error) body='<div class="wnone">監視データを取得できませんでした（'+esc(W.error)+'）</div>';
  else if(!W.prevDate) body='<div class="wnone">明日の朝から前日比の検知が始まります。</div>';
  else if(!items.length) body='<div class="wnone">消えた行・リンクはありません。</div>';
  else body=items.slice(0,60).map(function(it){
    return '<div class="wrow"><span class="wkind '+esc(it.kind)+'">'+(WKIND[it.kind]||it.kind)+'</span>'+
      '<span class="wcase" style="border-left:3px solid '+scColor(it.case)+'">'+esc(it.case)+'</span>'+
      '<span class="wdate">'+esc(it.date||'--')+'</span>'+
      '<span class="wtitle">'+esc(it.title)+'</span>'+
      (it.detail?'<span class="wdet">'+esc(it.detail)+'</span>':'')+'</div>';
  }).join('')+(items.length>60?'<div class="wnone">…ほか'+(items.length-60)+'件</div>':'');
  return '<div class="panel wpanel">'+head+body+
    '<div class="wfoot">毎朝の自動更新でシート全タブを保存し、前日と突き合わせています。消えた行を戻したいときは森本まで（保存データから復元できます）。誰の操作かはシートのセル右クリック→「編集履歴を表示」で分かります。</div></div>';
}

var SCHOOL_COLORS={"HERO'ZZ":'#990000',"CREATOR'ZZ":'#1C4587','RVA':'#B45F06','AI+':'#38761D','MERISE':'#351C75',
 'REAL VALUE':'#0891b2','LASTCALL':'#111827','星乃リア':'#db2777','ねぶたちゃん':'#0d9488','溝口勇児':'#4b5563'};
function scColor(n){ return SCHOOL_COLORS[n]||'#7c5cf0'; }
var MAXCHIP=4;

/* 日付キーごとに、その日の予定（投稿・初稿締切・インフォマ放送）を集める */
function dayBuckets(rows,y,m){
  var by={};
  function push(d,o){ if(d&&d.getFullYear()===y&&d.getMonth()===m)(by[d.getDate()]=by[d.getDate()]||[]).push(o); }
  rows.forEach(function(r){ push(pd(r.date),{k:'post',r:r}); });
  if(draftShow) rows.forEach(function(r){ if(r.draft&&r.draft!==r.date) push(pd(r.draft),{k:'draft',r:r}); });
  if(infShow) infFiltered().forEach(function(a){ push(pd(a[0]),{k:'inf',a:a}); });
  var rank={inf:0,post:1,draft:2};
  Object.keys(by).forEach(function(d){
    by[d].sort(function(a,b){
      if(rank[a.k]!==rank[b.k]) return rank[a.k]-rank[b.k];
      var ta=(a.r&&a.r.time)||'', tb=(b.r&&b.r.time)||'';
      if(!ta&&tb) return 1; if(ta&&!tb) return -1;
      return ta<tb?-1:ta>tb?1:0;
    });
  });
  return by;
}
function timeChip(t){
  t=String(t||'').trim();
  if(/^\d{1,2}$/.test(t)) return t+':00';
  if(/^\d{1,2}:\d{2}$/.test(t)) return t;
  if(/^\d{1,2}時$/.test(t)) return t.replace('時','')+':00';
  return '';   /* 「8/27確定予定」のような時刻以外のメモはチップに出さず詳細パネルで見せる */
}
function chipHtml(e){
  if(e.k==='inf'){
    return '<div class="cent infm" style="border-left-color:'+scColor(e.a[1])+'" title="インフォマ放送：'+esc(e.a[2])+'（'+esc(e.a[1])+'）">'+
      '<span class="ct"><span class="ibadge">放送</span>'+esc(e.a[2])+'</span></div>';
  }
  var r=e.r;
  if(e.k==='draft'){
    return '<div class="cent draft" style="border-left-color:'+scColor(r.sc)+'" title="初稿締切：'+esc(r.title)+'（'+esc(r.sc)+'・投稿予定 '+esc(r.date)+'）">'+
      '<span class="ct"><span class="dlabel">初稿</span>'+esc(r.title)+'</span></div>';
  }
  var c=STATUS_COLORS[r.status]||'#e8ecf2';
  return '<div class="cent'+(r.status==='投稿済'?' done':'')+'" style="background:'+c+';border-left-color:'+scColor(r.sc)+'" '+
    'title="'+esc(r.title)+'（'+esc(r.sc)+'・'+esc(r.status||'予定')+(r.media?'・'+esc(r.media):'')+(r.editor?'・'+esc(r.editor):'')+'）">'+
    '<span class="ct">'+chkHtml(r.status)+
    (timeChip(r.time)?'<span class="ctime">'+esc(timeChip(r.time))+'</span>':'')+esc(r.title)+'</span></div>';
}

/* ===== 週表示（スイムレーン）＝行=案件／列=7日。1マスあたり1〜3件になるので折り返して全文出せる ===== */
function wkStart(d){ var x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate()-x.getDay()); return x; }
function weekShift(n){ weekCur=new Date(weekCur); weekCur.setDate(weekCur.getDate()+n*7); daySel=null; renderSched(); }
function weekToday(){ weekCur=wkStart(new Date()); daySel=null; renderSched(); }
function scopedCases(){
  return B.sched.filter(function(c){
    if(curCase==='SCHOOL') return c.seg==='school';
    if(curCase==='TALENT') return c.seg==='talent';
    if(!isAgg()) return c.name===curCase;
    return true;
  });
}
function wkChip(e){
  if(e.k==='inf'){
    return '<div class="wke infm" title="インフォマ放送：'+esc(e.a[2])+'"><span class="ibadge">放送</span>'+esc(e.a[2])+'</div>';
  }
  var r=e.r;
  if(e.k==='draft'){
    return '<div class="wke draft" title="初稿締切：'+esc(r.title)+'（投稿予定 '+esc(r.date)+'）"><span class="dlabel">初稿</span>'+esc(r.title)+'</div>';
  }
  var c=STATUS_COLORS[r.status]||'#e8ecf2', tc=timeChip(r.time);
  return '<div class="wke'+(r.status==='投稿済'?' done':'')+'" style="background:'+c+'" '+
    'title="'+esc(r.title)+'（'+esc(r.status||'予定')+(r.editor?'・'+esc(r.editor):'')+'）">'+
    chkHtml(r.status)+
    (tc?'<span class="wkt">'+esc(tc)+'</span>':'')+mediaBadge(r.media)+' '+esc(r.title)+'</div>';
}
function weekHtml(rows){
  if(!weekCur) weekCur=wkStart(new Date());
  var days=[],i;
  for(i=0;i<7;i++){ var d=new Date(weekCur); d.setDate(d.getDate()+i); days.push(d); }
  var tnow=new Date(); tnow.setHours(0,0,0,0);
  function dk(d){ return d.getMonth()+'/'+d.getDate(); }
  var by={};
  function push(sc,d,o){ if(!d) return; var k=sc+'|'+dk(d); (by[k]=by[k]||[]).push(o); }
  rows.forEach(function(r){ push(r.sc,pd(r.date),{k:'post',r:r}); });
  if(draftShow) rows.forEach(function(r){ if(r.draft&&r.draft!==r.date) push(r.sc,pd(r.draft),{k:'draft',r:r}); });
  if(infShow) infFiltered().forEach(function(a){ push(a[1],pd(a[0]),{k:'inf',a:a}); });
  var rank={inf:0,post:1,draft:2};
  Object.keys(by).forEach(function(k){ by[k].sort(function(a,b){
    if(rank[a.k]!==rank[b.k]) return rank[a.k]-rank[b.k];
    var ta=(a.r&&a.r.time)||'',tb=(b.r&&b.r.time)||'';
    if(!ta&&tb) return 1; if(ta&&!tb) return -1; return ta<tb?-1:ta>tb?1:0; }); });

  var head='<div class="wkh corner"></div>';
  days.forEach(function(d){
    var isT=d.getTime()===tnow.getTime(), w=d.getDay();
    head+='<div class="wkh'+(w===0?' sun':w===6?' sat':'')+(isT?' today':'')+'">'+
      '<span class="wd">'+'日月火水木金土'.charAt(w)+'</span>'+
      '<span class="wn">'+(d.getMonth()+1)+'/'+d.getDate()+'</span></div>';
  });
  var body='',total=0;
  scopedCases().forEach(function(c){
    var cells='',n=0;
    days.forEach(function(d){
      var list=by[c.name+'|'+dk(d)]||[]; n+=list.length;
      var key=d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
      var isT=d.getTime()===tnow.getTime(), w=d.getDay();
      cells+='<div class="wkc'+((w===0||w===6)?' wknd':'')+(isT?' today':'')+(daySel===key?' sel':'')+
        '" onclick="selDay(\''+key+'\')">'+list.map(wkChip).join('')+'</div>';
    });
    total+=n;
    body+='<div style="display:contents" class="'+(n?'':'wkrow-empty')+'">'+
      '<div class="wklbl">'+logoTile(c.name,20,c.seg,46)+'<span class="wnm">'+esc(c.name)+'</span></div>'+cells+'</div>';
  });
  var s0=days[0],s6=days[6];
  var label=(s0.getMonth()+1)+'/'+s0.getDate()+'（'+'日月火水木金土'.charAt(s0.getDay())+'）〜 '+(s6.getMonth()+1)+'/'+s6.getDate()+'（'+'日月火水木金土'.charAt(s6.getDay())+'）';
  return '<div class="wkhead"><button class="btn" type="button" onclick="weekShift(-1)">'+IC.chevL+'前週</button>'+
    '<span class="wm">'+label+'</span>'+
    '<button class="btn" type="button" onclick="weekShift(1)">翌週'+IC.chevR+'</button>'+
    '<button class="btn" type="button" onclick="weekToday()">今週</button>'+
    '<span class="spacer"></span><span class="note" style="margin:0">この週 '+total+'件 ／ 行＝案件・色＝制作状況。日付をクリックで詳細</span></div>'+
    '<div class="wkwrap"><div class="wkgrid">'+head+body+'</div></div>';
}

function calHtml(rows){
  var y=calCur.y,m=calCur.m;
  var by=dayBuckets(rows,y,m);
  var first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  var tnow=new Date(),thisMonth=tnow.getFullYear()===y&&tnow.getMonth()===m;
  var cells='';
  ['日','月','火','水','木','金','土'].forEach(function(w,i){cells+='<div class="ch'+(i===0?' sun':i===6?' sat':'')+'">'+w+'</div>';});
  for(var i=0;i<first;i++)cells+='<div class="cday out"></div>';
  for(var d=1;d<=days;d++){
    var list=by[d]||[];
    var shown, over=0;
    if(isAgg()&&list.length>MAXCHIP){
      var g={},ord=[];
      list.forEach(function(e){ var nm=e.k==='inf'?e.a[1]:e.r.sc; if(!g[nm]){g[nm]=0;ord.push(nm);} g[nm]++; });
      shown=ord.slice(0,5).map(function(nm){
        return '<div class="csum"><span class="cs-d" style="background:'+scColor(nm)+'"></span>'+
          '<span class="cs-t">'+esc(nm)+'</span><span class="cs-n">'+g[nm]+'</span></div>';
      }).join('');
      over=ord.length>5?(ord.length-5):0;
      if(over){ shown+='<button type="button" class="cmore">＋ほか '+over+'案件</button>'; over=0; }
    } else {
      shown=list.slice(0,MAXCHIP).map(chipHtml).join('');
      over=list.length-MAXCHIP;
    }
    var key=y+'-'+m+'-'+d;
    var dow=(first+d-1)%7;
    cells+='<div class="cday'+(thisMonth&&tnow.getDate()===d?' today':'')+((dow===0||dow===6)?' wk':'')+
      (daySel===key?' sel':'')+'" onclick="selDay(\''+key+'\')">'+
      '<div class="dhead"><span class="dnum">'+d+'</span>'+
      (list.length?'<span class="dcnt">'+list.length+'件</span>':'')+'</div>'+
      shown+(over>0?'<button type="button" class="cmore">＋ほか '+over+'件</button>':'')+'</div>';
  }
  var rem=(first+days)%7; if(rem)for(var j=rem;j<7;j++)cells+='<div class="cday out"></div>';
  return '<div class="calhead"><button class="btn" type="button" onclick="calShift(-1)">'+IC.chevL+'前月</button><span class="cm">'+y+'年'+(m+1)+'月</span>'+
    '<button class="btn" type="button" onclick="calShift(1)">翌月'+IC.chevR+'</button><button class="btn" type="button" onclick="calToday()">今日</button>'+
    '<span class="spacer"></span><span class="note" style="margin:0">日付をクリックするとその日の詳細が下に開きます</span></div>'+
    '<div class="calwrap"><div class="cal">'+cells+'</div></div>';
}
function selDay(k){ daySel=(daySel===k?null:k); renderSched();
  if(daySel){ var el=document.getElementById('dayp'); if(el&&el.scrollIntoView) el.scrollIntoView({block:'nearest'}); } }
function dayPanelHtml(rows){
  if(!daySel) return '';
  var p=daySel.split('-'),y=+p[0],m=+p[1],d=+p[2];
  if(schedMode==='cal'&&(m!==calCur.m||y!==calCur.y)) return '';
  var list=(dayBuckets(rows,y,m)[d])||[];
  var dt=new Date(y,m,d);
  var head='<div class="dph"><span class="dpd">'+(m+1)+'月'+d+'日（'+'日月火水木金土'.charAt(dt.getDay())+'）</span>'+
    '<span class="dpn">'+(list.length?list.length+'件':'予定なし')+'</span>'+
    '<button class="btn close" type="button" onclick="selDay(\''+daySel+'\')">閉じる</button></div>';
  if(!list.length) return '<div class="panel dayp" id="dayp">'+head+'<p class="note dpempty">この日の予定は入っていません。</p></div>';
  var body=list.map(function(e){
    if(e.k==='inf'){
      return '<div class="fixrow inf"><span class="tc">放送</span>'+
        '<div class="fx"><span class="sctag tl">'+esc(e.a[1])+'</span> '+esc(e.a[2])+'</div>'+
        '<span class="ibadge">インフォマ</span></div>';
    }
    var r=e.r;
    if(e.k==='draft'){
      return '<div class="fixrow"><span class="tc">初稿締切</span>'+
        '<div class="fx"><span class="sctag'+(r.seg==='talent'?' tl':'')+'">'+esc(r.sc)+'</span> '+mediaBadge(r.media)+' '+esc(r.title)+
        '<small>／投稿予定 '+esc(r.date)+'</small></div>'+(r.status?stag(r.status):'')+'</div>';
    }
    var tc=timeChip(r.time);
    return '<div class="fixrow"><span class="tc num">'+esc(tc||'時刻未定')+'</span>'+
      '<div class="fx"><span class="sctag'+(r.seg==='talent'?' tl':'')+'">'+esc(r.sc)+'</span> '+mediaBadge(r.media)+' '+esc(r.title)+
      (!tc&&r.time?'<small>／'+esc(r.time)+'</small>':'')+
      (r.editor?'<small>／'+esc(r.editor)+'</small>':'')+
      linkChips(r.links)+stepsHtml(r)+'</div>'+
      chkHtml(r.status)+
      (r.status?stag(r.status):'')+'</div>';
  }).join('');
  return '<div class="panel dayp" id="dayp">'+head+body+'</div>';
}

function listHtml(rows){
  var t0=new Date();t0.setHours(0,0,0,0);
  var undated=[],up=[],past=[];
  rows.forEach(function(r){var d=pd(r.date);
    if(!d){ if(r.title) undated.push(r); return; }
    r._d=d;(d>=t0?up:past).push(r);});
  up.sort(function(a,b){return a._d-b._d;});
  past.sort(function(a,b){return b._d-a._d;});
  function tr(r){var d=r._d;
    var ds=d?(d.getMonth()+1)+'/'+d.getDate()+'（'+'日月火水木金土'.charAt(d.getDay())+'）':'—';
    return '<tr><td class="num">'+ds+(r.time?' '+esc(r.time):'')+(r.draft&&r.draft!==r.date?'<div class="draftd">初稿 '+esc(r.draft)+'</div>':'')+'</td>'+
      (isAgg()?'<td><span class="sctag'+(r.seg==='talent'?' tl':'')+'">'+esc(r.sc)+'</span></td>':'')+
      '<td class="wr">'+esc(r.title)+linkChips(r.links)+'</td><td>'+mediaBadge(r.media)+'</td><td>'+chkHtml(r.status)+stag(r.status)+'</td><td>'+esc(r.editor||'')+'</td></tr>';}
  function sec(title,arr){if(!arr.length)return '';
    return '<div class="grp-h2">'+title+'</div><div class="tbl-scroll"><table><thead><tr><th>投稿日</th>'+
      (isAgg()?'<th>案件</th>':'')+'<th>コンテンツ</th><th>媒体</th><th>状況</th><th>担当</th></tr></thead><tbody>'+arr.map(tr).join('')+'</tbody></table></div>';}
  return sec('<span class="gdot" style="background:var(--accent)"></span>今後の予定 — 期日が近い順（'+up.length+'件）',up)+
    sec('<span class="gdot" style="background:var(--warn)"></span>日付未定・制作中（'+undated.length+'件）',undated)+
    sec('<span class="gdot" style="background:var(--good)"></span>直近の投稿済み — 新しい順（'+past.length+'件）',past);
}

/* ---------- インフォマ（放送カレンダー・台本/配信進行） ---------- */
function infFiltered(){
  if(curCase==='TALENT') return [];
  return INF.air.filter(function(a){ return isAgg() || a[1]===curCase; });
}
function infDated(arr){
  return arr.map(function(a){ return {d:pd(a[0]),s:a[1],p:a[2]}; })
            .filter(function(x){ return x.d; })
            .sort(function(a,b){ return a.d-b.d; });
}
function infAirList(arr,hideSchool){
  return agendaHtml(arr.map(function(x){
    return { d:x.d, main:'<span class="ibadge">放送</span> '+esc(x.p),
      right:hideSchool?'':'<span class="sctag tl">'+esc(x.s||'—')+'</span>' };
  }));
}
function infListHtml(){
  var t0=new Date(); t0.setHours(0,0,0,0);
  var up=infDated(infFiltered()).filter(function(x){ return x.d>=t0; });
  if(!up.length) return '';
  var rows=up.map(function(x){
    return '<tr><td class="num">'+(x.d.getMonth()+1)+'/'+x.d.getDate()+'（'+'日月火水木金土'.charAt(x.d.getDay())+'）</td>'+
      '<td><span class="sctag tl">'+esc(x.s||'—')+'</span></td><td class="wr">'+esc(x.p)+'</td></tr>';
  }).join('');
  return '<div class="grp-h2"><span class="gdot" style="background:#a855f7"></span>インフォマ放送予定 — 期日が近い順（'+up.length+'件）</div>'+
    '<div class="tbl-scroll"><table><thead><tr><th>放送日</th><th>スクール</th><th>番組</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function infProgTable(prog){
  if(!prog.length) return '<p class="note">台本・配信の進行はまだ入力されていません。</p>';
  var ord={bad:0,warn:1,none:2,good:3};
  var ps=prog.slice().sort(function(a,b){
    var x=ord[infAlertCls(a[7])],y=ord[infAlertCls(b[7])];
    if(x!==y) return x-y;
    var da=pd(a[3]),db=pd(b[3]); if(!da) return 1; if(!db) return -1; return da-db;
  });
  var rows=ps.map(function(p){
    return '<tr><td><span class="ibadge'+(p[0]==='配信'?' k2':'')+'">'+esc(p[0])+'</span></td>'+
      '<td><span class="sctag tl">'+esc(p[2]||'—')+'</span></td>'+
      '<td class="wr">'+esc(p[1]||'（番組未定）')+(p[8]?' <small style="color:var(--ink-3);font-weight:500">／ '+esc(p[8])+'</small>':'')+'</td>'+
      '<td class="num">'+esc(p[3]||'—')+'</td>'+
      '<td>'+(p[4]?stag(p[4]):'—')+'</td><td>'+esc(p[5]||'')+'</td>'+
      '<td class="num">'+esc(p[6]||'—')+'</td>'+
      '<td><span class="ialert a-'+infAlertCls(p[7])+'">'+esc(p[7]||'—')+'</span></td></tr>';
  }).join('');
  return '<div class="panel"><div class="tbl-scroll"><table><thead><tr><th>区分</th><th>スクール</th><th>番組・メモ</th><th>撮影／配信日</th><th>ステータス</th><th>担当</th><th>期限</th><th>アラート</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function infCases(){
  var seen={},list=[];
  B.sched.forEach(function(c){ seen[c.name]=seen[c.name]||0; });
  INF.air.forEach(function(a){ if(a[1]&&!seen[a[1]+'|x']){ seen[a[1]+'|x']=1; list.push(a[1]); } });
  INF.prog.forEach(function(p){ if(p[2]&&!seen[p[2]+'|x']){ seen[p[2]+'|x']=1; list.push(p[2]); } });
  return list;
}
function setInfCase(n){ infCase=n; infDaySel=null; renderInfoma(); }
function infAirF(){ return INF.air.filter(function(a){ return infCase==='ALL'||a[1]===infCase; }); }
function infProgF(){ return INF.prog.filter(function(p){ return infCase==='ALL'||p[2]===infCase; }); }
function infKindLabel(p){ return p[0]==='台本'?'撮影':'配信'; }
function infDueLabel(p){ return p[0]==='台本'?'台本FIX期限':'確認/リンク期限'; }

/* インフォマのカレンダー：放送日＋撮影/収録日＋期限を同じ月グリッドに乗せる */
function infBuckets(y,m){
  var by={};
  function push(d,o){ if(d&&d.getFullYear()===y&&d.getMonth()===m)(by[d.getDate()]=by[d.getDate()]||[]).push(o); }
  infAirF().forEach(function(a){ push(pd(a[0]),{k:'air',a:a}); });
  infProgF().forEach(function(p){
    if(p[3]) push(pd(p[3]),{k:'prog',p:p});
    if(p[6]&&p[6]!==p[3]) push(pd(p[6]),{k:'due',p:p});
  });
  var rank={air:0,prog:1,due:2};
  Object.keys(by).forEach(function(d){ by[d].sort(function(a,b){ return rank[a.k]-rank[b.k]; }); });
  return by;
}
function infChip(e){
  if(e.k==='air'){
    return '<div class="cent infm" style="border-left-color:'+scColor(e.a[1])+'" title="放送：'+esc(e.a[2])+'（'+esc(e.a[1])+'）">'+
      '<span class="ct"><span class="ibadge" style="background:'+scColor(e.a[1])+'">放送</span>'+esc(e.a[2])+'</span></div>';
  }
  var p=e.p, nm=p[1]||'（番組未定）';
  if(e.k==='due'){
    return '<div class="cent draft" style="border-left-color:'+scColor(p[2])+'" title="'+esc(infDueLabel(p))+'：'+esc(nm)+'（'+esc(p[2])+'・'+esc(p[4]||'—')+'）">'+
      '<span class="ct"><span class="dlabel" style="border-color:'+scColor(p[2])+';color:'+scColor(p[2])+'">期限</span>'+esc(nm)+'</span></div>';
  }
  var c=STATUS_COLORS[p[4]]||'#e8ecf2';
  return '<div class="cent" style="background:'+c+';border-left-color:'+scColor(p[2])+'" title="'+esc(infKindLabel(p))+'：'+esc(nm)+'（'+esc(p[2])+'・'+esc(p[4]||'—')+'）">'+
    '<span class="ct"><span class="ibadge" style="background:'+scColor(p[2])+'">'+esc(infKindLabel(p))+'</span>'+esc(nm)+'</span></div>';
}
function infCalShift(n){ infCal.m+=n; if(infCal.m<0){infCal.m=11;infCal.y--;} if(infCal.m>11){infCal.m=0;infCal.y++;} infDaySel=null; renderInfoma(); }
function infCalToday(){ var t=new Date(); infCal={y:t.getFullYear(),m:t.getMonth()}; infDaySel=null; renderInfoma(); }
function infSelDay(k){ infDaySel=(infDaySel===k?null:k); renderInfoma(); }
function infCalHtml(){
  var y=infCal.y,m=infCal.m,by=infBuckets(y,m);
  var first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  var tnow=new Date(),thisMonth=tnow.getFullYear()===y&&tnow.getMonth()===m;
  var cells='';
  ['日','月','火','水','木','金','土'].forEach(function(w,i){cells+='<div class="ch'+(i===0?' sun':i===6?' sat':'')+'">'+w+'</div>';});
  for(var i=0;i<first;i++)cells+='<div class="cday out"></div>';
  for(var d=1;d<=days;d++){
    var list=by[d]||[];
    var key=y+'-'+m+'-'+d, dow=(first+d-1)%7;
    var over=list.length-MAXCHIP;
    cells+='<div class="cday'+(thisMonth&&tnow.getDate()===d?' today':'')+((dow===0||dow===6)?' wk':'')+
      (infDaySel===key?' sel':'')+'" onclick="infSelDay(\''+key+'\')">'+
      '<div class="dhead"><span class="dnum">'+d+'</span>'+
      (list.length?'<span class="dcnt">'+list.length+'件</span>':'')+'</div>'+
      list.slice(0,MAXCHIP).map(infChip).join('')+
      (over>0?'<button type="button" class="cmore">＋ほか '+over+'件</button>':'')+'</div>';
  }
  var rem=(first+days)%7; if(rem)for(var j=rem;j<7;j++)cells+='<div class="cday out"></div>';
  return '<div class="calhead"><button class="btn" type="button" onclick="infCalShift(-1)">'+IC.chevL+'前月</button>'+
    '<span class="cm">'+y+'年'+(m+1)+'月</span>'+
    '<button class="btn" type="button" onclick="infCalShift(1)">翌月'+IC.chevR+'</button>'+
    '<button class="btn" type="button" onclick="infCalToday()">今日</button>'+
    '<span class="spacer"></span><span class="note" style="margin:0">日付をクリックするとその日の詳細が下に開きます</span></div>'+
    '<div class="calwrap"><div class="cal">'+cells+'</div></div>';
}
function infDayPanelHtml(){
  if(!infDaySel) return '';
  var q=infDaySel.split('-'),y=+q[0],m=+q[1],d=+q[2];
  if(y!==infCal.y||m!==infCal.m) return '';
  var list=(infBuckets(y,m)[d])||[], dt=new Date(y,m,d);
  var head='<div class="dph"><span class="dpd">'+(m+1)+'月'+d+'日（'+'日月火水木金土'.charAt(dt.getDay())+'）</span>'+
    '<span class="dpn">'+(list.length?list.length+'件':'予定なし')+'</span>'+
    '<button class="btn close" type="button" onclick="infSelDay(\''+infDaySel+'\')">閉じる</button></div>';
  if(!list.length) return '<div class="panel dayp" id="infdayp">'+head+'<p class="note dpempty">この日の予定は入っていません。</p></div>';
  var body=list.map(function(e){
    if(e.k==='air'){
      return '<div class="fixrow inf"><span class="tc">放送</span>'+
        '<div class="fx"><span class="sctag tl">'+esc(e.a[1])+'</span> '+esc(e.a[2])+'</div>'+
        '<span class="ibadge">インフォマ</span></div>';
    }
    var p=e.p, nm=p[1]||'（番組未定）';
    return '<div class="fixrow"><span class="tc">'+esc(e.k==='due'?'期限':infKindLabel(p))+'</span>'+
      '<div class="fx"><span class="sctag tl">'+esc(p[2]||'—')+'</span> '+
      '<span class="ibadge'+(p[0]==='配信'?' k2':' k3')+'">'+esc(p[0])+'</span>'+esc(nm)+
      (p[5]?'<small>／担当 '+esc(p[5])+'</small>':'')+
      (e.k==='due'?'<small>／'+esc(infDueLabel(p))+'</small>':(p[6]?'<small>／'+esc(infDueLabel(p))+' '+esc(p[6])+'</small>':''))+
      (p[8]?'<small>／'+esc(p[8])+'</small>':'')+'</div>'+
      (p[4]?stag(p[4]):'')+'<span class="ialert a-'+infAlertCls(p[7])+'">'+esc(p[7]||'—')+'</span></div>';
  }).join('');
  return '<div class="panel dayp" id="infdayp">'+head+body+'</div>';
}
function renderInfoma(){
  if(!infCal){ var tn=new Date(); infCal={y:tn.getFullYear(),m:tn.getMonth()}; }
  var t0=new Date(); t0.setHours(0,0,0,0); var now=new Date();
  var air=infDated(infAirF());
  var up=air.filter(function(x){ return x.d>=t0; });
  var past=air.filter(function(x){ return x.d<t0; }).reverse();
  var thisMo=air.filter(function(x){ return x.d.getFullYear()===now.getFullYear()&&x.d.getMonth()===now.getMonth(); }).length;
  var prog=infProgF();
  var over=prog.filter(function(p){ return infAlertCls(p[7])==='bad'; }).length;
  var next=up.length?((up[0].d.getMonth()+1)+'/'+up[0].d.getDate()):'—';
  var tiles='<div class="ktiles">'+
    '<div class="kt cvt"><span class="ktl">今後の放送</span><span class="ktv">'+up.length+'<small class="ktt">本</small></span></div>'+
    '<div class="kt"><span class="ktl">直近の放送日</span><span class="ktv">'+next+'</span></div>'+
    '<div class="kt"><span class="ktl">今月の放送</span><span class="ktv">'+thisMo+'<small class="ktt">本</small></span></div>'+
    '<div class="kt"><span class="ktl">進行アラート超過</span><span class="ktv '+(over?'c-bad':'c-good')+'">'+over+'</span></div>'+
    '<div class="kt"><span class="ktl">進行中の行数</span><span class="ktv">'+prog.length+'</span></div></div>';
  var sw='<span class="switch"><button type="button" class="'+(infCase==='ALL'?'on':'')+'" onclick="setInfCase(\'ALL\')">'+IC.all+'すべて</button>'+
    infCases().map(function(n){ return '<button type="button" class="sc'+(infCase===n?' on':'')+'" onclick="setInfCase(\''+n.replace(/'/g,"\\'")+'\')">'+esc(n)+'</button>'; }).join('')+'</span>';
  var mode='<span class="switch"><button type="button" class="'+(infMode==='cal'?'on':'')+'" onclick="infMode=\'cal\';renderInfoma()">'+IC.cal+'カレンダー</button>'+
    '<button type="button" class="'+(infMode==='list'?'on':'')+'" onclick="infMode=\'list\';renderInfoma()">'+IC.list+'リスト</button></span>';
  var legend='<div class="bar" style="padding-top:8px;padding-bottom:8px;row-gap:6px"><span class="seglbl">カレンダーの見方</span>'+
    '<span class="stag" style="background:#F6EEFF;box-shadow:inset 0 0 0 1.5px #a855f7;color:#4c1d95"><span class="ibadge" style="margin-right:4px">放送</span>放送日</span>'+
    '<span class="stag" style="background:#FFF2CC"><span class="ibadge k3" style="margin-right:4px">撮影</span>撮影・収録日／配信日</span>'+
    '<span class="stag" style="background:transparent;border:1.5px dashed var(--border-strong);color:var(--ink-2)"><span class="dlabel" style="margin-right:4px">期限</span>台本FIX・確認の期限</span>'+
    '<span class="stag" style="background:#D9EAD3">塗り色＝進行ステータス</span></div>'+
    (infCase==='ALL'?'<div class="bar" style="padding-top:8px;padding-bottom:8px;row-gap:6px"><span class="seglbl">バッジの色</span>'+
      infCases().map(function(n){ return '<span class="lgi"><i class="ld" style="background:'+scColor(n)+'"></i>'+esc(n)+'</span>'; }).join('')+'</div>':'');
  var body = infMode==='cal'
    ? '<div class="panel">'+legend+infCalHtml()+'</div>'+infDayPanelHtml()
    : sh3('放送予定 — 期日が近い順')+
      '<div class="panel" style="padding:4px 16px 12px">'+(infAirList(up,infCase!=='ALL')||'<p class="note" style="margin:10px 0">今後の放送予定はまだ入っていません。</p>')+'</div>'+
      (past.length?sh3('放送済み — 新しい順（'+past.length+'件）')+'<div class="panel" style="padding:4px 16px 12px">'+infAirList(past,infCase!=='ALL')+'</div>':'');
  $('view').innerHTML=tiles+
    '<div class="panel" style="margin-bottom:14px"><div class="bar">'+sw+mode+
    '<span class="spacer"></span><span class="note" style="margin:0">スクール×インフォマ管理シート</span></div></div>'+
    body+
    sh3('台本・配信の進行管理 — 遅れている順')+infProgTable(prog)+
    '<p class="note">出典＝<b>スクール×インフォマ管理シート</b>（④放送カレンダー／⑤台本進行管理／⑥配信進行管理）。ステータス・期限・アラートはシート側の入力と自動計算をそのまま表示しています。</p>';
}

function numv(x){ return (x===null||x===undefined||x==='')?null:+x; }
function kst(t,pace,a){ if(t===null||t===0||a===null)return 'none'; if(!pace)return a>0?'good':'none'; var r=a/pace; return r>=1?'good':r>=0.6?'warn':'bad'; }
function kpiCardHtml(c){
  var pr=[],lastG='';
  var rows=c.kpis.map(function(k){
    var t=numv(k[1]),pace=numv(k[2]),a=numv(k[3]);
    var st=kst(t,pace,a);
    var ratio=(pace&&a!==null)?a/pace:null;
    if(t&&ratio!==null) pr.push(Math.min(ratio,3));
    var w=ratio!==null?Math.min(Math.max(ratio*100,0),100):0;
    var isCv=/LINE|面談/.test(k[0]);
    var pct=ratio!==null?Math.round(ratio*100)+'%':'—';
    var g=isCv?'CV':(/投稿本数/.test(k[0])?'投稿本数':(/再生|閲覧|インプレ|視聴/.test(k[0])?'再生・インプレッション':(/フォロワー|登録者/.test(k[0])?'フォロワー・登録':'')));
    var hd=(g&&g!=='CV'&&g!==lastG)?'<div class="ksec">'+g+'</div>':'';
    if(g)lastG=g;
    var mon=(t&&a!==null)?Math.round(a/t*100)+'%':'—';
    return hd+'<div class="krow2'+(isCv?' cvrow':'')+'"><span class="kn2'+(isCv?' cv':'')+'" title="月間目標 '+(t===null?'—':t.toLocaleString())+'">'+(isCv?'<span class="cvmark">CV</span>':'')+esc(k[0])+'</span>'+
      '<span class="kv2"><b>'+(a===null?'—':a.toLocaleString())+'</b><span class="tgt"> /月間 '+(t===null?'—':t.toLocaleString())+'</span></span>'+
      '<span class="kbar"><i class="b-'+st+'" style="width:'+w+'%"></i></span><span class="kp2 c-'+st+'">'+pct+'</span><span class="kmn">月間 '+mon+'</span></div>';
  }).join('');
  var avg=pr.length?Math.round(pr.reduce(function(x,y){return x+y;},0)/pr.length*100):null;
  var ost=avg===null?'none':avg>=100?'good':avg>=60?'warn':'bad';
  return '<div class="kcard"><div class="kh2">'+logoTile(c.name,28,c.seg,72)+'<span class="knm">'+esc(c.name)+'</span>'+
    '<span class="kovwrap"><span class="kovlbl">現時点達成率</span><span class="kov c-'+ost+'">'+(avg===null?'—':avg+'%')+'</span></span></div>'+
    '<div class="ovbar"><i class="b-'+ost+'" style="width:'+(avg===null?0:Math.min(avg,100))+'%"></i></div>'+rows+'</div>';
}
function caseStat(c){
  var pace=schoolAch(c), month=schoolMonthAch(c);
  return { pace:pace, month:month, st: pace===null?'none':pace>=100?'good':pace>=60?'warn':'bad' };
}
function worstKpi(c){
  var w=null, wr=1e9;
  c.kpis.forEach(function(k){ var t=numv(k[1]),pace=numv(k[2]),a=numv(k[3]);
    if(t&&pace&&a!==null){ var r=a/pace; if(r<wr){ wr=r; w=k[0]; } } });
  return w;
}
function stLabel(st){ return st==='good'?'順調':st==='warn'?'注意':st==='bad'?'要対応':'未計測'; }
function sortedCases(all){
  var cs=all.filter(function(c){ return !kpiFilter || c._s.st===kpiFilter; }).slice();
  cs.sort(function(a,b){
    if(kpiSort==='name') return a.name<b.name?-1:1;
    var pa=a._s.pace===null?1e9:a._s.pace, pb=b._s.pace===null?1e9:b._s.pace;
    return kpiSort==='desc' ? (pb===1e9?-1e9:pb)-(pa===1e9?-1e9:pa) : pa-pb;
  });
  return cs;
}
function graphHtml(cases){
  var rows=cases.map(function(c){
    var p=c._s.pace;
    return '<div class="hb"><span class="hl">'+esc(c.name)+'</span>'+
      '<span class="htrack"><i class="b-'+c._s.st+'" style="width:'+(p===null?0:Math.min(p,100))+'%"></i></span>'+
      '<span class="hv c-'+c._s.st+'">'+(p===null?'—':p+'%')+'</span>'+
      '<span class="hv2">月間 '+(c._s.month===null?'—':c._s.month+'%')+'</span></div>';
  }).join('');
  return '<div class="panel" style="padding:18px 20px"><div class="grp-h2" style="padding:0 0 10px">案件別 現時点達成率（バー=100%上限で表示）</div>'+rows+'</div>';
}
function tableHtml(cases){
  var rows='';
  cases.forEach(function(c){
    c.kpis.forEach(function(k){
      var t=numv(k[1]),pace=numv(k[2]),a=numv(k[3]);
      var st=kst(t,pace,a);
      var pct=(pace&&a!==null)?Math.round(a/pace*100)+'%':'—';
      var mon=(t&&a!==null)?Math.round(a/t*100)+'%':'—';
      var isCv=/LINE|面談/.test(k[0]);
      rows+='<tr><td>'+esc(c.name)+'</td><td class="wr" style="font-weight:600">'+(isCv?'<span class="cvmark">CV</span>':'')+esc(k[0])+'</td>'+
        '<td class="num" style="text-align:right"><b>'+(a===null?'—':a.toLocaleString())+'</b></td>'+
        '<td class="num" style="text-align:right;color:var(--ink-3)">'+(t===null?'—':t.toLocaleString())+'</td>'+
        '<td class="num c-'+st+'" style="text-align:right;font-weight:800">'+pct+'</td>'+
        '<td class="num" style="text-align:right;color:var(--ink-2)">'+mon+'</td></tr>';
    });
  });
  return '<div class="panel"><div class="tbl-scroll"><table><thead><tr><th>案件</th><th>KPI</th><th style="text-align:right">実績</th><th style="text-align:right">月間目標</th><th style="text-align:right">現時点達成率</th><th style="text-align:right">月間達成率</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function reportText(all){
  var L=[];
  L.push('■ YOAKE スクール横串オーガニック KPI報告（'+B.kpiBasis+'）');
  L.push('');
  ['bad','warn','good','none'].forEach(function(st){
    var cs=all.filter(function(c){ return c._s.st===st; });
    if(!cs.length) return;
    L.push('【'+stLabel(st)+'】');
    cs.forEach(function(c){
      var line='・'+c.name+'：現時点 '+(c._s.pace===null?'—':c._s.pace+'%')+' ／ 月間 '+(c._s.month===null?'—':c._s.month+'%');
      if(st==='bad'||st==='warn'){ var w=worstKpi(c); if(w) line+='（最遅れ: '+w+'）'; }
      L.push(line);
    });
    L.push('');
  });
  L.push('ボード: https://tinyurl.com/wein-sns-board');
  return L.join('\n');
}
function copyReport(){
  var ta=$('repTa'); ta.select();
  var done=function(){ var b=$('repCopy'); b.textContent='コピーしました'; setTimeout(function(){ b.textContent='テキストをコピー'; },1600); };
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(ta.value).then(done); }
  else { document.execCommand('copy'); done(); }
}
function reportHtml(all){
  return '<div class="panel" style="padding:16px 18px"><div class="grp-h2" style="padding:0 0 8px">定例報告フォーマット（そのままコピーしてチャットに貼れます）</div>'+
    '<textarea id="repTa" class="repta" readonly>'+esc(reportText(all))+'</textarea>'+
    '<div style="margin-top:10px"><button class="btn" id="repCopy" type="button" onclick="copyReport()">テキストをコピー</button></div></div>';
}
function renderKpi(){
  var seg='<span class="switch">'+[['all','すべて'],['school','スクール'],['talent','タレント']].map(function(x){
    return '<button type="button" class="'+(kpiSeg===x[0]?'on':'')+'" onclick="kpiSeg=\''+x[0]+'\';renderKpi()">'+x[1]+'</button>';}).join('')+'</span>';
  var view='<span class="switch">'+[['card','カード'],['graph','グラフ'],['table','テーブル'],['report','報告']].map(function(x){
    return '<button type="button" class="'+(kpiView===x[0]?'on':'')+'" onclick="kpiView=\''+x[0]+'\';renderKpi()">'+x[1]+'</button>';}).join('')+'</span>';
  var all=B.kpi.filter(function(c){ return kpiSeg==='all'||c.seg===kpiSeg; });
  all.forEach(function(c){ c._s=caseStat(c); });
  var chips='<span class="switch">'+[['','すべて'],['good','順調'],['warn','注意'],['bad','要対応'],['none','未計測']].map(function(x){
    return '<button type="button" class="'+(kpiFilter===x[0]?'on':'')+'" onclick="kpiFilter=\''+x[0]+'\';renderKpi()">'+(x[0]?'<i class="ld b-'+x[0]+'" style="width:8px;height:8px;border-radius:2px;display:inline-block;margin-right:4px"></i>':'')+x[1]+'</button>';}).join('')+'</span>';
  var sort='<span class="switch">'+[['asc','低い順'],['desc','高い順'],['name','名前順']].map(function(x){
    return '<button type="button" class="'+(kpiSort===x[0]?'on':'')+'" onclick="kpiSort=\''+x[0]+'\';renderKpi()">'+x[1]+'</button>';}).join('')+'</span>';
  var cases=sortedCases(all);
  var body;
  if(kpiView==='graph') body=graphHtml(cases);
  else if(kpiView==='table') body=tableHtml(cases);
  else if(kpiView==='report') body=reportHtml(all);
  else body='<div class="kgrid">'+cases.map(kpiCardHtml).join('')+'</div>';
  $('view').innerHTML=
    '<div class="panel" style="margin-bottom:14px"><div class="bar">'+seg+view+
    '<span class="spacer"></span><span class="note" style="margin:0">'+esc(B.kpiBasis)+'</span></div>'+
    (kpiView!=='report'?'<div class="bar" style="padding-top:8px;padding-bottom:8px">'+chips+sort+
    '<span class="lgd" style="margin-left:auto"><span class="lgi"><i class="ld b-good"></i>順調 100%〜</span><span class="lgi"><i class="ld b-warn"></i>注意 60%〜</span><span class="lgi"><i class="ld b-bad"></i>要対応 〜60%</span></span></div>':'')+'</div>'+
    body+
    '<p class="note"><b>%＝現時点達成率</b>（現在実績 ÷ 今日までのペース目標）。「/月間」＝月間目標。<span class="cvmark">CV</span>＝コンバージョン（LINE登録・面談予約）。</p>';
}
render();
