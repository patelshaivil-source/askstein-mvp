/* ── the reconstruction, reused on the content pages ─────────
   Same ambient field as the home screen (a slow, self-pulsing
   wireframe reconstruction with a literature point-cloud shell)
   so About / Corpus / Documentation / Contact read as part of
   the same product, not a separate static site. Runs ambient-
   only here — no retrieval/ignite calls, since these pages have
   no conversation to react to. Respects prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const cv=document.getElementById('field'); if(!cv) return;
  const ctx=cv.getContext('2d');
  const RM=matchMedia('(prefers-reduced-motion: reduce)');
  let W=0,H=0,DPR=1,t=0;
  const theme='light';

  function inkTriple(){ return '22,24,26'; }
  function mobileScale(){ return innerWidth<760 ? 0.55 : 1; }

  const TZ=0.38, TX=0.16;
  const cz=Math.cos(TZ), sz=Math.sin(TZ), cxx=Math.cos(TX), sxx=Math.sin(TX);

  const RING_PTS = 14;
  const RINGS_FEMUR = 44, RINGS_TIBIA = 38;
  const RINGS = (function(){
    const out=[];
    for(let i=0;i<=RINGS_FEMUR;i++){
      const u=i/RINGS_FEMUR;
      out.push({y:-2.30+u*2.21, rad:0.135+Math.pow(u,2.4)*0.255,
        cx:Math.sin(u*3.1)*0.05, cz:Math.sin(u*3.1)*0.022, bone:'femur', u, joint:u>0.87});
    }
    for(let i=0;i<=RINGS_TIBIA;i++){
      const u=i/RINGS_TIBIA;
      out.push({y:0.09+u*1.95, rad:0.305-Math.pow(u,1.6)*0.175,
        cx:-Math.sin(u*2.6)*0.045, cz:-Math.sin(u*2.6)*0.020, bone:'tibia', u, joint:u<0.11});
    }
    return out;
  })();

  let pts=[], links=[], drift=[];
  function buildDrift(){
    drift=[];
    const N = innerWidth<760 ? 20 : 54;
    for(let i=0;i<N;i++){
      drift.push({x:Math.random(), y:Math.random(),
        vx:(Math.random()-.5)*0.000010, vy:(Math.random()-.5)*0.000007,
        r:Math.random()*1.1+.4, ph:Math.random()*Math.PI*2, pr:0.00035+Math.random()*0.0005});
    }
  }
  function buildField(){
    pts=[];
    const N = innerWidth<760 ? 420 : 1300;
    const K = 22;
    const cents=[];
    for(let i=0;i<K;i++){
      const r = RINGS[Math.floor((i/K)*RINGS.length)];
      cents.push({x:r.cx,y:r.y,z:r.cz,rad:r.rad});
    }
    for(let i=0;i<N;i++){
      const c=cents[(Math.random()*cents.length)|0];
      const ang=Math.random()*6.28318;
      const shell=c.rad+0.05+Math.pow(Math.random(),1.6)*0.62;
      pts.push({x:c.x+Math.cos(ang)*shell, y:c.y+(Math.random()-.5)*0.11, z:c.z+Math.sin(ang)*shell,
                r:Math.random()*.6+.5, ph:Math.random()*Math.PI*2});
    }
    links=[];
    const ANCHORS = innerWidth<760 ? 50 : 130;
    for(let a=0;a<ANCHORS;a++){
      const i=(Math.random()*pts.length)|0, p=pts[i];
      let best=-1,bd=0.075;
      const scanFrom=Math.max(0,i-300), scanTo=Math.min(pts.length,i+300);
      for(let j=scanFrom;j<scanTo;j++){
        if(j===i) continue;
        const q=pts[j];
        const d=(p.x-q.x)**2+(p.y-q.y)**2+(p.z-q.z)**2;
        if(d<bd){bd=d;best=j;}
      }
      if(best>=0) links.push({i,j:best});
    }
  }

  function size(){
    DPR=Math.min(devicePixelRatio||1,2);
    W=innerWidth;H=innerHeight;
    cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+'px';cv.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    buildField(); buildDrift();
  }
  addEventListener('resize',size,{passive:true});

  function cam(){
    const cx=W*.5, cy=H*.48, scale=Math.min(W,H)*.90;
    return {cx,cy,scale,cy2:1,sy2:0,cx2:1,sx2:0,camZ:1.86};
  }
  function proj(x,y,z,c){
    let X=x*c.cy2 - z*c.sy2, Z=x*c.sy2 + z*c.cy2;
    let Y=y*c.cx2 - Z*c.sx2;  Z=y*c.sx2 + Z*c.cx2;
    const d=c.camZ+Z; if(d<=.18) return null;
    const k=1/d;
    return {x:c.cx+X*c.scale*k*1.05, y:c.cy+Y*c.scale*k*1.05, z:Z, k};
  }
  function boneOffsetX(){ return W<820 ? 0 : (W*0.5 - Math.max(60, Math.min(W*0.22, 360))); }
  function boneOffsetY(){ return W<820 ? H*0.02 : H*0.13; }

  function boneMesh(c){
    const OX=boneOffsetX(), OY=boneOffsetY();
    const spin = t*0.000085;
    const sway = Math.sin(t*0.00007)*0.045;
    const out=[];
    for(const r of RINGS){
      const rowPts=[];
      for(let k=0;k<RING_PTS;k++){
        const ang=(k/RING_PTS)*6.28318 + spin;
        let x=r.rad*Math.cos(ang)+r.cx+sway, y=r.y, z=r.rad*Math.sin(ang)+r.cz;
        let x1=x*cz - y*sz, y1=x*sz + y*cz;
        let y2=y1*cxx - z*sxx, z2=y1*sxx + z*cxx;
        const q=proj(x1,y2,z2,c);
        if(q){ q.x+=OX; q.y+=OY; }
        rowPts.push(q);
      }
      out.push(rowPts);
    }
    return out;
  }

  const ambient=0.85; // raised so the reconstruction reads as clearly on these pages as it does on the home screen

  function draw(){
    ctx.clearRect(0,0,W,H);
    const c=cam();
    const MS=mobileScale();
    const INK=inkTriple();

    for(const L of links){
      const p=pts[L.i], q0=pts[L.j];
      const a1=proj(p.x,p.y+Math.sin(t*.0006+p.ph)*.008,p.z,c);
      const a2=proj(q0.x,q0.y+Math.sin(t*.0006+q0.ph)*.008,q0.z,c);
      if(!a1||!a2) continue;
      const depth=Math.max(0,Math.min(1,(1.9-(a1.z+a2.z)/2)/3.0));
      const a=(0.05+depth*0.15)*ambient*MS;
      if(a<=.003) continue;
      ctx.strokeStyle='rgba('+INK+','+a.toFixed(3)+')';
      ctx.lineWidth=0.55;
      ctx.beginPath(); ctx.moveTo(a1.x,a1.y); ctx.lineTo(a2.x,a2.y); ctx.stroke();
    }

    for(let i=0;i<pts.length;i+=2){
      const p=pts[i];
      const q=proj(p.x, p.y+Math.sin(t*.0006+p.ph)*.008, p.z, c);
      if(!q) continue;
      const OX=boneOffsetX(), OY=boneOffsetY();
      const qx=q.x+OX, qy=q.y+OY;
      if(qx<-40||qx>W+40||qy<-40||qy>H+40) continue;
      const depth=Math.max(0,Math.min(1,(1.9-q.z)/3.0));
      const a=(0.03+depth*0.20)*ambient*MS;
      if(a<=.004) continue;
      ctx.beginPath();
      ctx.arc(qx,qy,Math.max(.3,p.r*q.k*1.5),0,6.283);
      ctx.fillStyle='rgba('+INK+','+a.toFixed(3)+')';
      ctx.fill();
    }

    const mesh=boneMesh(c);
    const segs=[];
    for(let i=0;i<RINGS.length-1;i++){
      if(RINGS[i].bone!==RINGS[i+1].bone) continue;
      const ring0=mesh[i], ring1=mesh[i+1];
      const zAvg=(function(){ let s=0,n=0; for(const p of ring0) if(p){s+=p.z;n++;} return n?s/n:0; })();
      const isJoint = RINGS[i].joint||RINGS[i+1].joint;
      const surfaceBand = (i%5)<2;
      segs.push({i,ring0,ring1,z:zAvg,isJoint,surfaceBand});
    }
    segs.sort((a,b)=>b.z-a.z);

    for(const s of segs){
      const depth=Math.max(0,Math.min(1,(1.9-s.z)/3.1));
      const {ring0,ring1,isJoint,surfaceBand}=s;
      if(surfaceBand){
        const fa=(0.028+depth*0.05)*ambient*MS;
        if(fa>.004){
          ctx.fillStyle='rgba('+INK+','+Math.min(.5,fa).toFixed(3)+')';
          for(let k=0;k<RING_PTS;k++){
            const k2=(k+1)%RING_PTS;
            const p0=ring0[k],p1=ring0[k2],p2=ring1[k2],p3=ring1[k];
            if(!p0||!p1||!p2||!p3) continue;
            ctx.beginPath();
            ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.lineTo(p3.x,p3.y);
            ctx.closePath(); ctx.fill();
          }
        }
      }
      const ribA=(0.09+depth*0.30)*ambient*MS;
      if(ribA>.005){
        ctx.strokeStyle='rgba('+INK+','+ribA.toFixed(3)+')';
        ctx.lineWidth=isJoint?Math.max(.8,1.0+depth*1.6):Math.max(.5,0.6+depth*1.1);
        for(let k=0;k<RING_PTS;k+=2){
          const p0=ring0[k], p1=ring1[k];
          if(!p0||!p1) continue;
          ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y); ctx.stroke();
        }
      }
      if(s.i%3===0){
        const ra=(0.06+depth*0.22)*ambient*MS;
        if(ra>.005){
          ctx.strokeStyle='rgba('+INK+','+ra.toFixed(3)+')';
          ctx.lineWidth=Math.max(.4,0.5+depth*0.7);
          ctx.beginPath();
          for(let k=0;k<=RING_PTS;k++){
            const p=ring0[k%RING_PTS]; if(!p) continue;
            if(k===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
          }
          ctx.stroke();
        }
      }
    }
    drawDrift(MS);
  }

  function drawDrift(MS){
    const INK=inkTriple();
    for(const p of drift){
      if(!RM.matches){
        p.x+=p.vx*16; p.y+=p.vy*16;
        if(p.x<-.02)p.x=1.02; if(p.x>1.02)p.x=-.02;
        if(p.y<-.02)p.y=1.02; if(p.y>1.02)p.y=-.02;
      }
      const tw=0.5+0.5*Math.sin(t*p.pr+p.ph);
      const a=(0.05+tw*0.16)*ambient*MS;
      if(a<=.004) continue;
      ctx.beginPath();
      ctx.arc(p.x*W,p.y*H,p.r,0,6.283);
      ctx.fillStyle='rgba('+INK+','+a.toFixed(3)+')';
      ctx.fill();
    }
  }

  let raf;
  function loop(){ t+=16; draw(); raf=requestAnimationFrame(loop); }
  size();
  if(RM.matches){ draw(); } else { loop(); }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(raf)}
    else if(!RM.matches){raf=requestAnimationFrame(loop)}
  });
})();

/* ── ground wave — the graph-paper grid, animated. Every line in
   the grid carries a slow, continuous vertical displacement from
   two overlaid traveling sine waves, so the whole surface reads as
   a gently rolling 3D relief rather than a flat, static pattern.
   Ink-only (no color), matches the home screen's version, and
   holds still under prefers-reduced-motion. ── */
