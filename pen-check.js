(function(root){
  'use strict';
  // Counts device input, not display latency. No handwriting coordinates are retained.
  function create(){
    let data,last=null,active=null;
    function reset(){data={penStrokes:0,mouseStrokes:0,blockedTouches:0,cancelledStrokes:0,penSamples:0,pressureMin:null,pressureMax:null,maxInputGapMs:0,gapsOver50Ms:0};last=null;active=null;}
    function start(e){if(e.pointerType==='touch'){data.blockedTouches++;return false;}if(active!==null)return false;active=e.pointerId;last=null;if(e.pointerType==='pen')data.penStrokes++;else data.mouseStrokes++;return true;}
    function sample(e){if(active!==e.pointerId||e.pointerType!=='pen')return;data.penSamples++;if(Number.isFinite(e.pressure)&&e.pressure>=0&&e.pressure<=1){data.pressureMin=data.pressureMin===null?e.pressure:Math.min(data.pressureMin,e.pressure);data.pressureMax=data.pressureMax===null?e.pressure:Math.max(data.pressureMax,e.pressure);}if(Number.isFinite(e.timeStamp)){if(last!==null&&e.timeStamp>=last){const gap=e.timeStamp-last;data.maxInputGapMs=Math.max(data.maxInputGapMs,gap);if(gap>50)data.gapsOver50Ms++;}last=e.timeStamp;}}
    function end(cancelled=false){if(active!==null&&cancelled)data.cancelledStrokes++;active=null;last=null;}
    function snapshot(){return {...data,maxInputGapMs:Math.round(data.maxInputGapMs*10)/10};}
    reset();return {reset,start,sample,end,snapshot};
  }
  root.PenCheck=Object.freeze({create});
})(window);
