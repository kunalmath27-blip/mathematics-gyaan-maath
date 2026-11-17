/* Freehand group selection. The temporary lasso is never part of saved ink. */
(function (root) {
  'use strict';
  const finite = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;
  const clone = v => JSON.parse(JSON.stringify(v));
  const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
  const isPoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);

  function onSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (!length) return Math.hypot(p.x - a.x, p.y - a.y) <= .5;
    const distance = Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / length;
    return distance <= .5 && p.x >= Math.min(a.x, b.x) - .5 && p.x <= Math.max(a.x, b.x) + .5 && p.y >= Math.min(a.y, b.y) - .5 && p.y <= Math.max(a.y, b.y) + .5;
  }
  function inside(p, polygon) {
    let yes = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[j], b = polygon[i];
      if (onSegment(p, a, b)) return true;
      if (((a.y > p.y) !== (b.y > p.y)) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) yes = !yes;
    }
    return yes;
  }

  class LassoTool {
    constructor(overlay, config = {}) {
      if (!overlay || typeof overlay.getContext !== 'function') throw new Error('LassoTool needs an overlay canvas.');
      this.overlay = overlay;
      this.ctx = overlay.getContext('2d');
      this.config = config;
      this.enabled = false;
      this._owner = null;
      this._refs = [];
      this._gesture = null;
    }
    get objects() { return this.config.getObjects?.() || []; }
    get selected() {
      const objects = this.objects;
      if (objects !== this._owner) return [];
      return this._refs.filter(o => objects.includes(o));
    }
    _notify() { this.config.onSelect?.(this.selected); }
    _refresh() {
      if (typeof this.config.render === 'function') this.config.render();
      else this.drawOverlay();
    }
    _select(refs) {
      this._owner = this.objects;
      this._refs = refs.slice();
      this._notify();
    }
    _bounds(object) {
      const b = this.config.bounds?.(object);
      if (!b || ![b.x, b.y, b.w, b.h].every(Number.isFinite) || b.w < 0 || b.h < 0) return null;
      return b;
    }
    bounds(refs = this.selected) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const object of refs) {
        const b = this._bounds(object);
        if (!b) continue;
        minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h);
      }
      return Number.isFinite(minX) ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY } : null;
    }
    setEnabled(enabled) {
      this.enabled = !!enabled;
      if (!this.enabled) this.clear();
      else this._refresh();
    }
    clear() {
      this._gesture = null;
      this._owner = null;
      this._refs = [];
      this._notify();
      this._refresh();
    }
    _contains(b, p) { return b && p.x >= b.x - 5 && p.x <= b.x + b.w + 5 && p.y >= b.y - 5 && p.y <= b.y + b.h + 5; }
    handleDown(event, p) {
      if (!this.enabled || !isPoint(p)) return;
      const refs = this.selected, bounds = this.bounds(refs);
      if (refs.length && this._contains(bounds, p)) {
        this._gesture = { mode: 'move', owner: this.objects, refs: refs.slice(), snapshots: refs.map(o => o.type === 'stroke' ? { ...o, points: o.points.map(q => ({ ...q })) } : { ...o }), bounds, x: p.x, y: p.y, changed: false };
      } else {
        this._select([]);
        this._gesture = { mode: 'lasso', owner: this.objects, points: [{ x: p.x, y: p.y }] };
      }
      this._refresh();
    }
    _clamped(bounds, dx, dy) {
      const width = this.overlay.width || 1600, height = this.overlay.height || 1000;
      dx = bounds.w <= width ? clamp(dx, -bounds.x, width - bounds.x - bounds.w) : clamp(dx, 40 - bounds.x - bounds.w, width - 40 - bounds.x);
      dy = bounds.h <= height ? clamp(dy, -bounds.y, height - bounds.y - bounds.h) : clamp(dy, 40 - bounds.y - bounds.h, height - 40 - bounds.y);
      return { dx, dy };
    }
    _translate(target, source, dx, dy) {
      if (source.type === 'stroke') target.points = source.points.map(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
      else {
        target.x = finite(source.x) + dx; target.y = finite(source.y) + dy;
        if (Number.isFinite(source.x2)) target.x2 = source.x2 + dx;
        if (Number.isFinite(source.y2)) target.y2 = source.y2 + dy;
      }
    }
    handleMove(event, p) {
      const g = this._gesture;
      if (!this.enabled || !g || !isPoint(p) || g.owner !== this.objects) return;
      if (g.mode === 'lasso') {
        const last = g.points[g.points.length - 1];
        if (Math.hypot(p.x - last.x, p.y - last.y) < 1) return;
        if (g.points.length >= 4000) g.points = g.points.filter((_, i) => i % 2 === 0);
        g.points.push({ x: p.x, y: p.y });
      } else {
        if (g.refs.some(o => !this.objects.includes(o))) { this.clear(); return; }
        const { dx, dy } = this._clamped(g.bounds, p.x - g.x, p.y - g.y);
        if (!g.changed && Math.abs(dx) + Math.abs(dy) < 1) return;
        if (!g.changed) { this.config.checkpoint?.(); g.changed = true; }
        g.refs.forEach((object, i) => this._translate(object, g.snapshots[i], dx, dy));
      }
      this._refresh();
    }
    handleUp() {
      const g = this._gesture;
      this._gesture = null;
      if (!g || g.owner !== this.objects) { this._refresh(); return; }
      if (g.mode === 'lasso') {
        const refs = [];
        if (g.points.length >= 3) for (const object of this.objects) {
          const b = this._bounds(object);
          if (!b) continue;
          let selected = inside({ x: b.x + b.w / 2, y: b.y + b.h / 2 }, g.points);
          if (!selected && object.type === 'stroke' && Array.isArray(object.points)) selected = object.points.some(p => isPoint(p) && inside(p, g.points));
          if (selected) refs.push(object);
        }
        this._select(refs);
      } else if (g.changed) { this.config.save?.(); this._notify(); }
      this._refresh();
    }
    duplicate() {
      const refs = this.selected, bounds = this.bounds(refs);
      if (!refs.length || !bounds) return [];
      this._gesture = null;
      const { dx, dy } = this._clamped(bounds, bounds.x + bounds.w + 50 <= (this.overlay.width || 1600) ? 50 : -50, bounds.y + bounds.h + 50 <= (this.overlay.height || 1000) ? 50 : -50);
      const copies = refs.map(object => { const copy = clone(object); this._translate(copy, copy, dx, dy); return copy; });
      this.config.checkpoint?.(); this.objects.push(...copies); this._select(copies);
      this.config.save?.(); this._refresh(); return copies;
    }
    remove() {
      const refs = this.selected;
      if (!refs.length) return false;
      const set = new Set(refs), objects = this.objects;
      this.config.checkpoint?.();
      for (let i = objects.length - 1; i >= 0; i--) if (set.has(objects[i])) objects.splice(i, 1);
      this._gesture = null; this._owner = null; this._refs = []; this._notify(); this.config.save?.(); this._refresh(); return true;
    }
    drawOverlay() {
      if (!this.enabled) return;
      const c = this.ctx, polygon = this._gesture?.mode === 'lasso' ? this._gesture.points : null;
      const rect = this.overlay.getBoundingClientRect?.();
      const scale = Math.max(.05, rect?.width > 0 && rect?.height > 0 ? Math.min(rect.width / (this.overlay.width || 1600), rect.height / (this.overlay.height || 1000)) : 1);
      c.save();
      try {
        c.strokeStyle = '#288d79'; c.lineWidth = 1.7 / scale; c.setLineDash([7 / scale, 5 / scale]);
        if (polygon?.length) {
          c.beginPath(); c.moveTo(polygon[0].x, polygon[0].y);
          for (let i = 1; i < polygon.length; i++) c.lineTo(polygon[i].x, polygon[i].y);
          if (polygon.length > 2) { c.closePath(); c.fillStyle = '#147d7210'; c.fill(); }
          c.stroke();
        }
        const b = this.bounds();
        if (b && this.selected.length) {
          const pad = 6 / scale;
          c.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);
          c.setLineDash([]); c.font = `${11 / scale}px system-ui, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'bottom'; c.fillStyle = '#288d79';
          c.fillText(this.selected.length + ' selected · drag / duplicate / delete', b.x, b.y - 10 / scale);
        }
      } finally { c.restore(); }
    }
  }
  root.LassoTool = LassoTool;
})(typeof window !== 'undefined' ? window : globalThis);
