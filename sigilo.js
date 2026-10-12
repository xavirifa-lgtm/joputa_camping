// «Que no se despierte nadie»: minijuego secreto del Joputa (v1.14).
// Lógica pura (sin DOM) para poder probarla con bots en Node.
// Coordenadas en píxeles; W = ancho del tablero, H = alto.
//
// Cruzas el camping de noche con el táper hasta tu nevera. Las linternas de los
// campistas desvelados giran como faros; las tiendas tapan la luz. Si una linterna
// te ilumina un rato (0,6 s), te pillan. Si pisas una lata, despiertas a todos.

export const LIMIT = 45;           // segundos
export const EXPOSE = 0.6;         // segundos de luz que aguantas (v1.15: más margen)

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };

export function makeWorld(rnd, W, H) {
  const R = W * 0.045;
  const start = { x: W / 2, y: H - R * 1.8 };
  const goal = { x: W / 2, y: R * 2.4 };
  const far = (p, list, d) => list.every((q) => dist(p, q) > d);
  // tiendas (tapan la luz y no se pueden atravesar)
  const tents = [];
  for (let i = 0; tents.length < 4 && i < 400; i += 1) {
    const big = rnd() < 0.4;   // algunas son caravanas: tapan más
    const t = { x: W * (0.12 + rnd() * 0.76), y: H * (0.18 + rnd() * 0.62), r: W * (big ? 0.095 : 0.075), kind: big ? 'caravana' : 'tienda' };
    if (far(t, [start, goal], W * 0.22) && far(t, tents, W * 0.26)) tents.push(t);
  }
  // linternas: faros que giran despacio, en zigzag de abajo arriba; nunca alcanzan la salida
  const first = rnd() < 0.5;
  const guards = [0.28, 0.5, 0.72].map((fy, i) => {
    const side = (i % 2 === 0) === first ? 0.24 : 0.76;
    const g = {
      x: W * (side + (rnd() - 0.5) * 0.08), y: H * fy + (rnd() - 0.5) * H * 0.03,
      a: rnd() * Math.PI * 2, w: (rnd() < 0.5 ? -1 : 1) * (0.7 + rnd() * 0.4),
      len: W * 0.36, half: 0.22,
    };
    const d = dist(g, start); const need = g.len + R * 2;
    if (d < need) { g.y -= need - d; }
    return g;
  });
  // latas en el suelo
  // dos latas en el camino recto: ir a lo loco no vale
  const cans = [0.36, 0.66].map((fy) => ({ x: W * (0.5 + (rnd() - 0.5) * 0.08), y: H * fy, r: W * 0.018 }))
    .filter((c) => tents.every((t) => dist(c, t) > t.r + W * 0.04));
  for (let i = 0; cans.length < 6 && i < 600; i += 1) {
    const c = { x: W * (0.06 + rnd() * 0.88), y: H * (0.12 + rnd() * 0.76), r: W * 0.018 };
    if (far(c, [start, goal], W * 0.16) && far(c, guards, W * 0.08) && tents.every((t) => dist(c, t) > t.r + W * 0.05) && far(c, cans, W * 0.12)) cans.push(c);
  }
  return { W, H, R, start, goal, tents, guards, cans, p: { ...start }, t: 0, expo: 0, best: 0, status: 'playing', speed: W * 0.3 };
}

// Distancia hasta donde llega un rayo de la linterna (las tiendas lo cortan)
export function rayLen(w, g, ang) {
  const dx = Math.cos(ang); const dy = Math.sin(ang); let L = g.len;
  for (const t of w.tents) {
    const fx = g.x - t.x; const fy = g.y - t.y;
    const b = fx * dx + fy * dy; const c = fx * fx + fy * fy - t.r * t.r;
    const disc = b * b - c;
    if (disc < 0) continue;
    const s = -b - Math.sqrt(disc);
    if (s > 0 && s < L) L = s;
  }
  return L;
}

export function isLit(w, p) {
  for (const g of w.guards) {
    const d = Math.hypot(p.x - g.x, p.y - g.y);
    if (d > g.len + w.R * 0.5) continue;
    const ang = Math.atan2(p.y - g.y, p.x - g.x);
    if (angDiff(ang, g.a) > g.half) continue;
    if (d - w.R * 0.5 < rayLen(w, g, ang)) return true;
  }
  return false;
}

// Avanza dt segundos moviéndose hacia target (o quieto si target es null)
export function step(w, target, dt) {
  if (w.status !== 'playing') return w.status;
  w.t += dt;
  for (const g of w.guards) g.a += g.w * dt;
  if (target) {
    const dx = target.x - w.p.x; const dy = target.y - w.p.y; const d = Math.hypot(dx, dy);
    if (d > 1) { const m = Math.min(d, w.speed * dt); w.p.x += (dx / d) * m; w.p.y += (dy / d) * m; }
  }
  // tiendas y bordes
  for (const t of w.tents) {
    const d = dist(w.p, t); const min = t.r + w.R * 0.8;
    if (d < min && d > 0) { w.p.x = t.x + ((w.p.x - t.x) / d) * min; w.p.y = t.y + ((w.p.y - t.y) / d) * min; }
  }
  w.p.x = Math.max(w.R, Math.min(w.W - w.R, w.p.x)); w.p.y = Math.max(w.R, Math.min(w.H - w.R, w.p.y));
  w.best = Math.max(w.best, (w.start.y - w.p.y) / (w.start.y - w.goal.y));
  if (w.cans.some((c) => dist(w.p, c) < c.r + w.R * 0.55)) return (w.status = 'lata');
  w.expo = isLit(w, w.p) ? w.expo + dt : Math.max(0, w.expo - dt * 0.5);
  if (w.expo >= EXPOSE) return (w.status = 'pillado');
  if (dist(w.p, w.goal) < w.R * 1.4) return (w.status = 'nevera');
  if (w.t >= LIMIT) return (w.status = 'tiempo');
  return w.status;
}

// Llegar: de 1 (en 15 s o menos) a 0,8 (en 45 s). No llegar: hasta 0,7 según lo avanzado.
export function score(w) {
  if (w.status === 'nevera') return Math.round((0.8 + 0.2 * Math.max(0, Math.min(1, (LIMIT - w.t) / 30))) * 100) / 100;
  return Math.round(0.7 * Math.max(0, Math.min(1, w.best)) * 100) / 100;
}

// Polígono iluminado de una linterna (para dibujar), recortado por las tiendas
export function beam(w, g, n = 18) {
  const pts = [[g.x, g.y]];
  for (let i = 0; i <= n; i += 1) {
    const a = g.a - g.half + (2 * g.half * i) / n; const L = rayLen(w, g, a);
    pts.push([g.x + Math.cos(a) * L, g.y + Math.sin(a) * L]);
  }
  return pts;
}
