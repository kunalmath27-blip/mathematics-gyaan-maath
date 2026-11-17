(function(root){
  'use strict';
  const PARAMS=new Set(['a','b','c','d','h','k','m','n','r']);
  const DEFAULTS={a:1,b:1,c:0,d:1,h:0,k:0,m:1,n:1,r:3};
  const FUNCTIONS={sin:Math.sin,cos:Math.cos,tan:Math.tan,sqrt:Math.sqrt,abs:Math.abs,log:Math.log10,ln:Math.log,exp:Math.exp,asin:Math.asin,acos:Math.acos,atan:Math.atan};
  const number=v=>({t:'n',v}),variable=v=>({t:'v',v});
  function op(t,a,b){
    if(a.t==='n'&&b.t==='n'){const v=t==='+'?a.v+b.v:t==='-'?a.v-b.v:t==='*'?a.v*b.v:t==='/'?a.v/b.v:Math.pow(a.v,b.v);if(Number.isFinite(v))return number(v);}
    if(t==='+'&&a.t==='n'&&a.v===0)return b;
    if((t==='+'||t==='-')&&b.t==='n'&&b.v===0)return a;
    if(t==='*'&&((a.t==='n'&&a.v===0)||(b.t==='n'&&b.v===0)))return number(0);
    if(t==='*'&&a.t==='n'&&a.v===1)return b;
    if((t==='*'||t==='/')&&b.t==='n'&&b.v===1)return a;
    if(t==='^'&&b.t==='n'&&b.v===1)return a;
    return{t,a,b};
  }
  function has(node,name){return node.t==='v'?node.v===name:node.a&&has(node.a,name)||node.b&&has(node.b,name)||false;}
  function names(node,set=new Set()){if(node.t==='v')set.add(node.v);if(node.a)names(node.a,set);if(node.b)names(node.b,set);return set;}
  function serialize(n){if(n.t==='n')return n.v<0?'('+n.v+')':String(n.v);if(n.t==='v')return n.v;if(n.t==='fn')return n.v+'('+serialize(n.a)+')';return'('+serialize(n.a)+n.t+serialize(n.b)+')';}
  function ast(input){
    if(!input||input.length>1200)throw Error('Use a math expression shorter than 1,200 characters.');
    const tokens=[];let at=0;
    while(at<input.length){const s=input.slice(at);let m;
      if(/^\s/.test(s)){at++;continue;}
      if((m=s.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i))){const v=Number(m[0]);if(!Number.isFinite(v))throw Error('Use finite numbers.');tokens.push({t:'n',v});at+=m[0].length;}
      else if((m=s.match(/^[a-z]+/i))){const word=m[0].toLowerCase();if(word==='x'||word==='y'||word==='pi'||word==='e'||PARAMS.has(word)||Object.hasOwn(FUNCTIONS,word))tokens.push({t:'id',v:word});else if(/^[abcdhkmnrxy]?[xy]$/.test(word)){for(const v of word)tokens.push({t:'id',v});}else throw Error('Unsupported word “'+word+'”. Enter an equation such as y = a*x^2 + b*x + c.');at+=m[0].length;}
      else if('+-*/^()'.includes(s[0])){tokens.push({t:s[0]});at++;}
      else throw Error('Unsupported symbol “'+s[0]+'”. Use ordinary equations and function brackets.');
      if(tokens.length>400)throw Error('This expression is too long.');
    }
    tokens.push({t:'end'});let p=0,depth=0;
    function take(t){if(tokens[p].t===t){p++;return true;}return false;}
    function need(t){if(!take(t))throw Error('Check your brackets: expected '+t+'.');}
    function expr(){let a=product();while(tokens[p].t==='+'||tokens[p].t==='-'){const t=tokens[p++].t;a=op(t,a,product());}return a;}
    function product(){let a=unary();while(true){let t=tokens[p].t;if(t==='*'||t==='/')p++;else if(t==='n'||t==='id'||t==='(')t='*';else break;a=op(t,a,unary());}return a;}
    function unary(){if(take('+'))return unary();if(take('-'))return op('*',number(-1),unary());return power();}
    function power(){let a=primary();if(take('^'))a=op('^',a,unary());return a;}
    function primary(){if(++depth>60)throw Error('Use fewer nested brackets.');const t=tokens[p++];let n;
      if(t.t==='n')n=number(t.v);
      else if(t.t==='id'){if(Object.hasOwn(FUNCTIONS,t.v)){need('(');n={t:'fn',v:t.v,a:expr()};need(')');}else if(t.v==='pi'||t.v==='e')n=number(t.v==='pi'?Math.PI:Math.E);else n=variable(t.v);}
      else if(t.t==='('){n=expr();need(')');}else throw Error('Expected a number, x, y, parameter or function.');depth--;return n;}
    const n=expr();if(tokens[p].t!=='end')throw Error('Check the expression and brackets.');return n;
  }
  function value(n,params,x=0){if(n.t==='n')return n.v;if(n.t==='v'){if(n.v==='x')return x;if(n.v==='y')throw Error('This equation still contains y.');const v=params[n.v];if(!Number.isFinite(v))throw Error('Set a finite value for '+n.v+'.');return v;}if(n.t==='fn')return FUNCTIONS[n.v](value(n.a,params,x));const a=value(n.a,params,x),b=value(n.b,params,x);return n.t==='+'?a+b:n.t==='-'?a-b:n.t==='*'?a*b:n.t==='/'?a/b:Math.pow(a,b);}
  function substitute(n,params){if(n.t==='v'&&n.v!=='x'){if(n.v==='y')throw Error('Cannot plot an unsolved y expression.');const v=Number(params[n.v]);if(!Number.isFinite(v)||Math.abs(v)>1e6)throw Error('Keep parameter '+n.v+' between −1,000,000 and 1,000,000.');return number(v);}if(n.t==='fn')return{...n,a:substitute(n.a,params)};if(n.a)return op(n.t,substitute(n.a,params),substitute(n.b,params));return n;}
  function linearY(n){
    if(!has(n,'y'))return{c:number(0),rest:n};
    if(n.t==='v'&&n.v==='y')return{c:number(1),rest:number(0)};
    if(n.t==='+'||n.t==='-'){const a=linearY(n.a),b=linearY(n.b);return{c:op(n.t,a.c,b.c),rest:op(n.t,a.rest,b.rest)};}
    if(n.t==='*'){const a=linearY(n.a),b=linearY(n.b);if(has(n.a,'y')&&has(n.b,'y'))throw Error('Only equations linear in y, and standard circles, can be rearranged automatically.');return{c:op('+',op('*',a.c,b.rest),op('*',a.rest,b.c)),rest:op('*',a.rest,b.rest)};}
    if(n.t==='/'&&!has(n.b,'y')){const a=linearY(n.a);return{c:op('/',a.c,n.b),rest:op('/',a.rest,n.b)};}
    if(n.t==='^'&&n.b.t==='n'&&n.b.v===1)return linearY(n.a);
    throw Error('This y equation is not supported. Try y = ..., 2x + 3y = 6, or a standard circle.');
  }
  function centerTerm(n,axis){if(n.t!=='^'||n.b.t!=='n'||n.b.v!==2)return null;const b=n.a;
    if(b.t==='v'&&b.v===axis)return number(0);
    if((b.t==='-'||b.t==='+')&&b.a.t==='v'&&b.a.v===axis&&!has(b.b,'x')&&!has(b.b,'y'))return b.t==='-'?b.b:op('*',number(-1),b.b);
    return null;
  }
  function circle(lhs,rhs,defaults,source){
    if(lhs.t!=='+')return null;let h=centerTerm(lhs.a,'x'),k=centerTerm(lhs.b,'y');if(!h||!k){h=centerTerm(lhs.b,'x');k=centerTerm(lhs.a,'y');}
    if(!h||!k||has(rhs,'x')||has(rhs,'y'))return null;
    const hs=value(h,defaults),ks=value(k,defaults),square=value(rhs,defaults);if(!Number.isFinite(hs)||!Number.isFinite(ks)||!Number.isFinite(square)||square<0)throw Error('A real circle needs a finite center and nonnegative radius squared.');
    const r=Math.sqrt(square);if([hs,ks,r].some(v=>Math.abs(v)>1e6))throw Error('Keep circle values within 1,000,000.');
    return{kind:'circle',expression:'(x-h)^2+(y-k)^2=r^2',parameters:{h:hs,k:ks,r},variables:['h','k','r'],source,description:'A circle with an adjustable center (h, k) and radius r.',notes:['The complete circle is drawn; it is not a single-valued function of x.']};
  }
  function normalize(text){return text.replace(/²/g,'^2').replace(/³/g,'^3').replace(/π/g,'pi').replace(/[−–]/g,'-').replace(/×/g,'*').replace(/÷/g,'/').replace(/\*\*/g,'^').replace(/\u221a\s*\(/g,'sqrt(').toLowerCase();}
  function parse(text){
    if(typeof text!=='string'||!text.trim())throw Error('Type a question or equation, for example y = a*x^2 + b*x + c.');
    if(text.length>1800)throw Error('Keep the question under 1,800 characters.');
    const source=text.trim();let s=normalize(source),assigned={};
    // Assignments are accepted only after a separator or the word "with".
    s=s.replace(/(?:[,;]|\bwith\s+)\s*([abcdhkmnr])\s*=\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(?=\s*(?:[,;]|$|\b(?:ka|ki|ke|graph)\b))/g,(match,key,num)=>{const v=Number(num);if(!Number.isFinite(v)||Math.abs(v)>1e6)throw Error('Parameter assignments must be finite and within 1,000,000.');assigned[key]=v;return' ';});
    s=s.trim().replace(/[?!.]+$/,'').trim();
    s=s.replace(/\s+(?:(?:ka|ki|ke)\s+)?graph(?:\s+(?:banao|banaiye|dikhao|draw|plot|please|karo))*\s*$/,'').trim();
    s=s.replace(/^(?:please\s+)?(?:(?:plot|draw|show|sketch)\s+(?:(?:the|a)\s+)?(?:graph\s+)?(?:(?:of|for)\s+)?|graph\s+(?:of|for)\s+)/,'').trim();
    s=s.replace(/^(?:the\s+)?(?:function|equation)\s+/,'').trim();
    const f=s.match(/^f\s*\(\s*x\s*\)\s*=\s*(.+)$/);if(f)s='y='+f[1];
    if(/[;,:<>\\{}\[\]]/.test(s))throw Error('Use one ordinary equation; unsupported punctuation or inequalities were found.');
    let sides=s.split('='),rootCondition=false;
    // A common teaching shorthand names y=f(x) and then asks for f(x)=0.
    // Keep the curve and explain that the final equality identifies its roots.
    if(sides.length===3&&sides[0].trim()==='y'&&/^[+-]?0(?:\.0*)?$/.test(sides[2].trim())){rootCondition=true;sides=sides.slice(0,2);}
    if(sides.length>2||sides.some(v=>!v.trim()))throw Error('Enter one expression or one equation with a single = sign.');
    let left=ast(sides[0]),right=sides.length===2?ast(sides[1]):null;const defaults={...DEFAULTS,...assigned};
    if(right){const c=circle(left,right,defaults,source)||circle(right,left,defaults,source);if(c)return c;}
    let expression,description,yCoefficient,notes=[];
    if(has(left,'y')||(right&&has(right,'y'))){if(!right)throw Error('Include = when your equation contains y.');const a=linearY(left),b=linearY(right),coefficient=op('-',a.c,b.c);if(coefficient.t==='n'&&coefficient.v===0)throw Error('This equation does not determine y.');yCoefficient=serialize(coefficient);expression=op('/',op('-',b.rest,a.rest),coefficient);description='The equation is rearranged to y as a function of x.';if(names(coefficient).size)notes.push('Parameter choices that make the y coefficient zero cannot be plotted as this function.');}
    else if(right){expression=op('-',left,right);description='The curve y = left side − right side. Its x-intercepts solve the original equation.';notes.push('An equation such as x² − 5x + 6 = 0 specifies roots; the associated function is shown to visualize them.');}
    else{expression=left;description='The expression is plotted as y = f(x).';}
    const vars=[...names(expression)].filter(v=>v!=='x').sort();if(vars.some(v=>!PARAMS.has(v)))throw Error('Use x and the supported single-letter parameters a, b, c, d, h, k, m, n or r.');
    if(rootCondition){description='The associated curve y = f(x) is shown. The final = 0 asks for its x-intercepts; it does not make the whole curve y = 0.';notes.push('The shorthand y = f(x) = 0 is interpreted as plotting f(x) and finding where f(x) is zero.');}
    const model={kind:'function',expression:serialize(expression),parameters:Object.fromEntries(vars.map(v=>[v,defaults[v]])),variables:vars,source,description,notes};if(yCoefficient)model.yCoefficient=yCoefficient;
    resolve(model,model.parameters);return model;
  }
  function merged(model,params){const result={...model.parameters,...params};for(const key of model.variables||[]){const v=Number(result[key]);if(!Number.isFinite(v)||Math.abs(v)>1e6)throw Error('Use finite parameter values between −1,000,000 and 1,000,000.');result[key]=v;}return result;}
  function resolve(model,params={}){
    if(model?.kind!=='function')throw Error('A circle is drawn from its center and radius, not as one y function.');const p=merged(model,params),n=ast(model.expression),concrete=serialize(substitute(n,p));
    if(model.yCoefficient){const coefficient=substitute(ast(model.yCoefficient),p);if(!has(coefficient,'x')&&value(coefficient,{})===0)throw Error('The y coefficient is zero with these parameters. This equation does not define y as a function; choose another value.');}
    if(concrete.length>1500)throw Error('The resulting expression is too long.');
    if(root.MathTools){root.MathTools.compile(concrete);}
    return concrete;
  }
  function polynomial(n,p){
    if(!has(n,'x')){const v=value(n,p);return Number.isFinite(v)?[v,0,0]:null;}
    if(n.t==='v'&&n.v==='x')return[0,1,0];if(n.t==='fn'||n.t==='v')return null;
    const a=polynomial(n.a,p),b=polynomial(n.b,p);if(!a||!b)return null;
    if(n.t==='+'||n.t==='-')return a.map((v,i)=>n.t==='+'?v+b[i]:v-b[i]);
    if(n.t==='*'){const c=[0,0,0];for(let i=0;i<3;i++)for(let j=0;j<3;j++){if(i+j>2&&a[i]*b[j]!==0)return null;if(i+j<3)c[i+j]+=a[i]*b[j];}return c;}
    if(n.t==='/'&&b[1]===0&&b[2]===0&&b[0]!==0)return a.map(v=>v/b[0]);
    if(n.t==='^'&&b[1]===0&&b[2]===0){if(b[0]===0)return[1,0,0];if(b[0]===1)return a;if(b[0]===2&&a[2]===0)return[a[0]**2,2*a[0]*a[1],a[1]**2];}return null;
  }
  function analyze(model,params={}){
    const p=merged(model,params);
    if(model.kind==='circle'){if(p.r<0)throw Error('The radius must be nonnegative.');return{type:'circle',center:{x:p.h,y:p.k},radius:p.r,equation:'(x − '+p.h+')² + (y − '+p.k+')² = '+p.r+'²'};}
    const n=ast(resolve(model,p)),poly=polynomial(n,{}),base={type:'function',equation:'y = '+serialize(n)};if(!poly||!poly.every(Number.isFinite))return base;
    const[c,b,a]=poly;if(a!==0){const d=b*b-4*a*c,x=-b/(2*a),y=value(n,{},x);let roots=[];if(d===0)roots=[x];else if(d>0){const q=-.5*(b+(b>=0?1:-1)*Math.sqrt(d));roots=[q/a,c/q].filter(Number.isFinite).sort((u,v)=>u-v);}return{...base,type:'quadratic',coefficients:{a,b,c},discriminant:d,roots,vertex:Number.isFinite(x)&&Number.isFinite(y)?{x,y}:null};}
    if(b!==0)return{...base,type:'linear',slope:b,intercept:c,roots:[-c/b].filter(Number.isFinite)};
    return{...base,type:'constant',value:c,roots:[],allXAreRoots:c===0};
  }
  function suggestBounds(model,params={}){
    const p=merged(model,params),a=analyze(model,p);if(a.type==='circle'){const pad=Math.max(1,a.radius*1.3);return{xmin:a.center.x-pad,xmax:a.center.x+pad,ymin:a.center.y-pad,ymax:a.center.y+pad};}
    let xmin=-5,xmax=5;if(a.type==='quadratic'&&a.vertex&&Math.abs(a.vertex.x)<1e5){xmin=a.vertex.x-5;xmax=a.vertex.x+5;const roots=a.roots.filter(v=>Math.abs(v-a.vertex.x)<100);if(roots.length){xmin=Math.min(xmin,...roots.map(v=>v-2));xmax=Math.max(xmax,...roots.map(v=>v+2));}}
    if(/(?:sin|cos|tan)\(/.test(model.expression)){xmin=-2*Math.PI;xmax=2*Math.PI;}
    const n=ast(resolve(model,p)),ys=[];for(let i=0;i<=200;i++){const v=value(n,{},xmin+(xmax-xmin)*i/200);if(Number.isFinite(v)&&Math.abs(v)<1e8)ys.push(v);}if(!ys.length)return{xmin,xmax,ymin:-5,ymax:5};ys.sort((a,b)=>a-b);let low=ys[Math.floor(ys.length*.04)],high=ys[Math.min(ys.length-1,Math.floor(ys.length*.96))];
    if(a.vertex){low=Math.min(low,a.vertex.y);high=Math.max(high,a.vertex.y);}if(a.roots?.length){low=Math.min(low,0);high=Math.max(high,0);}const pad=Math.max(1,(high-low)*.16);return{xmin,xmax,ymin:low-pad,ymax:high+pad};
  }
  root.QuestionGraph=Object.freeze({parse,resolve,analyze,suggestBounds});
})(typeof window!=='undefined'?window:globalThis);
