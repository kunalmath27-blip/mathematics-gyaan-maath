/* Dedicated live-ink overlay. Saved strokes remain ordinary PenEngine data. */
(function (root) {
  'use strict';
  const opaqueColor = color => typeof color === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color.trim());
  const key = point => point ? [point.x, point.y, point.p, point.tiltX, point.tiltY, point.twist].join(':') : '';
  function union(a, b) {
    if (!a) return b ? { ...b } : null;
    if (!b) return { ...a };
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
  }
  function clipped(rect, width, height) {
    if (!rect || !['x', 'y', 'w', 'h'].every(k => Number.isFinite(rect[k]))) return null;
    const x = Math.max(0, Math.floor(rect.x)), y = Math.max(0, Math.floor(rect.y));
    const right = Math.min(width, Math.ceil(rect.x + rect.w)), bottom = Math.min(height, Math.ceil(rect.y + rect.h));
    return right > x && bottom > y ? { x, y, w: right - x, h: bottom - y } : null;
  }
  function canvasFor(overlay) {
    if (typeof root.OffscreenCanvas === 'function') return new root.OffscreenCanvas(overlay.width, overlay.height);
    const canvas = (overlay.ownerDocument || root.document)?.createElement('canvas');
    if (!canvas) throw new Error('A live-ink canvas is unavailable.');
    canvas.width = overlay.width; canvas.height = overlay.height;
    return canvas;
  }

  class InkSurface {
    constructor(overlay, engine = root.PenEngine) {
      if (!overlay?.getContext || !engine?.draw) throw new Error('InkSurface needs a dedicated canvas and PenEngine.');
      this.canvas = overlay;
      this.context = overlay.getContext('2d');
      this.engine = engine;
      this.committed = canvasFor(overlay);
      this.committedContext = this.committed.getContext('2d');
      if (!this.context || !this.committedContext) throw new Error('The browser could not create a live-ink surface.');
      this.stroke = null;
      this.color = null;
      this.dirty = null;
      this._reset();
    }

    _reset() {
      this._points = null;
      this._count = 0;
      this._stable = 0;
      this._tail = null;
      this._lastKey = '';
      this._signature = '';
      this._mode = null;
    }

    _clean(context, rect) {
      context.save();
      try { context.resetTransform?.(); context.clearRect(rect.x, rect.y, rect.w, rect.h); }
      finally { context.restore(); }
    }

    _fullRect() { return { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height }; }

    _size() {
      if (this.committed.width === this.canvas.width && this.committed.height === this.canvas.height) return false;
      this.committed.width = this.canvas.width;
      this.committed.height = this.canvas.height;
      this._reset();
      return true;
    }

    setColor(color) {
      const next = typeof color === 'string' && color ? color : null;
      if (next === this.color) return this.dirty;
      this.color = next;
      if (this.stroke) return this.update(this.stroke);
      return null;
    }

    begin(stroke) {
      this.stroke = null;
      this._reset();
      return this.update(stroke);
    }

    update(stroke = this.stroke) {
      if (!stroke || !Array.isArray(stroke.points) || !stroke.points.length) { this.clear(); return null; }
      this._size();
      const paint = this.color ? { ...stroke, color: this.color } : stroke;
      const n = stroke.points.length;
      const signature = [paint.tool, paint.penStyle, paint.color, paint.width, paint.opacity ?? 1, paint.pressureEnabled, paint.sensitivity].join('|');
      const mode = paint.tool === 'pen' && ['ballpoint', 'fountain', 'calligraphy'].includes(paint.penStyle) && (paint.opacity === undefined || paint.opacity === 1) && opaqueColor(paint.color) && typeof this.engine.drawRange === 'function' && typeof this.engine.rangeBounds === 'function' ? 'incremental' : 'full';
      // Incremental input is append-only. PenEngine compaction replaces the
      // points array; editing a retained endpoint or changing paint resets it.
      const reset = this.stroke !== stroke || this._points !== stroke.points || n < this._count || signature !== this._signature || mode !== this._mode || (this._count && key(stroke.points[this._count - 1]) !== this._lastKey);
      this.stroke = stroke;
      if (reset) {
        if (mode === 'incremental') this._clean(this.context, this._fullRect());
        this._clean(this.committedContext, this._fullRect());
        this._stable = 0; this._tail = null; this._count = 0;
      }
      this._signature = signature; this._mode = mode; this._points = stroke.points;
      if (!reset && n === this._count) { this.dirty = null; return null; }
      if (mode === 'full') {
        this._clean(this.context, this._fullRect());
        this.engine.draw(this.context, paint);
        this._count = n; this._lastKey = key(stroke.points[n - 1]);
        this.dirty = this._fullRect();
        return this.dirty;
      }

      const stable = Math.max(0, n - 1);
      const changed = this.engine.rangeBounds(paint, this._stable, n);
      const tail = this.engine.rangeBounds(paint, n - 1, n);
      const damage = clipped(union(this._tail, changed), this.canvas.width, this.canvas.height);
      if (stable > this._stable) this.engine.drawRange(this.committedContext, paint, this._stable, stable);
      if (damage) {
        const context = this.context;
        context.save();
        try {
          context.resetTransform?.();
          context.globalAlpha = 1;
          context.globalCompositeOperation = 'source-over';
          context.shadowBlur = 0;
          if ('filter' in context) context.filter = 'none';
          context.clearRect(damage.x, damage.y, damage.w, damage.h);
          // Integer-aligned 1:1 copying avoids resampling earlier antialiasing.
          context.drawImage(this.committed, damage.x, damage.y, damage.w, damage.h, damage.x, damage.y, damage.w, damage.h);
          this.engine.drawRange(context, paint, n - 1, n);
        } finally { context.restore(); }
      }
      this._stable = stable; this._tail = tail; this._count = n; this._lastKey = key(stroke.points[n - 1]);
      this.dirty = damage;
      return damage;
    }

    finish(stroke = this.stroke) {
      if (!stroke) return null;
      this.engine.finish?.(stroke);
      // Keep the final preview until the owner commits the vector stroke and
      // explicitly clears this layer, avoiding a blank frame at pen-up.
      return this.update(stroke);
    }

    clear() {
      this._size();
      const rect = this._fullRect();
      this._clean(this.context, rect);
      this._clean(this.committedContext, rect);
      this.stroke = null;
      this.dirty = rect;
      this._reset();
      return rect;
    }
  }

  root.InkSurface = InkSurface;
})(typeof window !== 'undefined' ? window : globalThis);
