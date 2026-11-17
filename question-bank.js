(function (global) {
  'use strict';
  const DB_NAME = 'ganit-studio-question-bank';
  const STORE = 'questions';
  const MAX_FILE = 40 * 1024 * 1024;
  const MAX_IMPORT_PAGES = 10;
  const LEVELS = ['9', '10', '11', '12', 'JEE'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let dbPromise;
  let active;

  function database() {
    if (!global.indexedDB) return Promise.reject(new Error('Local question storage is unavailable in this browser.'));
    if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); dbPromise = null; };
        resolve(request.result);
      };
      request.onerror = () => reject(request.error || new Error('Cannot open your question bank.'));
      request.onblocked = () => reject(new Error('Close other Mathematics Gyaan Maath tabs, then open your question bank again.'));
    }).catch(error => { dbPromise = null; throw error; });
    return dbPromise;
  }

  async function access(mode, operation) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      let request, result;
      try { request = operation(transaction.objectStore(STORE)); }
      catch (error) { reject(error); return; }
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => reject(request.error || new Error('Cannot access local question storage.'));
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = transaction.onabort = () => reject(transaction.error || new Error('Could not save locally. Device storage may be full. Keep this form open and try again.'));
    });
  }

  function isPDF(attachment) {
    return attachment && (attachment.type === 'application/pdf' || /\.pdf$/i.test(attachment.name));
  }

  function pageRange(input, numPages) {
    const value = String(input ?? '').trim().replace(/[–—]/g, '-');
    if (!value || value.length > 120 || !Number.isInteger(numPages) || numPages < 1) throw new Error('Enter PDF pages, for example 1-3 or 1,3,5.');
    const pages = new Set();
    for (const token of value.split(',')) {
      const match = token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) throw new Error('Use page numbers and ranges, for example 1-3,5.');
      const first = Number(match[1]), last = Number(match[2] || match[1]);
      if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last) || first < 1 || last > numPages || last < first) throw new Error('Choose pages from 1 to ' + numPages + ', with each range in ascending order.');
      if (last - first + 1 > MAX_IMPORT_PAGES) throw new Error('Import up to ' + MAX_IMPORT_PAGES + ' PDF pages at a time.');
      for (let number = first; number <= last; number++) {
        pages.add(number);
        if (pages.size > MAX_IMPORT_PAGES) throw new Error('Import up to ' + MAX_IMPORT_PAGES + ' PDF pages at a time.');
      }
    }
    return [...pages].sort((a, b) => a - b);
  }

  async function imageData(blob) {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    try {
      image.src = url;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('This image is empty or unsupported.');
      const scale = Math.min(1, 1400 / image.naturalWidth, 1800 / image.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } catch (error) {
      throw new Error('This image could not be opened. Try a JPG, PNG or WebP photo.');
    } finally { URL.revokeObjectURL(url); }
  }

  async function boardImage(question) {
    if (!question.attachment?.blob) return undefined;
    if (!isPDF(question.attachment)) return imageData(question.attachment.blob);
    if (!global.StudioPDF) throw new Error('The PDF tool is unavailable. Open the app online once to finish its setup.');
    const pdf = await global.StudioPDF.open(question.attachment.blob);
    try {
      const page = Math.min(pdf.numPages, Math.max(1, Number(question.selectedPage) || 1));
      return (await pdf.render(page, { maxWidth: 1400 })).dataUrl;
    } finally { await pdf.destroy(); }
  }

  function downloadOriginal(attachment) {
    if (!attachment?.blob) return;
    const url = URL.createObjectURL(attachment.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.name || 'question';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  class Bank {
    constructor(config) {
      this.config = config;
      this.pdf = null;
      this.view = 0;
      this.disposed = false;
      this.batch = null;
      this.filter = { search: '', classLevel: 'all', source: 'all' };
      this.closeHandler = () => this.dispose();
      const body = document.querySelector('#modal-body');
      body?.closest('dialog')?.addEventListener('close', this.closeHandler, { once: true });
      // Other app tools can replace the same open dialog without a close event.
      // Release a PDF worker when the question bank is replaced in that way.
      if (body && global.MutationObserver) {
        this.observer = new MutationObserver(() => {
          if (!this.disposed && !body.querySelector('#qb-list, #qb-text, #qb-confirm-delete')) this.dispose();
        });
        this.observer.observe(body, { childList: true });
      }
    }

    cleanupPreview() {
      this.previewVersion = (this.previewVersion || 0) + 1;
      if (this.pdf) {
        try { Promise.resolve(this.pdf.destroy()).catch(() => {}); } catch (_) {}
        this.pdf = null;
      }
    }

    dispose() {
      this.disposed = true;
      if (this.batch) this.batch.cancelled = true;
      this.cleanupPreview();
      this.observer?.disconnect();
      document.querySelector('#modal-body')?.closest('dialog')?.removeEventListener('close', this.closeHandler);
    }

    show(title, html) {
      this.cleanupPreview();
      this.view++;
      this.config.openModal(title, html, 'MY QUESTIONS · PDF / PHOTO / PYQ');
      this.body = document.querySelector('#modal-body');
      return this.body;
    }

    async list() {
      const body = this.show('Your questions. Your teaching style.', '<p class="modal-intro">Bring your own textbook questions, photos, PDFs and PYQs onto the teaching board. Files save in this browser on this device.</p><div class="modal-actions"><button class="button primary" id="qb-add">＋ Add my question</button></div><div class="qb-filters input-row"><label class="field">Search<input id="qb-search" type="search" placeholder="Question, chapter, exam or year…" value="' + esc(this.filter.search) + '"></label><label class="field">Class<select id="qb-level"><option value="all">All classes</option>' + LEVELS.map(level => '<option value="' + level + '" ' + (this.filter.classLevel === level ? 'selected' : '') + '>' + (level === 'JEE' ? 'IIT JEE' : 'Class ' + level) + '</option>').join('') + '</select></label><label class="field">Source<select id="qb-source"><option value="all">All questions</option><option value="My question" ' + (this.filter.source === 'My question' ? 'selected' : '') + '>My questions</option><option value="PYQ" ' + (this.filter.source === 'PYQ' ? 'selected' : '') + '>PYQ</option></select></label></div><div id="qb-list" class="empty-state">Loading your questions…</div><div class="notice">For graphs, type the equation from a photo or scanned page. This app does not perform handwriting recognition or OCR. Download your original files separately to keep a backup.</div>');
      const view = this.view;
      const $ = selector => body.querySelector(selector);
      $('#qb-add').onclick = () => this.form();
      let questions;
      try { questions = await access('readonly', store => store.getAll()); }
      catch (error) { if (!this.disposed && view === this.view && $('#qb-list')) $('#qb-list').textContent = error.message; return; }
      if (this.disposed || view !== this.view || !$('#qb-list')) return;
      questions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const draw = () => {
        this.filter = { search: $('#qb-search').value, classLevel: $('#qb-level').value, source: $('#qb-source').value };
        const query = this.filter.search.trim().toLowerCase();
        const filtered = questions.filter(q => (this.filter.classLevel === 'all' || q.classLevel === this.filter.classLevel) && (this.filter.source === 'all' || q.sourceLabel === this.filter.source) && [q.title, q.text, q.chapter, q.exam, q.year].join(' ').toLowerCase().includes(query));
        const list = $('#qb-list');
        list.className = 'qb-list';
        list.innerHTML = filtered.length ? filtered.map(q => '<article class="qb-card"><div class="qb-card-copy"><div class="qb-tags"><span class="badge">' + esc(q.classLevel === 'JEE' ? 'IIT JEE' : 'CLASS ' + q.classLevel) + '</span><span class="badge">' + esc(q.sourceLabel) + '</span></div><h3>' + esc(q.title) + '</h3><p class="qb-meta">' + esc([q.chapter, q.exam, q.year].filter(Boolean).join(' · ') || 'Your teaching question') + '</p>' + (q.text ? '<p class="qb-excerpt">' + esc(q.text.slice(0, 180)) + (q.text.length > 180 ? '…' : '') + '</p>' : '') + (q.attachment ? '<small>▧ ' + esc(q.attachment.name) + (isPDF(q.attachment) ? ' · page ' + q.selectedPage : '') + '</small>' : '') + '</div><div class="modal-actions qb-card-actions"><button class="button outline" data-qb-view="' + esc(q.id) + '">View / edit</button><button class="button primary" data-qb-board="' + esc(q.id) + '">Put on board</button>' + (isPDF(q.attachment) ? '<button class="button outline" data-qb-pages="' + esc(q.id) + '">PDF pages</button>' : '') + '<button class="button quiet" data-qb-graph="' + esc(q.id) + '" ' + (!q.text?.trim() ? 'disabled title="Add a typed equation first"' : '') + '>Graph equation</button><button class="button quiet" data-qb-delete="' + esc(q.id) + '">Delete</button></div></article>').join('') : '<div class="empty-state">' + (questions.length ? 'No matching questions. Try another search or filter.' : 'Your question bank starts here.<br>Add a PDF, photo, PYQ or a question you type yourself.') + '</div>';
        const find = id => questions.find(q => q.id === id);
        list.querySelectorAll('[data-qb-view]').forEach(button => { button.onclick = () => this.form(find(button.dataset.qbView)); });
        list.querySelectorAll('[data-qb-board]').forEach(button => { button.onclick = async () => {
          button.disabled = true; button.textContent = 'Preparing…';
          try { await this.sendBoard(find(button.dataset.qbBoard)); }
          catch (error) { this.config.toast(error.message); }
          finally { button.disabled = false; button.textContent = 'Put on board'; }
        }; });
        list.querySelectorAll('[data-qb-pages]').forEach(button => { button.onclick = () => this.form(find(button.dataset.qbPages)); });
        list.querySelectorAll('[data-qb-graph]').forEach(button => { button.onclick = () => this.sendGraph(find(button.dataset.qbGraph).text); });
        list.querySelectorAll('[data-qb-delete]').forEach(button => { button.onclick = () => this.confirmDelete(find(button.dataset.qbDelete)); });
      };
      $('#qb-search').oninput = draw;
      $('#qb-level').onchange = draw;
      $('#qb-source').onchange = draw;
      draw();
    }

    async sendBoard(question, preparedImage) {
      if (!this.config.onBoard) throw new Error('The teaching board is unavailable.');
      const view = this.view;
      const dataUrl = preparedImage || await boardImage(question);
      if (this.disposed || view !== this.view || !this.body?.querySelector('#qb-list, #qb-text')) return;
      await this.config.onBoard(question, dataUrl);
      this.dispose();
      this.config.closeModal();
    }

    sendGraph(text) {
      if (!text?.trim()) { this.config.toast('Type the question’s equation first. Photos and scans are not read automatically.'); return; }
      if (!this.config.onGraph) { this.config.toast('The graph tool is unavailable.'); return; }
      this.dispose();
      this.config.closeModal();
      this.config.onGraph(text);
    }

    confirmDelete(question) {
      const body = this.show('Delete this question?', '<p class="modal-intro">Remove “' + esc(question.title) + '” and its saved attachment from this browser? Pages already placed on your board are kept.</p><div id="qb-error" class="error-text" role="alert"></div><div class="modal-actions"><button class="button primary" id="qb-confirm-delete">Delete question</button><button class="button outline" id="qb-keep">Keep question</button></div>');
      const view = this.view;
      body.querySelector('#qb-keep').onclick = () => this.list();
      body.querySelector('#qb-confirm-delete').onclick = async event => {
        event.target.disabled = true;
        try { await access('readwrite', store => store.delete(question.id)); this.config.toast('Question removed from this device.'); if (!this.disposed && view === this.view) await this.list(); }
        catch (error) { if (!this.disposed && view === this.view) { body.querySelector('#qb-error').textContent = error.message; event.target.disabled = false; } }
      };
    }

    form(existing) {
      const question = existing || { classLevel: LEVELS.includes(this.config.currentLevel) ? this.config.currentLevel : '10', sourceLabel: 'My question', selectedPage: 1 };
      let attachment = question.attachment || null;
      let selectedPage = Number(question.selectedPage) || 1;
      let previewData;
      let extracted = '';
      let lastAutoText = '';
      let busy = false;
      let rangeTouched = Boolean(question.pageRange);
      const body = this.show(existing ? 'Your question, ready to teach.' : 'Add a question of your own.', '<p class="modal-intro">Type a question, upload a photo, or select a page from a PDF. Save it for later or put it straight onto your board.</p><button class="button quiet" id="qb-back">← Back to question bank</button><div class="input-row"><label class="field">Question title<input id="qb-title" maxlength="200" placeholder="e.g. JEE 2024 — definite integral" value="' + esc(question.title) + '"></label><label class="field">Class<select id="qb-form-level">' + LEVELS.map(level => '<option value="' + level + '" ' + (question.classLevel === level ? 'selected' : '') + '>' + (level === 'JEE' ? 'IIT JEE' : 'Class ' + level) + '</option>').join('') + '</select></label></div><div class="input-row"><label class="field">Chapter<input id="qb-chapter" maxlength="160" placeholder="e.g. Integrals" value="' + esc(question.chapter) + '"></label><label class="field">Source<select id="qb-form-source"><option value="My question" ' + (question.sourceLabel !== 'PYQ' ? 'selected' : '') + '>My question</option><option value="PYQ" ' + (question.sourceLabel === 'PYQ' ? 'selected' : '') + '>PYQ · Previous year question</option></select></label></div><div class="input-row"><label class="field">Exam / book (optional)<input id="qb-exam" maxlength="160" placeholder="e.g. JEE Main, CBSE, my worksheet" value="' + esc(question.exam) + '"></label><label class="field">Year (optional)<input id="qb-year" inputmode="numeric" maxlength="8" placeholder="e.g. 2024" value="' + esc(question.year) + '"></label></div><label class="field">Question text / equation<textarea id="qb-text" rows="5" placeholder="Type your question or equation here. For a graph, include y = x^2 or a clear equation.">' + esc(question.text) + '</textarea></label><label class="field">Attach PDF or photo (up to 40 MB)<input id="qb-file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp,image/gif,.pdf,.png,.jpg,.jpeg,.webp,.gif"></label><div class="qb-attachment-meta" id="qb-attachment"></div><div class="qb-preview-panel" id="qb-preview-panel" hidden><div class="modal-actions" id="qb-pdf-controls" hidden><button class="button outline" id="qb-prev" aria-label="Previous PDF page">‹ Previous</button><label class="field qb-page-field">Page<input id="qb-page" type="number" min="1" value="1" aria-label="PDF page number"></label><span id="qb-page-total"></span><button class="button outline" id="qb-next" aria-label="Next PDF page">Next ›</button></div><p id="qb-preview-status" class="qb-meta" role="status"></p><img id="qb-preview" alt="Selected question attachment preview" hidden style="max-width:100%;height:auto;border-radius:12px;background:white"><div id="qb-extracted" hidden><p class="qb-meta" id="qb-extracted-info"></p><button class="button quiet" id="qb-use-text">Use this page’s extracted text</button></div><section id="qb-range-controls" hidden style="margin-top:18px;padding-top:12px;border-top:1px solid #e2e8db"><strong style="font-size:13px">Teach from several PDF pages</strong><label class="field">Pages to add to the board<input id="qb-page-range" type="text" maxlength="120" inputmode="text" placeholder="e.g. 1-3,5" value="' + esc(question.pageRange || selectedPage) + '" aria-describedby="qb-range-help"></label><p id="qb-range-help" class="qb-meta">Use 1-3 or 1,3,5. Up to 10 pages per import, placed on separate board pages in page order. Your original PDF is kept.</p><div class="modal-actions"><button class="button outline" id="qb-import-range">Add these PDF pages</button><button class="button quiet" id="qb-stop-range" hidden>Stop import</button></div><p id="qb-range-status" class="qb-meta" role="status" aria-live="polite"></p></section></div><div id="qb-error" class="error-text" role="alert"></div><div class="modal-actions"><button class="button primary" id="qb-save">' + (existing ? 'Save changes' : 'Save question') + '</button><button class="button outline" id="qb-board">Put on board</button><button class="button quiet" id="qb-graph">Graph typed equation</button>' + (existing ? '<button class="button quiet" id="qb-delete">Delete question</button>' : '') + '</div><div class="notice">PDF text is editable when the file contains selectable text. Photos, handwriting and scanned pages need a typed equation for graphing. Attachments stay on this device; they are not uploaded or searched online.</div>');
      const $ = selector => body.querySelector(selector);
      const view = this.view;
      const live = () => !this.disposed && view === this.view && body.isConnected && Boolean($('#qb-text'));
      const error = message => { if (live()) $('#qb-error').textContent = message || ''; };
      const buttonsBusy = value => {
        busy = value;
        ['#qb-save', '#qb-board', '#qb-file', '#qb-page', '#qb-graph', '#qb-back', '#qb-remove-file', '#qb-page-range', '#qb-import-range'].forEach(id => { if ($(id)) $(id).disabled = value; });
        if ($('#qb-prev')) $('#qb-prev').disabled = value || selectedPage <= 1;
        if ($('#qb-next')) $('#qb-next').disabled = value || !this.pdf || selectedPage >= this.pdf.numPages;
      };
      const attachmentMeta = () => {
        $('#qb-attachment').innerHTML = attachment ? '<span>' + esc(attachment.name) + ' · ' + (attachment.size / 1048576).toFixed(1) + ' MB</span><div class="modal-actions"><button class="button quiet" id="qb-download-original">Download original</button><button class="button quiet" id="qb-remove-file">Remove attachment</button></div>' : '<small>Optional: JPG, PNG, WebP, GIF or PDF. One attachment per saved question.</small>';
        if (!attachment) return;
        $('#qb-download-original').onclick = () => downloadOriginal(attachment);
        $('#qb-remove-file').onclick = () => {
          this.cleanupPreview(); attachment = null; previewData = undefined; extracted = ''; selectedPage = 1;
          $('#qb-file').value = ''; $('#qb-preview-panel').hidden = true;
          buttonsBusy(false); attachmentMeta(); error('');
        };
      };
      const preview = async () => {
        if (!attachment) return;
        const token = this.previewVersion = (this.previewVersion || 0) + 1;
        const valid = () => live() && token === this.previewVersion;
        buttonsBusy(true); error(''); previewData = undefined;
        $('#qb-preview-panel').hidden = false; $('#qb-preview-status').textContent = 'Preparing your preview…';
        $('#qb-preview').hidden = true; $('#qb-extracted').hidden = true;
        $('#qb-pdf-controls').hidden = !isPDF(attachment);
        $('#qb-range-controls').hidden = !isPDF(attachment);
        $('#qb-range-status').textContent = '';
        try {
          if (isPDF(attachment)) {
            if (!global.StudioPDF) throw new Error('The PDF tool is unavailable. Open the app online once to complete setup.');
            if (!this.pdf) {
              const pdf = await global.StudioPDF.open(attachment.blob);
              if (!valid()) { pdf.destroy(); return; }
              this.pdf = pdf;
            }
            const pdf = this.pdf;
            selectedPage = Math.max(1, Math.min(pdf.numPages, selectedPage));
            $('#qb-page').value = selectedPage; $('#qb-page').max = pdf.numPages;
            $('#qb-page-total').textContent = 'of ' + pdf.numPages;
            if (!rangeTouched) $('#qb-page-range').value = selectedPage;
            $('#qb-prev').disabled = selectedPage <= 1; $('#qb-next').disabled = selectedPage >= pdf.numPages;
            const rendered = await pdf.render(selectedPage, { maxWidth: 1400 });
            if (!valid()) return;
            previewData = rendered.dataUrl; extracted = rendered.text || '';
            $('#qb-extracted').hidden = false;
            $('#qb-extracted-info').textContent = extracted.trim() ? 'Text was extracted from this page. Check the equation and symbols before using it.' : 'No selectable text was found. This may be a scanned page. Type the equation yourself to use graphing.';
            $('#qb-use-text').hidden = !extracted.trim();
            if (extracted.trim() && (!$('#qb-text').value.trim() || $('#qb-text').value === lastAutoText)) { $('#qb-text').value = extracted; lastAutoText = extracted; }
            $('#qb-preview-status').textContent = 'PDF page ' + selectedPage + ' · this page will be placed on the board.';
          } else {
            const data = await imageData(attachment.blob);
            if (!valid()) return;
            previewData = data; $('#qb-preview-status').textContent = 'Photo preview · write or draw over it on the board.';
          }
          if (valid()) { $('#qb-preview').src = previewData; $('#qb-preview').hidden = false; }
        } catch (failure) { if (valid()) { error(failure.message); $('#qb-preview-status').textContent = 'Preview unavailable. You can still save the original attachment.'; } }
        finally { if (valid()) buttonsBusy(false); }
      };
      const read = () => {
        const now = new Date().toISOString();
        const text = $('#qb-text').value.trim();
        const title = $('#qb-title').value.trim() || text.slice(0, 90) || attachment?.name?.replace(/\.[^.]+$/, '') || '';
        if (!title && !attachment) throw new Error('Add a title, question text or an attachment first.');
        const classLevel = $('#qb-form-level').value;
        return { id: existing?.id || global.crypto?.randomUUID?.() || 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2), title: title || 'My question', text, classLevel, level: classLevel, chapter: $('#qb-chapter').value.trim(), sourceLabel: $('#qb-form-source').value, exam: $('#qb-exam').value.trim(), year: $('#qb-year').value.trim(), attachment, selectedPage, pageRange: isPDF(attachment) ? $('#qb-page-range').value.trim() : undefined, createdAt: existing?.createdAt || now, updatedAt: now };
      };
      $('#qb-back').onclick = () => this.list();
      $('#qb-file').onchange = async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_FILE) { error('Choose a PDF or photo smaller than 40 MB. Your current attachment is kept.'); event.target.value = ''; return; }
        if (!(file.type.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) { error('Choose a PDF, JPG, PNG, WebP or GIF file. Your current attachment is kept.'); event.target.value = ''; return; }
        this.cleanupPreview();
        attachment = { blob: file, name: file.name, type: file.type, size: file.size };
        selectedPage = 1; previewData = undefined; extracted = ''; rangeTouched = false; $('#qb-page-range').value = '1';
        if (!$('#qb-title').value.trim()) $('#qb-title').value = file.name.replace(/\.[^.]+$/, '');
        attachmentMeta(); await preview();
      };
      $('#qb-prev').onclick = () => { if (!busy && selectedPage > 1) { selectedPage--; preview(); } };
      $('#qb-next').onclick = () => { if (!busy && this.pdf && selectedPage < this.pdf.numPages) { selectedPage++; preview(); } };
      $('#qb-page').onchange = event => { if (!busy) { selectedPage = Math.max(1, Math.floor(Number(event.target.value) || 1)); preview(); } };
      $('#qb-use-text').onclick = () => { $('#qb-text').value = extracted; lastAutoText = extracted; this.config.toast('PDF page text added. Check mathematical symbols before graphing.'); };
      $('#qb-save').onclick = async () => {
        if (busy) return;
        let entry;
        try {
          entry = read(); buttonsBusy(true); error('');
          await access('readwrite', store => store.put(entry));
          this.config.toast('Question saved on this device.');
          if (live()) await this.list();
        } catch (failure) { error(failure.message || 'Could not save this question. Keep the form open and try again.'); }
        finally { if (live()) buttonsBusy(false); }
      };
      $('#qb-board').onclick = async () => {
        if (busy) return;
        try { const entry = read(); buttonsBusy(true); error(''); await this.sendBoard(entry, previewData); }
        catch (failure) { error(failure.message); }
        finally { if (live()) buttonsBusy(false); }
      };
      $('#qb-page-range').oninput = () => { rangeTouched = true; };
      $('#qb-stop-range').onclick = () => {
        if (!this.batch) return;
        this.batch.cancelled = true;
        $('#qb-stop-range').disabled = true;
        $('#qb-range-status').textContent = 'Stopping after the current page finishes…';
      };
      $('#qb-import-range').onclick = async () => {
        if (busy || !isPDF(attachment)) return;
        let entry, pages;
        try {
          entry = read();
          if (!this.pdf) throw new Error('Wait for the PDF preview to load before importing pages.');
          pages = pageRange($('#qb-page-range').value, this.pdf.numPages);
        } catch (failure) { error(failure.message); return; }
        if (!this.config.onBoard) { error('The teaching board is unavailable.'); return; }
        const pdf = this.pdf;
        const batch = { cancelled: false, added: 0 };
        this.batch = batch;
        buttonsBusy(true); error('');
        $('#qb-stop-range').hidden = false; $('#qb-stop-range').disabled = false;
        try {
          for (const pageNumber of pages) {
            if (!live() || batch.cancelled) break;
            $('#qb-range-status').textContent = 'Preparing PDF page ' + pageNumber + ' · ' + batch.added + ' of ' + pages.length + ' added…';
            const rendered = await pdf.render(pageNumber, { maxWidth: 1400 });
            if (!live() || batch.cancelled) break;
            const pageQuestion = { ...entry, title: entry.title + ' · PDF page ' + pageNumber, selectedPage: pageNumber, text: pageNumber === entry.selectedPage ? entry.text : (rendered.text || ''), pdfTotalPages: pdf.numPages };
            await this.config.onBoard(pageQuestion, rendered.dataUrl);
            batch.added++;
          }
          if (!live()) return;
          if (batch.cancelled) {
            $('#qb-range-status').textContent = 'Import stopped. ' + batch.added + ' board page' + (batch.added === 1 ? '' : 's') + ' added; already added pages are kept.';
            this.config.toast(batch.added + ' PDF page' + (batch.added === 1 ? '' : 's') + ' added. Import stopped.');
          } else {
            this.config.toast(batch.added + ' PDF pages added as separate board pages.');
            this.dispose(); this.config.closeModal();
          }
        } catch (failure) {
          if (live()) error((batch.added ? batch.added + ' page' + (batch.added === 1 ? '' : 's') + ' already added. ' : '') + failure.message + ' Already added board pages are kept.');
        } finally {
          if (this.batch === batch) this.batch = null;
          if (live()) { buttonsBusy(false); $('#qb-stop-range').hidden = true; $('#qb-stop-range').disabled = false; }
        }
      };
      $('#qb-graph').onclick = () => this.sendGraph($('#qb-text').value);
      if ($('#qb-delete')) $('#qb-delete').onclick = () => this.confirmDelete(existing);
      attachmentMeta();
      if (attachment) preview();
    }
  }

  global.QuestionBank = {
    parsePageRange: pageRange,
    maxImportPages: MAX_IMPORT_PAGES,
    open(config) {
      active?.dispose();
      active = new Bank(config);
      active.list();
    }
  };
})(window);
