/* Board-object editing. Adorners use a separate canvas so recordings stay clean. */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const transformCopy = object => object.type === 'stroke' ? { ...object, points: object.points.map(p => ({ ...p })) } : { ...object };
  const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const BOX_TYPES = new Set(['image', 'graph', 'livegraph', 'diagram', 'geometry', 'instrument', 'conic']);
  const SHAPE_TYPES = new Set(['line', 'rectangle', 'circle']);

  class BoardEditor {
    constructor(canvas, overlay, config = {}) {
      if (!canvas || !overlay) throw new Error('BoardEditor needs a board and an overlay canvas.');
      this.canvas = canvas;
      this.overlay = overlay;
      this.context = canvas.getContext('2d');
      this.overlayContext = overlay.getContext('2d');
      this.config = config;
      this.enabled = false;
      this._index = -1;
      this._ref = null;
      this._drag = null;
    }
    get objects() { return this.config.getObjects?.() || []; }
    get selected() {
      const objects = this.objects;
      return this._index >= 0 && objects[this._index] === this._ref ? this._ref : null;
    }
    get selectedIndex() { return this.selected ? this._index : -1; }
    _notify() { this.config.onSelect?.(this.selected, this.selectedIndex); }
    _scale() {
      const rect = this.canvas.getBoundingClientRect?.();
      return rect && rect.width > 0 && rect.height > 0
        ? Math.min(rect.width / this.canvas.width, rect.height / this.canvas.height) : 1;
    }
    _select(index) {
      this._index = index;
      this._ref = index >= 0 ? this.objects[index] || null : null;
      if (!this._ref) this._index = -1;
      this._notify();
      this.drawOverlay();
    }
    select(index) {
      this._drag = null;
      this._select(Number.isInteger(index) && index >= 0 && index < this.objects.length ? index : -1);
      return this.selected;
    }
    setEnabled(enabled) {
      this.enabled = !!enabled;
      if (!this.enabled) this.clear();
      else this.drawOverlay();
    }
    clear() {
      this._drag = null;
      this._index = -1;
      this._ref = null;
      this._notify();
      this.drawOverlay();
    }
    bounds(object = this.selected) {
      if (!object) return null;
      let x, y, w, h;
      if (BOX_TYPES.has(object.type)) {
        x = finite(object.x); y = finite(object.y);
        w = Math.max(1, finite(object.w, 100)); h = Math.max(1, finite(object.h, 100));
      } else if (SHAPE_TYPES.has(object.type)) {
        const x1 = finite(object.x), x2 = finite(object.x2, x1);
        const y1 = finite(object.y), y2 = finite(object.y2, y1);
        x = Math.min(x1, x2); y = Math.min(y1, y2);
        w = Math.max(1, Math.abs(x2 - x1)); h = Math.max(1, Math.abs(y2 - y1));
      } else if (object.type === 'stroke') {
        if (!Array.isArray(object.points) || !object.points.length) return null;
        let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
        for (const p of object.points) {
          if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
          xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x);
          ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y);
        }
        if (!Number.isFinite(xmin)) return null;
        const pad = Math.max(1, finite(object.width, 4) / 2);
        x = xmin - pad; y = ymin - pad;
        w = Math.max(pad * 2, xmax - xmin + pad * 2);
        h = Math.max(pad * 2, ymax - ymin + pad * 2);
      } else if (object.type === 'text') {
        if (typeof root.TextTools?.layout === 'function') {
          try {
            const measured = root.TextTools.layout(this.context, object)?.bounds;
            if (measured && [measured.x, measured.y, measured.w, measured.h].every(Number.isFinite) && measured.w >= 0 && measured.h >= 0) {
              return { x: measured.x, y: measured.y, w: Math.max(1, measured.w), h: Math.max(1, measured.h) };
            }
          } catch (_) { /* Standalone/legacy renderer still has a safe fallback. */ }
        }
        const size = Math.max(1, finite(object.size, 32));
        const lineHeight = Math.max(1, finite(object.lineHeight, size * 1.6));
        const maxWidth = Math.max(1, finite(object.maxWidth, 1400));
        const ctx = this.context;
        ctx.save();
        ctx.font = (object.italic ? 'italic ' : '') + (object.bold ? 'bold ' : '') + size + 'px ' + (object.serif ? 'Georgia, serif' : '"Segoe UI", sans-serif');
        let lineCount = 0, measured = 0;
        for (const paragraph of String(object.text || '').split('\n')) {
          let line = '';
          for (const word of paragraph.split(' ')) {
            const candidate = line ? line + ' ' + word : word;
            if (ctx.measureText(candidate).width > maxWidth && line) {
              measured = Math.max(measured, ctx.measureText(line).width);
              lineCount++; line = word;
            } else line = candidate;
          }
          measured = Math.max(measured, ctx.measureText(line).width);
          lineCount++;
        }
        ctx.restore();
        x = finite(object.x); y = finite(object.y) - size;
        w = Math.max(size * .35, measured);
        h = Math.max(size * 1.25, (lineCount - 1) * lineHeight + size * 1.25);
      } else return null;
      return { x, y, w, h };
    }
    hitTest(p, { includeLocked = false } = {}) {
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return -1;
      const tolerance = 6 / Math.max(.05, this._scale()), objects = this.objects;
      for (let i = objects.length - 1; i >= 0; i--) {
        if (!includeLocked && objects[i]?.locked) continue;
        if (this._contains(this.bounds(objects[i]), p, tolerance)) return i;
      }
      return -1;
    }
    setLocked(locked, index = this.selectedIndex) {
      const objects = this.objects;
      if (!Number.isInteger(index) || index < 0 || index >= objects.length) return null;
      const object = objects[index];
      locked = !!locked;
      if (!!object.locked === locked) return object;
      this._drag = null;
      this.config.checkpoint?.();
      object.locked = locked;
      this._notify(); this.config.render?.(); this.config.save?.(); this.drawOverlay();
      return object;
    }
    toggleLocked(index = this.selectedIndex) {
      const object = Number.isInteger(index) ? this.objects[index] : null;
      return object ? this.setLocked(!object.locked, index) : null;
    }
    _reorder(index, target) {
      const objects = this.objects;
      if (!Number.isInteger(index) || !Number.isInteger(target) || index < 0 || index >= objects.length || target < 0 || target >= objects.length || index === target) return false;
      this._drag = null;
      const selected = this.selected;
      this.config.checkpoint?.();
      const [object] = objects.splice(index, 1);
      objects.splice(target, 0, object);
      if (selected) { this._ref = selected; this._index = objects.indexOf(selected); }
      this._notify(); this.config.render?.(); this.config.save?.(); this.drawOverlay();
      return true;
    }
    bringToFront(index = this.selectedIndex) { return this._reorder(index, this.objects.length - 1); }
    sendToBack(index = this.selectedIndex) { return this._reorder(index, 0); }
    _contains(bounds, p, tolerance) {
      return bounds && p.x >= bounds.x - tolerance && p.x <= bounds.x + bounds.w + tolerance &&
        p.y >= bounds.y - tolerance && p.y <= bounds.y + bounds.h + tolerance;
    }
    handleDown(event, p) {
      if (!this.enabled || !p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
      this._drag = null;
      const scale = Math.max(.05, this._scale());
      let index = this.selectedIndex, bounds = this.bounds();
      const hitRadius = 24 / scale;
      let resize = !this.selected?.locked && bounds && Math.abs(p.x - bounds.x - bounds.w) <= hitRadius && Math.abs(p.y - bounds.y - bounds.h) <= hitRadius;
      if (!resize) {
        index = this.hitTest(p);
        this._select(index);
        bounds = this.bounds();
      }
      if (index < 0 || !bounds || !this.selected || this.selected.locked) return;
      this._drag = { mode: resize ? 'resize' : 'move', x: p.x, y: p.y, snapshot: clone(this.selected), bounds, changed: false, ref: this.selected };
    }
    _translated(object, dx, dy) {
      const out = transformCopy(object);
      if (out.type === 'stroke') {
        for (const p of out.points) { p.x += dx; p.y += dy; }
      } else {
        out.x = finite(out.x) + dx; out.y = finite(out.y) + dy;
        if (SHAPE_TYPES.has(out.type)) {
          out.x2 = finite(out.x2, finite(object.x)) + dx;
          out.y2 = finite(out.y2, finite(object.y)) + dy;
        }
      }
      return out;
    }
    _moved(object, bounds, dx, dy) {
      const width = this.canvas.width || 1600, height = this.canvas.height || 1000;
      dx = bounds.w <= width ? clamp(dx, -bounds.x, width - bounds.x - bounds.w) : clamp(dx, 40 - bounds.x - bounds.w, width - 40 - bounds.x);
      dy = bounds.h <= height ? clamp(dy, -bounds.y, height - bounds.y - bounds.h) : clamp(dy, 40 - bounds.y - bounds.h, height - 40 - bounds.y);
      return this._translated(object, dx, dy);
    }
    _resized(object, bounds, dx, dy) {
      const out = transformCopy(object);
      const min = (['graph', 'livegraph', 'conic'].includes(object.type)) ? 100 : 25;
      const maxW = Math.max(min, (this.canvas.width || 1600) - bounds.x);
      const maxH = Math.max(min, (this.canvas.height || 1000) - bounds.y);
      const sx = clamp(bounds.w + dx, min, maxW) / bounds.w;
      const sy = clamp(bounds.h + dy, min, maxH) / bounds.h;
      if (BOX_TYPES.has(out.type)) {
        if (out.type === 'image' && out.preserveAspect !== false) {
          const candidate = Math.abs(sx - 1) > Math.abs(sy - 1) ? sx : sy;
          const upper = Math.min(maxW / bounds.w, maxH / bounds.h);
          const lower = Math.min(upper, Math.max(min / bounds.w, min / bounds.h));
          const factor = clamp(candidate, lower, upper);
          out.w = bounds.w * factor; out.h = bounds.h * factor;
        } else { out.w = bounds.w * sx; out.h = bounds.h * sy; }
      } else if (SHAPE_TYPES.has(out.type)) {
        out.x = bounds.x + (finite(object.x) - bounds.x) * sx;
        out.y = bounds.y + (finite(object.y) - bounds.y) * sy;
        out.x2 = bounds.x + (finite(object.x2) - bounds.x) * sx;
        out.y2 = bounds.y + (finite(object.y2) - bounds.y) * sy;
      } else if (out.type === 'stroke') {
        for (const p of out.points) {
          p.x = bounds.x + (p.x - bounds.x) * sx;
          p.y = bounds.y + (p.y - bounds.y) * sy;
        }
        out.width = clamp(finite(object.width, 4) * Math.sqrt(sx * sy), 1, 300);
      } else if (out.type === 'text') {
        // Text preserves its proportions; changing the layout width would reflow
        // lines instead of performing the scale expected from a resize handle.
        const factor = clamp(Math.abs(sx - 1) > Math.abs(sy - 1) ? sx : sy, .1, 20);
        const oldSize = Math.max(1, finite(object.size, 32));
        const newSize = clamp(oldSize * factor, 8, 360), actual = newSize / oldSize;
        out.size = newSize;
        out.maxWidth = Math.max(1, finite(object.maxWidth, 1400) * actual);
        out.lineHeight = Math.max(1, finite(object.lineHeight, oldSize * 1.6) * actual);
        out.x = bounds.x + (finite(object.x) - bounds.x) * actual;
        out.y = bounds.y + (finite(object.y) - bounds.y) * actual;
      }
      return out;
    }
    handleMove(event, p) {
      const drag = this._drag;
      if (!this.enabled || !drag || !p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || this.selected !== drag.ref || this.selected.locked) return;
      const dx = p.x - drag.x, dy = p.y - drag.y;
      if (!drag.changed && Math.abs(dx) + Math.abs(dy) < 1) return;
      const updated = drag.mode === 'resize' ? this._resized(drag.snapshot, drag.bounds, dx, dy) : this._moved(drag.snapshot, drag.bounds, dx, dy);
      if (!drag.changed) { this.config.checkpoint?.(); drag.changed = true; }
      Object.assign(drag.ref, updated);
      this.config.render?.();
      this.drawOverlay();
    }
    handleUp() {
      const drag = this._drag;
      this._drag = null;
      if (drag?.changed) { this.config.save?.(); this._notify(); }
      this.drawOverlay();
    }
    duplicate() {
      const object = this.selected, bounds = this.bounds();
      if (!object || !bounds) return null;
      this._drag = null;
      const width = this.canvas.width || 1600, height = this.canvas.height || 1000;
      let dx = bounds.x + bounds.w + 50 <= width ? 50 : -50;
      let dy = bounds.y + bounds.h + 50 <= height ? 50 : -50;
      if (bounds.w <= width) dx = clamp(dx, -bounds.x, width - bounds.x - bounds.w);
      if (bounds.h <= height) dy = clamp(dy, -bounds.y, height - bounds.y - bounds.h);
      const copy = this._translated(clone(object), dx, dy);
      if (copy.locked) copy.locked = false;
      this.config.checkpoint?.();
      const objects = this.objects;
      objects.push(copy);
      this._select(objects.length - 1);
      this.config.render?.(); this.config.save?.(); this.drawOverlay();
      return copy;
    }
    remove() {
      const index = this.selectedIndex;
      if (index < 0 || this.selected.locked) return false;
      this.config.checkpoint?.();
      this.objects.splice(index, 1);
      this.clear(); this.config.render?.(); this.config.save?.();
      return true;
    }
    drawOverlay() {
      const ctx = this.overlayContext;
      ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
      const bounds = this.bounds();
      if (!this.enabled || !bounds) return;
      const scale = Math.max(.05, this._scale()), pad = 4 / scale, size = 20 / scale;
      ctx.save();
      ctx.strokeStyle = this.selected.locked ? '#8a927c' : '#288d79'; ctx.lineWidth = 1.5 / scale;
      ctx.setLineDash([5 / scale, 4 / scale]);
      ctx.strokeRect(bounds.x - pad, bounds.y - pad, bounds.w + pad * 2, bounds.h + pad * 2);
      ctx.setLineDash([]);
      if (this.selected.locked) { ctx.restore(); return; }
      const hx = bounds.x + bounds.w, hy = bounds.y + bounds.h;
      ctx.fillStyle = '#fff'; ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
      ctx.strokeRect(hx - size / 2, hy - size / 2, size, size);
      ctx.beginPath(); ctx.moveTo(hx - size * .18, hy + size * .2); ctx.lineTo(hx + size * .2, hy - size * .18); ctx.stroke();
      ctx.restore();
    }
  }
  root.BoardEditor = BoardEditor;
})(typeof window !== 'undefined' ? window : globalThis);
