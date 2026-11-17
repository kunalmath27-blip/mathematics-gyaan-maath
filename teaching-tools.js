(function (global) {
  'use strict';
  const DEFAULT_COLOR = '#147d72';
  const LASER_LIFETIME = 900;
  const now = () => global.performance?.now ? global.performance.now() : Date.now();
  const requestFrame = global.requestAnimationFrame
    ? global.requestAnimationFrame.bind(global)
    : callback => global.setTimeout(() => callback(now()), 16);
  const cancelFrame = global.cancelAnimationFrame
    ? global.cancelAnimationFrame.bind(global)
    : global.clearTimeout.bind(global);

  function finitePoint(point) {
    return Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y) && Math.abs(point.x) <= 10000000 && Math.abs(point.y) <= 10000000);
  }

  function checkedRect(rect) {
    if (!rect || !['x', 'y', 'w', 'h'].every(key => Number.isFinite(rect[key])) || rect.w <= 0 || rect.h <= 0 || rect.w > 100000 || rect.h > 100000 || Math.abs(rect.x) > 10000000 || Math.abs(rect.y) > 10000000) {
      throw new Error('The instrument needs a finite, positive drawing box.');
    }
    return rect;
  }

  function line(context, x1, y1, x2, y2) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }

  function ruler(context, color) {
    context.fillStyle = 'rgba(241, 248, 231, 0.92)';
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.fillRect(20, 24, 960, 186);
    context.strokeRect(20, 24, 960, 186);
    const start = 70, span = 860;
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillStyle = color;
    context.font = '24px system-ui, sans-serif';
    // One hundred equal divisions: ten nominal centimetres, ten ticks per cm.
    for (let tick = 0; tick <= 100; tick++) {
      const x = start + span * tick / 100;
      const major = tick % 10 === 0;
      const length = major ? 65 : tick % 5 === 0 ? 48 : 30;
      context.lineWidth = major ? 2.4 : 1.2;
      line(context, x, 24, x, 24 + length);
      if (major) context.fillText(String(tick / 10), x, 101);
    }
    context.textAlign = 'left';
    context.font = '19px system-ui, sans-serif';
    context.fillText('cm · board scale (not actual size)', 70, 164);
    return { tickCount: 101, majorTickCount: 11, nominalCentimetres: 10 };
  }

  function protractor(context, color) {
    const cx = 500, cy = 510, radius = 440;
    context.fillStyle = 'rgba(234, 246, 237, 0.88)';
    context.strokeStyle = color;
    context.lineWidth = 2.4;
    context.beginPath();
    context.moveTo(cx - radius, cy);
    context.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
    context.lineTo(cx + radius, cy + 58);
    context.lineTo(cx - radius, cy + 58);
    context.closePath();
    context.fill();
    context.stroke();
    // Zero is the right-hand baseline; ninety is vertically above the centre.
    for (let degree = 0; degree <= 180; degree++) {
      const theta = degree * Math.PI / 180;
      const major = degree % 10 === 0;
      const length = major ? 56 : degree % 5 === 0 ? 38 : 21;
      const cos = Math.cos(theta), sin = Math.sin(theta);
      context.lineWidth = major ? 2.5 : 1.1;
      context.strokeStyle = color;
      line(context, cx + radius * cos, cy - radius * sin, cx + (radius - length) * cos, cy - (radius - length) * sin);
      if (major) {
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = color;
        context.font = '24px system-ui, sans-serif';
        context.fillText(String(degree), cx + 353 * cos, cy - 353 * sin);
        context.fillStyle = '#718779';
        context.font = '20px system-ui, sans-serif';
        context.fillText(String(180 - degree), cx + 305 * cos, cy - 305 * sin);
      }
    }
    context.strokeStyle = color;
    context.lineWidth = 2;
    line(context, cx - radius, cy, cx + radius, cy);
    line(context, cx - 19, cy, cx + 19, cy);
    line(context, cx, cy - 19, cx, cy + 19);
    context.beginPath();
    context.arc(cx, cy, 38, Math.PI, 2 * Math.PI);
    context.stroke();
    context.beginPath();
    context.fillStyle = color;
    context.arc(cx, cy, 4.5, 0, 2 * Math.PI);
    context.fill();
    context.font = '19px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('PROTRACTOR · degrees', cx, cy + 31);
    context.font = '17px system-ui, sans-serif';
    context.fillStyle = '#718779';
    context.fillText('Outer scale: 0° at right · inner scale: 0° at left', cx, 610);
    return { tickCount: 181, majorTickCount: 19, degrees: 180 };
  }

  function drawInstrument(context, rect, options = {}) {
    checkedRect(rect);
    const kind = options.kind || 'ruler';
    if (!['ruler', 'protractor'].includes(kind)) throw new Error('Choose a ruler or protractor.');
    const angle = options.angle === undefined ? 0 : Number(options.angle);
    if (!Number.isFinite(angle)) throw new Error('Instrument rotation must be a finite angle.');
    const color = typeof options.color === 'string' && options.color.length <= 100 ? options.color : DEFAULT_COLOR;
    const nativeWidth = 1000, nativeHeight = kind === 'ruler' ? 240 : 650;
    const rotation = (angle % 360) * Math.PI / 180;
    // Fit the rotated instrument inside the supplied selection box.
    const rotatedWidth = Math.abs(nativeWidth * Math.cos(rotation)) + Math.abs(nativeHeight * Math.sin(rotation));
    const rotatedHeight = Math.abs(nativeWidth * Math.sin(rotation)) + Math.abs(nativeHeight * Math.cos(rotation));
    const scale = Math.min(rect.w / rotatedWidth, rect.h / rotatedHeight);
    context.save();
    try {
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
      context.shadowBlur = 0;
      context.setLineDash?.([]);
      context.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      context.rotate(rotation);
      context.scale(scale, scale);
      context.translate(-nativeWidth / 2, -nativeHeight / 2);
      const details = kind === 'ruler' ? ruler(context, color) : protractor(context, color);
      return { kind, angle: angle % 360, ...details };
    } finally { context.restore(); }
  }

  class TeacherEffects {
    constructor({ render } = {}) {
      this._render = typeof render === 'function' ? render : () => {};
      this._trail = [];
      this._spot = null;
      this._lastPoint = null;
      this._frame = null;
      this._destroyed = false;
      this._tick = this._tick.bind(this);
    }

    _notify() {
      if (this._destroyed) return;
      try { this._render(); } catch (error) { global.console?.error('Teaching effect render failed:', error); }
    }

    _schedule() {
      if (!this._destroyed && this._frame === null && this._trail.length) this._frame = requestFrame(this._tick);
    }

    _tick() {
      this._frame = null;
      if (this._destroyed) return;
      const time = now();
      this._trail = this._trail.filter(point => time - point.time < LASER_LIFETIME);
      // Render once after the final point expires to erase its previous frame.
      this._notify();
      this._schedule();
    }

    laser(point) {
      if (this._destroyed || !finitePoint(point)) return false;
      const time = now();
      this._lastPoint = { x: point.x, y: point.y };
      this._trail = this._trail.filter(p => time - p.time < LASER_LIFETIME);
      this._trail.push({ ...this._lastPoint, time });
      if (this._trail.length > 192) this._trail.splice(0, this._trail.length - 192);
      this._notify();
      this._schedule();
      return true;
    }

    spotlight(point) {
      if (this._destroyed || (point !== undefined && !finitePoint(point))) return false;
      if (point) this._lastPoint = { x: point.x, y: point.y };
      this._spot = this._lastPoint ? { ...this._lastPoint } : { x: null, y: null };
      this._notify();
      return true;
    }

    clear() {
      if (this._destroyed) return;
      const hadEffect = this._trail.length || this._spot || this._frame !== null;
      if (this._frame !== null) cancelFrame(this._frame);
      this._frame = null;
      this._trail = [];
      this._spot = null;
      this._lastPoint = null;
      if (hadEffect) this._notify();
    }

    draw(context) {
      if (this._destroyed) return;
      const time = now();
      const trail = this._trail.filter(point => time - point.time < LASER_LIFETIME);
      if (!this._spot && !trail.length) return;
      context.save();
      try {
        context.globalAlpha = 1;
        context.globalCompositeOperation = 'source-over';
        context.shadowBlur = 0;
        context.setLineDash?.([]);
        if (this._spot) {
          const width = context.canvas?.width || 1600, height = context.canvas?.height || 1000;
          const x = this._spot.x === null ? width / 2 : this._spot.x;
          const y = this._spot.y === null ? height / 2 : this._spot.y;
          context.fillStyle = 'rgba(9, 26, 24, 0.66)';
          context.beginPath();
          context.rect(0, 0, width, height);
          context.moveTo(x + 140, y);
          context.arc(x, y, 140, 0, 2 * Math.PI, true);
          context.fill('evenodd');
          context.strokeStyle = 'rgba(255, 255, 255, 0.42)';
          context.lineWidth = 2;
          context.beginPath();
          context.arc(x, y, 140, 0, 2 * Math.PI);
          context.stroke();
        }
        if (trail.length) {
          context.lineCap = 'round';
          context.lineJoin = 'round';
          context.strokeStyle = '#f34b35';
          context.shadowColor = '#f34b35';
          context.shadowBlur = 12;
          for (let index = 1; index < trail.length; index++) {
            const a = trail[index - 1], b = trail[index];
            const opacity = Math.max(0, 1 - (time - b.time) / LASER_LIFETIME);
            context.globalAlpha = opacity * opacity;
            context.lineWidth = 5;
            line(context, a.x, a.y, b.x, b.y);
          }
          const last = trail[trail.length - 1];
          const opacity = Math.max(0, 1 - (time - last.time) / LASER_LIFETIME);
          context.globalAlpha = opacity * opacity;
          context.fillStyle = '#ff4932';
          context.beginPath();
          context.arc(last.x, last.y, 6, 0, 2 * Math.PI);
          context.fill();
          context.shadowBlur = 0;
          context.fillStyle = '#fff9e8';
          context.beginPath();
          context.arc(last.x, last.y, 2.2, 0, 2 * Math.PI);
          context.fill();
        }
      } finally { context.restore(); }
    }

    destroy() {
      if (this._destroyed) return;
      this.clear();
      this._destroyed = true;
      this._render = () => {};
    }
  }

  global.TeachingTools = Object.freeze({ drawInstrument });
  global.TeacherEffects = TeacherEffects;
})(window);
