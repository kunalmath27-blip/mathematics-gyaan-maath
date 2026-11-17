(function(root){
  'use strict';
  const defaults=Object.freeze({style:'ballpoint',pressure:true,sensitivity:1,smoothing:.35});
  const STYLES=new Set(['ballpoint','fountain','pencil','calligraphy']),MAX_POINTS=50000;
  const live=new WeakMap();
  const finite=(v,fallback)=>typeof v==='number'&&Number.isFinite(v)?v:fallback;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function normalizeSettings(input={}){return{style:STYLES.has(input.style)?input.style:defaults.style,pressure:input.pressure!==false,sensitivity:clamp(finite(input.sensitivity,1),.25,3),smoothing:clamp(finite(input.smoothing,.35),0,.9)};}
  function point(event={}){
    const supports=event.pointerType==='pen'&&typeof event.pressure==='number'&&Number.isFinite(event.pressure)&&event.pressure>=0&&event.pressure<=1;
    const twist=finite(event.twist,0);
    return{p:supports?event.pressure:.5,tiltX:clamp(finite(event.tiltX,0),-90,90),tiltY:clamp(finite(event.tiltY,0),-90,90),twist:((twist%360)+360)%360,t:finite(event.timeStamp,0),pressureSupported:supports};
  }
  function copyPoint(p){
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e7||Math.abs(p.y)>1e7)throw Error('Pen points need finite board coordinates.');
    const pressure=finite(p.p,.5);
    return{x:p.x,y:p.y,p:clamp(pressure,0,1),tiltX:clamp(finite(p.tiltX,0),-90,90),tiltY:clamp(finite(p.tiltY,0),-90,90),twist:((finite(p.twist,0)%360)+360)%360,t:finite(p.t,0),pressureSupported:p.pressureSupported!==false};
  }
  function createStroke(options={},first){
    const settings=normalizeSettings(options.settings),stroke={type:'stroke',tool:options.tool||'pen',color:typeof options.color==='string'?options.color:'#243b3a',width:clamp(finite(options.width,4),.1,500),penStyle:settings.style,pressureEnabled:settings.pressure,sensitivity:settings.sensitivity,smoothing:settings.smoothing,points:[copyPoint(first)]};
    live.set(stroke,{lastRaw:copyPoint(first),finished:false});return stroke;
  }
  function compact(stroke){
    const points=stroke.points,next=[points[0]];for(let i=2;i<points.length-1;i+=2)next.push(points[i]);next.push(points[points.length-1]);stroke.points=next;
  }
  function append(stroke,input){
    if(!stroke||!Array.isArray(stroke.points)||!stroke.points.length)throw Error('Start the pen stroke before adding points.');
    const raw=copyPoint(input),state=live.get(stroke)||{lastRaw:stroke.points[stroke.points.length-1],finished:false};state.finished=false;state.lastRaw=raw;live.set(stroke,state);
    const previous=stroke.points[stroke.points.length-1],smoothing=clamp(finite(stroke.smoothing,0),0,.9),alpha=1-.8*smoothing;
    const next={...raw,x:previous.x+(raw.x-previous.x)*alpha,y:previous.y+(raw.y-previous.y)*alpha};
    if(Math.hypot(next.x-previous.x,next.y-previous.y)<.08&&Math.abs(next.p-previous.p)<.01&&Math.abs(next.tiltX-previous.tiltX)<1&&Math.abs(next.tiltY-previous.tiltY)<1)return stroke;
    if(stroke.points.length>=MAX_POINTS)compact(stroke);stroke.points.push(next);return stroke;
  }
  function finish(stroke){
    const state=live.get(stroke);if(!state||state.finished)return stroke;const end=state.lastRaw,last=stroke.points[stroke.points.length-1];
    // The filter may trail the pen while moving. The saved endpoint is exact.
    if(end.x!==last.x||end.y!==last.y||end.p!==last.p){if(stroke.points.length>=MAX_POINTS)compact(stroke);stroke.points.push({...end});}
    else stroke.points[stroke.points.length-1]={...end};state.finished=true;return stroke;
  }
  function isEraser(event){return event?.pointerType==='pen'&&(((finite(event.buttons,0)&32)!==0)||event.button===5);}
  function isSideButton(event){return event?.pointerType==='pen'&&(((finite(event.buttons,0)&2)!==0)||event.button===2);}
  function legacyDraw(ctx,s){
    const ps=s.points;ctx.strokeStyle=s.tool==='eraser'?'#fff':s.color;ctx.fillStyle=ctx.strokeStyle;ctx.globalAlpha=s.tool==='highlight'?.25:1;ctx.lineCap='round';ctx.lineJoin='round';
    if(ps.length===1){ctx.beginPath();ctx.arc(ps[0].x,ps[0].y,s.width/2,0,2*Math.PI);ctx.fill();return;}
    for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];ctx.lineWidth=s.tool==='pen'?s.width*(.5+((a.p+b.p)/2||.5)):s.width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  }
  function pressureAt(s,p){return s.pressureEnabled===false?.5:Math.pow(clamp(finite(p.p,.5),0,1),1/clamp(finite(s.sensitivity,1),.25,3));}
  function nib(s,p,angle=0){
    const pressure=pressureAt(s,p),style=s.penStyle;
    if(s.tool!=='pen')return{width:s.width,alpha:s.tool==='highlight'?.24:1};
    let factor=s.pressureEnabled===false?1:.25+1.5*pressure,alpha=1;
    if(style==='fountain')factor=s.pressureEnabled===false?1:.12+1.9*pressure;
    if(style==='pencil'){const tilt=Math.min(85,Math.hypot(finite(p.tiltX,0),finite(p.tiltY,0)))*Math.PI/180;factor=(s.pressureEnabled===false?1:.4+1.1*pressure)*(1+1.7*Math.sin(tilt));alpha=.38+.5*pressure;}
    if(style==='calligraphy'){const twist=finite(p.twist,0),nibAngle=(twist||45)*Math.PI/180;factor*=.25+1.4*Math.abs(Math.sin(angle-nibAngle));}
    return{width:Math.max(.1,s.width*factor),alpha};
  }
  function path(ctx,points){
    ctx.moveTo(points[0].x,points[0].y);
    for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];ctx.quadraticCurveTo(a.x,a.y,(a.x+b.x)/2,(a.y+b.y)/2);}
    const end=points[points.length-1];ctx.lineTo(end.x,end.y);
  }
  function draw(ctx,stroke){
    if(!stroke||!Array.isArray(stroke.points)||!stroke.points.length)return;
    ctx.save();try{
      if(!Object.hasOwn(stroke,'penStyle')){legacyDraw(ctx,stroke);return;}
      const ps=stroke.points;ctx.strokeStyle=stroke.tool==='eraser'?'#fff':stroke.color;ctx.fillStyle=ctx.strokeStyle;ctx.lineCap='round';ctx.lineJoin='round';
      if(ps.length===1){const ink=nib(stroke,ps[0]);ctx.globalAlpha=ink.alpha;ctx.beginPath();ctx.arc(ps[0].x,ps[0].y,ink.width/2,0,Math.PI*2);ctx.fill();return;}
      if(stroke.tool==='highlight'||stroke.tool==='eraser'){ctx.lineWidth=stroke.width;ctx.globalAlpha=stroke.tool==='highlight'?.24:1;ctx.beginPath();path(ctx,ps);ctx.stroke();return;}
      // Each quadratic joins adjacent midpoints. Width follows measured pressure
      // while the same coordinates remain usable by the existing notebook format.
      let start={x:ps[0].x,y:ps[0].y};
      for(let i=0;i<ps.length;i++){
        const control=ps[i],next=ps[i+1],end=next?{x:(control.x+next.x)/2,y:(control.y+next.y)/2}:{x:control.x,y:control.y};
        const angle=Math.atan2(end.y-start.y,end.x-start.x),ink=nib(stroke,control,angle);ctx.lineWidth=ink.width;ctx.globalAlpha=ink.alpha;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo(control.x,control.y,end.x,end.y);ctx.stroke();start=end;
      }
    }finally{ctx.restore();}
  }
  function recognizeShape(stroke){
    if(!stroke||stroke.tool!=='pen'||!Array.isArray(stroke.points)||stroke.points.length<3)return null;
    const original=stroke.points,step=Math.max(1,Math.ceil(original.length/1000)),ps=[];for(let i=0;i<original.length;i+=step)ps.push(original[i]);if(ps[ps.length-1]!==original[original.length-1])ps.push(original[original.length-1]);
    if(ps.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
    const first=ps[0],last=ps[ps.length-1],dx=last.x-first.x,dy=last.y-first.y,distance=Math.hypot(dx,dy);let length=0;for(let i=1;i<ps.length;i++)length+=Math.hypot(ps[i].x-ps[i-1].x,ps[i].y-ps[i-1].y);
    if(distance>=20&&length<=distance*1.13){let deviation=0;for(const p of ps)deviation=Math.max(deviation,Math.abs(dy*(p.x-first.x)-dx*(p.y-first.y))/distance);if(deviation<=Math.max(3,distance*.025))return{type:'line',x:first.x,y:first.y,x2:last.x,y2:last.y,color:stroke.color,width:stroke.width};}
    let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity;for(const p of ps){xmin=Math.min(xmin,p.x);xmax=Math.max(xmax,p.x);ymin=Math.min(ymin,p.y);ymax=Math.max(ymax,p.y);}const w=xmax-xmin,h=ymax-ymin,diag=Math.hypot(w,h);
    if(ps.length<12||w<25||h<25||distance>Math.max(10,diag*.1))return null;
    const cx=(xmin+xmax)/2,cy=(ymin+ymax)/2;let radialError=0,radialMax=0;for(const p of ps){const error=Math.abs(Math.hypot((p.x-cx)/(w/2),(p.y-cy)/(h/2))-1);radialError+=error;radialMax=Math.max(radialMax,error);}
    const ellipsePerimeter=Math.PI*(3*(w/2+h/2)-Math.sqrt((3*w/2+h/2)*(w/2+3*h/2)));
    if(w/h>.15&&w/h<6.7&&radialError/ps.length<.09&&radialMax<.3&&length>ellipsePerimeter*.78&&length<ellipsePerimeter*1.22)return{type:'circle',x:xmin,y:ymin,x2:xmax,y2:ymax,color:stroke.color,width:stroke.width};
    const threshold=Math.max(4,Math.min(w,h)*.1),edges=[0,0,0,0];let near=0;
    for(const p of ps){const distances=[Math.abs(p.y-ymin),Math.abs(p.x-xmax),Math.abs(p.y-ymax),Math.abs(p.x-xmin)],smallest=Math.min(...distances);if(smallest<=threshold){near++;edges[distances.indexOf(smallest)]++;}}
    if(near/ps.length>.92&&edges.every(v=>v>=2)&&length>2*(w+h)*.8&&length<2*(w+h)*1.2)return{type:'rectangle',x:xmin,y:ymin,x2:xmax,y2:ymax,color:stroke.color,width:stroke.width};
    return null;
  }
  root.PenEngine=Object.freeze({defaults,normalizeSettings,point,createStroke,append,finish,draw,isEraser,isSideButton,recognizeShape,MAX_POINTS});
})(typeof window!=='undefined'?window:globalThis);
