import { useState, useEffect, useMemo } from "react";

const GC = {
  "Equity":"#3B82F6","Resto":"#8B5CF6",
  "Bonos":"#10B981","Commodities":"#F59E0B",
  "Macro":"#EF4444","Crypto":"#EC4899",
};
const LB=55, SHOW=55;

function analyze(idA, idB, prices) {
  const oA=prices[idA], oB=prices[idB];
  if(!oA||!oB) return null;
  const n=Math.min(oA.high.length, oB.high.length);
  const rHigh=[], rLow=[], rMid=[];
  for(let i=0;i<n;i++){
    const h=oA.high[i]/oB.low[i];
    const l=oA.low[i]/oB.high[i];
    rHigh.push(h); rLow.push(l); rMid.push((h+l)/2);
  }
  const upper=[], lower=[];
  for(let i=0;i<n;i++){
    if(i<LB){upper.push(null);lower.push(null);continue;}
    upper.push(Math.max(...rHigh.slice(i-LB,i)));
    lower.push(Math.min(...rLow.slice(i-LB,i)));
  }
  const cur=rMid[n-1], prev=rMid[n-2];
  const uNow=upper[n-1], lNow=lower[n-1];
  const uPrev=upper[n-2], lPrev=lower[n-2];
  const crossUp  =uNow!=null&&cur>uNow &&prev!=null&&prev<=uPrev;
  const crossDown=lNow!=null&&cur<lNow &&prev!=null&&prev>=lPrev;
  const above=uNow!=null&&cur>uNow;
  const below=lNow!=null&&cur<lNow;
  const base=rMid[n-SHOW]||rMid[0];
  const mSlice=rMid.slice(-SHOW).map(v=>(v/base)*100);
  const uSlice=upper.slice(-SHOW).map(v=>v!=null?(v/base)*100:null);
  const lSlice=lower.slice(-SHOW).map(v=>v!=null?(v/base)*100:null);
  const changePct=((cur/base)-1)*100;
  const growing=cur>=base;
  return {mSlice,uSlice,lSlice,above,below,crossUp,crossDown,changePct,growing};
}

function computeRanking(assets, prices) {
  const N=assets.length;
  return assets.map(a=>{
    let wins=0, totalPct=0;
    assets.forEach(b=>{
      if(b.id===a.id) return;
      const d=analyze(a.id,b.id,prices);
      if(!d) return;
      if(d.growing) wins++;
      totalPct+=d.changePct;
    });
    return {asset:a,wins,losses:N-1-wins,score:wins,total:N-1,avgPct:totalPct/(N-1)};
  }).sort((a,b)=>b.score-a.score);
}

function DetailChart({asset,baseId,assets,prices,onClose}){
  const d=analyze(asset.id,baseId,prices);
  const base=assets.find(a=>a.id===baseId);
  const gc=GC[asset.group];
  if(!d) return null;
  const W=400,H=100;
  const allVals=[...d.mSlice,...d.uSlice.filter(Boolean),...d.lSlice.filter(Boolean)];
  const mn=Math.min(...allVals),mx=Math.max(...allVals),rng=mx-mn||1;
  const toY=v=>H-((v-mn)/rng)*H;
  const toX=i=>(i/(d.mSlice.length-1))*W;
  const vi=d.uSlice.map((u,i)=>(u!==null&&d.lSlice[i]!==null)?i:null).filter(i=>i!==null);
  const band=vi.length?vi.map(i=>`${toX(i)},${toY(d.uSlice[i])}`).join(" ")+" "+[...vi].reverse().map(i=>`${toX(i)},${toY(d.lSlice[i])}`).join(" "):"";
  const uL=vi.map(i=>`${toX(i)},${toY(d.uSlice[i])}`).join(" ");
  const lL=vi.map(i=>`${toX(i)},${toY(d.lSlice[i])}`).join(" ");
  const mL=d.mSlice.map((v,i)=>`${toX(i)},${toY(v)}`).join(" ");
  const lc=d.above?"#34D399":d.below?"#F87171":"#64748B";
  const dc=d.crossUp?"#A78BFA":d.crossDown?"#FB923C":lc;
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(2,8,23,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#0A0F1E",border:`1px solid ${gc}40`,borderRadius:12,padding:24,width:480,maxWidth:"95vw"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:"#F1F5F9"}}>{asset.label}</div>
            <div style={{fontSize:10,color:"#334155"}}>vs {base?.label} · Donchian {LB}d · High/Low real</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:14,fontWeight:800,fontFamily:"monospace",color:d.changePct>=0?"#34D399":"#F87171"}}>{d.changePct>=0?"+":""}{d.changePct.toFixed(1)}% <span style={{fontSize:9,opacity:0.5}}>55d</span></span>
            <button onClick={onClose} style={{background:"transparent",border:"none",color:"#475569",fontSize:18,cursor:"pointer"}}>✕</button>
          </div>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block",height:110}}>
          {band&&<polygon points={band} fill={`${gc}14`} stroke="none"/>}
          {uL&&<polyline points={uL} fill="none" stroke={`${gc}55`} strokeWidth={1}/>}
          {lL&&<polyline points={lL} fill="none" stroke={`${gc}55`} strokeWidth={1}/>}
          <line x1={0} y1={toY(100)} x2={W} y2={toY(100)} stroke="#1E293B" strokeWidth={1} strokeDasharray="3,3"/>
          <polyline points={mL} fill="none" stroke={lc} strokeWidth={2.5} strokeLinejoin="round"/>
          <circle cx={toX(d.mSlice.length-1)} cy={toY(d.mSlice[d.mSlice.length-1])} r={5} fill={dc} stroke="#020817" strokeWidth={2}/>
        </svg>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#1E3A5F",marginTop:6}}>
          <span>55d atrás = 100</span>
          <span>{d.above?"Sobre canal":d.below?"Bajo canal":"Dentro del canal"}</span>
          <span>hoy</span>
        </div>
      </div>
    </div>
  );
}

