(function (root) {
  'use strict';

  const TAU = 2 * Math.PI;
  const DEFAULTS = Object.freeze({kind: 'circle', radius: 5, angle: 60, startAngle: 0, color: '#147d72', labels: true, fill: true});

  function finiteNumber(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(name + ' must be a finite number.');
    return value;
  }

  function format(value) {
    if (value === null) return 'undefined';
    if (Math.abs(value) < 1e-12) return '0';
    if (Math.abs(value) >= 1e6 || Math.abs(value) < 0.001) return value.toExponential(3).replace(/\.?(0+)(?=e)/, '');
    return Number(value.toFixed(3)).toString();
  }

  function info(options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('Geometry options must be an object.');
    const o = {...DEFAULTS, ...options};
    if (o.kind !== 'circle' && o.kind !== 'sector') throw new Error('Choose a circle or a sector.');
    const radius = finiteNumber(o.radius, 'Radius');
    if (!(radius > 0)) throw new Error('Radius must be greater than zero.');
    const angle = finiteNumber(o.angle, 'Angle');
    if (angle < 0 || angle > 360) throw new Error('Angle must be between 0° and 360°, inclusive.');
    const rawStart = finiteNumber(o.startAngle, 'Start angle');
    const startAngle = ((rawStart % 360) + 360) % 360;
    if (typeof o.color !== 'string' || !o.color.trim() || o.color.length > 128) throw new Error('Choose a valid drawing color.');
    const effectiveAngle = o.kind === 'circle' ? 360 : angle;
    const angleRad = effectiveAngle * Math.PI / 180;
    const circumference = TAU * radius;
    const isDegenerate = o.kind === 'sector' && angle === 0;
    const isFullCircle = effectiveAngle === 360;
    const arcLength = isDegenerate ? 0 : isFullCircle ? circumference : radius * angleRad;
    const area = isDegenerate ? 0 : radius * radius * (isFullCircle ? Math.PI : angleRad / 2);
    // A collapsed, zero-angle wedge has no enclosed 2D region. Do not call
    // the limiting value 2r its perimeter; show the radius only as a guide.
    const perimeter = isDegenerate ? null : isFullCircle ? circumference : arcLength + 2 * radius;
    if (![circumference, arcLength, area, ...(perimeter === null ? [] : [perimeter])].every(Number.isFinite)) {
      throw new Error('Radius is too large for finite geometry calculations.');
    }
    const title = o.kind === 'circle' ? 'Circle' : isDegenerate ? 'Zero-angle sector' : isFullCircle ? '360° sector · full circle' : format(angle) + '° circular sector';
    const boundaryNote = isDegenerate ? 'Degenerate sector: no enclosed region; perimeter is not reported.' : isFullCircle ? 'Full-circle boundary: circumference only; do not add two radii.' : 'Sector boundary = arc AB + OA + OB = arc length + 2r.';
    const result = {
      kind: o.kind, radius, angle, effectiveAngle, angleRad, startAngle,
      color: o.color, labels: o.labels !== false, fill: o.fill !== false,
      area, circumference, arcLength, perimeter, isDegenerate, isFullCircle,
      title, units: 'cm', boundaryNote,
      areaLabel: 'Area = ' + format(area) + ' cm²',
      circumferenceLabel: 'Circumference = ' + format(circumference) + ' cm',
      arcLengthLabel: 'Arc AB = ' + format(arcLength) + ' cm',
      perimeterLabel: perimeter === null ? 'Perimeter undefined for a 0° sector' : 'Perimeter = ' + format(perimeter) + ' cm'
    };
    result.summary = result.areaLabel + ' · ' + (o.kind === 'circle' ? result.circumferenceLabel : result.arcLengthLabel + ' · ' + result.perimeterLabel);
    return result;
  }

  function label(ctx, text, x, y, size = 18, color = '#244440', align = 'left') {
    ctx.font = size + 'px system-ui, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function segment(ctx, a, b, color, width = 2, dash = []) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function dot(ctx, p, color) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function draw(ctx, rect = {}, options = {}) {
    const g = info(options);
    if (!ctx || typeof ctx.save !== 'function') throw new Error('A 2D canvas context is required.');
    const r = {x: rect.x === undefined ? 0 : rect.x, y: rect.y === undefined ? 0 : rect.y, w: rect.w === undefined ? 640 : rect.w, h: rect.h === undefined ? 600 : rect.h};
    for (const name of ['x', 'y', 'w', 'h']) finiteNumber(r[name], 'Rectangle ' + name);
    if (!(r.w > 0 && r.h > 0)) throw new Error('Drawing rectangle must have positive width and height.');

    // Use a fixed mathematical layout and uniformly fit it inside the supplied
    // rectangle. This preserves circular geometry at every aspect ratio.
    const scale = Math.min(r.w / 640, r.h / 600);
    ctx.save();
    try {
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      ctx.fillStyle = '#fcfdfa';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.translate(r.x + (r.w - 640 * scale) / 2, r.y + (r.h - 600 * scale) / 2);
      ctx.scale(scale, scale);

      const C = {x: 320, y: 285}, R = 160;
      const start = g.startAngle * Math.PI / 180;
      const end = start + g.angleRad;
      const point = (theta, radius = R) => ({x: C.x + radius * Math.cos(theta), y: C.y - radius * Math.sin(theta)});
      const A = point(start), B = point(end);
      const muted = '#788d84', orange = '#b67836';

      label(ctx, g.title, 28, 29, 23, g.color);
      label(ctx, 'r = ' + format(g.radius) + ' cm' + (g.kind === 'sector' ? '  ·  θ = ' + format(g.angle) + '°' : '') + '  ·  rotation = ' + format(g.startAngle) + '° CCW', 28, 59, 15, muted);

      // A light full-circle guide makes the size of a major/minor sector clear.
      if (!g.isFullCircle) {
        ctx.beginPath();
        ctx.arc(C.x, C.y, R, 0, TAU);
        ctx.strokeStyle = '#d9e5de';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      if (g.isFullCircle) {
        ctx.arc(C.x, C.y, R, 0, TAU);
      } else if (g.isDegenerate) {
        ctx.moveTo(C.x, C.y);
        ctx.lineTo(A.x, A.y);
      } else {
        ctx.moveTo(C.x, C.y);
        ctx.lineTo(A.x, A.y);
        // Canvas y points down: negate both angles and sweep anticlockwise
        // to obtain positive, mathematical counterclockwise rotation.
        ctx.arc(C.x, C.y, R, -start, -end, true);
        ctx.closePath();
      }
      if (g.fill && !g.isDegenerate) {
        ctx.save();
        ctx.globalAlpha = 0.13;
        ctx.fillStyle = g.color;
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Full circles have no radial boundary; the dashed line is a radius guide.
      if (g.isFullCircle) segment(ctx, C, A, orange, 2, [6, 5]);

      if (g.labels) {
        dot(ctx, C, g.color);
        dot(ctx, A, g.color);
        if (!g.isFullCircle && !g.isDegenerate) dot(ctx, B, g.color);
        label(ctx, 'O', C.x - 17, C.y + 18, 19, g.color);

        const radiusLabel = point(start, R * 0.59);
        const normal = {x: Math.sin(start), y: Math.cos(start)};
        label(ctx, 'r = ' + format(g.radius) + ' cm', radiusLabel.x + normal.x * 17, radiusLabel.y + normal.y * 17, 16, orange, 'center');

        if (g.isFullCircle || g.isDegenerate) {
          const p = point(start, R + 25);
          label(ctx, 'A = B', p.x, p.y, 18, g.color, 'center');
        } else {
          const aLabel = point(start, R + 24), bLabel = point(end, R + 24);
          if (Math.hypot(A.x - B.x, A.y - B.y) < 42) {
            aLabel.x += Math.sin(start) * 20;
            aLabel.y += Math.cos(start) * 20;
            bLabel.x -= Math.sin(end) * 20;
            bLabel.y -= Math.cos(end) * 20;
          }
          label(ctx, 'A', aLabel.x, aLabel.y, 19, g.color, 'center');
          label(ctx, 'B', bLabel.x, bLabel.y, 19, g.color, 'center');
        }

        if (!g.isDegenerate) {
          const angleRadius = 43;
          ctx.beginPath();
          ctx.arc(C.x, C.y, angleRadius, -start, -end, true);
          ctx.strokeStyle = orange;
          ctx.lineWidth = 2;
          ctx.stroke();
          const tip = point(end, angleRadius);
          const direction = {x: -Math.sin(end), y: -Math.cos(end)};
          const side = {x: -direction.y, y: direction.x};
          ctx.beginPath();
          ctx.moveTo(tip.x, tip.y);
          ctx.lineTo(tip.x - direction.x * 10 + side.x * 4, tip.y - direction.y * 10 + side.y * 4);
          ctx.lineTo(tip.x - direction.x * 10 - side.x * 4, tip.y - direction.y * 10 - side.y * 4);
          ctx.closePath();
          ctx.fillStyle = orange;
          ctx.fill();
          const mid = point(start + g.angleRad / 2, 73);
          label(ctx, format(g.effectiveAngle) + '°', mid.x, mid.y, 17, orange, 'center');
        } else {
          const p = point(start, 55);
          label(ctx, '0°', p.x - normal.x * 20, p.y - normal.y * 20, 17, orange, 'center');
        }
      }

      if (g.kind === 'circle') {
        label(ctx, 'Area = πr² = ' + format(g.area) + ' cm²', 28, 509, 19, g.color);
        label(ctx, 'Circumference = 2πr = ' + format(g.circumference) + ' cm', 28, 540, 19, g.color);
        label(ctx, 'Dashed OA is a radius guide; A and B coincide.', 28, 572, 14, muted);
      } else if (g.isDegenerate) {
        label(ctx, 'Area = 0 cm²  ·  Arc AB = 0 cm', 28, 509, 19, g.color);
        label(ctx, 'No enclosed region · perimeter undefined', 28, 540, 18, orange);
        label(ctx, 'The collapsed radius is a guide, not a 2D boundary.', 28, 572, 14, muted);
      } else if (g.isFullCircle) {
        label(ctx, 'Area = πr² = ' + format(g.area) + ' cm²', 28, 509, 19, g.color);
        label(ctx, 'Arc = perimeter = 2πr = ' + format(g.perimeter) + ' cm', 28, 540, 19, g.color);
        label(ctx, 'Full-circle boundary: do not add two radii.', 28, 572, 14, muted);
      } else {
        label(ctx, 'Area = (θ / 360)πr² = ' + format(g.area) + ' cm²', 28, 509, 19, g.color);
        label(ctx, 'Arc AB = (θ / 360)2πr = ' + format(g.arcLength) + ' cm', 28, 540, 19, g.color);
        label(ctx, 'Perimeter = arc + 2r = ' + format(g.perimeter) + ' cm', 28, 572, 18, g.color);
      }
    } finally {
      ctx.restore();
    }
    return g;
  }

  root.GeometryTools = Object.freeze({draw, info});
})(typeof window !== 'undefined' ? window : globalThis);
