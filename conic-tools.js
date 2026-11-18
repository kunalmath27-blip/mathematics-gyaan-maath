(function (root) {
  'use strict';

  // Standard-form conics only. The renderer is deliberately independent of the
  // expression compiler: both hyperbola branches and sideways parabolas are
  // parametric curves, so they are not functions y = f(x).
  const limits = Object.freeze({center:10000,minLength:0.001,maxLength:1000});
  const defaults = Object.freeze({kind:'ellipse',orientation:'horizontal',h:0,k:0,a:5,b:3,p:2,showFoci:true,showGuides:true});
  const presets = Object.freeze([
    {id:'ellipse',label:'Ellipse',options:{...defaults}},
    {id:'hyperbola',label:'Hyperbola',options:{...defaults,kind:'hyperbola',a:3,b:2}},
    {id:'parabola',label:'Parabola',options:{...defaults,kind:'parabola'}},
    {id:'circle',label:'Circle',options:{...defaults,a:3,b:3}}
  ].map(preset=>Object.freeze({...preset,options:Object.freeze(preset.options)})));
  const colors = Object.freeze({curve:'#147d72',focus:'#d89b50',guide:'#8b7bbc',vertex:'#244440'});

  function normalize(options={}) {
    if(!options || typeof options!=='object' || Array.isArray(options)) throw new Error('Use conic options.');
    const kind=options.kind===undefined?defaults.kind:options.kind;
    if(!['ellipse','hyperbola','parabola'].includes(kind)) throw new Error('Choose ellipse, hyperbola or parabola.');
    const base=kind==='hyperbola'?presets[1].options:kind==='parabola'?presets[2].options:defaults;
    const o={...base};
    for(const key of Object.keys(defaults)) if(options[key]!==undefined) o[key]=options[key];
    if(!['horizontal','vertical'].includes(o.orientation)) throw new Error('Choose a horizontal or vertical orientation.');
    for(const key of ['h','k','a','b','p']) {
      if(typeof o[key]!=='number' || !Number.isFinite(o[key])) throw new Error(key+' must be a finite number.');
      if(Object.is(o[key],-0)) o[key]=0;
    }
    if(Math.abs(o.h)>limits.center || Math.abs(o.k)>limits.center) throw new Error('Center coordinates must be between −10000 and 10000.');
    for(const key of ['a','b']) if(o[key]<limits.minLength || o[key]>limits.maxLength) throw new Error(key+' must be between 0.001 and 1000.');
    if(Math.abs(o.p)<limits.minLength || Math.abs(o.p)>limits.maxLength) throw new Error('Use a nonzero p with magnitude between 0.001 and 1000.');
    if(typeof o.showFoci!=='boolean' || typeof o.showGuides!=='boolean') throw new Error('Focus and guide visibility must be true or false.');
    return o;
  }

  function fmt(value) {
    if(Object.is(value,-0) || value===0) return '0';
    // Enough precision for teaching labels without showing binary roundoff.
    return Number(value.toPrecision(8)).toString();
  }
  function shifted(variable,value) { return value===0?variable:'('+variable+(value>0?' − ':' + ')+fmt(Math.abs(value))+')'; }
  function lineEquation(axis,value) { return {axis,value,equation:axis+' = '+fmt(value)}; }
  function point(x,y) { return {x,y}; }
  function boundsAround(x,y,rx,ry) { return {xmin:x-rx,xmax:x+rx,ymin:y-ry,ymax:y+ry}; }

  function analyze(options={}) {
    const o=normalize(options),{kind,orientation,h,k,a,b,p}=o,horizontal=orientation==='horizontal';
    const x=shifted('x',h),y=shifted('y',k);
    const along=(u,v)=>horizontal?point(h+u,k+v):point(h+v,k+u);
    const out={kind,orientation,options:o,equation:'',center:null,vertex:null,vertices:[],coVertices:[],foci:[],eccentricity:0,directrices:[],asymptotes:[],suggestedBounds:null};
    if(kind==='ellipse') {
      const rx=horizontal?a:b,ry=horizontal?b:a,A=Math.max(a,b),B=Math.min(a,b);
      const majorHorizontal=rx>=ry,c=Math.sqrt((A-B)*(A+B)),e=c/A;
      out.equation=x+'² / '+fmt(rx*rx)+' + '+y+'² / '+fmt(ry*ry)+' = 1';
      out.center=point(h,k);out.semiMajor=A;out.semiMinor=B;out.c=c;
      out.majorAxis=majorHorizontal?'horizontal':'vertical';out.eccentricity=e;
      out.vertices=majorHorizontal?[point(h-A,k),point(h+A,k)]:[point(h,k-A),point(h,k+A)];
      out.coVertices=majorHorizontal?[point(h,k-B),point(h,k+B)]:[point(h-B,k),point(h+B,k)];
      out.foci=majorHorizontal?[point(h-c,k),point(h+c,k)]:[point(h,k-c),point(h,k+c)];
      if(e>0) out.directrices=[lineEquation(majorHorizontal?'x':'y',(majorHorizontal?h:k)-A/e),lineEquation(majorHorizontal?'x':'y',(majorHorizontal?h:k)+A/e)];
      out.suggestedBounds=boundsAround(h,k,rx*1.35,ry*1.35);
    } else if(kind==='hyperbola') {
      const c=Math.hypot(a,b),slope=horizontal?b/a:a/b;
      out.equation=(horizontal?x:y)+'² / '+fmt(a*a)+' − '+(horizontal?y:x)+'² / '+fmt(b*b)+' = 1';
      out.center=point(h,k);out.c=c;out.eccentricity=c/a;
      out.vertices=[along(-a,0),along(a,0)];out.foci=[along(-c,0),along(c,0)];
      out.directrices=[lineEquation(horizontal?'x':'y',(horizontal?h:k)-a*a/c),lineEquation(horizontal?'x':'y',(horizontal?h:k)+a*a/c)];
      out.asymptotes=[-slope,slope].map(m=>({slope:m,intercept:k-m*h,equation:y+' = '+fmt(m)+' '+x}));
      const alongRadius=Math.max(a*2.3,c*1.3),acrossRadius=Math.max(b*2.1,a*.5);
      out.suggestedBounds=boundsAround(h,k,horizontal?alongRadius:acrossRadius,horizontal?acrossRadius:alongRadius);
    } else {
      out.equation=(horizontal?y:x)+'² = '+fmt(4*p)+' '+(horizontal?x:y);
      out.vertex=point(h,k);out.vertices=[point(h,k)];out.focus=along(p,0);out.foci=[out.focus];out.eccentricity=1;
      out.directrix=lineEquation(horizontal?'x':'y',(horizontal?h:k)-p);out.directrices=[out.directrix];
      out.opening=horizontal?(p>0?'right':'left'):(p>0?'up':'down');
      out.latusRectum=[along(p,-2*Math.abs(p)),along(p,2*Math.abs(p))];
      const q=Math.abs(p),start=-1.6*q,end=4.6*q;
      const low=p>0?start:-end,high=p>0?end:-start;
      out.suggestedBounds=horizontal?{xmin:h+low,xmax:h+high,ymin:k-3*q,ymax:k+3*q}:{xmin:h-3*q,xmax:h+3*q,ymin:k+low,ymax:k+high};
    }
    return out;
  }

  function draw(ctx,rect,options={}) {
    if(!ctx || !root.MathTools || typeof root.MathTools.drawGraph!=='function') throw new Error('MathTools and a canvas context are required.');
    if(!rect || typeof rect!=='object') throw new Error('Use a finite graph rectangle.');
    const r={x:rect.x===undefined?0:rect.x,y:rect.y===undefined?0:rect.y,w:rect.w===undefined?600:rect.w,h:rect.h===undefined?360:rect.h};
    if(!Object.values(r).every(v=>typeof v==='number'&&Number.isFinite(v)) || r.w<90 || r.h<90 || r.w>100000 || r.h>100000 || Math.abs(r.x)>1e7 || Math.abs(r.y)>1e7) throw new Error('Graph dimensions must be finite and between 90 and 100000 pixels.');
    const analysis=analyze(options),o=analysis.options,{h,k,a,b,p}=o,horizontal=o.orientation==='horizontal';
    const bounds={...analysis.suggestedBounds},plotWidth=r.w-62,plotHeight=r.h-63;
    // MathTools uses these fixed plot insets. Expand one world range, rather
    // than stretch the curve, so a unit has the same pixel length on each axis.
    const centerX=(bounds.xmin+bounds.xmax)/2,centerY=(bounds.ymin+bounds.ymax)/2;
    const unitsPerPixel=Math.max((bounds.xmax-bounds.xmin)/plotWidth,(bounds.ymax-bounds.ymin)/plotHeight);
    bounds.xmin=centerX-unitsPerPixel*plotWidth/2;bounds.xmax=centerX+unitsPerPixel*plotWidth/2;
    bounds.ymin=centerY-unitsPerPixel*plotHeight/2;bounds.ymax=centerY+unitsPerPixel*plotHeight/2;
    const graph=root.MathTools.drawGraph(ctx,r,()=>NaN,{...bounds,label:false});
    const {X,Y}=graph,plot=graph.bounds;
    const mapping={X,Y,x:px=>bounds.xmin+(px-plot.x)/plot.w*(bounds.xmax-bounds.xmin),y:py=>bounds.ymax-(py-plot.y)/plot.h*(bounds.ymax-bounds.ymin),scale:1/unitsPerPixel,plot};
    const segment=(x1,y1,x2,y2,color=colors.guide,width=1.5,dash=[6,5])=>{
      ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.moveTo(X(x1),Y(y1));ctx.lineTo(X(x2),Y(y2));ctx.stroke();ctx.setLineDash([]);
    };
    const guide=line=>line.axis==='x'?segment(line.value,bounds.ymin,line.value,bounds.ymax):segment(bounds.xmin,line.value,bounds.xmax,line.value);
    const curve=points=>{
      ctx.beginPath();ctx.strokeStyle=colors.curve;ctx.lineWidth=3;ctx.lineJoin='round';ctx.setLineDash([]);
      points.forEach((q,i)=>i?ctx.lineTo(X(q.x),Y(q.y)):ctx.moveTo(X(q.x),Y(q.y)));
      ctx.stroke();
    };
    const marker=(q,label,color)=>{
      if(q.x<bounds.xmin || q.x>bounds.xmax || q.y<bounds.ymin || q.y>bounds.ymax) return;
      const px=X(q.x),py=Y(q.y);ctx.beginPath();ctx.fillStyle=color;ctx.arc(px,py,4,0,2*Math.PI);ctx.fill();
      ctx.font='11px system-ui, sans-serif';ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillStyle=color;
      const labelX=Math.min(px+8,plot.x+plot.w-8);ctx.textAlign=labelX>plot.x+plot.w-95?'right':'left';
      ctx.fillText(label,labelX,py-8);
    };
    const steps=Math.max(360,Math.min(1400,Math.ceil(Math.max(plot.w,plot.h)*1.5)));
    const along=(u,v)=>horizontal?point(h+u,k+v):point(h+v,k+u);
    ctx.save();ctx.beginPath();ctx.rect(plot.x,plot.y,plot.w,plot.h);ctx.clip();
    if(o.showGuides) {
      if(o.kind==='hyperbola') analysis.asymptotes.forEach(line=>{
        // Express the finite viewport intersection in local coordinates to
        // avoid huge offscreen canvas commands for steep asymptotes.
        const candidates=[];
        for(const x of [bounds.xmin,bounds.xmax]) {const y=k+line.slope*(x-h);if(y>=bounds.ymin && y<=bounds.ymax)candidates.push(point(x,y));}
        for(const y of [bounds.ymin,bounds.ymax]) {const x=h+(y-k)/line.slope;if(x>=bounds.xmin && x<=bounds.xmax)candidates.push(point(x,y));}
        // A line through a corner contributes that point twice. Select the
        // farthest pair so opposite-corner lines cannot collapse to one point.
        let endpoints=null,distance=0;
        for(let i=0;i<candidates.length;i++) for(let j=i+1;j<candidates.length;j++) {
          const d=(candidates[i].x-candidates[j].x)**2+(candidates[i].y-candidates[j].y)**2;
          if(d>distance) {distance=d;endpoints=[candidates[i],candidates[j]];}
        }
        if(endpoints) segment(endpoints[0].x,endpoints[0].y,endpoints[1].x,endpoints[1].y);
      });
      if(o.kind==='parabola') {
        guide(analysis.directrix);
        if(horizontal) segment(bounds.xmin,k,bounds.xmax,k,colors.guide,1,[3,5]);
        else segment(h,bounds.ymin,h,bounds.ymax,colors.guide,1,[3,5]);
      }
      if(o.kind==='ellipse') {
        const rx=horizontal?a:b,ry=horizontal?b:a;
        segment(h-rx,k,h+rx,k,colors.guide,1,[4,5]);segment(h,k-ry,h,k+ry,colors.guide,1,[4,5]);
      }
    }
    if(o.kind==='ellipse') {
      const rx=horizontal?a:b,ry=horizontal?b:a,points=[];
      for(let i=0;i<=steps;i++) {const t=2*Math.PI*i/steps;points.push(point(h+rx*Math.cos(t),k+ry*Math.sin(t)));}
      curve(points);
    } else if(o.kind==='hyperbola') {
      const across=Math.max(Math.abs((horizontal?bounds.ymin:bounds.xmin)-(horizontal?k:h)),Math.abs((horizontal?bounds.ymax:bounds.xmax)-(horizontal?k:h)));
      const extent=Math.max(Math.abs((horizontal?bounds.xmin:bounds.ymin)-(horizontal?h:k)),Math.abs((horizontal?bounds.xmax:bounds.ymax)-(horizontal?h:k)));
      const tmax=Math.min(Math.asinh(across/b),Math.acosh(Math.max(1,extent/a)));
      // Each branch gets a new path. There is never a line across the gap.
      for(const sign of [-1,1]) {
        const points=[];
        for(let i=0;i<=steps;i++) {const t=-tmax+2*tmax*i/steps;points.push(along(sign*a*Math.cosh(t),b*Math.sinh(t)));}
        curve(points);
      }
    } else {
      const acrossLow=(horizontal?bounds.ymin:bounds.xmin)-(horizontal?k:h),acrossHigh=(horizontal?bounds.ymax:bounds.xmax)-(horizontal?k:h);
      const alongLow=(horizontal?bounds.xmin:bounds.ymin)-(horizontal?h:k),alongHigh=(horizontal?bounds.xmax:bounds.ymax)-(horizontal?h:k);
      const openingExtent=Math.max(0,p>0?alongHigh:-alongLow),crossLimit=Math.sqrt(4*Math.abs(p)*openingExtent);
      const low=Math.max(acrossLow,-crossLimit),high=Math.min(acrossHigh,crossLimit),points=[];
      for(let i=0;i<=steps;i++) {const v=low+(high-low)*i/steps;points.push(along(v*v/(4*p),v));}
      curve(points);
    }
    analysis.vertices.forEach((q,i)=>marker(q,o.kind==='parabola'?'V':analysis.vertices.length===1?'V':'V'+(i===0?'₁':'₂'),colors.vertex));
    if(o.showFoci) analysis.foci.forEach((q,i)=>{
      if(i && q.x===analysis.foci[0].x && q.y===analysis.foci[0].y) return;
      marker(q,(analysis.foci.length===1?'F':'F'+(i===0?'₁':'₂'))+' ('+fmt(q.x)+', '+fmt(q.y)+')',colors.focus);
    });
    ctx.restore();
    return {analysis,bounds,mapping};
  }

  root.ConicTools=Object.freeze({defaults,presets,limits,normalize,analyze,draw});
})(typeof window!=='undefined'?window:globalThis);
