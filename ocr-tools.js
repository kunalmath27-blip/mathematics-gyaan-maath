/* Optional, device-local printed-text OCR. Tesseract.js 6.0.1 / core 6.0.0.
 * Models and engine load only after the user enables OCR; photos stay on device.
 */
(function (global) {
  'use strict';
  const scriptURL = document.currentScript && document.currentScript.src;
  const baseURL = new URL('.', scriptURL || global.location.href);
  const CACHE = 'mgm-ocr-v1';
  const MARKER = new URL('vendor/ocr/installed-v1.json', baseURL).href;
  const ASSETS = [{"path":"vendor/ocr/LICENSE-CORE","size":11358},{"path":"vendor/ocr/LICENSE-MODELS","size":10173},{"path":"vendor/ocr/LICENSE-TESSERACT.md","size":11357},{"path":"vendor/ocr/PACKAGE-METADATA.json","size":9743},{"path":"vendor/ocr/SOURCES.txt","size":1962},{"path":"vendor/ocr/core/tesseract-core-lstm.wasm.js","size":3954181,"parts":[{"path":"vendor/ocr/parts/tesseract-core-lstm.wasm.js.part-00.bin","size":524288,"sha256":"a7016eaab2e85ad2a79abee8cb743bf4e9bc56d309995d98f063093f79d7a0a8"},{"path":"vendor/ocr/parts/tesseract-core-lstm.wasm.js.part-01.bin","size":524288,"sha256":"a02973929ddc842c61db56ade637ba21bc55354253dff30aa41d16c377c3f341"},{"path":"vendor/ocr/parts/tesseract-core-lstm.wasm.js.part-02.bin","size":524288,"sha256":"26f0f4bcdcbb1003d8f89e5ad15487fd7dad7abbfc58b60e4917b640b3504f67"},{"path":"vendor/ocr/parts/tesseract-core-lstm.wasm.js.part-03.bin","size":524288,"sha256":"dab66495dafac8d9e729765425059a93f58141f5101aa6da83db3d3256df9313"},{"path":"vendor/ocr/parts/tesseract-core-lstm.wasm.js.part-04.bin","size":524288,"sha256":"4ae656b9ab0a54ccfee159ea3fb3aee57e26fc9c0b5c50fc8d284010832d4b65"},{"path":"vendor/ocr/parts/tesseract-core-lstm.wasm.js.part-05.bin","size":524288,"sha256":"fadfdb0d2ae2fdfd0b4268da1cb5af078b893571ef46ec6194f9dded1ed8a08a"},{"path":"vendor/ocr/parts/tesseract-core-lstm.wasm.js.part-06.bin","size":524288,"sha256":"b73c4af709ca537a778369a1d08c9f3673ad1e1d35e09f5e20875fa4dd2038c9"},{"path":"vendor/ocr/parts/tesseract-core-lstm.wasm.js.part-07.bin","size":284165,"sha256":"2b756bda4a16a8fadf213698a8a910bb3054ba8abf4624ad6a2a1b1efaa68136"}],"sha256":"775a35df6f2ae100e02609443e6bd5cafcd07983dd6175454ca4a432a7730687","type":"application/javascript"},{"path":"vendor/ocr/core/tesseract-core-simd-lstm.wasm.js","size":3954569,"parts":[{"path":"vendor/ocr/parts/tesseract-core-simd-lstm.wasm.js.part-00.bin","size":524288,"sha256":"6ee01b5f0d4234310a8ea587ed8855f8253951fd38ddce43b9dcead3fee01a2a"},{"path":"vendor/ocr/parts/tesseract-core-simd-lstm.wasm.js.part-01.bin","size":524288,"sha256":"47a92c8370577d8e6594990914c67bab39e023fcead09af864642a9a2e196cf4"},{"path":"vendor/ocr/parts/tesseract-core-simd-lstm.wasm.js.part-02.bin","size":524288,"sha256":"8d04affd4417dcd2765e024e1733a2b7b575cf26e101ea8c3b11de9ddc029e5b"},{"path":"vendor/ocr/parts/tesseract-core-simd-lstm.wasm.js.part-03.bin","size":524288,"sha256":"4737f06b99fe12924e17099886be7518b39f41dc6ff55bc870d4f877d979412d"},{"path":"vendor/ocr/parts/tesseract-core-simd-lstm.wasm.js.part-04.bin","size":524288,"sha256":"08c986ce7e039b495aabfd61b8f4046a5a91dca4c2bf0a420648a38768af49b4"},{"path":"vendor/ocr/parts/tesseract-core-simd-lstm.wasm.js.part-05.bin","size":524288,"sha256":"947e8e66998a7f3de18a4ebb228c2fdd9848f4b87f1b840481aba7e229f953d9"},{"path":"vendor/ocr/parts/tesseract-core-simd-lstm.wasm.js.part-06.bin","size":524288,"sha256":"443890a5dd91896668ade1e243d50f1b0d1190cdcca9aba65ff86bcd3ba8893f"},{"path":"vendor/ocr/parts/tesseract-core-simd-lstm.wasm.js.part-07.bin","size":284553,"sha256":"674208f6f0aaec61a604ea35c8b9c29c8cf4c72d5de1e1063d08da057fcb39be"}],"sha256":"9d7c43fb206dc9f48475228b46bf35f888fa9e6259da2e67d5a75c77049f2dc7","type":"application/javascript"},{"path":"vendor/ocr/lang/eng.traineddata.gz","size":2952873,"parts":[{"path":"vendor/ocr/parts/eng.traineddata.gz.part-00.bin","size":524288,"sha256":"660d9e19b26bd60ac562ebae3c617fca6fc7d9a3ab285235f4060c0634ababb4"},{"path":"vendor/ocr/parts/eng.traineddata.gz.part-01.bin","size":524288,"sha256":"145798c312b5b543fecabf135ea51f53dbd4492b90742b95b28ca04254c59089"},{"path":"vendor/ocr/parts/eng.traineddata.gz.part-02.bin","size":524288,"sha256":"6487d2acff42fb40074a05c7c6b3e30b80aded290e96cadba944f42f08c7717b"},{"path":"vendor/ocr/parts/eng.traineddata.gz.part-03.bin","size":524288,"sha256":"e0cb79cb0e687cd02677934de22928bf64945a1e45c3cdde53e643a93295af12"},{"path":"vendor/ocr/parts/eng.traineddata.gz.part-04.bin","size":524288,"sha256":"37b27c7287c84398bdba8461b07fa0621265463e71f75ee145071621689bc285"},{"path":"vendor/ocr/parts/eng.traineddata.gz.part-05.bin","size":331433,"sha256":"27a8197ed66138ad46d43c1f0927da977a0796b2254e6d622cc5e6a92bbc4b37"}],"sha256":"45b4cb346724ac1774f1c36f42f182b887bcdb28ebe63e6fff90ac41f3fcff91","type":"application/gzip"},{"path":"vendor/ocr/lang/hin.traineddata.gz","size":1389692,"parts":[{"path":"vendor/ocr/parts/hin.traineddata.gz.part-00.bin","size":524288,"sha256":"7e3c9772affad3f924a21591e59fdbbe663ea009068d90a059c93c0992676eb0"},{"path":"vendor/ocr/parts/hin.traineddata.gz.part-01.bin","size":524288,"sha256":"d80628587325d03fedb1ae0e04b86ee6a222ef4143a2514ae4285c72b0aa9e76"},{"path":"vendor/ocr/parts/hin.traineddata.gz.part-02.bin","size":341116,"sha256":"0992814f8e86d74ed5da0da1fe1ed1987793d9bfa99fe3ab5176b5eeef010f64"}],"sha256":"f3b6a0d320df38d886178cdd727b90dbf9df3db053adb32bd9cf73f0463cda07","type":"application/gzip"},{"path":"vendor/ocr/tesseract.min.js","size":62961},{"path":"vendor/ocr/tesseract.min.js.LICENSE.txt","size":149},{"path":"vendor/ocr/worker.min.js","size":111162},{"path":"vendor/ocr/worker.min.js.LICENSE.txt","size":466}];
  const TOTAL_BYTES = ASSETS.reduce((sum, asset) => sum + asset.size, 0);
  const MAX_PIXELS = 2000000;
  const MAX_FILE = 40 * 1024 * 1024;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let setupTask, libraryPromise, engine, engineLanguage, starting, engineRecord, terminating = Promise.resolve();
  let queue = Promise.resolve(), activeJob, pendingJobs = 0, idleTimer, activeUI;

  function abortError() { const error = new Error('Text reading cancelled.'); error.name = 'AbortError'; return error; }
  function checkAbort(signal) { if (signal && signal.aborted) throw abortError(); }
  function report(callback, message) { try { callback && callback(message); } catch (_) {} }
  function abortable(promise, signal, onAbort) {
    if (!signal) return Promise.resolve(promise);
    return new Promise((resolve, reject) => {
      let done = false;
      const cleanup = () => signal.removeEventListener('abort', cancel);
      const cancel = () => { if (done) return; done = true; cleanup(); try { onAbort && onAbort(); } catch (_) {} reject(abortError()); };
      signal.addEventListener('abort', cancel, { once: true });
      Promise.resolve(promise).then(value => { if (!done) { done = true; cleanup(); resolve(value); } }, error => { if (!done) { done = true; cleanup(); reject(error); } });
      if (signal.aborted) cancel();
    });
  }
  function languageName(language) {
    if (language === 'eng' || language === undefined || language === null || language === '') return 'eng';
    if (language === 'eng+hin' || language === 'hin+eng') return 'eng+hin';
    throw new Error('Choose English or English + Hindi printed text.');
  }

  async function status() {
    const common = { cacheName: CACHE, totalBytes: TOTAL_BYTES, assetCount: ASSETS.length, downloadedBytes: 0, ready: false, available: Boolean(global.caches), languages: ['eng', 'eng+hin'] };
    if (!global.caches) return common;
    try {
      if (!(await caches.keys()).includes(CACHE)) return common;
      const cache = await caches.open(CACHE);
      for (const asset of ASSETS) {
        const response = await cache.match(new URL(asset.path, baseURL).href);
        if (response && response.ok && await validBytes(new Uint8Array(await response.arrayBuffer()), asset)) common.downloadedBytes += asset.size;
      }
      const marker = await cache.match(MARKER);
      const metadata = marker ? await marker.json().catch(() => null) : null;
      common.ready = Boolean(common.downloadedBytes === TOTAL_BYTES && metadata && metadata.version === 1 && metadata.assetCount === ASSETS.length);
      return common;
    } catch (_) { return { ...common, available: false }; }
  }

  async function validBytes(bytes, asset, signal) {
    checkAbort(signal);
    if (bytes.byteLength !== asset.size) return false;
    if (asset.sha256 && global.crypto && global.crypto.subtle) {
      const digest = await abortable(global.crypto.subtle.digest('SHA-256', bytes), signal);
      const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (hex !== asset.sha256) return false;
    }
    checkAbort(signal); return true;
  }
  function cacheHeaders(response, type) {
    const headers = new Headers(response ? response.headers : undefined);
    // fetch() has decoded transport compression before arrayBuffer().
    headers.delete('Content-Encoding'); headers.delete('Content-Length');
    if (type) headers.set('Content-Type', type);
    return headers;
  }
  async function cachedBytes(cache, asset, signal) {
    const url = new URL(asset.path, baseURL).href, response = await cache.match(url);
    if (!response) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (response.ok && await validBytes(bytes, asset, signal)) return bytes;
    await cache.delete(url); return null;
  }
  async function downloadAsset(asset, signal) {
    const response = await fetch(new URL(asset.path, baseURL).href, { cache: 'reload', credentials: 'same-origin', signal });
    if (!response.ok) throw new Error('Text reader download failed. Open the app online and enable it again to resume.');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!(await validBytes(bytes, asset, signal))) throw new Error('The text reader files are incomplete or damaged. Refresh the app online and enable it again.');
    return { bytes, response };
  }
  async function setup(options = {}) {
    const { onProgress, signal } = options;
    checkAbort(signal);
    if (!global.caches || !global.fetch) throw new Error('This browser cannot save the offline text reader. Try current Chrome over HTTPS.');
    if (setupTask) return abortable(setupTask, signal);
    setupTask = (async () => {
      const cache = await caches.open(CACHE);
      let downloadedBytes = 0;
      const progress = (status, partial = 0) => report(onProgress, { phase: 'setup', status, progress: (downloadedBytes + partial) / TOTAL_BYTES, downloadedBytes: downloadedBytes + partial, totalBytes: TOTAL_BYTES });
      await cache.delete(MARKER);
      for (let index = 0; index < ASSETS.length; index++) {
        checkAbort(signal);
        const asset = ASSETS[index], url = new URL(asset.path, baseURL).href;
        progress('Preparing text reader ' + (index + 1) + ' of ' + ASSETS.length);
        const existing = await cachedBytes(cache, asset, signal);
        if (!existing && asset.parts) {
          const assembled = new Uint8Array(asset.size);
          let offset = 0;
          for (let partIndex = 0; partIndex < asset.parts.length; partIndex++) {
            const part = asset.parts[partIndex], partURL = new URL(part.path, baseURL).href;
            checkAbort(signal);
            let bytes = await cachedBytes(cache, part, signal);
            if (!bytes) {
              const fetched = await downloadAsset(part, signal); bytes = fetched.bytes;
              checkAbort(signal);
              await cache.put(partURL, new Response(bytes, { status: 200, headers: cacheHeaders(fetched.response, 'application/octet-stream') }));
            }
            if (offset + bytes.byteLength > assembled.byteLength) throw new Error('The text reader files are incomplete. Enable it again online.');
            assembled.set(bytes, offset); offset += bytes.byteLength;
            progress('Saving text reader ' + (index + 1) + ' of ' + ASSETS.length + ' · part ' + (partIndex + 1) + ' of ' + asset.parts.length, offset);
          }
          if (offset !== asset.size || !(await validBytes(assembled, asset, signal))) throw new Error('The text reader files are incomplete or damaged. Enable it again online.');
          checkAbort(signal);
          await cache.put(url, new Response(assembled, { status: 200, headers: cacheHeaders(null, asset.type) }));
        } else if (!existing) {
          const fetched = await downloadAsset(asset, signal); checkAbort(signal);
          await cache.put(url, new Response(fetched.bytes, { status: 200, headers: cacheHeaders(fetched.response, asset.type) }));
        }
        // Only discard resumable pieces once the complete logical asset is committed.
        if (asset.parts) for (const part of asset.parts) await cache.delete(new URL(part.path, baseURL).href);
        checkAbort(signal); downloadedBytes += asset.size;
        progress('Saved text reader ' + (index + 1) + ' of ' + ASSETS.length);
      }
      checkAbort(signal);
      await cache.put(MARKER, new Response(JSON.stringify({ version: 1, assetCount: ASSETS.length, installedAt: new Date().toISOString() }), { headers: { 'Content-Type': 'application/json' } }));
      return status();
    })();
    try { return await setupTask; }
    catch (error) {
      if (signal && signal.aborted || error && error.name === 'AbortError') throw abortError();
      if (error && error.name === 'QuotaExceededError') throw new Error('Device storage is full. Free space, then enable the text reader again.');
      if (error instanceof TypeError) throw new Error('Text reader download failed. Open the app online and enable it again to resume.');
      throw error;
    } finally { setupTask = null; }
  }

  async function controlledServiceWorker(signal) {
    checkAbort(signal);
    const serviceWorker = global.navigator && global.navigator.serviceWorker;
    const reloadMessage = 'The text reader is saved. Reload this app once, then read the image again.';
    if (!serviceWorker || typeof serviceWorker.addEventListener !== 'function') throw new Error(reloadMessage);
    if (serviceWorker.controller) return;
    let cleanup = () => {};
    await abortable(new Promise((resolve, reject) => {
      let timer;
      const changed = () => { if (serviceWorker.controller) { cleanup(); resolve(); } };
      cleanup = () => { clearTimeout(timer); serviceWorker.removeEventListener('controllerchange', changed); };
      serviceWorker.addEventListener('controllerchange', changed);
      timer = setTimeout(() => { cleanup(); reject(new Error(reloadMessage)); }, 8000);
      Promise.resolve(serviceWorker.ready).then(changed, () => {});
      changed();
    }), signal, () => cleanup());
    checkAbort(signal);
  }

  async function library() {
    if (global.Tesseract && typeof global.Tesseract.createWorker === 'function') return global.Tesseract;
    if (!libraryPromise) libraryPromise = new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = new URL('vendor/ocr/tesseract.min.js', baseURL).href;
      tag.async = true;
      tag.onload = () => {
        if (global.Tesseract && typeof global.Tesseract.createWorker === 'function') resolve(global.Tesseract);
        else { libraryPromise = null; tag.remove(); reject(new Error('Text reader could not start. Refresh the app and try again.')); }
      };
      tag.onerror = () => { libraryPromise = null; tag.remove(); reject(new Error('Text reader could not load. Open the app online once after enabling OCR.')); };
      document.head.append(tag);
    });
    return libraryPromise;
  }

  function workerError(error) {
    if (error && error.name === 'AbortError') return error;
    return new Error('The printed-text reader could not finish. Try again, or reopen the app online to repair its optional download.');
  }
  function terminateWorker(worker) {
    if (!worker) return Promise.resolve();
    try { return Promise.resolve(worker.terminate()).catch(() => {}); } catch (_) { return Promise.resolve(); }
  }
  function stopStarting(record, error = abortError()) {
    if (!record || record.disposed) return;
    record.disposed = true;
    record.fail(error);
    // Tesseract's initialization Promise does not expose terminate until it resolves.
    // Keep its synchronously created native Worker so cancellation also stops loading.
    terminateWorker(record.nativeWorker);
  }
  async function release() {
    clearTimeout(idleTimer);
    if (starting) stopStarting(starting);
    const old = engine; if (engineRecord) { engineRecord.disposed = true; engineRecord.fail(abortError()); } engine = null; engineLanguage = null; engineRecord = null;
    if (old) terminating = terminateWorker(old);
    await terminating;
  }

  async function ensureEngine(language, signal) {
    await abortable(terminating, signal); checkAbort(signal);
    await controlledServiceWorker(signal);
    if (engine && engineLanguage === language) return engine;
    if (engine) await release();
    const sdk = await abortable(library(), signal); checkAbort(signal);
    const workerPath = new URL('vendor/ocr/worker.min.js', baseURL).href;
    const record = { disposed: false, nativeWorker: null };
    record.failure = new Promise((_, reject) => { record.fail = reject; });
    starting = record;
    const NativeWorker = global.Worker;
    // Tesseract 6.0.1 spawns synchronously. Restore the constructor immediately;
    // all unrelated workers pass through, and only our fixed local URL is captured.
    if (NativeWorker) global.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        if (new URL(String(args[0]), baseURL).href === workerPath) {
          record.nativeWorker = this;
          this.addEventListener && this.addEventListener('error', event => record.fail(workerError(event)));
        }
      }
    };
    let created;
    try {
      created = Promise.resolve(sdk.createWorker(language, 1, {
        workerPath,
        corePath: new URL('vendor/ocr/core', baseURL).href,
        langPath: new URL('vendor/ocr/lang', baseURL).href,
        workerBlobURL: false, gzip: true, cacheMethod: 'none', legacyCore: false, legacyLang: false,
        logger: message => { if (activeJob && !activeJob.signal.aborted && !record.disposed) report(activeJob.onProgress, { phase: 'recognize', status: message.status || 'Reading printed text', progress: Number.isFinite(message.progress) ? message.progress : 0 }); },
        // The SDK can otherwise leave initialization pending after model errors.
        errorHandler: error => record.fail(workerError(error))
      }));
    } catch (error) { created = Promise.reject(error); }
    finally { if (NativeWorker) global.Worker = NativeWorker; }
    created.then(worker => { if (record.disposed) terminateWorker(worker); }, () => {});
    try {
      const worker = await abortable(Promise.race([created, record.failure]), signal, () => stopStarting(record));
      if (record.disposed || signal.aborted) { await terminateWorker(worker); throw abortError(); }
      engine = worker; engineLanguage = language; engineRecord = record;
      return worker;
    } catch (error) { stopStarting(record, workerError(error)); throw workerError(error); }
    finally { if (starting === record) starting = null; }
  }

  async function prepareImage(image, signal) {
    checkAbort(signal);
    let source = image, objectURL;
    if (typeof image === 'string' || image && typeof image.arrayBuffer === 'function') {
      if (typeof image === 'string') {
        if (image.length > 80000000 || !/^(data:image\/(?:png|jpeg|webp|gif|bmp);|blob:)/i.test(image)) throw new Error('Choose a local photo or rendered PDF page.');
      } else {
        if (image.size > MAX_FILE) throw new Error('Choose an image smaller than 40 MB.');
        if (image.type && !image.type.startsWith('image/')) throw new Error('Render a PDF page first, or choose a photo.');
        objectURL = URL.createObjectURL(image);
      }
      source = new Image(); source.src = objectURL || image;
      try { await abortable(source.decode(), signal); }
      catch (error) { if (objectURL) URL.revokeObjectURL(objectURL); if (error.name === 'AbortError') throw error; throw new Error('This image could not be read. Try a clearer JPG, PNG or WebP photo.'); }
    }
    try {
      checkAbort(signal);
      const width = Number(source && (source.naturalWidth || source.width)), height = Number(source && (source.naturalHeight || source.height));
      if (![width, height].every(Number.isFinite) || width <= 0 || height <= 0) throw new Error('The selected image has no readable size.');
      const scale = Math.min(1, Math.sqrt(MAX_PIXELS / (width * height)), 1800 / width, 2200 / height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(width * scale)); canvas.height = Math.max(1, Math.floor(height * scale));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('This browser could not prepare the image. Try current Chrome.');
      context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(source, 0, 0, canvas.width, canvas.height);
      return { canvas, release() { canvas.width = 0; canvas.height = 0; } };
    } finally { if (objectURL) URL.revokeObjectURL(objectURL); }
  }

  function recognize(image, language = 'eng', options = {}) {
    let selected;
    try { selected = languageName(language); } catch (error) { return Promise.reject(error); }
    const controller = new AbortController(), signal = controller.signal;
    const parentCancel = () => controller.abort();
    if (options.signal) { options.signal.addEventListener('abort', parentCancel, { once: true }); if (options.signal.aborted) controller.abort(); }
    const job = { controller, signal, onProgress: options.onProgress };
    pendingJobs++; clearTimeout(idleTimer);
    const operation = queue.catch(() => {}).then(async () => {
      checkAbort(signal); activeJob = job;
      let prepared;
      try {
        if (!(await status()).ready) throw new Error('Enable the optional printed-text reader first.');
        prepared = await prepareImage(image, signal); checkAbort(signal);
        const worker = await ensureEngine(selected, signal);
        if (signal.aborted) { await release(); throw abortError(); }
        report(job.onProgress, { phase: 'recognize', status: 'Reading printed text', progress: 0 });
        const result = await abortable(Promise.race([worker.recognize(prepared.canvas, {}, { text: true }), engineRecord.failure]), signal, () => { release(); });
        checkAbort(signal);
        const data = result && result.data || {};
        return { text: String(data.text || '').slice(0, 200000), confidence: Number.isFinite(data.confidence) ? data.confidence : null, language: selected };
      } catch (error) { await release(); throw error && error.name ? error : workerError(error); }
      finally { if (prepared) prepared.release(); if (activeJob === job) activeJob = null; }
    });
    const settled = operation.finally(() => {
      pendingJobs--;
      if (!pendingJobs) idleTimer = setTimeout(() => { if (!activeJob && !pendingJobs) release(); }, 60000);
    });
    queue = settled.catch(() => {});
    return abortable(settled, signal).finally(() => { if (options.signal) options.signal.removeEventListener('abort', parentCancel); });
  }
  function cancel() { if (activeJob) activeJob.controller.abort(); }

  class OCRView {
    constructor(config) {
      this.config = config; this.disposed = false; this.previewVersion = 0; this.ready = false;
      this.preview = null; this.pdf = null; this.page = 1; this.busy = false; this.textFromPDF = '';
      config.openModal('Printed question se editable text.', '<p class="modal-intro">Photo ya scanned PDF page ka printed text is device par padhiye. Result ko edit aur check karne ke baad board ya graph mein use karein.</p><div id="studio-ocr"><div class="notice"><strong>Printed text only.</strong> Handwriting aur maths notation reliable nahi hain. Powers/superscripts, signs, fractions aur integral symbols ko manually check/correct karein. Images OCR ke liye ChatGPT ya kisi server par upload nahi hoti.</div><div class="modal-actions"><button class="button primary" id="ocr-enable">Enable on this device · ~12 MB</button><span id="ocr-setup-status" class="qb-meta">Checking optional text reader…</span></div><div class="input-row"><label class="field">Photo or PDF<input id="ocr-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.pdf"></label><label class="field">Printed language<select id="ocr-language"><option value="eng">English</option><option value="eng+hin">English + Hindi</option></select></label></div><div id="ocr-pdf-controls" class="modal-actions" hidden><button class="button quiet" id="ocr-prev">‹ Previous</button><label class="field">PDF page<input id="ocr-page" type="number" min="1" value="1"></label><span id="ocr-page-total" class="qb-meta"></span><button class="button quiet" id="ocr-next">Next ›</button></div><p id="ocr-preview-status" class="qb-meta" role="status"></p><img id="ocr-preview" hidden alt="Selected printed question preview" style="width:100%;max-height:340px;object-fit:contain;background:#fff;border:1px solid #dfe7d7;border-radius:8px"><div class="modal-actions"><button class="button outline" id="ocr-pdf-text" hidden>Use selectable PDF text</button><button class="button primary" id="ocr-read" disabled>Read printed text</button><button class="button quiet" id="ocr-cancel" hidden>Cancel</button></div><div id="ocr-progress-wrap" hidden><progress id="ocr-progress" max="1" value="0" style="width:100%"></progress><p id="ocr-progress-text" class="qb-meta" role="status" aria-live="polite"></p></div><div id="ocr-error" class="error-text" role="alert"></div><label class="field">Editable text · correct the equation before using it<textarea id="ocr-text" rows="7" placeholder="Recognized text will appear here. You can also type or paste a corrected equation."></textarea></label><label class="compare-label"><input id="ocr-reviewed" type="checkbox"> I checked the text, numbers and maths symbols.</label><div class="modal-actions"><button class="button primary" id="ocr-use-text" disabled>Use reviewed text on board</button><button class="button outline" id="ocr-use-graph" disabled>Graph reviewed equation</button></div><p class="library-note">For a PDF with selectable text, the direct-text button is faster and more accurate than OCR. Read one clear question at a time. Graphing still requires a supported equation; OCR does not solve the question. Save original files in My Questions if you want to reopen them later.</p></div>', 'OPTIONAL · LOCAL PRINTED TEXT READER');
      this.body = document.querySelector('#modal-body');
      this.$ = selector => this.body.querySelector(selector);
      this.dialog = this.body.closest('dialog');
      // dialog.close() queues its event; another tool may already have reopened it.
      this.closeHandler = () => { if (!this.dialog.open) this.dispose(); };
      this.dialog && this.dialog.addEventListener('close', this.closeHandler);
      if (global.MutationObserver) { this.observer = new MutationObserver(() => { if (!this.body.querySelector('#studio-ocr')) this.dispose(); }); this.observer.observe(this.body, { childList: true }); }
      this.bind(); this.refreshStatus();
    }
    live() { return !this.disposed && this.body.isConnected && Boolean(this.$('#studio-ocr')); }
    error(message) { if (this.live()) this.$('#ocr-error').textContent = message || ''; }
    actions() {
      if (!this.live()) return;
      const reviewed = this.$('#ocr-reviewed').checked && this.$('#ocr-text').value.trim();
      this.$('#ocr-use-text').disabled = this.busy || !reviewed || typeof this.config.onText !== 'function';
      this.$('#ocr-use-graph').disabled = this.busy || !reviewed || typeof this.config.onGraph !== 'function';
      this.$('#ocr-read').disabled = this.busy || !this.preview || !this.ready;
      this.$('#ocr-prev').disabled = this.busy || this.page <= 1;
      this.$('#ocr-next').disabled = this.busy || !this.pdf || this.page >= this.pdf.numPages;
    }
    setBusy(value, cancellable = true) {
      this.busy = value;
      if (!this.live()) return;
      for (const id of ['ocr-file', 'ocr-language', 'ocr-page', 'ocr-enable', 'ocr-pdf-text', 'ocr-text', 'ocr-reviewed']) this.$('#' + id).disabled = value;
      this.$('#ocr-cancel').hidden = !value || !cancellable;
      this.$('#ocr-progress-wrap').hidden = !value || !cancellable;
      this.actions();
    }
    progress(message) {
      if (!this.live()) return;
      this.$('#ocr-progress').value = Math.max(0, Math.min(1, Number(message.progress) || 0));
      this.$('#ocr-progress-text').textContent = message.status || 'Working…';
    }
    async refreshStatus() {
      const state = await status(); if (!this.live()) return;
      this.ready = Boolean(state.ready);
      this.$('#ocr-enable').hidden = this.ready;
      this.$('#ocr-enable').disabled = this.busy || !state.available;
      this.$('#ocr-setup-status').textContent = this.ready ? 'Printed-text reader saved for offline use.' : !state.available ? 'Offline OCR storage is unavailable. Try current Chrome over HTTPS.' : 'Optional download: about 12 MB. ' + (state.downloadedBytes ? (state.downloadedBytes / 1000000).toFixed(1) + ' MB already saved; Enable resumes setup.' : 'Enable it once before reading images.');
      this.actions();
    }
    putDraft(text) {
      this.$('#ocr-text').value = String(text || ''); this.$('#ocr-reviewed').checked = false; this.actions();
    }
    async runSetup() {
      if (this.busy) return;
      const controller = this.controller = new AbortController();
      this.setBusy(true); this.error('');
      try { await setup({ signal: controller.signal, onProgress: message => this.progress(message) }); if (this.live()) this.config.toast && this.config.toast('Printed-text reader enabled on this device.'); }
      catch (error) { if (this.live()) this.error(error.name === 'AbortError' ? 'Setup cancelled. Enable again to resume downloaded files.' : error.message || String(error)); }
      finally { if (this.controller === controller) this.controller = null; if (this.live()) { this.setBusy(false); this.refreshStatus(); } }
    }
    async readText() {
      if (this.busy || !this.preview) return;
      const controller = this.controller = new AbortController();
      this.setBusy(true); this.error('');
      try {
        const result = await recognize(this.preview, this.$('#ocr-language').value, { signal: controller.signal, onProgress: message => this.progress(message) });
        if (!this.live()) return;
        this.putDraft(result.text);
        this.$('#ocr-preview-status').textContent = result.text.trim() ? 'Draft ready. Correct text and mathematical symbols, then check the review box.' : 'No printed text was found. Try a sharper, closer crop or type the equation.';
      } catch (error) { if (this.live()) this.error(error.name === 'AbortError' ? 'Text reading cancelled. Your previous draft is kept.' : error.message || String(error)); }
      finally { if (this.controller === controller) this.controller = null; if (this.live()) this.setBusy(false); }
    }
    async loadFile(file) {
      if (!file || this.busy) return;
      if (file.size > MAX_FILE) { this.error('Choose a photo or PDF smaller than 40 MB.'); return; }
      if (!(file.type && file.type.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) { this.error('Choose a PDF, JPG, PNG, WebP or GIF file.'); return; }
      const version = ++this.previewVersion;
      const previousPDF = this.pdf; this.pdf = null;
      this.preview = null; this.page = 1; this.textFromPDF = '';
      this.$('#ocr-preview').hidden = true; this.$('#ocr-pdf-text').hidden = true;
      this.$('#ocr-pdf-controls').hidden = true;
      this.setBusy(true, false); this.error(''); this.$('#ocr-preview-status').textContent = 'Preparing selected file…';
      try {
        if (previousPDF) await previousPDF.destroy();
        if (!this.live() || version !== this.previewVersion) return;
        if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
          if (!global.StudioPDF) throw new Error('PDF tools are unavailable. Use a photo, or update the app online.');
          const pdf = await global.StudioPDF.open(file);
          if (!this.live() || version !== this.previewVersion) { await pdf.destroy(); return; }
          this.pdf = pdf; this.$('#ocr-pdf-controls').hidden = false;
          await this.loadPage(1, version);
        } else {
          const prepared = await prepareImage(file);
          try { if (!this.live() || version !== this.previewVersion) return; this.preview = prepared.canvas.toDataURL('image/png'); this.$('#ocr-preview').src = this.preview; this.$('#ocr-preview').hidden = false; this.$('#ocr-preview-status').textContent = 'Photo ready. A sharp close-up of one printed question works best.'; }
          finally { prepared.release(); }
        }
      } catch (error) { if (this.live() && version === this.previewVersion) this.error(error.message || String(error)); }
      finally { if (this.live() && version === this.previewVersion) this.setBusy(false); }
    }
    async loadPage(number, version) {
      if (!this.pdf) return;
      const token = version || ++this.previewVersion;
      this.page = Math.max(1, Math.min(this.pdf.numPages, Math.floor(Number(number) || 1)));
      this.preview = null; this.textFromPDF = '';
      this.$('#ocr-preview').hidden = true; this.$('#ocr-pdf-text').hidden = true;
      this.setBusy(true, false); this.error('');
      try {
        const rendered = await this.pdf.render(this.page, { maxWidth: 1600 });
        if (!this.live() || token !== this.previewVersion) return;
        this.preview = rendered.dataUrl; this.textFromPDF = rendered.text || '';
        this.$('#ocr-preview').src = this.preview; this.$('#ocr-preview').hidden = false;
        this.$('#ocr-page').value = this.page; this.$('#ocr-page').max = this.pdf.numPages;
        this.$('#ocr-page-total').textContent = 'of ' + this.pdf.numPages;
        this.$('#ocr-pdf-text').hidden = !this.textFromPDF.trim();
        this.$('#ocr-preview-status').textContent = this.textFromPDF.trim() ? 'Selectable PDF text is available. Use it directly, then review the symbols.' : 'Scanned page: enable the printed-text reader, or type the equation manually.';
      } catch (error) { if (this.live() && token === this.previewVersion) this.error(error.message || String(error)); }
      finally { if (this.live() && token === this.previewVersion) this.setBusy(false); }
    }
    use(kind) {
      if (!this.live() || this.busy) return;
      const text = this.$('#ocr-text').value.trim();
      if (!text || !this.$('#ocr-reviewed').checked) { this.error('Check and correct the text, then tick the review box first.'); return; }
      const callback = kind === 'graph' ? this.config.onGraph : this.config.onText;
      if (typeof callback !== 'function') return;
      this.dispose(); this.config.closeModal();
      Promise.resolve().then(() => callback(text)).catch(error => this.config.toast && this.config.toast(error.message || String(error)));
    }
    bind() {
      this.$('#ocr-enable').onclick = () => this.runSetup();
      this.$('#ocr-read').onclick = () => this.readText();
      this.$('#ocr-cancel').onclick = () => { this.controller && this.controller.abort(); };
      this.$('#ocr-file').onchange = event => this.loadFile(event.target.files && event.target.files[0]);
      this.$('#ocr-prev').onclick = () => { if (!this.busy) this.loadPage(this.page - 1); };
      this.$('#ocr-next').onclick = () => { if (!this.busy) this.loadPage(this.page + 1); };
      this.$('#ocr-page').onchange = event => { if (!this.busy) this.loadPage(event.target.value); };
      this.$('#ocr-pdf-text').onclick = () => this.putDraft(this.textFromPDF);
      this.$('#ocr-text').oninput = () => { this.$('#ocr-reviewed').checked = false; this.actions(); };
      this.$('#ocr-reviewed').onchange = () => this.actions();
      this.$('#ocr-use-text').onclick = () => this.use('text');
      this.$('#ocr-use-graph').onclick = () => this.use('graph');
    }
    dispose() {
      if (this.disposed) return;
      this.disposed = true; this.previewVersion++;
      this.controller && this.controller.abort();
      if (this.pdf) { Promise.resolve(this.pdf.destroy()).catch(() => {}); this.pdf = null; }
      this.observer && this.observer.disconnect();
      this.dialog && this.dialog.removeEventListener('close', this.closeHandler);
    }
  }
  function open(config = {}) {
    if (typeof config.openModal !== 'function' || typeof config.closeModal !== 'function') throw new Error('The text reader needs the app dialog controls.');
    if (activeUI) activeUI.dispose();
    activeUI = new OCRView(config);
    return activeUI;
  }


  global.StudioOCR = Object.freeze({ open, setup, status, recognize, cancel, release, cacheName: CACHE, totalBytes: TOTAL_BYTES });
})(window);
