/* Touch-safe board navigation. Ink stays in board coordinates at every zoom. */
(function (root) {
  'use strict';
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const position = e => ({ x: Number(e.clientX) || 0, y: Number(e.clientY) || 0 });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  class BoardViewport {
    constructor(wrapper, canvas, overlay, config = {}) {
      if (!wrapper || !canvas || !overlay) throw new Error('BoardViewport needs a board wrapper, canvas and overlay.');
      this.wrapper = wrapper; this.canvas = canvas; this.overlay = overlay; this.config = config;
      this.zoom = 1; this.x = 0; this.y = 0; this.handMode = false;
      this._touches = new Map(); this._pens = new Set(); this._inkPointers = new Set();
      this._captures = new Set(); this._navPointers = new Set();
      this._pinch = null; this._touchPan = null; this._pointerPan = null; this._destroyed = false;
      this._original = { overflow: wrapper.style.overflow, touchAction: wrapper.style.touchAction,
        canvas: this._saveStyle(canvas), overlay: this._saveStyle(overlay) };
      wrapper.style.overflow = 'hidden'; wrapper.style.touchAction = 'none';
      for (const element of [canvas, overlay]) { element.style.transformOrigin = '0 0'; element.style.willChange = 'transform'; }
      this._listeners = {
        pointerdown: e => this._down(e), pointermove: e => this._move(e),
        pointerup: e => this._up(e, false), pointercancel: e => this._up(e, true),
        lostpointercapture: e => this._lost(e), wheel: e => this._wheel(e)
      };
      for (const [type, handler] of Object.entries(this._listeners)) wrapper.addEventListener(type, handler, { capture: true, passive: false });
      this._outsideEnd = e => {
        if (this.wrapper.contains?.(e.target) || e.composedPath?.().includes(this.wrapper)) return;
        const tracked = this._touches.has(e.pointerId) || this._pens.has(e.pointerId) || this._inkPointers.has(e.pointerId) || this._navPointers.has(e.pointerId);
        if (tracked) { if (this._inkPointers.has(e.pointerId)) this.config.cancelDrawing?.(); this._up(e, e.type === 'pointercancel', true); }
      };
      this._onBlur = () => this._cancelAll();
      this._onResize = () => this._apply(this.zoom, this.x, this.y);
      root.addEventListener?.('pointerup', this._outsideEnd, true);
      root.addEventListener?.('pointercancel', this._outsideEnd, true);
      root.addEventListener?.('blur', this._onBlur);
      root.addEventListener?.('resize', this._onResize);
      if (typeof root.ResizeObserver === 'function') { this._observer = new root.ResizeObserver(this._onResize); this._observer.observe(wrapper); }
      this._apply(1, 0, 0, true);
    }
    _saveStyle(element) { return { transform: element.style.transform, transformOrigin: element.style.transformOrigin, willChange: element.style.willChange }; }
    get state() { return { zoom: this.zoom, x: this.x, y: this.y, handMode: this.handMode }; }
    _penActive() { return this._pens.size > 0 || !!this.config.isPenActive?.(); }
    _navigationOnly() { return this.config.isTouchNavigation ? !!this.config.isTouchNavigation() : true; }
    _consume(e) { if (e.cancelable !== false) e.preventDefault?.(); e.stopImmediatePropagation?.(); e.stopPropagation?.(); }
    _capture(id) { try { this.wrapper.setPointerCapture?.(id); this._captures.add(id); } catch (_) {} }
    _release(id) { this._captures.delete(id); try { if (!this.wrapper.hasPointerCapture || this.wrapper.hasPointerCapture(id)) this.wrapper.releasePointerCapture?.(id); } catch (_) {} }
    _baseBox() {
      const r = this.canvas.getBoundingClientRect();
      return { left: r.left - this.x, top: r.top - this.y, width: r.width / this.zoom, height: r.height / this.zoom };
    }
    _apply(zoom, x, y, force = false) {
      if (this._destroyed) return;
      const base = this._baseBox(), wr = this.wrapper.getBoundingClientRect();
      const width = this.wrapper.clientWidth || wr.width || base.width, height = this.wrapper.clientHeight || wr.height || base.height;
      zoom = clamp(Number.isFinite(zoom) ? zoom : this.zoom, 1, 4);
      x = clamp(Number.isFinite(x) ? x : 0, Math.min(0, width - base.width * zoom), 0);
      y = clamp(Number.isFinite(y) ? y : 0, Math.min(0, height - base.height * zoom), 0);
      if (zoom === 1) { x = 0; y = 0; }
      const changed = zoom !== this.zoom || x !== this.x || y !== this.y;
      this.zoom = zoom; this.x = x; this.y = y;
      const transform = `translate(${x}px, ${y}px) scale(${zoom})`;
      this.canvas.style.transform = transform; this.overlay.style.transform = transform;
      if (changed || force) this.config.onChange?.({ zoom, x, y });
    }
    point(e) {
      const r = this.canvas.getBoundingClientRect();
      const width = this.canvas.width || 1600, height = this.canvas.height || 1000;
      const scale = Math.min(r.width / width, r.height / height) || 1;
      const ox = (r.width - width * scale) / 2, oy = (r.height - height * scale) / 2;
      const pressure = Number.isFinite(e.pressure) ? e.pressure : .5;
      return { x: (e.clientX - r.left - ox) / scale, y: (e.clientY - r.top - oy) / scale,
        p: e.pointerType === 'pen' ? pressure : .5 };
    }
    setZoom(value, anchorScreenPoint) {
      if (this._destroyed || !Number.isFinite(Number(value))) return this.state;
      const next = clamp(Number(value), 1, 4), base = this._baseBox(), wr = this.wrapper.getBoundingClientRect();
      const anchor = anchorScreenPoint || { x: wr.left + wr.width / 2, y: wr.top + wr.height / 2 };
      const ax = Number.isFinite(anchor.x) ? anchor.x : Number.isFinite(anchor.clientX) ? anchor.clientX : wr.left + wr.width / 2;
      const ay = Number.isFinite(anchor.y) ? anchor.y : Number.isFinite(anchor.clientY) ? anchor.clientY : wr.top + wr.height / 2;
      const localX = (ax - base.left - this.x) / this.zoom, localY = (ay - base.top - this.y) / this.zoom;
      if (next !== this.zoom && (this._inkPointers.size || [...this._touches.values()].some(t => t.ink))) this.config.cancelDrawing?.();
      this._apply(next, ax - base.left - localX * next, ay - base.top - localY * next);
      this._pinch = null; this._touchPan = null; this._pointerPan = null;
      return this.state;
    }
    zoomBy(factor) { return Number.isFinite(Number(factor)) && Number(factor) > 0 ? this.setZoom(this.zoom * Number(factor)) : this.state; }
    reset() {
      if (this._inkPointers.size || [...this._touches.values()].some(t => t.ink)) this.config.cancelDrawing?.();
      this._pinch = null; this._touchPan = null; this._pointerPan = null;
      this._apply(1, 0, 0); return this.state;
    }
    setHandMode(enabled) {
      enabled = !!enabled;
      if (enabled === this.handMode) return this.state;
      if (this._inkPointers.size || [...this._touches.values()].some(t => t.ink)) this.config.cancelDrawing?.();
      this.handMode = enabled; this._pinch = null; this._touchPan = null; this._pointerPan = null;
      for (const t of this._touches.values()) { t.ink = false; t.consumed = true; this._capture(t.id); }
      return this.state;
    }
    _available() { return [...this._touches.values()].filter(t => !t.blocked); }
    _cancelTouchInk() {
      const hasInk = [...this._touches.values()].some(t => t.ink);
      if (hasInk) this.config.cancelDrawing?.();
      for (const t of this._touches.values()) { t.ink = false; t.consumed = true; this._capture(t.id); }
    }
    _blockTouchesForPen() {
      if ([...this._touches.values()].some(t => t.ink)) this.config.cancelDrawing?.();
      for (const t of this._touches.values()) { t.ink = false; t.blocked = true; t.consumed = true; this._capture(t.id); }
      this._pinch = null; this._touchPan = null;
    }
    _startPinch() {
      if (this._penActive()) return false;
      const available = this._available();
      if (available.length < 2) return false;
      this._cancelTouchInk(); this._touchPan = null;
      const [a, b] = available, d = distance(a, b);
      if (d < 12) return false;
      const center = midpoint(a, b), base = this._baseBox();
      this._pinch = { ids: [a.id, b.id], distance: d, zoom: this.zoom,
        anchorX: (center.x - base.left - this.x) / this.zoom, anchorY: (center.y - base.top - this.y) / this.zoom };
      return true;
    }
    _down(e) {
      if (this._destroyed) return;
      const id = e.pointerId;
      if (e.pointerType === 'touch') {
        const blocked = this._penActive();
        const t = { id, ...position(e), blocked, consumed: blocked, ink: false };
        this._touches.set(id, t);
        if (blocked) { this._capture(id); this._consume(e); return; }
        if (this._available().length >= 2) { this._startPinch(); this._consume(e); return; }
        if (this.handMode || this._navigationOnly()) {
          t.consumed = true; this._capture(id);
          if (this.handMode) this._touchPan = { id, x: t.x, y: t.y, startX: this.x, startY: this.y };
          this._consume(e); return;
        }
        t.ink = true; // Explicit finger-writing setting: the first touch reaches the ink engine.
        return;
      }
      if (e.pointerType === 'pen') { this._blockTouchesForPen(); this._pens.add(id); }
      if (this.handMode) {
        this.config.cancelDrawing?.(); this._navPointers.add(id); this._capture(id);
        if (e.button === undefined || e.button === 0) this._pointerPan = { id, ...position(e), startX: this.x, startY: this.y };
        this._consume(e); return;
      }
      this._inkPointers.add(id);
    }
    _move(e) {
      if (this._destroyed) return;
      const id = e.pointerId;
      if (e.pointerType === 'touch') {
        const t = this._touches.get(id);
        if (!t) { if (this._penActive() || this._navigationOnly() || this.handMode) this._consume(e); return; }
        Object.assign(t, position(e));
        if (t.blocked || this._penActive()) { if (t.ink) this.config.cancelDrawing?.(); t.blocked = true; t.consumed = true; t.ink = false; this._consume(e); return; }
        if (!this._pinch && this._available().length >= 2) this._startPinch();
        if (this._pinch) {
          const a = this._touches.get(this._pinch.ids[0]), b = this._touches.get(this._pinch.ids[1]);
          if (a && b) {
            const center = midpoint(a, b), base = this._baseBox();
            const zoom = clamp(this._pinch.zoom * distance(a, b) / this._pinch.distance, 1, 4);
            this._apply(zoom, center.x - base.left - this._pinch.anchorX * zoom, center.y - base.top - this._pinch.anchorY * zoom);
          }
          this._consume(e); return;
        }
        if (this.handMode) {
          if (!this._touchPan || this._touchPan.id !== id) this._touchPan = { id, x: t.x, y: t.y, startX: this.x, startY: this.y };
          const pan = this._touchPan;
          this._apply(this.zoom, pan.startX + t.x - pan.x, pan.startY + t.y - pan.y);
          t.consumed = true; this._consume(e); return;
        }
        if (t.consumed || this._navigationOnly()) {
          if (t.ink) this._cancelTouchInk();
          t.consumed = true; this._consume(e);
        }
        return;
      }
      if (this._navPointers.has(id)) {
        const pan = this._pointerPan;
        if (pan?.id === id) this._apply(this.zoom, pan.startX + e.clientX - pan.x, pan.startY + e.clientY - pan.y);
        this._consume(e); return;
      }
      if (this.handMode) this._consume(e);
    }
    _up(e, cancelled, outside = false) {
      if (this._destroyed) return;
      const id = e.pointerId;
      if (e.pointerType === 'touch' || this._touches.has(id)) {
        const t = this._touches.get(id), wasPinch = this._pinch?.ids.includes(id);
        const consumed = !!t?.consumed || !!t?.blocked || !!this._pinch || this.handMode || this._navigationOnly() || this._penActive();
        this._touches.delete(id); this._release(id);
        if (wasPinch) {
          this._pinch = null;
          for (const remaining of this._touches.values()) { remaining.ink = false; remaining.consumed = true; if (cancelled) remaining.blocked = true; }
        }
        if (this._touchPan?.id === id) this._touchPan = null;
        if (!cancelled && this.handMode && !this._penActive() && this._available().length === 1) {
          const remaining = this._available()[0];
          this._touchPan = { id: remaining.id, x: remaining.x, y: remaining.y, startX: this.x, startY: this.y };
        }
        if (consumed && !outside) this._consume(e);
        return;
      }
      const consumed = this._navPointers.has(id) || this.handMode;
      this._pens.delete(id); this._inkPointers.delete(id); this._navPointers.delete(id);
      if (this._pointerPan?.id === id) this._pointerPan = null;
      this._release(id);
      if (consumed && !outside) this._consume(e);
    }
    _lost(e) {
      // A canvas may lose capture because this wrapper has just taken it for a
      // pinch. That transition is already handled before capture is transferred.
      if (e.target !== this.wrapper) return;
      const id = e.pointerId;
      if (!this._captures.has(id)) return;
      this._captures.delete(id);
      const hadInk = this._inkPointers.has(id) || this._touches.get(id)?.ink;
      this._touches.delete(id); this._pens.delete(id); this._inkPointers.delete(id); this._navPointers.delete(id);
      this._pinch = null; this._touchPan = null; this._pointerPan = null;
      for (const t of this._touches.values()) { t.blocked = true; t.consumed = true; t.ink = false; }
      if (hadInk) this.config.cancelDrawing?.();
    }
    _wheel(e) {
      if (!e.ctrlKey) return;
      this._consume(e);
      if (this._penActive()) return;
      this.setZoom(this.zoom * Math.exp(-clamp(e.deltaY || 0, -200, 200) * .005), position(e));
    }
    _cancelAll() {
      if (this._inkPointers.size || [...this._touches.values()].some(t => t.ink)) this.config.cancelDrawing?.();
      this._touches.clear(); this._pens.clear(); this._inkPointers.clear(); this._navPointers.clear();
      this._pinch = null; this._touchPan = null; this._pointerPan = null;
      for (const id of [...this._captures]) this._release(id);
    }
    destroy() {
      if (this._destroyed) return;
      this._cancelAll(); this._destroyed = true;
      for (const [type, handler] of Object.entries(this._listeners)) this.wrapper.removeEventListener(type, handler, true);
      root.removeEventListener?.('pointerup', this._outsideEnd, true); root.removeEventListener?.('pointercancel', this._outsideEnd, true);
      root.removeEventListener?.('blur', this._onBlur); root.removeEventListener?.('resize', this._onResize);
      this._observer?.disconnect();
      this.wrapper.style.overflow = this._original.overflow; this.wrapper.style.touchAction = this._original.touchAction;
      Object.assign(this.canvas.style, this._original.canvas); Object.assign(this.overlay.style, this._original.overlay);
    }
  }
  root.BoardViewport = BoardViewport;
})(typeof window !== 'undefined' ? window : globalThis);
