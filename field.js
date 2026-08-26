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

  let pts=[], links=[], drift=[], jointDots=[];
  /* ── tiny glowing motes suspended in the joint gap itself —
     the narrow space between where the femur rings end and the
     tibia rings begin. They drift slowly in true 3D (turning with
     the rest of the reconstruction) and each dims and re-glows on
     its own independent, offset cycle rather than blinking in
     unison — matches the home screen's version. ────────────────── */
  function buildJointDots(){
    jointDots=[];
    const N = innerWidth<760 ? 180 : 320; // 20x density, per feedback
    for(let i=0;i<N;i++){
      const ang=Math.random()*6.28318, rad=0.05+Math.random()*0.30;
      jointDots.push({
        x:Math.cos(ang)*rad, y:(Math.random()-.5)*0.22, z:Math.sin(ang)*rad,
        vx:(Math.random()-.5)*0.00006, vy:(Math.random()-.5)*0.00004, vz:(Math.random()-.5)*0.00006,
        ph:Math.random()*Math.PI*2, sp:0.0009+Math.random()*0.0012
      });
    }
  }
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
    // knowledge-graph links removed — the thin connecting lines
    // read as stray marks scattered across the page rather than
    // structure, so the point cloud now stands alone.
    links=[];
  }

  function size(){
    DPR=Math.min(devicePixelRatio||1,2);
    W=innerWidth;H=innerHeight;
    cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+'px';cv.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    buildField(); buildDrift(); buildJointDots();
  }
  addEventListener('resize',size,{passive:true});

  function cam(){
    const cx=W*.5, cy=H*.48, scale=Math.min(W,H)*.90;
    return {cx,cy,scale,cy2:1,sy2:0,cx2:1,sx2:0,camZ:1.86-pulseT*0.16};
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

  const DOT_GOLD=[214,168,86], DOT_WHITE=[255,255,255];
  function drawJointDots(c,AMB,MS){
    const OX=boneOffsetX(), OY=boneOffsetY();
    const spin=t*0.000085;
    const ca=Math.cos(spin), sa=Math.sin(spin);
    for(const d of jointDots){
      d.x+=d.vx*16; d.y+=d.vy*16; d.z+=d.vz*16;
      if(d.y>0.13) d.y=-0.13; if(d.y<-0.13) d.y=0.13;
      const rad=Math.hypot(d.x,d.z);
      if(rad>0.36){ const k=0.34/rad; d.x*=k; d.z*=k; }
      const rx=d.x*ca - d.z*sa, rz=d.x*sa + d.z*ca;
      let x1=rx*cz - d.y*sz, y1=rx*sz + d.y*cz;
      let y2=y1*cxx - rz*sxx, z2=y1*sxx + rz*cxx;
      const q=proj(x1,y2,z2,c);
      if(!q) continue;
      const qx=q.x+OX, qy=q.y+OY;
      // each mote dims into gold, then glows back up to white, on
      // its own offset cycle — a slow, repeating twinkle rather
      // than a single flash
      const glow=0.5+0.5*Math.sin(t*d.sp+d.ph);
      const rC=Math.round(DOT_GOLD[0]+(DOT_WHITE[0]-DOT_GOLD[0])*glow);
      const gC=Math.round(DOT_GOLD[1]+(DOT_WHITE[1]-DOT_GOLD[1])*glow);
      const bC=Math.round(DOT_GOLD[2]+(DOT_WHITE[2]-DOT_GOLD[2])*glow);
      const rgb=rC+','+gC+','+bC;
      const coreA=(0.35+0.5*glow)*AMB*MS;
      if(coreA<=.006) continue;
      const rpx=Math.max(1.1,1.7*q.k);
      const haloR=rpx*3.4;
      const grad=ctx.createRadialGradient(qx,qy,0,qx,qy,haloR);
      grad.addColorStop(0,'rgba('+rgb+','+(coreA*0.5).toFixed(3)+')');
      grad.addColorStop(1,'rgba('+rgb+',0)');
      ctx.beginPath(); ctx.arc(qx,qy,haloR,0,6.283); ctx.fillStyle=grad; ctx.fill();
      ctx.beginPath(); ctx.arc(qx,qy,rpx,0,6.283);
      ctx.fillStyle='rgba('+rgb+','+Math.min(1,coreA*1.3).toFixed(3)+')'; ctx.fill();
    }
  }

  const ambientBase=0.85; // raised so the reconstruction reads as clearly on these pages as it does on the home screen
  /* ── the same ambient self-pulse the home screen has: the
     reconstruction periodically expands and brightens slightly,
     then relaxes back to its resting state, on a slow irregular
     loop — so these pages feel like the same living object rather
     than a frozen decoration. ── */
  let pulseOn=false, pulseT=0;
  function ambient(){ return ambientBase*(1+pulseT*0.42); }
  function pulseTick(){
    pulseOn=true;
    setTimeout(()=>{
      pulseOn=false;
      setTimeout(pulseTick, 2400+Math.random()*1800);
    }, 1500);
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    const c=cam();
    const MS=mobileScale();
    const INK=inkTriple();
    const AMB=ambient();

    /* knowledge-graph link lines removed per feedback — they read
       as stray tick marks scattered across the page rather than
       structure. The point-cloud shell below stands alone now. */

    for(let i=0;i<pts.length;i+=2){
      const p=pts[i];
      const q=proj(p.x, p.y+Math.sin(t*.0006+p.ph)*.008, p.z, c);
      if(!q) continue;
      const OX=boneOffsetX(), OY=boneOffsetY();
      const qx=q.x+OX, qy=q.y+OY;
      if(qx<-40||qx>W+40||qy<-40||qy>H+40) continue;
      const depth=Math.max(0,Math.min(1,(1.9-q.z)/3.0));
      const a=(0.03+depth*0.20)*AMB*MS;
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
        const fa=(0.028+depth*0.05)*AMB*MS;
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
      const ribA=(0.09+depth*0.30)*AMB*MS;
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
        const ra=(0.06+depth*0.22)*AMB*MS;
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
    drawJointDots(c,AMB,MS);
    drawDrift(MS,AMB);
  }

  function drawDrift(MS,AMB){
    const INK=inkTriple();
    for(const p of drift){
      if(!RM.matches){
        p.x+=p.vx*16; p.y+=p.vy*16;
        if(p.x<-.02)p.x=1.02; if(p.x>1.02)p.x=-.02;
        if(p.y<-.02)p.y=1.02; if(p.y>1.02)p.y=-.02;
      }
      const tw=0.5+0.5*Math.sin(t*p.pr+p.ph);
      const a=(0.05+tw*0.16)*AMB*MS;
      if(a<=.004) continue;
      ctx.beginPath();
      ctx.arc(p.x*W,p.y*H,p.r,0,6.283);
      ctx.fillStyle='rgba('+INK+','+a.toFixed(3)+')';
      ctx.fill();
    }
  }

  let raf;
  function loop(){
    t+=16;
    pulseT = pulseOn ? Math.min(1,pulseT+0.020) : Math.max(0,pulseT-0.028);
    draw();
    raf=requestAnimationFrame(loop);
  }
  size();
  if(RM.matches){ draw(); } else { loop(); setTimeout(pulseTick, 900); }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(raf)}
    else if(!RM.matches){raf=requestAnimationFrame(loop)}
  });
})();