(function(){
  const cv=document.getElementById('ground');
  if(!cv || cv.tagName!=='CANVAS') return;
  const ctx=cv.getContext('2d');
  const RM=matchMedia('(prefers-reduced-motion: reduce)');
  let W=0,H=0,DPR=1;
  const CELL=88, SUB=3, AMP=7;

  function size(){
    DPR=Math.min(devicePixelRatio||1,2);
    W=innerWidth; H=innerHeight;
    cv.width=W*DPR; cv.height=H*DPR;
    cv.style.width=W+'px'; cv.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  addEventListener('resize',size,{passive:true});
  size();

  function waveAt(x,y,t){
    return AMP*( Math.sin(x*0.010+y*0.014+t*0.00035)*0.6
               + Math.sin(x*0.006-y*0.008+t*0.00022)*0.4 );
  }
  const INK='22,24,26', BASE=0.05, BOOST=0.08; // these pages are always light

  function draw(t){
    ctx.clearRect(0,0,W,H);
    const cols=Math.ceil(W/CELL)+2, rows=Math.ceil(H/CELL)+2;
    const midY=(rows*CELL)/2, midX=(cols*CELL)/2;
    ctx.lineWidth=1;

    for(let i=0;i<=cols;i++){
      const x0=i*CELL;
      ctx.beginPath();
      for(let j=0;j<=rows*SUB;j++){
        const y=(j/SUB)*CELL;
        const py=y+waveAt(x0,y,t);
        if(j===0) ctx.moveTo(x0,py); else ctx.lineTo(x0,py);
      }
      const shade=BASE+(Math.abs(waveAt(x0,midY,t))/AMP)*BOOST;
      ctx.strokeStyle='rgba('+INK+','+shade.toFixed(3)+')';
      ctx.stroke();
    }
    for(let j=0;j<=rows;j++){
      const y0=j*CELL;
      ctx.beginPath();
      for(let i=0;i<=cols*SUB;i++){
        const x=(i/SUB)*CELL;
        const py=y0+waveAt(x,y0,t);
        if(i===0) ctx.moveTo(x,py); else ctx.lineTo(x,py);
      }
      const shade=BASE+(Math.abs(waveAt(midX,y0,t))/AMP)*BOOST;
      ctx.strokeStyle='rgba('+INK+','+shade.toFixed(3)+')';
      ctx.stroke();
    }
  }

  let raf, t0=performance.now();
  function loop(now){ draw(now-t0); raf=requestAnimationFrame(loop); }
  if(RM.matches){ draw(0); } else { raf=requestAnimationFrame(loop); }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(raf)}
    else if(!RM.matches){raf=requestAnimationFrame(loop)}
  });
})();
