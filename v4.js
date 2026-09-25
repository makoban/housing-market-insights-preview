(function(){
"use strict";
function esc(value){return String(value===undefined||value===null?"":value).replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]})}
function number(v){return Number(v).toLocaleString("ja-JP")}
function icon(name){return '<i data-lucide="'+esc(name)+'"></i>'}
function lookup(topics,name){return topics.find(function(x){return x.name===name})}
Promise.all([
 fetch("analysis.json",{cache:"no-store"}).then(function(r){if(!r.ok)throw Error("analysis");return r.json()}),
 fetch("snapshot.json",{cache:"no-store"}).then(function(r){if(!r.ok)throw Error("snapshot");return r.json()})
]).then(function(all){
 var data=all[0],old=all[1],topics=data.x.topics,topicNames=["住宅ローン","補助金","平屋","断熱","高価格帯"];
 var five=topicNames.map(function(n){return lookup(topics,n)}),down=five.filter(function(t){return t.change_pct<0}).length;
 document.getElementById("topic-direction").textContent="5テーマ中 "+down+"テーマ減";
 document.getElementById("starts-yoy").textContent="+"+data.mlit.july_yoy_pct.toFixed(1)+"%";
 document.getElementById("tracked-makers").textContent=number(data.makers.data.length)+"社";
 var observed=data.observed_counts;
 document.getElementById("social-factors").textContent=five.map(function(t){return t.name+" "+(t.change_pct>0?"+":"")+String(t.change_pct).replace("-","−")+"%"}).join("、");
 document.getElementById("housing-factors").textContent="7月 "+number(data.mlit.latest_detached_subdivision)+"戸（前年同月比 +"+data.mlit.july_yoy_pct.toFixed(1)+"%）。5〜7月 "+number(data.mlit.three_months_detached)+"戸（前年同期比 +"+data.mlit.three_months_yoy_pct.toFixed(1)+"%）。";
 document.getElementById("forecast-factors").textContent="Xの話題は"+down+"/5テーマで減少。一方、着工は +"+data.mlit.july_yoy_pct.toFixed(1)+"%。Xの話題を主に参考にした見通しです。金利・為替・株・金は別欄の参考情報です。";
 document.getElementById("risk-factors").textContent="取得した投稿本文"+number(observed.sampled_posts)+"件のうち、メーカーへの反応候補は延べ"+number(observed.target_reaction_candidates)+"件。継続的な広がりまでは読み取れません。";
 document.getElementById("maker-keyword-total").textContent=number(observed.maker_keyword_matches_31d)+"件";
 document.getElementById("sampled-post-total").textContent=number(observed.sampled_posts)+"件";
 document.getElementById("reaction-total").textContent=number(observed.target_reaction_candidates)+"件";
 document.getElementById("transaction-total-card").textContent=number(observed.mlit_land_and_building_cases)+"件";
 document.getElementById("registration-total").textContent=number(data.administrative_reference.registrations);
 function reactionSummary(m){
   if(!m.target_reactions)return '<div class="brand-summary brand-summary-empty">対象投稿にポジ・ネガの声はありません。</div>';
   var s=m.reaction_summary;
   var posBasis=m.positive?'好意 '+number(m.positive)+'件':m.mixed?'両面 '+number(m.mixed)+'件':'該当0件';
   var negBasis=m.negative?'懸念 '+number(m.negative)+'件':m.mixed?'両面 '+number(m.mixed)+'件':'該当0件';
   return '<div class="brand-summary"><div class="brand-summary-title">投稿で見られた声</div><div class="summary-line"><span class="summary-kind good">'+icon('thumbs-up')+'ポジ</span><p>'+esc(s.positive||'該当する声なし')+'<small>'+esc(posBasis)+'</small></p></div><div class="summary-line"><span class="summary-kind uneasy">'+icon('thumbs-down')+'ネガ</span><p>'+esc(s.negative||'該当する声なし')+'<small>'+esc(negBasis)+'</small></p></div>'+(s.context?'<p class="summary-context">'+esc(s.context)+'</p>':'')+'</div>';
 }
 function makerCard(m){
   var total=m.target_reactions||1;
   var good=Math.round(m.positive/total*100),mixed=Math.round(m.mixed/total*100),neg=Math.round(m.negative/total*100);
   var brandLogo=m.logo?'<img src="'+esc(m.logo)+'" alt="'+esc(m.name)+'のロゴ">':'<span class="logo-fallback">'+esc(m.name)+'</span>';
   var change=m.change_pct===null?'増減未算出':(m.change_pct>0?'+':'')+m.change_pct+'%';
   var changeClass=m.change_pct===null?'':m.change_pct<0?'down':'up';
   var trendIcon=m.change_pct===null?'circle-help':m.change_pct>0?'arrow-up-right':m.change_pct<0?'arrow-down-right':'minus';
   return '<article class="card brand-card"><div class="brand-header"><span class="brand-logo">'+brandLogo+'</span><div><h3>'+esc(m.name)+'</h3><small>31日間のX投稿</small></div></div><div class="brand-counts"><div><strong>'+number(m.keyword_count_31d)+'</strong><small>Xキーワード言及 / 31日</small></div><div><strong>'+number(m.target_reactions)+'</strong><small>反応候補 / 対象'+number(m.searched_posts)+'件</small></div></div><div class="brand-reaction"><div class="brand-reaction-title">投稿の反応内訳</div><div class="reaction-numbers"><span class="good">'+icon('thumbs-up')+'好意 <b>'+number(m.positive)+'</b></span><span class="uneasy">'+icon('thumbs-down')+'懸念 <b>'+number(m.negative)+'</b></span><span class="muted">両面 '+number(m.mixed)+'</span><span class="muted">中立 '+number(m.neutral)+'</span></div><div class="reaction-track" aria-hidden="true"><span class="good-fill" style="width:'+good+'%"></span><span class="mixed-fill" style="width:'+mixed+'%"></span><span class="negative-fill" style="width:'+neg+'%"></span></div></div>'+reactionSummary(m)+'<div class="brand-foot"><span>'+icon("users-round")+'独立投稿者 '+number(m.unique_authors)+'人</span><span class="change '+changeClass+'">'+icon(trendIcon)+'言及 '+esc(change)+'</span></div></article>'
 }
 function renderMakers(){
   var query=document.getElementById('maker-search').value.trim().toLowerCase();
   var sort=document.getElementById('maker-sort').value;
   var rows=data.makers.data.filter(function(m){return m.name.toLowerCase().includes(query)}).slice();
   if(sort==='volume')rows.sort(function(a,b){return b.keyword_count_31d-a.keyword_count_31d});
   if(sort==='positive')rows.sort(function(a,b){return b.positive-a.positive||b.target_reactions-a.target_reactions});
   document.getElementById('brand-grid').innerHTML=rows.length?rows.map(makerCard).join(''):'<div class="card brand-empty">一致するメーカーがありません。</div>';
   if(window.lucide)window.lucide.createIcons();
 }
 document.getElementById('maker-search').addEventListener('input',renderMakers);
 document.getElementById('maker-sort').addEventListener('change',renderMakers);
 renderMakers();
 var topicIcons={"住宅ローン":"landmark","補助金":"badge-japanese-yen","平屋":"house","断熱":"sun","高価格帯":"gem"};
 document.getElementById("topics-list").innerHTML=five.map(function(t){
   var pct=Math.max(t.earlier_15d,t.later_15d),w1=Math.round(t.earlier_15d/pct*100),w2=Math.round(t.later_15d/pct*100);
   var change=(t.change_pct>0?"+":"")+t.change_pct+"%";
   return '<div class="topic-row"><span class="topic-name">'+icon(topicIcons[t.name])+esc(t.name)+'</span><span class="topic-mini"><small>'+number(t.earlier_15d)+' → '+number(t.later_15d)+'</small><span class="topic-bars" aria-hidden="true"><i style="width:'+w1+'%"></i><i style="width:'+w2+'%"></i></span></span><span class="topic-change '+(t.change_pct<0?"down":"up")+'">'+change+'</span></div>'
 }).join("");
 document.getElementById("latest-starts").textContent=number(data.mlit.latest_detached_subdivision);
 document.getElementById("history-delta").textContent="前年同月比 +"+data.mlit.july_yoy_pct.toFixed(1)+"%";
 document.getElementById("three-month-trend").textContent="直近3か月（5〜7月）は "+number(data.mlit.three_months_detached)+"戸。前年同期比 +"+data.mlit.three_months_yoy_pct.toFixed(1)+"%。";
 var series=data.mlit.monthly,top=Math.max.apply(null,series.map(function(x){return x.detached_subdivision}));
 document.getElementById("bar-chart").innerHTML=series.map(function(m,i){
   var h=Math.round(m.detached_subdivision/top*148);
   return '<div class="bar '+(i===series.length-1?"latest ":"")+(m.month.endsWith("-01")?"bar-year":"")+'" style="height:'+h+'px" title="'+esc(m.month)+'：'+number(m.detached_subdivision)+'戸"></div>'
 }).join("");
 document.getElementById("bar-chart").setAttribute("aria-label","分譲一戸建て月別着工戸数。最初 "+series[0].month+" "+number(series[0].detached_subdivision)+"戸、最新 "+series[series.length-1].month+" "+number(series[series.length-1].detached_subdivision)+"戸。詳しい数値は次の表。");
 document.getElementById("history-table").innerHTML=series.map(function(m){return '<tr><td>'+esc(m.month)+'</td><td>'+number(m.detached_subdivision)+'</td><td>'+number(m.owner_occupied)+'</td><td>'+number(m.all_starts)+'</td></tr>'}).join("");
 var transaction=data.mlit_transactions,available=transaction.quarters.filter(function(q){return q.status===200&&q.median_price_yen}),maximum=Math.max.apply(null,available.map(function(q){return q.median_price_yen}));
 document.getElementById('transaction-period').textContent=transaction.latest_published_period;
 document.getElementById('transaction-price').textContent=number(Math.round(transaction.latest_median_price_yen/10000))+'万円';
 document.getElementById('transaction-cases').textContent='愛知県一宮市の公開事例 '+number(transaction.latest_published_cases)+'件';
 document.getElementById('transaction-bars').innerHTML=available.map(function(q){var h=Math.max(10,Math.round(q.median_price_yen/maximum*128));return '<span class="transaction-column '+(q.period===transaction.latest_published_period?'latest':'')+'" title="'+esc(q.period)+'：中央値'+number(Math.round(q.median_price_yen/10000))+'万円、公開事例'+number(q.land_and_building_published_cases)+'件"><span class="bar" style="height:'+h+'px"></span><small>'+esc(q.period.replace('20',''))+'</small></span>'}).join('');
 document.getElementById('transaction-bars').setAttribute('aria-label','愛知県一宮市の土地と建物の公開事例価格中央値。'+available.map(function(q){return q.period+' '+number(Math.round(q.median_price_yen/10000))+'万円'}).join('、'));
 document.getElementById("economy-grid").innerHTML=old.macro.map(function(m){return '<article class="card economic-card"><span class="econ-name">'+esc(m.name)+'</span><strong>'+esc(m.value)+'</strong><p>'+esc(m.change)+'</p><small>'+esc(m.date)+' · '+esc(m.frequency)+'</small><a href="'+esc(m.url)+'" target="_blank" rel="noopener noreferrer">出典：'+esc(m.source)+' ↗</a></article>'}).join("");
 document.getElementById("updated-at").textContent=new Date(data.built_at).toLocaleString("ja-JP",{timeZone:"Asia/Tokyo"});
 if(window.lucide)window.lucide.createIcons()
}).catch(function(err){
 document.querySelector(".status").textContent="データを表示できません";
 if(window.lucide)window.lucide.createIcons();
 console.error(err);
});
if(window.lucide)window.lucide.createIcons();
})();
