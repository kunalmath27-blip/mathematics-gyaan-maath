(function (root) {
  'use strict';

  const EPS = 1e-9;
  const finite = Number.isFinite;
  const pointOK = p => !!p && finite(p.x) && finite(p.y);
  const pressure = p => Math.max(0, Math.min(1, finite(p.p) ? p.p : finite(p.pressure) ? p.pressure : 0.5));
  const strokeWidth = s => finite(s.width) && s.width > 0 ? s.width : 4;
  const samePoint = (a, b) => Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;

  function segmentHalfWidth(stroke, a, b) {
    const w = strokeWidth(stroke);
    return w * (stroke.tool === 'pen' ? 0.5 + (pressure(a) + pressure(b)) / 2 : 1) / 2;
  }

  function splitHalfWidth(stroke, a, b) {
    // A fragment's endpoint pressure is interpolated. Its renderer may use a
    // higher average pressure than the original long segment. The maximum
    // endpoint pressure bounds both new cap widths and keeps the gap clear.
    return strokeWidth(stroke) * (stroke.tool === 'pen' ? 0.5 + Math.max(pressure(a), pressure(b)) : 1) / 2;
  }

  function distanceToSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (!length) return Math.hypot(p.x - a.x, p.y - a.y);
    if (!finite(length)) return Infinity;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * (dx / length) + (p.y - a.y) * (dy / length)) / length));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  function pointRuns(points) {
    const runs = [];
    let run = [];
    for (const p of points) {
      if (pointOK(p)) run.push(p);
      else if (run.length) {runs.push(run); run = [];}
    }
    if (run.length) runs.push(run);
    return runs;
  }

  function hitStroke(stroke, p, radius = 0) {
    if (!stroke || stroke.type !== 'stroke' || !Array.isArray(stroke.points) || !pointOK(p) || !finite(radius) || radius < 0) return false;
    for (const run of pointRuns(stroke.points)) {
      if (run.length === 1) {
        if (Math.hypot(p.x - run[0].x, p.y - run[0].y) <= radius + strokeWidth(stroke) / 2) return true;
      } else for (let i = 1; i < run.length; i++) {
        if (distanceToSegment(p, run[i - 1], run[i]) <= radius + segmentHalfWidth(stroke, run[i - 1], run[i])) return true;
      }
    }
    return false;
  }

  function interpolate(a, b, t) {
    if (t <= EPS) return {...a};
    if (t >= 1 - EPS) return {...b};
    const p = {...a};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (finite(a[key]) && finite(b[key])) p[key] = a[key] + (b[key] - a[key]) * t;
    }
    p.x = a.x + (b.x - a.x) * t;
    p.y = a.y + (b.y - a.y) * t;
    p.p = pressure(a) + (pressure(b) - pressure(a)) * t;
    if ('pressure' in a || 'pressure' in b) p.pressure = p.p;
    return p;
  }

  // Return the portion [t0,t1] inside the eraser disk. The supplied radius
  // includes ink width, so sparse strokes erase between samples too.
  function cutInterval(a, b, p, radius) {
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    if (!length) return Math.hypot(a.x - p.x, a.y - p.y) <= radius ? [0, 1] : null;
    if (!finite(length)) return null;
    if (!finite(radius)) return [0, 1];
    const ux = dx / length, uy = dy / length;
    const vx = p.x - a.x, vy = p.y - a.y;
    const distance = Math.abs(vx * uy - vy * ux);
    // Tangency removes no positive-length part of the centreline.
    if (distance >= radius || radius <= 0) return null;
    const centre = (vx * ux + vy * uy) / length;
    const half = radius * Math.sqrt(Math.max(0, 1 - (distance / radius) ** 2)) / length;
    const lo = Math.max(0, centre - half), hi = Math.min(1, centre + half);
    return hi - lo > EPS ? [lo, hi] : null;
  }

  function splitStroke(stroke, p, radius) {
    const fragments = [];
    let changed = false;
    for (const run of pointRuns(stroke.points)) {
      if (run.length === 1) {
        if (Math.hypot(run[0].x - p.x, run[0].y - p.y) <= radius + strokeWidth(stroke) / 2) changed = true;
        else fragments.push(run);
        continue;
      }
      let current = [];
      const append = q => {
        if (!current.length || !samePoint(current[current.length - 1], q)) current.push(q);
      };
      const flush = () => {
        // Do not turn a cut boundary into a newly painted singleton dot.
        if (current.length > 1) fragments.push(current);
        current = [];
      };
      for (let i = 1; i < run.length; i++) {
        const a = run[i - 1], b = run[i];
        const interval = cutInterval(a, b, p, radius + splitHalfWidth(stroke, a, b));
        if (!interval) {append(a); append(b); continue;}
        changed = true;
        const [lo, hi] = interval;
        if (lo > EPS) {append(a); append(interpolate(a, b, lo));}
        flush();
        if (hi < 1 - EPS) {append(interpolate(a, b, hi)); append(b);}
      }
      flush();
    }
    return {changed, fragments: changed ? fragments.map(points => ({...stroke, points})) : [stroke]};
  }

  function erase(objects, p, radius, mode = 'stroke') {
    if (!Array.isArray(objects)) throw new Error('Board objects must be an array.');
    if (mode !== 'stroke' && mode !== 'segment') throw new Error('Choose stroke or segment erasing.');
    if (!pointOK(p) || !finite(radius) || radius < 0) return {changed: false, objects};
    let changed = false;
    const next = [];
    for (const object of objects) {
      // Images, PDF pages, graphs, text and geometric objects never enter the
      // ink eraser path. Legacy white eraser strokes remain ordinary ink here.
      // Locked ink stays intact, including when it sits under unlocked writing.
      if (object?.locked === true) {next.push(object); continue;}
      if (!hitStroke(object, p, radius)) {next.push(object); continue;}
      if (mode === 'stroke') {changed = true; continue;}
      const result = splitStroke(object, p, radius);
      changed = changed || result.changed;
      next.push(...result.fragments);
    }
    return {changed, objects: changed ? next : objects};
  }

  function snapStroke(stroke, options = {}) {
    if (!stroke || stroke.type !== 'stroke' || !Array.isArray(stroke.points) || !stroke.points.length || !stroke.points.every(pointOK)) throw new Error('Draw an ink stroke before converting it to a shape.');
    const mode = options.mode || 'line';
    if (!['line', 'rectangle', 'circle'].includes(mode)) throw new Error('Choose line, rectangle or circle.');
    const snapAngle = options.snapAngle === undefined ? 15 : options.snapAngle;
    if (!finite(snapAngle) || snapAngle < 0 || snapAngle > 180) throw new Error('Snap angle must be between 0° and 180°.');
    const points = stroke.points;
    let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
    for (const p of points) {xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x); ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y);}
    const shape = {type: mode, color: typeof stroke.color === 'string' ? stroke.color : '#243b3a', width: strokeWidth(stroke)};
    if (mode === 'line') {
      const a = points[0], b = points[points.length - 1];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (!(length > EPS && finite(length))) throw new Error('A line needs two distinct endpoints.');
      let angle = Math.atan2(b.y - a.y, b.x - a.x);
      if (snapAngle > 0) {const step = snapAngle * Math.PI / 180; angle = Math.round(angle / step) * step;}
      return {...shape, x: a.x, y: a.y, x2: a.x + length * Math.cos(angle), y2: a.y + length * Math.sin(angle)};
    }
    const w = xmax - xmin, h = ymax - ymin;
    if (!finite(w) || !finite(h)) throw new Error('Draw the shape within finite board coordinates.');
    if (mode === 'rectangle') {
      if (!(w > EPS && h > EPS)) throw new Error('A rectangle needs both width and height.');
      return {...shape, x: xmin, y: ymin, x2: xmax, y2: ymax};
    }
    const diameter = Math.max(w, h);
    if (!(diameter > EPS)) throw new Error('A circle needs a visible diameter.');
    const cx = xmin + w / 2, cy = ymin + h / 2;
    // Equal extents produce a genuine circle in the board's existing ellipse
    // renderer. This is an explicit geometry command, not handwriting OCR.
    return {...shape, x: cx - diameter / 2, y: cy - diameter / 2, x2: cx + diameter / 2, y2: cy + diameter / 2};
  }

  function drawPaper(ctx, options = {}) {
    const width = options.width === undefined ? 1600 : options.width;
    const height = options.height === undefined ? 1000 : options.height;
    const requestedSpacing = options.spacing === undefined ? 32 : options.spacing;
    if (![width, height, requestedSpacing].every(finite) || width <= 0 || height <= 0 || width > 32768 || height > 32768 || width * height > 268435456 || requestedSpacing <= 0) throw new Error('Use finite positive paper dimensions (up to 32768) and spacing.');
    const background = options.background || 'white', pattern = options.pattern || 'dots';
    const colors = {
      white: {paper: '#ffffff', marks: '#dce7db'},
      cream: {paper: '#fff9ec', marks: '#dfd5c0'},
      dark: {paper: '#16252b', marks: '#354c55'}
    };
    if (!Object.hasOwn(colors, background)) throw new Error('Choose white, cream or dark paper.');
    if (!['dots', 'grid', 'ruled', 'blank'].includes(pattern)) throw new Error('Choose dots, grid, ruled or blank paper.');
    if (!ctx || typeof ctx.save !== 'function') throw new Error('A 2D canvas context is required.');

    // Clamp work by spacing, then by indexed counts. Very small user-provided
    // spacing cannot turn an imported page into millions of drawing operations.
    let spacing = Math.max(4, requestedSpacing);
    if (pattern === 'dots') spacing = Math.max(spacing, Math.sqrt(width * height / 16000));
    else if (pattern !== 'blank') spacing = Math.max(spacing, (width + height) / 4000);
    let cols = Math.ceil(width / spacing), rows = Math.ceil(height / spacing);
    while (pattern === 'dots' && cols * rows > 20000) {spacing *= 1.05; cols = Math.ceil(width / spacing); rows = Math.ceil(height / spacing);}
    const offset = spacing * 0.75;

    ctx.save();
    try {
      ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.clip();
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors[background].paper;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = colors[background].marks;
      ctx.strokeStyle = colors[background].marks;
      ctx.lineWidth = 1;
      if (typeof ctx.setLineDash === 'function') ctx.setLineDash([]);
      if (pattern === 'dots') {
        let count = 0;
        for (let ix = 0; ix < cols && count < 20000; ix++) {
          const x = offset + ix * spacing;
          if (x >= width) break;
          for (let iy = 0; iy < rows && count < 20000; iy++) {
            const y = offset + iy * spacing;
            if (y >= height) break;
            ctx.beginPath(); ctx.arc(x, y, 0.9, 0, 2 * Math.PI); ctx.fill(); count++;
          }
        }
      } else if (pattern === 'grid' || pattern === 'ruled') {
        ctx.beginPath();
        if (pattern === 'grid') for (let ix = 0; ix < Math.min(cols, 4000); ix++) {
          const x = offset + ix * spacing;
          if (x >= width) break;
          ctx.moveTo(x, 0); ctx.lineTo(x, height);
        }
        for (let iy = 0; iy < Math.min(rows, 4000); iy++) {
          const y = offset + iy * spacing;
          if (y >= height) break;
          ctx.moveTo(0, y); ctx.lineTo(width, y);
        }
        ctx.stroke();
      }
    } finally {ctx.restore();}
    return {width, height, background, pattern, spacing, requestedSpacing};
  }

  root.InkTools = Object.freeze({hitStroke, erase, snapStroke, drawPaper});
})(typeof window !== 'undefined' ? window : globalThis);
