(function (global) {
  'use strict';

  const DB_NAME = 'ganit-studio-recordings';
  const STORE = 'recordings';
  let dbPromise;

  function database() {
    if (!global.indexedDB) return Promise.reject(new Error('Recording storage is unavailable. Download your video before leaving this page.'));
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' });
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => { db.close(); dbPromise = null; };
          resolve(db);
        };
        request.onerror = () => reject(request.error || new Error('Cannot open recording storage.'));
        request.onblocked = () => reject(new Error('Close other Mathematics Gyaan Maath tabs and try opening recordings again.'));
      }).catch(error => { dbPromise = null; throw error; });
    }
    return dbPromise;
  }

  async function access(mode, operation) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      let result;
      let request;
      try { request = operation(transaction.objectStore(STORE)); }
      catch (error) { reject(error); return; }
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => reject(request.error || new Error('Cannot access saved recordings.'));
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error || new Error('Cannot save this recording. Download it now.'));
      transaction.onabort = () => reject(transaction.error || new Error('Recording storage is full or unavailable. Download your video now.'));
    });
  }

  function publicRecord(record) {
    const { blob, ...metadata } = record;
    return metadata;
  }

  function recordingMetadata(options) {
    const source = options?.metadata && typeof options.metadata === 'object' ? options.metadata : options;
    const metadata = {};
    for (const field of ['name', 'lessonTitle', 'notebookName', 'notebookId', 'classLevel']) {
      const value = source?.[field];
      if (value === undefined || value === null) continue;
      const text = String(value).trim();
      if (text) metadata[field] = field === 'name' ? text.slice(0, 200) : text;
    }
    return Object.freeze(metadata);
  }

  function friendlyError(error, microphone) {
    if (error && error.name === 'NotAllowedError') return new Error(microphone
      ? 'Microphone permission was not granted. Allow it in browser settings, or turn microphone off to record only the board.'
      : 'The browser did not allow recording. Open the app in Chrome over HTTPS and try again.');
    if (error && error.name === 'NotFoundError') return new Error('No microphone was found. Turn microphone off to record only the board.');
    if (error && error.name === 'NotReadableError') return new Error('The microphone is busy or unavailable. Close other apps using it, or record with microphone off.');
    if (error && error.name === 'SecurityError') return new Error('This browser blocked canvas recording. Use a recent Chrome browser and local image uploads.');
    return error instanceof Error ? error : new Error(String(error || 'Recording failed. Please try again.'));
  }

  class StudioRecorder {
    constructor(canvas, callbacks = {}) {
      this.canvas = canvas;
      this.onState = callbacks.onState || (() => {});
      this.onSaved = callbacks.onSaved || (() => {});
      this.onError = callbacks.onError || (() => {});
      this.state = 'idle';
      this.seconds = 0;
      this.microphone = false;
      this.recorder = null;
      this.stream = null;
      this.audioStream = null;
      this._elapsed = 0;
      this._activeSince = 0;
      this._chunks = [];
      this._timer = null;
      this._frames = null;
      this._stopPromise = null;
      this._stopResolve = null;
      this._stopReject = null;
      this._lastBlob = null;
      this._metadata = Object.freeze({});
    }

    static async list({ query = '', classLevel = '' } = {}) {
      const records = await access('readonly', store => store.getAll());
      const search = String(query ?? '').trim().toLocaleLowerCase();
      const level = String(classLevel ?? '').trim().toUpperCase();
      return records.filter(record => {
        if (level && level !== 'ALL' && String(record.classLevel ?? '').trim().toUpperCase() !== level) return false;
        return !search || [record.name, record.lessonTitle, record.notebookName, record.classLevel].filter(value => value !== undefined && value !== null).join(' ').toLocaleLowerCase().includes(search);
      }).map(publicRecord).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    static async rename(id, name) {
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 200) throw new Error('Recording name must contain 1–200 characters.');
      const db = await database();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE, 'readwrite');
        const store = transaction.objectStore(STORE);
        const request = store.get(id);
        let renamed;
        let failure;
        request.onsuccess = () => {
          if (!request.result) {
            failure = new Error('This recording is no longer saved on this device.');
            transaction.abort();
            return;
          }
          const record = { ...request.result, name: name.trim() };
          renamed = publicRecord(record);
          store.put(record);
        };
        request.onerror = () => { failure = request.error; };
        transaction.oncomplete = () => resolve(renamed);
        transaction.onerror = transaction.onabort = () => reject(failure || transaction.error || new Error('Could not rename this recording. Try again.'));
      });
    }

    static async remove(id) {
      await access('readwrite', store => store.delete(id));
    }

    static async getBlob(id) {
      const record = await access('readonly', store => store.get(id));
      if (!record) throw new Error('This recording is no longer saved on this device.');
      return record.blob;
    }

    _call(callback, value) {
      try { callback(value); } catch (error) { console.error('Recording callback failed:', error); }
    }

    _duration() {
      return (this._elapsed + (this._activeSince ? performance.now() - this._activeSince : 0)) / 1000;
    }

    _emit() {
      this.seconds = Math.floor(this._duration());
      this._call(this.onState, { state: this.state, seconds: this.seconds, microphone: this.microphone });
    }

    _cleanup() {
      clearInterval(this._timer);
      clearInterval(this._frames);
      this._timer = this._frames = null;
      const tracks = new Set([...(this.stream?.getTracks() || []), ...(this.audioStream?.getTracks() || [])]);
      tracks.forEach(track => { track.onended = null; track.stop(); });
      this.stream = this.audioStream = null;
    }

    async start(options = {}) {
      if (this.state !== 'idle') throw new Error('A recording is already active. Stop it before starting another.');
      const { microphone = true } = options;
      // Capture the lesson before waiting for microphone permission. Switching
      // pages or changing the caller's object must not relabel an active video.
      this._metadata = recordingMetadata(options);
      this.state = 'starting';
      this._elapsed = 0;
      this._activeSince = 0;
      this.microphone = Boolean(microphone);
      this._chunks = [];
      this._lastBlob = null;
      this._stopPromise = null;
      this._emit();
      try {
        if (!global.MediaRecorder || !this.canvas?.captureStream) throw new Error('Board recording is unavailable in this browser. Use an up-to-date Chrome browser on your Samsung tablet.');
        if (this.microphone && !navigator.mediaDevices?.getUserMedia) throw new Error('Microphone recording needs HTTPS and a supported browser. You can turn microphone off to record only the board.');
        if (this.microphone) this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
        this.stream = this.canvas.captureStream(24);
        if (!this.stream.getVideoTracks().length) throw new Error('The teaching board could not start its video stream. Refresh the app and try again.');
        this.audioStream?.getAudioTracks().forEach(track => this.stream.addTrack(track));
        const candidates = this.microphone
          ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
          : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
        const mimeType = candidates.find(type => !MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(type));
        const options = { videoBitsPerSecond: 2500000 };
        if (mimeType) options.mimeType = mimeType;
        this.recorder = new MediaRecorder(this.stream, options);
        this.recorder.ondataavailable = event => { if (event.data?.size) this._chunks.push(event.data); };
        this.recorder.onstop = () => this._finish();
        this.recorder.onerror = event => {
          this._call(this.onError, friendlyError(event.error));
          this.stop().catch(() => {});
        };
        this.stream.getTracks().forEach(track => {
          track.onended = () => {
            if (this.state === 'recording' || this.state === 'paused') {
              this._call(this.onError, new Error('A recording input disconnected. Saving the recorded portion.'));
              this.stop().catch(() => {});
            }
          };
        });
        this.recorder.start(1000);
        this._activeSince = performance.now();
        this.state = 'recording';
        this._timer = setInterval(() => this._emit(), 500);
        // A static board still needs a first video frame and regular frames.
        const videoTrack = this.stream.getVideoTracks()[0];
        if (typeof videoTrack.requestFrame === 'function') {
          videoTrack.requestFrame();
          this._frames = setInterval(() => { if (this.state === 'recording') videoTrack.requestFrame(); }, 1000 / 24);
        }
        this._emit();
      } catch (error) {
        if (this.recorder) {
          this.recorder.onstop = this.recorder.ondataavailable = this.recorder.onerror = null;
          try { if (this.recorder.state !== 'inactive') this.recorder.stop(); } catch (_) {}
        }
        this._cleanup();
        this.recorder = null;
        this.state = 'idle';
        this._emit();
        const readable = friendlyError(error, this.microphone);
        this._call(this.onError, readable);
        throw readable;
      }
    }

    pause() {
      if (this.state !== 'recording') return;
      this.recorder.pause();
      this._elapsed += performance.now() - this._activeSince;
      this._activeSince = 0;
      this.state = 'paused';
      this._emit();
    }

    resume() {
      if (this.state !== 'paused') return;
      this.recorder.resume();
      this._activeSince = performance.now();
      this.state = 'recording';
      this._emit();
    }

    async stop() {
      if (this._stopPromise) return this._stopPromise;
      if (!this.recorder || this.state === 'idle') return this._lastBlob;
      if (this.state === 'starting') throw new Error('Please wait for recording to start before stopping it.');
      if (this._activeSince) this._elapsed += performance.now() - this._activeSince;
      this._activeSince = 0;
      this.state = 'stopping';
      this._emit();
      this._stopPromise = new Promise((resolve, reject) => { this._stopResolve = resolve; this._stopReject = reject; });
      try {
        // A native error may already make the recorder inactive. Its final
        // dataavailable and stop events are still queued in that order; saving
        // here would discard the final chunk. Only onstop may finish the blob.
        if (this.recorder.state !== 'inactive') this.recorder.stop();
      } catch (error) {
        // The native recorder can become inactive between the state check and
        // stop(). In that case its queued stop event still completes this save.
        if (error.name === 'InvalidStateError' && this.recorder?.state === 'inactive') return this._stopPromise;
        this._cleanup();
        this.state = 'idle';
        this._emit();
        this._call(this.onError, friendlyError(error));
        this._stopReject(error);
      }
      return this._stopPromise;
    }

    async _finish() {
      if (this._finishing) return;
      this._finishing = true;
      if (this._activeSince) this._elapsed += performance.now() - this._activeSince;
      this._activeSince = 0;
      const duration = this._duration();
      this._cleanup();
      try {
        const type = this.recorder?.mimeType || this._chunks[0]?.type || 'video/webm';
        const blob = new Blob(this._chunks, { type });
        if (!blob.size) throw new Error('The browser produced an empty recording. Keep the app visible while recording and try again.');
        this._lastBlob = blob;
        const now = new Date();
        const record = {
          ...this._metadata,
          id: global.crypto?.randomUUID?.() || `rec-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: this._metadata.name || `Math lesson · ${now.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
          createdAt: now.toISOString(), size: blob.size, type, duration, blob
        };
        let saved = true;
        let saveError = null;
        try { await access('readwrite', store => store.put(record)); }
        catch (error) {
          saved = false;
          saveError = 'This video could not be saved on the device. Download it now before closing the app.';
          this._call(this.onError, new Error(saveError));
        }
        this.state = 'idle';
        this._emit();
        this._call(this.onSaved, { ...record, saved, saveError });
        this._stopResolve?.(blob);
      } catch (error) {
        this.state = 'idle';
        this._emit();
        this._call(this.onError, friendlyError(error));
        this._stopReject?.(error);
      } finally {
        this.recorder = null;
        this._chunks = [];
        this._finishing = false;
      }
    }
  }

  global.StudioRecorder = StudioRecorder;
})(window);
