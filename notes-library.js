/* Local notebooks and folders. No account or network is needed. */
(function(root){
 'use strict';
 const DB='ganit-studio-notes-v1';let promise;
 const id=()=>root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const clean=(s,f='Untitled notebook')=>String(s||'').trim().slice(0,160)||f;
 function db(){if(!promise)promise=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{for(const name of ['notes','folders','settings'])r.result.createObjectStore(name);};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return promise;}
 async function transaction(store,mode,operation){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(store,mode),s=t.objectStore(store);let value;try{const r=operation(s);if(r){r.onsuccess=()=>value=r.result;r.onerror=()=>reject(r.error);}}catch(e){reject(e);return;}t.oncomplete=()=>resolve(value);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('Storage unavailable.'));});}
 const get=(s,k)=>transaction(s,'readonly',x=>x.get(k));
 const put=(s,k,v)=>transaction(s,'readwrite',x=>x.put(v,k));
 const all=s=>transaction(s,'readonly',x=>x.getAll());
 function searchText(snapshot){return(snapshot?.pages||[]).map(p=>[p.title,...(p.objects||[]).filter(o=>o.type==='text').map(o=>o.text)].join(' ')).join(' ').slice(0,200000).toLowerCase();}
 function metadata(n){const {snapshot,search,...m}=n;return{...m,pageCount:snapshot?.pages?.length||0};}
 async function mutate(noteId,fn){const n=await get('notes',noteId);if(!n)throw Error('Notebook nahi mili.');fn(n);n.updatedAt=new Date().toISOString();await put('notes',noteId,n);return metadata(n);}
 async function createNote(title,snapshot,folderId=null){const n={id:id(),title:clean(title),folderId:folderId||null,trashed:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),snapshot,search:searchText(snapshot)};await put('notes',n.id,n);return n;}
 async function initialize(snapshot){const active=await get('settings','active');if(active){const n=await get('notes',active);if(n&&!n.trashed)return n;}const notes=(await all('notes')).filter(n=>!n.trashed);const n=notes[0]||await createNote('Meri teaching notebook',snapshot);await put('settings','active',n.id);return n;}
 root.NotesLibrary=Object.freeze({initialize,createNote,getNote:noteId=>get('notes',noteId),
  async listNotes(options={}){const query=String(options.query||'').trim().toLowerCase();return(await all('notes')).filter(n=>options.trash?n.trashed:!n.trashed).filter(n=>options.folderId===undefined||n.folderId===options.folderId).filter(n=>!query||(n.title+' '+n.search).toLowerCase().includes(query)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(metadata);},
  saveNote:(noteId,snapshot)=>mutate(noteId,n=>{n.snapshot=snapshot;n.search=searchText(snapshot);}),
  renameNote:(noteId,title)=>mutate(noteId,n=>{n.title=clean(title);}),moveNote:(noteId,folderId)=>mutate(noteId,n=>{n.folderId=folderId||null;}),
  trashNote:noteId=>mutate(noteId,n=>{n.trashed=true;}),restoreNote:noteId=>mutate(noteId,n=>{n.trashed=false;}),
  setActive:noteId=>put('settings','active',noteId),getActive:()=>get('settings','active'),
  listFolders:async()=> (await all('folders')).sort((a,b)=>a.name.localeCompare(b.name)),
  async createFolder(name){const f={id:id(),name:clean(name,'New folder')};await put('folders',f.id,f);return f;},
  async renameFolder(folderId,name){const f=await get('folders',folderId);if(!f)throw Error('Folder nahi mila.');f.name=clean(name,'Folder');await put('folders',folderId,f);return f;}
 });
})(typeof window!=='undefined'?window:globalThis);
