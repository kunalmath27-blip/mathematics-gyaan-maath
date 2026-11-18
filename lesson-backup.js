/* Binary, device-local teaching backups. Restore always creates additional copies. */
(function (root) {
  'use strict';
  const MAGIC = 'MGMBAK01', PREFIX = 12, FORMAT = 'mathematics-gyaan-maath-backup';
  const LIMITS = Object.freeze({header:80*1024*1024,total:512*1024*1024,attachment:40*1024*1024,notes:200,questions:1000,recordings:100,folders:1000,pages:1000});
  const SPECS = {
    notes:{name:'ganit-studio-notes-v1',stores:[['notes',false],['folders',false],['settings',false]]},
    questions:{name:'ganit-studio-question-bank',stores:[['questions',true]]},
    recordings:{name:'ganit-studio-recordings',stores:[['recordings',true]]}
  };
  const now = () => new Date().toISOString();
  const plain = v => !!v && typeof v==='object' && !Array.isArray(v);
  function fail(message){throw new Error(message);}
  function string(v,name,max=200,optional=false){if(optional&&(v===undefined||v===null))return '';if(typeof v!=='string'||v.length>max||(!optional&&!v.trim()))fail('Invalid '+name+'.');return v;}
  function identifier(v,name='source ID'){return string(v,name,200);}
  function timestamp(v,name){const s=string(v,name,64);if(!Number.isFinite(Date.parse(s)))fail('Invalid '+name+'.');return s;}
  function integer(v,name,min=0,max=Number.MAX_SAFE_INTEGER){if(!Number.isSafeInteger(v)||v<min||v>max)fail('Invalid '+name+'.');return v;}
  function mime(v,kind){const s=string(v,'file MIME type',160).toLowerCase();
    if(!/^[a-z0-9.+-]+\/[a-z0-9.+-]+(?:;[a-z0-9=,+ ._-]+)?$/.test(s))fail('Invalid file MIME type.');
    const base=s.split(';')[0];
    if(kind==='attachment'&&!(base==='application/pdf'||/^image\/(?:png|jpeg|jpg|webp|gif|bmp|avif|heic|heif|tiff|svg\+xml)$/.test(base)))fail('Only PDF or photo attachments are supported.');
    if(kind==='video'&&base!=='video/webm'&&base!=='video/mp4')fail('Only WebM or MP4 recordings are supported.');
    return s;
  }
  function inferredType(attachment){const proposed=attachment.type||attachment.blob?.type;if(proposed)return proposed;
    const ext=String(attachment.name||'').toLowerCase().split('.').pop();return({pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',bmp:'image/bmp',avif:'image/avif',heic:'image/heic',heif:'image/heif',tif:'image/tiff',tiff:'image/tiff',svg:'image/svg+xml'})[ext]||'';
  }
  function list(v,name,max){if(!Array.isArray(v)||v.length>max)fail('Backup has too many or invalid '+name+'.');return v;}
  function unique(items,name){const ids=new Set();for(const item of items){if(ids.has(item.id))fail('Duplicate '+name+' source ID.');ids.add(item.id);}return ids;}
  function basicSnapshot(s){if(!plain(s)||s.version!==1||!Array.isArray(s.pages)||!s.pages.length||s.pages.length>LIMITS.pages||s.pages.some(p=>!plain(p)||!Array.isArray(p.objects)))fail('Invalid notebook snapshot.');return s;}
  function count(data){return{folders:data.folders.length,notes:data.notes.length,questions:data.questions.length,recordings:data.recordings.length,attachments:data.questions.filter(q=>q.attachment).length};}
  function validateData(input){
    if(!plain(input)||input.format!==FORMAT||input.version!==1)fail('Choose a valid .mgm teaching backup.');
    const createdAt=timestamp(input.createdAt,'backup date');
    const folders=list(input.folders,'folders',LIMITS.folders).map(f=>{if(!plain(f))fail('Invalid folder metadata.');return{id:identifier(f.id),name:string(f.name,'folder name',160)};});
    const folderIDs=unique(folders,'folder');
    const notes=list(input.notes,'notebooks',LIMITS.notes).map(n=>{if(!plain(n))fail('Invalid notebook metadata.');const folderId=n.folderId==null?null:identifier(n.folderId,'notebook folder ID');if(folderId!==null&&!folderIDs.has(folderId))fail('Notebook refers to a missing folder.');if(n.trashed!==undefined&&typeof n.trashed!=='boolean')fail('Invalid notebook trash status.');return{id:identifier(n.id),title:string(n.title,'notebook title',160),folderId,trashed:n.trashed===true,createdAt:timestamp(n.createdAt,'notebook date'),updatedAt:timestamp(n.updatedAt,'notebook update date'),snapshot:basicSnapshot(n.snapshot)};});
    unique(notes,'notebook');
    const questions=list(input.questions,'questions',LIMITS.questions).map(q=>{if(!plain(q))fail('Invalid question metadata.');const classLevel=string(q.classLevel,'question class',8);if(!['9','10','11','12','JEE'].includes(classLevel))fail('Invalid question class.');const sourceLabel=string(q.sourceLabel,'question source',20);if(!['My question','PYQ'].includes(sourceLabel))fail('Invalid question source.');
      let attachment=null;if(q.attachment!=null){const a=q.attachment;if(!plain(a)||!(a.blob instanceof Blob))fail('Invalid original attachment.');const type=mime(inferredType(a),'attachment'),size=integer(a.size,'attachment size',1,LIMITS.attachment);if(size!==a.blob.size)fail('Attachment size does not match its binary data.');if(a.blob.type&&mime(a.blob.type,'attachment').split(';')[0]!==type.split(';')[0])fail('Attachment MIME type does not match its blob.');attachment={name:string(a.name,'attachment filename',255),type,size,blob:a.blob};}
      const selectedPage=integer(q.selectedPage===undefined?1:q.selectedPage,'PDF page',1,1000000);
      return{id:identifier(q.id),title:string(q.title,'question title',200),text:string(q.text,'question text',2*1024*1024,true),classLevel,level:classLevel,chapter:string(q.chapter,'chapter',160,true),sourceLabel,exam:string(q.exam,'exam',160,true),year:string(q.year,'exam year',8,true),selectedPage,...(q.pageRange===undefined?{}:{pageRange:string(q.pageRange,'PDF page range',120,true)}),createdAt:timestamp(q.createdAt,'question date'),updatedAt:timestamp(q.updatedAt,'question update date'),attachment};
    });unique(questions,'question');
    const recordings=list(input.recordings,'recordings',LIMITS.recordings).map(r=>{if(!plain(r)||!(r.blob instanceof Blob))fail('Invalid recording metadata or binary.');const type=mime(r.type||r.blob.type,'video'),size=integer(r.size,'recording size',1,LIMITS.total);if(size!==r.blob.size)fail('Recording size does not match its binary data.');if(r.blob.type&&mime(r.blob.type,'video').split(';')[0]!==type.split(';')[0])fail('Recording MIME type does not match its blob.');if(!Number.isFinite(r.duration)||r.duration<0||r.duration>1e9)fail('Invalid recording duration.');const metadata={};for(const field of ['lessonTitle','notebookName'])if(r[field]!==undefined&&r[field]!==null)metadata[field]=string(r[field],field==='lessonTitle'?'lesson title':'recording notebook name',200);if(r.notebookId!==undefined&&r.notebookId!==null)metadata.notebookId=identifier(r.notebookId,'recording notebook ID');if(r.classLevel!==undefined&&r.classLevel!==null){const level=string(r.classLevel,'recording class',8);if(!['9','10','11','12','JEE'].includes(level))fail('Invalid recording class.');metadata.classLevel=level;}return{id:identifier(r.id),name:string(r.name,'recording name',250),createdAt:timestamp(r.createdAt,'recording date'),type,size,duration:r.duration,blob:r.blob,...metadata};});unique(recordings,'recording');
    return{format:FORMAT,version:1,createdAt,folders,notes,questions,recordings};
  }
  async function database(kind){if(!root.indexedDB)fail('Local browser storage is unavailable.');const spec=SPECS[kind];return new Promise((resolve,reject)=>{const request=root.indexedDB.open(spec.name,1);request.onupgradeneeded=()=>{for(const[name,keyed]of spec.stores)if(!request.result.objectStoreNames.contains(name))request.result.createObjectStore(name,keyed?{keyPath:'id'}:undefined);};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||Error('Cannot open local teaching storage.'));request.onblocked=()=>reject(Error('Close other teaching app tabs and try again.'));});}
  async function readAll(kind,store){const db=await database(kind);try{return await new Promise((resolve,reject)=>{const t=db.transaction(store,'readonly'),r=t.objectStore(store).getAll();let value;r.onsuccess=()=>{value=r.result;};r.onerror=()=>reject(r.error);t.oncomplete=()=>resolve(value||[]);t.onerror=t.onabort=()=>reject(t.error||Error('Cannot read local backup data.'));});}finally{db.close();}}
  async function addRecord(kind,store,record){const db=await database(kind);try{return await new Promise((resolve,reject)=>{const t=db.transaction(store,'readwrite');try{t.objectStore(store).add(record);}catch(e){reject(e);return;}t.oncomplete=resolve;t.onerror=t.onabort=()=>reject(t.error||Error('Could not store this restored item.'));});}finally{db.close();}}
  async function collect(options={}){
    const selection={notes:options.notes!==false,questions:options.questions!==false,recordings:options.recordings===true};
    let folders=[],notes=[],questions=[],recordings=[];
    if(selection.notes){folders=await readAll('notes','folders');notes=await readAll('notes','notes');}
    if(selection.questions)questions=await readAll('questions','questions');
    if(selection.recordings)recordings=await readAll('recordings','recordings');
    return validateData({format:FORMAT,version:1,createdAt:now(),folders,notes,questions,recordings});
  }
  async function pack(input){const data=validateData(input),parts=[],blobs=[];let offset=0;
    const append=(blob,type)=>{const id='blob-'+blobs.length;blobs.push({id,offset,length:blob.size,type});parts.push(blob);offset+=blob.size;if(offset>LIMITS.total)fail('Backup exceeds 512 MB. Exclude recordings or back up fewer items.');return id;};
    const manifest={format:FORMAT,version:1,createdAt:data.createdAt,folders:data.folders,notes:data.notes,questions:data.questions.map(q=>({...q,attachment:q.attachment?{name:q.attachment.name,type:q.attachment.type,size:q.attachment.size,blobId:append(q.attachment.blob,q.attachment.type)}:null})),recordings:data.recordings.map(r=>{const{blob,...metadata}=r;return{...metadata,blobId:append(blob,r.type)};}),blobs};
    const json=new TextEncoder().encode(JSON.stringify(manifest));if(json.byteLength>LIMITS.header)fail('Notebook metadata exceeds the 80 MB backup limit.');if(PREFIX+json.byteLength+offset>LIMITS.total)fail('Backup exceeds 512 MB. Exclude recordings or back up fewer items.');
    const prefix=new Uint8Array(PREFIX);for(let i=0;i<MAGIC.length;i++)prefix[i]=MAGIC.charCodeAt(i);new DataView(prefix.buffer).setUint32(8,json.byteLength,true);
    return new Blob([prefix,json,...parts],{type:'application/x-mgm-backup'});
  }
  async function inspect(file){
    if(!(file instanceof Blob)||file.size<PREFIX||file.size>LIMITS.total)fail('Choose a .mgm backup smaller than 512 MB.');
    const prefix=new Uint8Array(await file.slice(0,PREFIX).arrayBuffer());if(String.fromCharCode(...prefix.slice(0,8))!==MAGIC)fail('This file is not a valid .mgm teaching backup.');
    const length=new DataView(prefix.buffer,prefix.byteOffset,prefix.byteLength).getUint32(8,true);if(!length||length>LIMITS.header||PREFIX+length>file.size)fail('Invalid backup metadata length.');
    let manifest;try{manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await file.slice(PREFIX,PREFIX+length).arrayBuffer()));}catch(_){fail('Backup metadata is damaged or unreadable.');}
    if(!plain(manifest)||manifest.format!==FORMAT||manifest.version!==1)fail('Unsupported teaching backup format.');
    const descriptors=list(manifest.blobs,'binary files',LIMITS.questions+LIMITS.recordings),map=new Map();let expected=0;
    for(const d of descriptors){if(!plain(d))fail('Invalid binary file metadata.');const id=identifier(d.id,'binary file ID');if(map.has(id))fail('Duplicate binary file ID.');const offset=integer(d.offset,'binary offset',0,LIMITS.total),size=integer(d.length,'binary length',1,LIMITS.total);if(offset!==expected||offset+size>file.size-PREFIX-length)fail('Invalid or overlapping binary file bounds.');const type=string(d.type,'binary MIME type',160);map.set(id,{offset,size,type});expected+=size;}
    if(PREFIX+length+expected!==file.size)fail('Backup binary size does not match its manifest.');
    const used=new Set();function blobFor(id,type,size,kind){const d=map.get(identifier(id,'attachment reference'));if(!d||used.has(id))fail('Missing or duplicate binary attachment reference.');const normalized=mime(type,kind);if(normalized!==mime(d.type,kind)||size!==d.size)fail('Binary attachment metadata does not match its file.');used.add(id);return file.slice(PREFIX+length+d.offset,PREFIX+length+d.offset+d.size,normalized);}
    list(manifest.questions,'questions',LIMITS.questions);list(manifest.recordings,'recordings',LIMITS.recordings);
    const input={...manifest,questions:manifest.questions.map(q=>{if(!plain(q))fail('Invalid question metadata.');if(q.attachment==null)return q;const a=q.attachment;if(!plain(a))fail('Invalid attachment metadata.');return{...q,attachment:{...a,blob:blobFor(a.blobId,a.type,a.size,'attachment')}};}),recordings:manifest.recordings.map(r=>{if(!plain(r))fail('Invalid recording metadata.');return{...r,blob:blobFor(r.blobId,r.type,r.size,'video')};})};
    if(used.size!==map.size)fail('Backup contains unreferenced binary files.');
    const data=validateData(input);return{counts:count(data),size:file.size,data};
  }
  function uuid(){if(root.crypto?.randomUUID)return root.crypto.randomUUID();const bytes=new Uint8Array(16);if(root.crypto?.getRandomValues)root.crypto.getRandomValues(bytes);else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256);bytes[6]=bytes[6]&15|64;bytes[8]=bytes[8]&63|128;const h=Array.from(bytes,v=>v.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}
  async function restore(file,options={}){
    const parsed=await inspect(file),data=parsed.data;
    if(data.notes.length&&typeof options.validateSnapshot!=='function')fail('Notebook validation is required before restoring teaching pages.');
    // Every notebook is checked before creating even an empty folder or DB row.
    for(const note of data.notes)if(await options.validateSnapshot(note.snapshot)===false)fail('A notebook snapshot failed validation.');
    if((data.notes.length||data.folders.length)&&(!root.NotesLibrary?.createFolder||!root.NotesLibrary?.createNote))fail('The notebook library is unavailable. Refresh the app before restoring.');
    if(data.notes.some(n=>n.trashed)&&!root.NotesLibrary?.trashNote)fail('Notebook trash support is unavailable. Refresh the app before restoring.');
    const restoredCounts={folders:0,notes:0,questions:0,recordings:0},folderMap=new Map(),noteMap=new Map();let completed=0;
    const total=data.folders.length+data.notes.length+data.questions.length+data.recordings.length;
    function progress(phase){try{options.onProgress?.({phase,completed,total,restoredCounts:{...restoredCounts}});}catch(_){}}
    progress('starting');
    try{
      for(const f of data.folders){const added=await root.NotesLibrary.createFolder(f.name);folderMap.set(f.id,added.id);restoredCounts.folders++;completed++;progress('folders');}
      for(const n of data.notes){const added=await root.NotesLibrary.createNote(n.title,n.snapshot,n.folderId?folderMap.get(n.folderId):null);noteMap.set(n.id,added.id);restoredCounts.notes++;completed++;if(n.trashed&&root.NotesLibrary.trashNote)await root.NotesLibrary.trashNote(added.id);progress('notes');}
      for(const q of data.questions){await addRecord('questions','questions',{...q,id:uuid()});restoredCounts.questions++;completed++;progress('questions');}
      for(const r of data.recordings){const{notebookId,...metadata}=r;const copy={...metadata,id:uuid()};if(notebookId&&noteMap.has(notebookId))copy.notebookId=noteMap.get(notebookId);await addRecord('recordings','recordings',copy);restoredCounts.recordings++;completed++;progress('recordings');}
      progress('complete');return{restoredCounts,counts:parsed.counts,size:parsed.size};
    }catch(cause){const error=new Error('Restore stopped. '+completed+' items were added; existing work is unchanged. '+(cause?.message||'Device storage may be full.'));error.name='LessonBackupRestoreError';error.cause=cause;error.restoredCounts={...restoredCounts};error.completed=completed;error.total=total;progress('failed');throw error;}
  }
  root.LessonBackup=Object.freeze({collect,pack,inspect,restore,LIMITS});
})(typeof window!=='undefined'?window:globalThis);