function Row({asset,baseId,prices,onClick}){
  const d=analyze(asset.id,baseId,prices);
  if(!d) return null;
  const gc=GC[asset.group];
  const isCross=d.crossUp||d.crossDown;
  return (
    <div onClick={()=>onClick(asset)}
      style={{display:"flex",alignItems:"center",padding:"10px 20px",borderBottom:"1px solid #080e1c",cursor:"pointer",gap:12}}
      onMouseEnter={e=>e.currentTarget.style.background="#0d1525"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div style={{width:6,height:6,borderRadius:"50%",background:gc,flexShrink:0}}/>
      <div style={{flex:1,fontSize:14,fontWeight:700,color:"#E2E8F0"}}>{asset.label}</div>
      {isCross&&<div style={{fontSize:9,fontWeight:800,color:d.crossUp?"#A78BFA":"#FB923C",background:d.crossUp?"#A78BFA18":"#FB923C18",padding:"2px 7px",borderRadius:4,border:`1px solid ${d.crossUp?"#A78BFA40":"#FB923C40"}`,animation:"pulse 1.2s infinite"}}>{d.crossUp?"ENTRA":"SALE"}</div>}
      <div style={{fontSize:14,fontWeight:800,fontFamily:"monospace",color:d.changePct>=0?"#34D399":"#F87171",minWidth:70,textAlign:"right"}}>
        {d.changePct>=0?"+":""}{d.changePct.toFixed(1)}%<span style={{fontSize:8,opacity:0.4,marginLeft:2}}>55d</span>
      </div>
    </div>
  );
}

function RankingRow({item,rank,onClick}){
  const gc=GC[item.asset.group];
  const isWinner=item.wins>item.losses;
  const pct=Math.round((item.wins/item.total)*100);
  return (
    <div onClick={()=>onClick(item.asset)}
      style={{display:"flex",alignItems:"center",padding:"10px 20px",borderBottom:"1px solid #080e1c",cursor:"pointer",gap:12}}
      onMouseEnter={e=>e.currentTarget.style.background="#0d1525"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div style={{width:20,fontSize:11,fontWeight:800,color:"#1E3A5F",fontFamily:"monospace",textAlign:"right",flexShrink:0}}>{rank}</div>
      <div style={{width:6,height:6,borderRadius:"50%",background:gc,flexShrink:0}}/>
      <div style={{flex:1,fontSize:14,fontWeight:700,color:"#E2E8F0"}}>{item.asset.label}</div>
      <div style={{width:80,flexShrink:0}}>
        <div style={{height:4,background:"#0d1525",borderRadius:2,overflow:"hidden"}}>
          <div style={{width:`${pct}%`,height:"100%",background:isWinner?"#34D399":"#F87171",borderRadius:2}}/>
        </div>
      </div>
      <div style={{fontSize:13,fontWeight:800,fontFamily:"monospace",color:isWinner?"#34D399":"#F87171",minWidth:50,textAlign:"right"}}>{item.wins}/{item.total}</div>
      <div style={{fontSize:11,fontWeight:700,fontFamily:"monospace",color:item.avgPct>=0?"#34D39980":"#F8717180",minWidth:55,textAlign:"right"}}>
        {item.avgPct>=0?"+":""}{item.avgPct.toFixed(1)}%<span style={{fontSize:8,opacity:0.5,marginLeft:2}}>avg</span>
      </div>
    </div>
  );
}

export default function App(){
  const [prices,setPrices]=useState(null);
  const [assets,setAssets]=useState([]);
  const [updatedAt,setUpdatedAt]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [baseId,setBaseId]=useState("SPY");
  const [view,setView]=useState("flow");
  const [detail,setDetail]=useState(null);
  const [detailBase,setDetailBase]=useState("SPY");

  useEffect(()=>{
    fetch("data/prices.json")
      .then(r=>r.json())
      .then(d=>{setPrices(d.prices);setAssets(d.assets);setUpdatedAt(d.updated_at);setLoading(false);})
      .catch(e=>{setError(e.message);setLoading(false);});
  },[]);

  const others=useMemo(()=>assets.filter(a=>a.id!==baseId),[assets,baseId]);
  const baseAsset=assets.find(a=>a.id===baseId);

  const {flowing,leaving}=useMemo(()=>{
    if(!prices) return {flowing:[],leaving:[]};
    const all=others.map(a=>({asset:a,...(analyze(a.id,baseId,prices)||{})})).filter(d=>d.growing!==undefined);
    return {
      flowing:[...all.filter(d=>d.growing)].sort((a,b)=>b.changePct-a.changePct),
      leaving:[...all.filter(d=>!d.growing)].sort((a,b)=>a.changePct-b.changePct),
    };
  },[others,baseId,prices]);

  const ranking=useMemo(()=>{
    if(!prices) return [];
    return computeRanking(assets,prices);
  },[assets,prices]);

  if(loading) return <div style={{minHeight:"100vh",background:"#020817",display:"flex",alignItems:"center",justifyContent:"center",color:"#475569",fontFamily:"Inter,sans-serif",fontSize:14}}>Cargando precios...</div>;
  if(error) return (
    <div style={{minHeight:"100vh",background:"#020817",display:"flex",alignItems:"center",justifyContent:"center",color:"#F87171",fontFamily:"monospace",flexDirection:"column",gap:12,padding:24}}>
      <div style={{fontSize:16,fontWeight:700}}>No se encontró data/prices.json</div>
      <div style={{fontSize:12,color:"#475569"}}>Ejecuta primero:</div>
      <div style={{background:"#0F172A",padding:"12px 20px",borderRadius:8,fontSize:13,color:"#34D399"}}>python fetch_data.py</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#020817",color:"#E2E8F0",fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:48}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.15}} *{box-sizing:border-box}`}</style>

      {detail&&<DetailChart asset={detail} baseId={detailBase} assets={assets} prices={prices} onClose={()=>setDetail(null)}/>}

      <div style={{position:"sticky",top:0,zIndex:20,background:"#020817f4",backdropFilter:"blur(12px)",borderBottom:"1px solid #0a1020",padding:"20px 24px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:9,color:"#1E3A5F",letterSpacing:2,textTransform:"uppercase"}}>Capital Flow · Donchian {LB}d · High/Low</div>
            <div style={{fontSize:22,fontWeight:800,color:"#F1F5F9",letterSpacing:-0.5,marginTop:2}}>¿Dónde fluye el dinero?</div>
            {updatedAt&&<div style={{fontSize:9,color:"#1E3A5F",marginTop:2}}>Actualizado: {new Date(updatedAt).toLocaleString("es-CO",{timeZone:"America/Bogota"})}</div>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{display:"flex",background:"#0F172A",borderRadius:8,border:"1px solid #1E293B",overflow:"hidden"}}>
              {[["flow","Flujo"],["ranking","Ranking Global"]].map(([k,l])=>(
                <button key={k} onClick={()=>setView(k)} style={{padding:"6px 14px",fontSize:11,cursor:"pointer",border:"none",background:view===k?"#1E293B":"transparent",color:view===k?"#F1F5F9":"#475569",fontWeight:view===k?700:400}}>{l}</button>
              ))}
            </div>
            {view==="flow"&&<>
              <span style={{fontSize:10,color:"#334155"}}>vs</span>
              <select value={baseId} onChange={e=>setBaseId(e.target.value)}
                style={{background:"#0F172A",border:"1px solid #1E293B",color:"#F1F5F9",borderRadius:7,padding:"6px 10px",fontSize:12,cursor:"pointer"}}>
                {assets.map(a=><option key={a.id} value={a.id}>{a.label} ({a.id})</option>)}
              </select>
            </>}
          </div>
        </div>
      </div>

      {view==="flow"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:"calc(100vh - 120px)"}}>
          <div style={{borderRight:"1px solid #0a1020"}}>
            <div style={{padding:"12px 20px",borderBottom:"2px solid #F8717130",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:13,fontWeight:800,color:"#F87171"}}>↓ SALE DE</span>
              <span style={{fontSize:11,fontFamily:"monospace",color:"#F8717180"}}>{leaving.length}</span>
              <span style={{fontSize:9,color:"#1E3A5F",fontStyle:"italic"}}>ratio decreciente vs {baseAsset?.label}</span>
            </div>
            {leaving.map(({asset})=><Row key={asset.id} asset={asset} baseId={baseId} prices={prices} onClick={a=>{setDetailBase(baseId);setDetail(a);}}/>)}
          </div>
          <div>
            <div style={{padding:"12px 20px",borderBottom:"2px solid #34D39930",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:13,fontWeight:800,color:"#34D399"}}>↑ FLUYE HACIA</span>
              <span style={{fontSize:11,fontFamily:"monospace",color:"#34D39980"}}>{flowing.length}</span>
              <span style={{fontSize:9,color:"#1E3A5F",fontStyle:"italic"}}>ratio creciente vs {baseAsset?.label}</span>
            </div>
            {flowing.map(({asset})=><Row key={asset.id} asset={asset} baseId={baseId} prices={prices} onClick={a=>{setDetailBase(baseId);setDetail(a);}}/>)}
          </div>
        </div>
      )}

      {view==="ranking"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",padding:"10px 20px",borderBottom:"1px solid #0a1020",gap:12}}>
            <div style={{width:20}}/><div style={{width:6}}/>
            <div style={{flex:1,fontSize:9,color:"#1E3A5F",textTransform:"uppercase",letterSpacing:1}}>Activo</div>
            <div style={{width:80,fontSize:9,color:"#1E3A5F",textTransform:"uppercase",letterSpacing:1}}>Fuerza</div>
            <div style={{minWidth:50,textAlign:"right",fontSize:9,color:"#1E3A5F",textTransform:"uppercase",letterSpacing:1}}>Victorias</div>
            <div style={{minWidth:55,textAlign:"right",fontSize:9,color:"#1E3A5F",textTransform:"uppercase",letterSpacing:1}}>% Avg</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
            <div style={{borderRight:"1px solid #0a1020"}}>
              <div style={{padding:"10px 20px",borderBottom:"2px solid #34D39930",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,fontWeight:800,color:"#34D399"}}>↑ GANADORES</span>
                <span style={{fontSize:9,color:"#1E3A5F",fontStyle:"italic"}}>ganan contra la mayoría</span>
              </div>
              {ranking.filter(r=>r.wins>r.losses).map((item,i)=>(
                <RankingRow key={item.asset.id} item={item} rank={i+1} onClick={a=>{setDetailBase("SPY");setDetail(a);}}/>
              ))}
            </div>
            <div>
              <div style={{padding:"10px 20px",borderBottom:"2px solid #F8717130",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,fontWeight:800,color:"#F87171"}}>↓ PERDEDORES</span>
                <span style={{fontSize:9,color:"#1E3A5F",fontStyle:"italic"}}>pierden contra la mayoría</span>
              </div>
              {[...ranking].reverse().filter(r=>r.wins<=r.losses).map((item,i)=>(
                <RankingRow key={item.asset.id} item={item} rank={i+1} onClick={a=>{setDetailBase("SPY");setDetail(a);}}/>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
