(function (root) {
  'use strict';
  const FN = Object.freeze({sin:Math.sin,cos:Math.cos,tan:Math.tan,sqrt:Math.sqrt,abs:Math.abs,log:Math.log10,ln:Math.log,exp:Math.exp,asin:Math.asin,acos:Math.acos,atan:Math.atan});
  function compile(input) {
    const source=String(input||'').replace(/π/g,'pi').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/²/g,'^2').replace(/³/g,'^3').trim().toLowerCase();
    if(!source || source.length>500) throw new Error('Enter an expression, for example x^2 - 3.');
    let at=0; const tokens=[];
    while(at<source.length){
      const rest=source.slice(at); let m;
      if(/^\s/.test(rest)){at++;continue;}
      if((m=rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/))){tokens.push({kind:'n',value:Number(m[0])});at+=m[0].length;continue;}
      if((m=rest.match(/^[a-z]+/))){tokens.push({kind:'id',value:m[0]});at+=m[0].length;continue;}
      if('+-*/^()'.includes(rest[0])){tokens.push({kind:rest[0]});at++;continue;}
      throw new Error('Unsupported symbol: '+rest[0]);
    }
    tokens.push({kind:'end'}); let p=0,depth=0;
    function take(k){if(tokens[p].kind===k){p++;return true;}return false;}
    function need(k){if(!take(k))throw new Error('Expected '+k+'.');}
    function expr(){let a=product();while(tokens[p].kind==='+'||tokens[p].kind==='-'){const op=tokens[p++].kind,b=product(),left=a;a=op==='+'?x=>left(x)+b(x):x=>left(x)-b(x);}return a;}
    function product(){let a=unary();while(true){let op=tokens[p].kind;if(op==='*'||op==='/')p++;else if(op==='('||op==='id'||op==='n')op='*';else break;const b=unary(),left=a;a=op==='*'?x=>left(x)*b(x):x=>left(x)/b(x);}return a;}
    function unary(){if(take('+'))return unary();if(take('-')){const a=unary();return x=>-a(x);}return power();}
    function power(){let a=primary();if(take('^')){const b=unary(),left=a;a=x=>Math.pow(left(x),b(x));}return a;}
    function primary(){
      if(++depth>100)throw new Error('Expression is too deeply nested.');
      let result; const t=tokens[p++];
      if(t.kind==='n')result=()=>t.value;
      else if(t.kind==='id'){
        if(t.value==='x')result=x=>x;
        else if(t.value==='pi')result=()=>Math.PI;
        else if(t.value==='e')result=()=>Math.E;
        else if(Object.hasOwn(FN,t.value)){need('(');const a=expr();need(')');result=x=>FN[t.value](a(x));}
        else throw new Error('Unknown name: '+t.value+'. Use x, pi, e, sin, cos, tan, sqrt, abs, log, ln or exp.');
      }else if(t.kind==='('){result=expr();need(')');}
      else throw new Error('Expected a number, x, function or bracket.');
      depth--;return result;
    }
    const fn=expr();if(tokens[p].kind!=='end')throw new Error('Check your brackets and operators.');return fn;
  }
  function calc(expression){const v=compile(expression)(0);if(!Number.isFinite(v))throw new Error('This expression has no finite real value.');return v;}
  const palette={ink:'#244440',muted:'#82918b',grid:'#e4ebe6',axis:'#99aaa2',green:'#147d72',orange:'#d89b50',violet:'#8b7bbc'};
  function text(ctx,s,x,y,size=15,color=palette.ink,align='left'){ctx.font=`${size}px system-ui, sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);}
  function line(ctx,x1,y1,x2,y2,color=palette.ink,width=2,dash=[]){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);}
  function dot(ctx,x,y,color=palette.green,r=5){ctx.beginPath();ctx.fillStyle=color;ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function niceStep(span){const rough=span/8,pow=10**Math.floor(Math.log10(rough)),n=rough/pow;return (n<1.5?1:n<3?2:n<7?5:10)*pow;}
  function fmt(n){if(Math.abs(n)<1e-9)return'0';return Number(n.toPrecision(4)).toString();}
  function drawGraph(ctx,rect,expression,options={}){
    const r={x:rect.x||0,y:rect.y||0,w:rect.w||600,h:rect.h||360};
    const o={color:palette.green,xmin:-5,xmax:5,ymin:-3,ymax:8,grid:true,...options};
    const xspan=o.xmax-o.xmin,yspan=o.ymax-o.ymin;
    if(![o.xmin,o.xmax,o.ymin,o.ymax,xspan,yspan].every(Number.isFinite)||!(xspan>0&&yspan>0))throw new Error('Use finite graph ranges with maximum greater than minimum.');
    if(!Object.values(r).every(Number.isFinite)||r.w<90||r.h<90)throw new Error('Graph dimensions must be finite and at least 90 pixels.');
    const fn=typeof expression==='function'?expression:compile(expression);
    const pad={l:42,r:20,t:28,b:35};
    const b={x:r.x+pad.l,y:r.y+pad.t,w:r.w-pad.l-pad.r,h:r.h-pad.t-pad.b};
    const X=x=>b.x+(x-o.xmin)/(o.xmax-o.xmin)*b.w,Y=y=>b.y+b.h-(y-o.ymin)/(o.ymax-o.ymin)*b.h;
    ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
    if(o.background!==false){ctx.fillStyle=o.background||'#fcfdfa';ctx.fillRect(r.x,r.y,r.w,r.h);}
    const sx=niceStep(o.xmax-o.xmin),sy=niceStep(o.ymax-o.ymin);
    const yaxis=Math.min(b.x+b.w,Math.max(b.x,X(0))),xaxis=Math.min(b.y+b.h,Math.max(b.y,Y(0)));
    // Bound tick counts: adding a small step to a very large value can round
    // back to that same value and must never create a non-terminating loop.
    const xtick=Math.ceil(o.xmin/sx),ytick=Math.ceil(o.ymin/sy);
    let previousX,previousY;
    for(let i=0;i<32;i++){const x=(xtick+i)*sx;if(!Number.isFinite(x)||x>o.xmax+sx/100)break;if(x<o.xmin||x===previousX)continue;previousX=x;if(o.grid)line(ctx,X(x),b.y,X(x),b.y+b.h,palette.grid,1);text(ctx,fmt(x),X(x),b.y+b.h+17,11,palette.muted,'center');}
    for(let i=0;i<32;i++){const y=(ytick+i)*sy;if(!Number.isFinite(y)||y>o.ymax+sy/100)break;if(y<o.ymin||y===previousY)continue;previousY=y;if(o.grid)line(ctx,b.x,Y(y),b.x+b.w,Y(y),palette.grid,1);text(ctx,fmt(y),b.x-9,Y(y),11,palette.muted,'right');}
    line(ctx,b.x,xaxis,b.x+b.w,xaxis,palette.axis,1.4);line(ctx,yaxis,b.y,yaxis,b.y+b.h,palette.axis,1.4);
    text(ctx,'x',b.x+b.w-2,xaxis-12,12,palette.muted,'right');text(ctx,'y',yaxis+10,b.y+5,12,palette.muted);
    ctx.save();ctx.beginPath();ctx.rect(b.x,b.y,b.w,b.h);ctx.clip();ctx.strokeStyle=o.color;ctx.lineWidth=o.lineWidth||3;ctx.lineJoin='round';ctx.beginPath();let prev=null;
    const steps=Math.max(300,Math.min(1800,Math.round(b.w*2)));
    for(let i=0;i<=steps;i++){const x=o.xmin+(o.xmax-o.xmin)*i/steps,y=fn(x),px=X(x),py=Y(y);if(!Number.isFinite(y)||Math.abs(py)>1e7){prev=null;continue;}if(!prev||Math.abs(py-prev.y)>b.h*.75)ctx.moveTo(px,py);else ctx.lineTo(px,py);prev={x:px,y:py};}
    ctx.stroke();ctx.restore();
    if(o.label!==false)text(ctx,typeof expression==='string'?'y = '+expression:(o.title||''),b.x+6,r.y+12,13,o.color);
    ctx.restore();return{X,Y,bounds:b,options:o};
  }
  function drawDiagram(ctx,rect,type,options={}){
    const r={x:rect.x||0,y:rect.y||0,w:rect.w||600,h:rect.h||360};
    ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.fillStyle=options.background||'#fcfdfa';ctx.fillRect(r.x,r.y,r.w,r.h);
    if(type==='triangle'){
      const scale=Math.min((r.w-125)/14,(r.h-95)/12),left=r.x+(r.w-14*scale)/2,bottom=r.y+r.h-45;
      const A={x:left,y:bottom},B={x:left+14*scale,y:bottom},C={x:left+5*scale,y:bottom-12*scale},D={x:C.x,y:bottom};
      ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(C.x,C.y);ctx.lineTo(B.x,B.y);ctx.closePath();ctx.fillStyle='#147d7213';ctx.fill();ctx.strokeStyle=palette.green;ctx.lineWidth=3;ctx.stroke();
      line(ctx,C.x,C.y,D.x,D.y,palette.orange,2,[6,5]);line(ctx,D.x,D.y-11,D.x+11,D.y-11,palette.orange,1.5);line(ctx,D.x+11,D.y-11,D.x+11,D.y,palette.orange,1.5);
      text(ctx,'A',A.x-13,A.y+7,15);text(ctx,'B',B.x+13,B.y+7,15);text(ctx,'C',C.x,C.y-19,15,palette.ink,'center');
      text(ctx,'13 cm',(A.x+C.x)/2-25,(A.y+C.y)/2,15,palette.green,'right');text(ctx,'15 cm',(B.x+C.x)/2+25,(B.y+C.y)/2,15,palette.green);text(ctx,'14 cm',(A.x+B.x)/2,bottom+24,15,palette.green,'center');
      text(ctx,'12 cm',D.x+14,(C.y+D.y)/2,14,palette.orange);text(ctx,'Area = 84 cm²',r.x+20,r.y+21,16,palette.ink);
    }else if(type==='unitcircle'){
      const angle=Number.isFinite(Number(options.angle))?Number(options.angle):30,theta=angle*Math.PI/180;
      const radius=Math.min(r.w*.32,r.h*.34),cx=r.x+r.w/2,cy=r.y+r.h/2+8,px=cx+radius*Math.cos(theta),py=cy-radius*Math.sin(theta);
      line(ctx,cx-radius-27,cy,cx+radius+27,cy,palette.axis,1.3);line(ctx,cx,cy-radius-22,cx,cy+radius+22,palette.axis,1.3);
      ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.strokeStyle='#9ec8b9';ctx.lineWidth=2;ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,Math.min(35,radius*.3),0,-theta,theta>=0);ctx.closePath();ctx.fillStyle='#d89b5025';ctx.fill();
      line(ctx,cx,cy,px,py,palette.green,3);line(ctx,px,py,px,cy,palette.orange,1.6,[5,4]);line(ctx,px,py,cx,py,palette.orange,1.6,[5,4]);dot(ctx,px,py);
      text(ctx,'(cos θ, sin θ)',px+(Math.cos(theta)>=0?12:-12),py-15,13,palette.green,Math.cos(theta)>=0?'left':'right');
      text(ctx,angle+'°',cx+42,cy-14,14,palette.orange);text(ctx,'1',cx+radius+9,cy+17,12,palette.muted);text(ctx,'−1',cx-radius-9,cy+17,12,palette.muted,'right');text(ctx,'1',cx+12,cy-radius-10,12,palette.muted);
      text(ctx,'Unit circle · sin²θ + cos²θ = 1',r.x+20,r.y+21,16);text(ctx,'cos θ = '+Math.cos(theta).toFixed(3)+'    sin θ = '+Math.sin(theta).toFixed(3),cx,r.y+r.h-15,13,palette.green,'center');
    }else if(type==='derivative'){
      const a=Number.isFinite(Number(options.a))?Number(options.a):2;
      const g=drawGraph(ctx,r,'x^2',{xmin:-1,xmax:4,ymin:-2,ymax:10,label:false});
      const x1=-1,x2=4;ctx.save();ctx.beginPath();ctx.rect(g.bounds.x,g.bounds.y,g.bounds.w,g.bounds.h);ctx.clip();line(ctx,g.X(x1),g.Y(2*a*x1-a*a),g.X(x2),g.Y(2*a*x2-a*a),palette.orange,2.5);ctx.restore();
      dot(ctx,g.X(a),g.Y(a*a));text(ctx,`(${fmt(a)}, ${fmt(a*a)})`,g.X(a)+12,g.Y(a*a)-12,14,palette.green);
      text(ctx,`y = x²    Tangent slope = ${fmt(2*a)}`,r.x+48,r.y+13,14,palette.green);
    }else if(type==='integral'){
      const fn=x=>Math.sin(x)/(Math.sin(x)+Math.cos(x));
      const g=drawGraph(ctx,r,fn,{xmin:0,xmax:Math.PI/2,ymin:0,ymax:1.15,label:false});
      ctx.beginPath();ctx.moveTo(g.X(0),g.Y(0));for(let i=0;i<=120;i++){const x=i/120*Math.PI/2;ctx.lineTo(g.X(x),g.Y(fn(x)));}ctx.lineTo(g.X(Math.PI/2),g.Y(0));ctx.closePath();ctx.fillStyle='#147d7220';ctx.fill();
      ctx.beginPath();ctx.strokeStyle=palette.orange;ctx.lineWidth=2;ctx.setLineDash([6,5]);for(let i=0;i<=120;i++){const x=i/120*Math.PI/2,y=1-fn(x);i?ctx.lineTo(g.X(x),g.Y(y)):ctx.moveTo(g.X(x),g.Y(y));}ctx.stroke();ctx.setLineDash([]);
      text(ctx,'Symmetry: f(x) + f(π/2 − x) = 1',r.x+45,r.y+13,14,palette.green);text(ctx,'Shaded area = π/4',r.x+r.w-28,r.y+r.h-55,13,palette.green,'right');
    }else{
      const expression=options.expression||'x^2 - 5*x + 6';
      const g=drawGraph(ctx,r,expression,{xmin:0,xmax:5,ymin:-1,ymax:7,...options});
      if(!options.expression){
        dot(ctx,g.X(2),g.Y(0),palette.orange,4);dot(ctx,g.X(3),g.Y(0),palette.orange,4);dot(ctx,g.X(2.5),g.Y(-.25),palette.green,4);
        text(ctx,'(2, 0)',g.X(2)-9,g.Y(0)-15,12,palette.orange,'right');text(ctx,'(3, 0)',g.X(3)+9,g.Y(0)-15,12,palette.orange);
        text(ctx,'(2.5, −0.25)',g.X(2.5),g.Y(-.25)+17,11,palette.green,'center');
      }
    }
    ctx.restore();
  }
  root.MathTools=Object.freeze({compile,calc,drawGraph,drawDiagram});
})(typeof window!=='undefined'?window:globalThis);
