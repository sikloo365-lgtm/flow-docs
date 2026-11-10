(()=>{'use strict';
const $=s=>document.querySelector(s),key='line-stop-proposal-v1';
const empty=()=>({running:false,repair:'normal',startedAt:null,lastLabel:null,pausedElapsed:0,count:686,mode:'demo',notified:false,level:'waiting',events:[],message:'',scene:'작업 시작을 눌러 시연해보세요.'});
let state=empty(),tasks=[],auto=false;
function read(){try{const v=JSON.parse(localStorage.getItem(key));if(v&&typeof v.running==='boolean'&&['normal','called','fixing'].includes(v.repair)&&['demo','real'].includes(v.mode)&&Array.isArray(v.events)){state={...empty(),...v};}}catch{}}
read();const view=new URLSearchParams(location.search).get('view');if(['monitor','keeper'].includes(view))document.body.dataset.view=view;
const stamp=t=>t?new Date(t).toLocaleTimeString('ko-KR',{hour12:false}):'—';
function elapsed(now=Date.now()){if(!state.running)return 0;if(state.repair==='fixing')return state.pausedElapsed;return Math.max(0,(now-(state.lastLabel||state.startedAt||now))/1000);}
function limits(){return state.mode==='demo'?[10,20]:[300,600];}
function level(){const s=elapsed(),[y,r]=limits();return !state.running?'waiting':s>=r?'red':s>=y?'yellow':'normal';}
function log(text){state.events.unshift({at:Date.now(),text});state.events=state.events.slice(0,6);state.scene=text;}
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{}render();}
function work(){if(state.running){state.running=false;state.level='waiting';log('작업 완료 신호 전달 · 정지 감시 종료');}else{state.running=true;state.startedAt=Date.now();state.lastLabel=null;state.pausedElapsed=0;state.notified=false;state.message='';state.level='normal';log('작업 시작 신호 전달 · 라벨 정지 감시 시작');}save();}
function label(){if(!state.running||state.repair==='fixing')return;state.lastLabel=Date.now();state.count++;state.notified=false;state.level='normal';log('라벨 발행 신호 전달 · 정지 타이머 초기화');save();}
function repair(){if(state.repair==='normal'){state.repair='called';log('설비 호출 전달 · 정지 타이머 계속 진행');}else if(state.repair==='called'){state.pausedElapsed=elapsed();state.repair='fixing';log('수리 중 신호 전달 · 경과시간과 경보 단계 상승 일시 정지');}else{state.repair='normal';state.startedAt=Date.now();state.lastLabel=null;state.pausedElapsed=0;state.notified=false;state.level=state.running?'normal':'waiting';log('수리 완료 신호 전달 · 정지 타이머 초기화');}save();}
function tick(){read();const current=level();if(current!==state.level){state.level=current;if(current==='yellow')log('라벨 발행 지연 · 황색 점등 시작');if(current==='red')log('장시간 라벨 발행 지연 · 적색 점등 시작');save();}
if(current==='red'&&!state.notified&&state.repair!=='fixing'){state.notified=true;state.message=`[생산라인 정지 알림 · 시연]\n조립 01 / 키퍼 검사\n라벨 발행 ${state.mode==='demo'?'20초':'10분'} 이상 지연\n마지막 라벨: ${stamp(state.lastLabel)}\n현장 확인을 요청합니다.`;log('지정 번호 문자 발송 시연 완료 · 실제 문자 미발송');save();}render();}
function render(){const l=level(),s=Math.floor(elapsed()),seconds=String(s%60).padStart(2,'0'),minutes=String(Math.floor(s/60)).padStart(2,'0');$('#elapsed').textContent=minutes+':'+seconds;
for(const [id,color]of [['red','red'],['amber','yellow'],['green','normal']])$('#'+id).classList.toggle('active',l===color);
const status={waiting:'작업 대기',normal:'정상 진행',yellow:'주의 · 라벨 지연',red:'정지 경보 · 라벨 지연'};$('#alarm').className='status-tag '+l;$('#alarm').textContent=status[l];
const repairs={normal:'정상',called:'설비 호출',fixing:'수리 중'};$('#monitor-work').textContent=state.running?'작업 중':'작업 대기';$('#row-work').textContent=state.running?'진행 중':'대기';$('#monitor-repair').textContent=$('#row-repair').textContent=repairs[state.repair];
$('#keeper-signal').textContent=state.running?'작업 중':'대기';$('#last-label').textContent=stamp(state.lastLabel);$('#sequence').textContent=$('#keeper-seq').textContent=String(state.count).padStart(4,'0');
$('#timer-note').textContent=!state.running?'작업 시작 전에는 정지 알림이 발생하지 않습니다.':state.repair==='fixing'?'수리 중: 타이머와 경보 단계 상승을 멈췄습니다.':state.repair==='called'?'설비 호출 상태에서도 타이머는 계속 진행됩니다.':!state.lastLabel?'첫 라벨 전에는 작업 시작시각부터 측정합니다.':'라벨 발행시각을 기준으로 정지 시간을 측정합니다.';
$('#work').className=state.running?'complete':'start';$('#work-text').textContent=state.running?'작업 완료':'작업 시작';$('#work-icon').textContent=state.running?'■':'▶';$('#work-sub').textContent=state.running?'완료 신호 전송 · 정지 감시 종료':'라인 모니터로 시작 신호 전송';
const controls={normal:['call','설비 호출','호출 후에도 정지 타이머 유지','⌁'],called:['fixing','수리 중','누르면 정지 타이머 일시 정지','Ⅱ'],fixing:['done','수리 완료','누르면 정지 타이머 초기화','✓']}[state.repair];$('#repair').className=controls[0];$('#repair-text').textContent=controls[1];$('#repair-sub').textContent=controls[2];$('#repair-icon').textContent=controls[3];$('#label').disabled=!state.running||state.repair==='fixing';
$('#step-call').classList.toggle('active',state.repair==='called');$('#step-fixing').classList.toggle('active',state.repair==='fixing');$('#step-done').classList.toggle('active',state.repair==='normal'&&state.events.some(e=>e.text.startsWith('수리 완료')));
$('#mode').value=state.mode;$('#normal-rule').textContent=state.mode==='demo'?'10초 미만':'5분 미만';$('#yellow-rule').textContent=state.mode==='demo'?'10초 이상':'5분 이상';$('#red-rule').textContent=state.mode==='demo'?'20초 이상':'10분 이상';$('#scene').textContent=state.scene;
$('#sms-preview').textContent=state.message||'적색 경보가 발생하면 이곳에 문자 발송 시연이 표시됩니다.';$('#sms-preview').classList.toggle('sent',!!state.message);$('#sms-state').textContent=state.message?'발송 시연 기록 · 실제 문자는 발송하지 않았습니다.':'실제 문자는 발송하지 않습니다.';
const sig=JSON.stringify(state.events);if($('#events').dataset.sig!==sig){$('#events').dataset.sig=sig;$('#events').replaceChildren();if(!state.events.length){const li=document.createElement('li');li.className='empty';li.textContent='아직 전달된 신호가 없습니다.';$('#events').append(li);}for(const e of state.events){const li=document.createElement('li'),time=document.createElement('time'),span=document.createElement('span');time.textContent=stamp(e.at);span.textContent=e.text;li.append(time,span);$('#events').append(li);}}
$('#clock').textContent=new Date().toLocaleString('ko-KR',{hour12:false});$('#date').textContent=new Date().toLocaleDateString('ko-KR',{month:'2-digit',day:'2-digit'});
}
function stopAuto(){tasks.forEach(clearTimeout);tasks=[];auto=false;$('#auto').textContent='▶ 자동 시연 · 38초';}
function reset(){stopAuto();state=empty();save();}
$('#work').addEventListener('click',()=>{stopAuto();work();});$('#repair').addEventListener('click',()=>{stopAuto();repair();});$('#label').addEventListener('click',()=>{stopAuto();label();});$('#reset').addEventListener('click',reset);
$('#mode').addEventListener('change',e=>{stopAuto();const mode=e.target.value;state=empty();state.mode=mode;log('알림 기준 변경 · 새 작업을 시작해주세요.');save();});
$('#auto').addEventListener('click',()=>{if(auto){stopAuto();log('자동 시연 정지 · 버튼으로 직접 조작할 수 있습니다.');save();return;}reset();auto=true;$('#auto').textContent='■ 자동 시연 정지';work();for(const [ms,fn]of [[2000,label],[24000,repair],[26000,repair],[30000,repair],[32000,label],[36000,work],[38000,()=>{stopAuto();log('자동 시연 완료 · 다시 시작하거나 직접 조작해보세요.');save();}]])tasks.push(setTimeout(fn,ms));});
window.addEventListener('storage',e=>{if(e.key===key){stopAuto();read();render();}});render();setInterval(tick,100);
})();
// Independent PC screen viewports: scroll, zoom, fit and expand do not affect machine state.
(()=>{
 for(const tools of document.querySelectorAll('.view-tools')){
  const panel=tools.closest('.panel'),pan=panel.querySelector('.screen-pan'),surface=pan.querySelector('.legacy-surface');let scale=1;
  function zoom(value){scale=Math.max(.15,Math.min(3,value));surface.style.zoom=scale;tools.querySelector('output').textContent=Math.round(scale*100)+'%';}
  tools.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.pan)pan.scrollBy({left:Number(b.dataset.pan)*pan.clientWidth*.65,behavior:'smooth'});if(b.dataset.zoom)zoom(scale+Number(b.dataset.zoom)*.1);if(b.hasAttribute('data-fit')){zoom(Math.min((pan.clientWidth-3)/parseFloat(getComputedStyle(surface).width),(pan.clientHeight-3)/(surface.scrollHeight||580)));pan.scrollTo(0,0);}if(b.hasAttribute('data-expand')){const w=document.querySelector('#workspace'),id=tools.dataset.for;if(w.dataset.expanded===id){delete w.dataset.expanded;b.textContent='크게 보기';}else{w.dataset.expanded=id;b.textContent='반반 보기';}}});
  let pinch=null;
  const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  pan.addEventListener('touchstart',e=>{if(e.touches.length!==2)return;e.preventDefault();const rect=pan.getBoundingClientRect(),x=(e.touches[0].clientX+e.touches[1].clientX)/2-rect.left,y=(e.touches[0].clientY+e.touches[1].clientY)/2-rect.top;pinch={distance:distance(e.touches),scale,x:(pan.scrollLeft+x)/scale,y:(pan.scrollTop+y)/scale};},{passive:false});
  pan.addEventListener('touchmove',e=>{if(!pinch||e.touches.length!==2)return;e.preventDefault();const rect=pan.getBoundingClientRect(),x=(e.touches[0].clientX+e.touches[1].clientX)/2-rect.left,y=(e.touches[0].clientY+e.touches[1].clientY)/2-rect.top;zoom(pinch.scale*distance(e.touches)/Math.max(1,pinch.distance));pan.scrollLeft=pinch.x*scale-x;pan.scrollTop=pinch.y*scale-y;},{passive:false});
  pan.addEventListener('touchend',()=>{pinch=null;});pan.addEventListener('touchcancel',()=>{pinch=null;});
  pan.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();zoom(scale+(e.deltaY<0?.1:-.1));}else if(e.shiftKey){e.preventDefault();pan.scrollLeft+=e.deltaY;}},{passive:false});
 }
})();
