/* Offline PDF page rendering powered by Mozilla PDF.js 4.10.38 (Apache-2.0).
 * Text extraction is not OCR; scanned pages can still be rendered and annotated.
 */
(function (global) {
  'use strict';
  const scriptURL = document.currentScript && document.currentScript.src;
  const baseURL = new URL('.', scriptURL || global.location.href);
  const MAX_FILE_BYTES = 40 * 1024 * 1024;
  const MAX_PIXELS = 3000000;
  let libraryPromise;

  function abortError() {
    const error = new Error('PDF preview changed.');
    error.name = 'AbortError';
    return error;
  }

  function friendlyError(error) {
    if (error && (error.name === 'AbortError' || error.name === 'RenderingCancelledException')) return abortError();
    const name = error && error.name;
    if (name === 'PasswordException') return new Error('This PDF is password protected. Upload an unlocked copy.');
    if (name === 'InvalidPDFException' || name === 'MissingPDFException') return new Error('This file could not be read as a PDF. Try opening it on your tablet and export a fresh copy.');
    if (name === 'UnknownErrorException') return new Error('This PDF could not be opened. Try a smaller or freshly exported copy.');
    return new Error(error && error.message ? error.message : 'PDF preview is unavailable. Try an image or another PDF.');
  }

  async function library() {
    if (!libraryPromise) {
      libraryPromise = import(new URL('vendor/pdfjs/pdf.min.mjs', baseURL).href).then(pdfjs => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('vendor/pdfjs/pdf.worker.min.mjs', baseURL).href;
        return pdfjs;
      }).catch(error => {
        libraryPromise = null;
        throw new Error('PDF tools could not load. Open the app online once and wait for Offline ready, then try again.');
      });
    }
    return libraryPromise;
  }

  function pageText(content) {
    const lines = [];
    let line = '';
    let length = 0;
    for (const item of content.items || []) {
      if (typeof item.str !== 'string') continue;
      const value = item.str;
      if (value) {
        // Preserve the PDF's text; do not infer exponents or solve scanned images.
        line += (line && !/\s$/.test(line) && !/^\s/.test(value) ? ' ' : '') + value;
        length += value.length;
      }
      if (item.hasEOL) {
        lines.push(line.trimEnd());
        line = '';
      }
      if (length > 200000) break;
    }
    if (line) lines.push(line.trimEnd());
    return lines.join('\n').trim();
  }

  async function open(blob) {
    if (!blob || typeof blob.arrayBuffer !== 'function' || !Number.isFinite(blob.size)) throw new Error('Choose a PDF file from your device.');
    if (blob.size === 0) throw new Error('This PDF file is empty.');
    if (blob.size > MAX_FILE_BYTES) throw new Error('Choose a PDF smaller than 40 MB.');
    const pdfjs = await library();
    let loadingTask;
    let documentProxy;
    try {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      loadingTask = pdfjs.getDocument({
        data: bytes,
        standardFontDataUrl: new URL('vendor/pdfjs/standard_fonts/', baseURL).href,
        isEvalSupported: false,
        enableXfa: false,
        useWorkerFetch: true,
        disableAutoFetch: true,
        maxImageSize: 25000000,
        verbosity: 0
      });
      documentProxy = await loadingTask.promise;
    } catch (error) {
      if (loadingTask) await loadingTask.destroy().catch(() => {});
      throw friendlyError(error);
    }

    let destroyed = false;
    let generation = 0;
    let renderTask = null;
    const numPages = documentProxy.numPages;

    async function render(pageNumber, options = {}) {
      if (destroyed) throw new Error('This PDF is closed. Choose it again to preview a page.');
      const pageIndex = Number(pageNumber);
      if (!Number.isInteger(pageIndex) || pageIndex < 1 || pageIndex > numPages) throw new Error('Choose a page from 1 to ' + numPages + '.');
      const requestedWidth = Number(options.maxWidth === undefined ? 1400 : options.maxWidth);
      if (!Number.isFinite(requestedWidth) || requestedWidth <= 0) throw new Error('PDF preview width must be a positive number.');
      const maxWidth = Math.max(200, Math.min(1800, requestedWidth));
      const thisGeneration = ++generation;
      if (renderTask) renderTask.cancel();
      renderTask = null;
      let page;
      let task;
      let canvas;
      function current() { if (destroyed || thisGeneration !== generation) throw abortError(); }
      try {
        page = await documentProxy.getPage(pageIndex);
        current();
        const natural = page.getViewport({ scale: 1 });
        if (![natural.width, natural.height].every(Number.isFinite) || natural.width <= 0 || natural.height <= 0) throw new Error('This PDF page has invalid dimensions.');
        const scale = Math.min(maxWidth / natural.width, 2200 / natural.height, Math.sqrt(MAX_PIXELS / (natural.width * natural.height)));
        const viewport = page.getViewport({ scale });
        canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Your browser could not create a PDF preview. Try current Chrome.');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        const textPromise = page.getTextContent().then(pageText).catch(() => '');
        task = page.render({ canvasContext: context, viewport, background: 'rgb(255,255,255)' });
        renderTask = task;
        await task.promise;
        current();
        const text = await textPromise;
        current();
        return {
          dataUrl: canvas.toDataURL('image/png'),
          text,
          width: canvas.width,
          height: canvas.height
        };
      } catch (error) {
        throw friendlyError(error);
      } finally {
        if (renderTask === task) renderTask = null;
        if (canvas) { canvas.width = 0; canvas.height = 0; }
        if (page && !destroyed && thisGeneration === generation) page.cleanup();
      }
    }

    async function destroy() {
      if (destroyed) return;
      destroyed = true;
      generation++;
      if (renderTask) renderTask.cancel();
      renderTask = null;
      await loadingTask.destroy().catch(() => {});
    }

    return Object.freeze({ numPages, render, destroy });
  }

  global.StudioPDF = Object.freeze({ open, version: '4.10.38' });
})(window);
