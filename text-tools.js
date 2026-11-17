/* Canvas text styling, with bounds shared by the selection tool. */
(function(root){
 'use strict';
 function layout(c,o){const size=Number(o.size)||32,lineHeight=Number(o.lineHeight)||size*1.6,maxWidth=Math.max(1,Number(o.maxWidth)||1400);c.save();c.font=(o.italic?'italic ':'')+(o.bold?'bold ':'')+size+'px '+(o.serif?'Georgia, serif':'"Segoe UI", sans-serif');const strings=[];
  for(const paragraph of String(o.text||'').split('\n')){let line='';for(const word of paragraph.split(' ')){const candidate=line?line+' '+word:word;if(c.measureText(candidate).width>maxWidth&&line){strings.push(line);line=word;}else line=candidate;}strings.push(line);}
  const lines=strings.map((text,i)=>{const width=c.measureText(text).width;return{text,width,x:(Number(o.x)||0)+(o.align==='center'?(maxWidth-width)/2:o.align==='right'?maxWidth-width:0),y:(Number(o.y)||0)+i*lineHeight};});c.restore();const x=Math.min(...lines.map(l=>l.x)),right=Math.max(...lines.map(l=>l.x+l.width));return{lines,bounds:{x,y:(Number(o.y)||0)-size,w:Math.max(size*.35,right-x),h:Math.max(size*1.25,(lines.length-1)*lineHeight+size*1.25)}};
 }
 function draw(c,o){const result=layout(c,o),size=Number(o.size)||32;c.save();c.fillStyle=o.color||'#2e4c43';c.strokeStyle=c.fillStyle;c.textAlign='left';c.textBaseline='alphabetic';c.font=(o.italic?'italic ':'')+(o.bold?'bold ':'')+size+'px '+(o.serif?'Georgia, serif':'"Segoe UI", sans-serif');for(const line of result.lines){c.fillText(line.text,line.x,line.y);if(o.underline&&line.width){c.lineWidth=Math.max(1,size/20);c.beginPath();c.moveTo(line.x,line.y+size*.12);c.lineTo(line.x+line.width,line.y+size*.12);c.stroke();}}c.restore();return result;}
 root.TextTools=Object.freeze({layout,draw});
})(typeof window!=='undefined'?window:globalThis);
