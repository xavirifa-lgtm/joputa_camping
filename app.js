// Webapp del juego (el nombre se configura en config.js: GAME_NAME)
// Toda la lógica del juego vive en el servidor (funciones jp_*). Aquí solo se
// pinta el estado y se envían acciones.

import * as SIG from './sigilo.js';

const IMG = (n) => `img/${n}.webp`;
const GAME_NAME = window.JOPUTA_CONFIG?.GAME_NAME || 'El Joputa del Camping';
document.title = GAME_NAME;
const $app = document.getElementById('app');
const $sheet = document.getElementById('sheet-root');
const $toast = document.getElementById('toast');

const AVATARS = ['avatar_abuelo', 'avatar_gafas_sol', 'avatar_gorra', 'avatar_rulos',
  'avatar_tirantes', 'avatar_sombrero', 'avatar_bigote', 'avatar_auriculares',
  // v1.5: avatares del grupo
  'avatar_nina_pijama', 'avatar_gafas_cabeza', 'avatar_canoso_risa', 'avatar_moreno_chaqueta',
  'avatar_mono', 'avatar_rubia_sorpresa', 'avatar_canoso_gafas_sol', 'avatar_calvo_gafas', 'avatar_mono_tirantes',
  'avatar_gafas_granate', 'avatar_botellas', 'avatar_rizos_gafas', 'avatar_despeinado',
  'avatar_rizos_risa', 'avatar_gafas_rojo', 'avatar_mono_flores', 'avatar_rubia_gafas_rosa', 'avatar_calvo_collar',
  'avatar_barba', 'avatar_rizos_sudadera', 'avatar_abuelo_gafas', 'avatar_abuela_abrigo',
  'avatar_rizos_galleta', 'avatar_gafas_galleta', 'avatar_canosa_abrigo'];

// Centro de cada parcela del mapa, en % del ancho y alto de la imagen
const SPOTS = [[19.5, 9.4], [41.7, 8.0], [60.5, 8.0], [83.3, 9.4], [15.6, 20.3], [86.0, 21.1], [15.6, 29.8],
  [84.6, 29.8], [15.6, 61.0], [33.9, 61.0], [61.2, 59.6], [84.6, 60.3], [61.2, 72.7], [84.6, 73.4]];

const LEVELS = [[0, 'parcela_1_canadiense'], [40, 'parcela_2_iglu'], [120, 'parcela_3_caravana'], [250, 'parcela_4_bungalow']];

// minijuego secreto del Joputa: no está en GAMES (ni torneo, ni duelos, ni misión, ni Noticias)
const SECRET_GAMES = {
  sigilo: { name: 'Que no se despierte nadie', bg: 'bg_tienda', sprite: 'ico_decimo',
    hint: 'Arrastra el dedo para llevar el táper hasta tu nevera. Que no te pille ninguna linterna y no pises ninguna lata. Para el 90 tienes que llegar en 30 s.' },
};
const GAMES = {
  petanca: { name: 'Petanca', bg: 'bg_petanca', sprite: 'pt_bola_plata', hint: 'Tienes 3 bolas para arrimarte al boliche más que las 2 doradas del rival. Arrastra hacia atrás y suelta: cuanto más arrastras, más fuerte. Puedes bochar.' },
  aparcar: { name: 'Aparcar la caravana', bg: 'bg_tienda', sprite: 'ap_caravana', hint: 'Mete la caravana marcha atrás en la parcela. Ojo: hacia atrás, la caravana gira al revés que el volante. Sin tocar los setos ni la mesa; cada cono resta.' },
  tienda: { name: 'Montar el avance', bg: 'bg_tienda', sprite: 'mj_piqueta', hint: 'Clava las 6 piquetas del avance: dale al martillo cuando la marca esté en el verde. Dos martillazos buenos por piqueta; fuera del verde, se dobla.' },
  cafe: { name: 'Servir el café', bg: 'bg_cafe', sprite: 'mj_moka', hint: 'Quita la cafetera del fuego justo cuando suba el café (si esperas, se quema). Luego llena las 3 tazas hasta su raya manteniendo pulsado.' },
  mosquitos: { name: 'Cazar mosquitos', bg: 'bg_tienda', sprite: 'mj_raqueta', hint: 'Arrastra la raqueta eléctrica por la pantalla y fríe los mosquitos. Ojo con la vecina, que pasa de vez en cuando.' },
  hamacas: { name: 'Las hamacas', bg: 'bg_cafe', sprite: 'obj_toalla', hint: 'Como el Simón: mira el orden en que se iluminan las hamacas y repítelo. Cada ronda, una más.' },
  sardinas: { name: 'Sardinas a la plancha', bg: 'bg_pesca', sprite: 'sd_hecha', hint: 'Mueve la plancha para atrapar las sardinas. Tócalas para servirlas cuando estén doradas: si las dejas mucho, se queman.' },
  ruta: { name: 'La ruta del camping', bg: 'bg_tienda', sprite: 'ico_cartel', hint: 'Pasa por todas las parcelas de un solo trazo y por los carteles en orden (1, 2, 3…). Arrastra el dedo desde el 1.' },
  cotilleo: { name: 'Cotilleo exprés', bg: 'bg_cafe', sprite: 'rol_cotilla', hint: '5 preguntas sobre lo que ha pasado en el camping estos días. Cuanto antes contestes, más puntos.' },
  toallas: { name: 'Toallas en la piscina', bg: 'bg_tienda', sprite: 'obj_toalla', hint: 'Coloca todas las toallas en las tumbonas libres sin que sobre hueco. Toca una toalla, gírala si hace falta y toca dónde va.' },
  chiringuito: { name: 'La barra del chiringuito', bg: 'bg_cafe', sprite: 'ch_tinto', hint: 'Tres clientes a la vez. Arrastra hasta cada uno lo que pide (o toca la bebida y luego al cliente) antes de que se canse.' },
  sopa: { name: 'Sopa de letras', bg: 'bg_petanca', sprite: 'ico_pista', hint: 'Las palabras están escondidas: solo ves cuántas letras tienen. Van de izquierda a derecha, de arriba abajo o en diagonal ↘. Arrastra el dedo de la primera a la última letra.' },
  papelera: { name: 'Encestar en la papelera', bg: 'bg_tienda', sprite: 'obj_pista_falsificada', hint: 'Arrastra hacia atrás y suelta para lanzar la bola de papel. Ojo con el viento. 5 tiros.' },
  sombrilla: { name: 'Aguantar la sombrilla', bg: 'bg_pesca', sprite: 'mj_sombrilla', hint: 'Que no se vuele 15 s: inclina el móvil hacia el lado contrario del viento, o arrastra el dedo hacia ese lado.' },
};
const CAMPING_WORDS = ['Camping', 'Piscina', 'Hamaca', 'Toalla', 'Petanca', 'Sardina', 'Parcela', 'Caravana', 'Tienda', 'Café', 'Loro', 'Táper', 'Hoguera', 'Sombrilla', 'Linterna'];
const DRINKS = [['☕', 'Café solo'], ['🥛', 'Cortado'], ['🧊', 'Con hielo'], ['🍵', 'Manzanilla'], ['🍋', 'Limonada']];
const RULES_TRIVIA = [
  ['¿Cuánto cuesta asaltar a alguien?', '5 fichas', ['10 fichas', '20 fichas', 'Nada']],
  ['¿Cuántas acciones tienes al día?', '5', ['3', '7', '10']],
  ['¿Qué cobra el Joputa si nadie le pilla?', 'El táper', ['La hucha', 'Un megáfono', 'Nada']],
  ['¿Qué hace la toalla en la hamaca?', 'Bloquea un asalto', ['Roba fichas', 'Da una pista', 'Duplica tus fichas']],
  ['¿Cuánto paga quien acusa a un inocente?', '40 fichas', ['15 fichas', '100 fichas', 'Nada']],
  ['¿Cuánto roba una venganza?', 'El doble', ['La mitad', 'Lo mismo', 'Nada']],
  ['¿Cuándo se elige al Joputa?', 'En el café del sábado', ['El lunes a las 8', 'El domingo por la noche', 'Cuando alguien lo pide']],
  ['¿Cuántas fichas cobra cada uno en el café?', '40', ['20', '10', '100']],
  ['¿Qué hace el megáfono?', 'Descarta una réplica trampa', ['Duplica tu voto', 'Avisa a todos', 'Roba fichas']],
  ['¿Cuántas acusaciones tienes por semana?', 'Una', ['Dos', 'Tres', 'Las que quieras']],
];
// Palabra para la sopa: mayúsculas, sin tildes, espacios ni artículo inicial
const soupWord = (w) => {
  let x = w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const noArt = x.replace(/^(EL|LA|LOS|LAS)\s+/, '');
  x = (noArt.replace(/[^A-Z]/g, '').length >= 3 ? noArt : x).replace(/[^A-Z]/g, '');
  return x;
};
// Generador pseudoaleatorio con semilla: en un duelo los dos juegan exactamente la misma partida
const seeded = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const SHOP = [
  ['toalla', 50, 'Bloquea el próximo asalto (24 h). Visible.'],
  ['altavoz', 50, 'Alguien gana la mitad en minijuegos hoy.'],
  ['linterna', 60, 'Ves las fichas exactas de alguien.'],
  ['cortar_luz', 60, 'Alguien cobra la mitad en el café de hoy.'],
  ['mosquitos', 60, 'Alguien no puede jugar minijuegos hoy.'],
  ['descafeinado', 70, 'Trampa: quien te asalte pierde 20 (24 h).'],
  ['perro', 80, 'Quien te asalte pierde 10 y no roba (24 h).'],
  ['coartada', 120, 'Tu próximo asalto es anónimo.'],
  ['pista_falsificada', 300, 'Envía una pista falsa como si fuera del juego. 1 por semana en todo el camping.'],
];
const ITEM_NAMES = {
  toalla: 'Toalla en la hamaca', altavoz: 'Altavoz a tope', linterna: 'Linterna', cortar_luz: 'Cortar la luz',
  mosquitos: 'Enjambre de mosquitos', descafeinado: 'Descafeinado', perro: 'Perro del camping', coartada: 'Coartada',
  ampliar_nevera: 'Ampliar la nevera', pista_falsificada: 'Pista falsificada', megafono: 'Megáfono', punal: 'Puñal',
};
// Mecánicas que el administrador puede activar o desactivar en cada camping
const FEATURES = [
  ['complice', 'Cómplice y traiciones', 'Reclutar cómplice, chivarse y reparto del sábado.'],
  ['pase', 'Pasar el táper', 'El Joputa se lo quita de encima ganando «Que no se despierte nadie»: cobra el 30 % y otro pasa a ser el Joputa.'],
  ['pistas_falsas', 'Pistas falsas', 'La pista falsa del Joputa y la Pista falsificada de la tienda.'],
  ['eventos', 'Eventos semanales', 'Tormenta, inspección, fiesta, mercadillo, corte de agua y karaoke.'],
  ['retos', 'Retos diarios', 'Los 3 retos del día y el reto especial semanal.'],
  ['loro', 'El loro y sus burlas', 'Burlas al fallar un minijuego y réplicas.'],
  ['mision', 'Misión, hucha y hoguera', 'Misión semanal, sabotaje, hucha y hoguera del sábado.'],
  ['roles', 'Roles secretos', 'Cotilla, Socorrista y Alcalde.'],
  ['enfermeria', 'Enfermería', 'La trastada que deja a alguien sin votar.'],
  ['trastadas_camping', 'Trastadas del camping', 'Las 1-3 trastadas al azar que hace el propio camping.'],
  ['sospechas', 'Sospecha diaria', 'Señalar cada día a quien crees que es el Joputa; puntúa el sábado.'],
  ['torneo', 'Torneo del día', 'Cada día un minijuego: los 3 mejores cobran al café.'],
  ['duelos', 'Duelos', 'Retar a otro jugador a un minijuego con apuesta.'],
  ['cambio', 'Cambio de neveras', 'Final del sábado: 3 finalistas intercambian neveras y quien acabe con el táper, lo cobra.'],
];
const feat = (k) => S.st?.group.features?.[k] !== false;
const ROLE_IMG = { cotilla: 'rol_cotilla', socorrista: 'rol_socorrista', alcalde: 'rol_alcalde' };
const ROLE_NAME = { cotilla: 'el Cotilla', socorrista: 'el Socorrista', alcalde: 'el Alcalde' };
const TARGET_ITEMS = ['linterna', 'cortar_luz', 'altavoz', 'mosquitos'];

const TRASTADAS = {
  luz: { img: 'tr_cortar_luz', name: 'Cortar la luz', fx: 'Cobra la mitad en el café', d: 20 },
  colchon: { img: 'tr_colchon', name: 'Pinchar el colchón', fx: '1 acción menos', d: 20 },
  ropa: { img: 'tr_tendedero', name: 'Esconder la ropa', fx: 'Sin objetos ese día', d: 20 },
  piquetas: { img: 'tr_piquetas', name: 'Mover las piquetas', fx: 'Pierde sus defensas', d: 20 },
  saquear: { img: 'tr_saquear', name: 'Saquear', fx: '−30 % de sus fichas (máx. 60)', d: 40 },
  nevera: { img: 'tr_vaciar_nevera', name: 'Vaciar la nevera', fx: '−15 % de sus fichas (máx. 40)', d: 40 },
  enfermeria: { img: 'tr_enfermeria', name: 'A la enfermería', fx: 'No vota hasta mañana, pero le das 2 pistas', d: 60 },
};

const EFFECT_TEXT = {
  toalla: ['obj_toalla', 'Tienes la toalla puesta.'], perro: ['obj_perro', 'Tu perro vigila la parcela.'],
  descafeinado: ['obj_descafeinado', 'Tienes el descafeinado trampa preparado.'], coartada: ['obj_coartada', 'Tu próximo asalto será anónimo.'],
  luz: ['obj_cortar_luz', 'Te han cortado la luz: hoy cobras la mitad en el café.'], altavoz: ['obj_altavoz', 'Altavoz a tope: hoy ganas la mitad en minijuegos.'],
  mosquitos: ['obj_mosquitos', 'Mosquitos: no puedes jugar minijuegos hasta el café.'], sin_objetos: ['tr_tendedero', 'Te han escondido la ropa: hoy no puedes usar objetos.'],
  pillado: ['insignia_pillado', 'Te han pillado esta semana.'], chivato: ['insignia_chivato', 'Eres el chivato de la semana.'],
  enfermeria: ['tr_enfermeria', 'Estás en la enfermería: hasta el café de mañana no puedes acusar ni votar.'],
};

// --------------------------------------------------------------- estado
const S = {
  view: 'boot', groups: [], groupId: localStorage.getItem('joputa.group'), st: null, tab: 'camping',
  rank: 'hoy', offset: 0, email: '', codeSent: false, onboard: 'join', avatar: AVATARS[0], busy: false,
  sheet: null, tr: { kind: null, target: null }, rec: { target: null, share: 30 }, feedAll: false, duelStake: 20,
};
let api;

// ------------------------------------------------------------ utilidades
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tz = () => S.st?.group.tz || 'Europe/Madrid';
const fmtTime = (iso) => new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: tz() }).format(new Date(iso));
const fmtDay = (iso) => new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz() }).format(new Date(iso));
const serverNow = () => new Date(Date.now() + S.offset);
const player = (id) => S.st?.players.find((p) => p.id === id);
const levelImg = (pts) => LEVELS.filter(([min]) => pts >= min).pop()[1];

function toast(msg, err = false) {
  $toast.textContent = msg;
  $toast.className = 'show' + (err ? ' err' : '');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { $toast.className = ''; }, err ? 4200 : 3200);
}

function countdown() {
  if (!S.st) return '';
  const ms = new Date(S.st.clock.next_close) - serverNow();
  if (ms <= 0) return 'Café ya';
  const h = Math.floor(ms / 3600e3); const m = Math.floor((ms % 3600e3) / 60e3);
  return `☕ en ${h ? `${h} h ` : ''}${m} min`;
}

async function rpc(fn, args = {}, { quiet = false } = {}) {
  if (S.busy) return null;
  S.busy = true;
  try {
    const r = await api.rpc(fn, args);
    if (r?.msg && !quiet) toast(r.msg);
    return r;
  } catch (e) {
    toast(e.message || 'Algo ha fallado.', true);
    return null;
  } finally {
    S.busy = false;
  }
}

async function act(fn, args) {
  const r = await rpc(fn, { p_group: S.groupId, ...args });
  closeSheet();
  await refresh();
  return r;
}

async function refresh() {
  if (!S.groupId) return;
  try {
    const st = await api.rpc('jp_state', { p_group: S.groupId });
    S.st = st;
    S.offset = new Date(st.clock.now) - Date.now();
    render();
    if (S.sheet) openSheet(S.sheet.fn, ...S.sheet.args); // repinta la hoja con datos nuevos
  } catch (e) {
    toast(e.message, true);
    if (/No perteneces/.test(e.message)) { S.groupId = null; localStorage.removeItem('joputa.group'); await loadGroups(); }
  }
}

// ---------------------------------------------------------------- vistas
function render() {
  if (S.view === 'login') return renderLogin();
  if (S.view === 'onboard') return renderOnboard();
  if (S.view === 'game' && S.st) return renderGame();
}

function renderLogin() {
  $app.innerHTML = `
  <div class="hero"><img src="img/app_icon_192.png" alt=""><h1>${esc(GAME_NAME)}</h1>
    <p>Roba, desconfía y pilla al Joputa antes del café del sábado.</p></div>
  <main style="padding-bottom:40px">
    <div class="card">
      ${S.codeSent ? `
        <h2>Revisa tu correo</h2>
        <p class="muted">Te hemos enviado un código a <b>${esc(S.email)}</b>.</p>
        <form data-form="verify">
          <label class="field">Código<input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="10" required></label>
          <button class="btn green block">Entrar</button>
        </form>
        <button class="btn ghost block" style="margin-top:10px" data-act="resetLogin">Usar otro correo</button>` : `
        <h2>Entra con tu correo</h2>
        <p class="muted">Sin contraseñas: te enviamos un código.</p>
        <form data-form="sendCode">
          <label class="field">Correo<input name="email" type="email" autocomplete="email" required value="${esc(S.email)}"></label>
          <button class="btn block">Enviarme el código</button>
        </form>`}
    </div>
  </main>`;
}

function avatarPicker() {
  return `<div class="avatars">${AVATARS.map((a) => `
    <button type="button" data-act="pickAvatar" data-v="${a}" aria-pressed="${S.avatar === a}" aria-label="${a.replace('avatar_', '')}"><img src="${IMG(a)}" alt=""></button>`).join('')}</div>`;
}

function renderOnboard() {
  const code = new URLSearchParams(location.search).get('c') || '';
  $app.innerHTML = `
  <div class="hero"><img src="img/app_icon_192.png" alt=""><h1>${S.groups.length ? 'Otro camping' : '¡Bienvenido!'}</h1>
    <p>Únete al camping de tus amigos o abre uno nuevo.</p></div>
  <main style="padding-bottom:40px">
    <div class="seg" style="grid-template-columns:1fr 1fr">
      <button data-act="onboardTab" data-v="join" aria-pressed="${S.onboard === 'join'}">Unirme</button>
      <button data-act="onboardTab" data-v="create" aria-pressed="${S.onboard === 'create'}">Crear camping</button>
    </div>
    <form class="card" data-form="${S.onboard}">
      ${S.onboard === 'join'
        ? `<label class="field">Código de invitación<input name="code" required maxlength="6" style="text-transform:uppercase" value="${esc(code)}"></label>`
        : `<label class="field">Nombre del camping<input name="camp" required maxlength="40" placeholder="Camping Les Palmeres"></label>
           <label class="field">Hora del café (cierre del día)<input name="cafe" type="time" value="17:00" required></label>`}
      <label class="field">Tu nombre en el juego<input name="name" required maxlength="20"></label>
      <div class="field">Tu campista</div>
      ${avatarPicker()}
      <button class="btn green block">${S.onboard === 'join' ? 'Entrar al camping' : 'Abrir el camping'}</button>
    </form>
    ${S.groups.length ? '<button class="btn ghost block" data-act="backToGame">Volver</button>' : ''}
    <button class="btn ghost block" style="margin-top:10px" data-act="logout">Cerrar sesión</button>
  </main>`;
}

function renderGame() {
  const st = S.st; const me = st.me;
  const seenFeed = Number(localStorage.getItem(`joputa.seen.${S.groupId}`) || 0);
  const newFeed = st.feed.length && st.feed[0].id > seenFeed && S.tab !== 'feed';
  const voteDot = st.accusation?.can_vote && st.accusation.my_vote === null;
  const tabs = [['camping', 'parcela_1_canadiense', 'Camping'], ['jugar', 'ico_accion', 'Jugar'],
    ['pistas', 'ico_pista', 'Pistas', voteDot], ['feed', 'ico_aviso', 'Noticias', newFeed], ['ranking', 'ico_trofeo', 'Ranking']];
  $app.innerHTML = `
  <header class="topbar">
    <button class="camp" data-act="menu" style="background:none;border:0;padding:0;text-align:left">${esc(st.group.name)} ▾</button>
    <span class="cafe" id="countdown">${countdown()}</span>
    <div class="stats">
      <div class="stat"><img src="${IMG('ico_ficha')}" alt="Fichas"><span>${me.nevera + me.chiringuito}<small> fichas</small></span></div>
      <div class="stat"><img src="${IMG('ico_trofeo')}" alt="Puntos"><span>${st.players.find((p) => p.is_me)?.points_week ?? 0}<small> pts</small></span></div>
      <div class="stat"><img src="${IMG('ico_accion')}" alt="Acciones"><span>${me.actions_left}<small> acciones</small></span></div>
    </div>
  </header>
  ${st.test ? `<button class="banner testbar" data-act="sheetTest"><span>🧪 <b>Prueba</b> · ${esc(fmtDay(st.clock.now))}, ${esc(fmtTime(st.clock.now))}${st.test.acting ? ` · juegas como <b>${esc(st.me.name)}</b>` : ''}</span><span class="testbtn">Panel</span></button>` : ''}
  <main>${({ camping: viewCamping, jugar: viewJugar, pistas: viewPistas, feed: viewFeed, ranking: viewRanking })[S.tab]()}</main>
  <nav class="tabbar">${tabs.map(([k, ic, label, dot]) => `
    <button data-act="tab" data-v="${k}" aria-current="${S.tab === k ? 'page' : 'false'}">
      <img src="${IMG(ic)}" alt="">${label}${dot ? '<span class="dot"></span>' : ''}</button>`).join('')}</nav>`;
  if (S.tab === 'feed' && st.feed.length) localStorage.setItem(`joputa.seen.${S.groupId}`, st.feed[0].id);
}

function banners() {
  const st = S.st; const out = [];
  const bannerBtn = (cls, img, title, sub, tab = 'jugar') => `<button class="banner ${cls}" data-act="tab" data-v="${tab}" style="width:100%;text-align:left;font:inherit">
      <img src="${IMG(img)}" alt=""><div><b>${title}</b><div class="muted">${sub}</div></div></button>`;
  if (st.burla) {
    out.push(bannerBtn('parrot', 'insignia_chivato', 'El loro se está burlando de ti.', `Contéstale antes de las ${fmtTime(st.burla.expires)} y gana 30 fichas.`));
  }
  if (st.offer) {
    out.push(bannerBtn('night', 'rol_complice', `${esc(st.offer.from)} es el Joputa y te quiere de cómplice.`,
      `Te ofrece el ${st.offer.share} % del táper. Contesta antes de las ${fmtTime(st.offer.expires)}.`));
  }
  if (st.joputa && !st.joputa.caught) {
    out.push(bannerBtn('night', 'rol_joputa', 'Esta semana eres el Joputa.',
      `Táper: ${st.joputa.decimo} fichas · ${st.joputa.reparto ? 'decide el reparto antes del café' : st.joputa.tonight ? 'trastada lista para esta noche' : 'prepara la trastada de esta noche'}`));
  }
  if (st.complice && st.complice.active) {
    out.push(bannerBtn('night', 'rol_complice', `Eres el cómplice de ${esc(st.complice.joputa)}.`,
      st.complice.reparto ? 'Decide el reparto antes del café.' : `Tu parte: ${st.complice.share} % del táper. Que no te pillen.`));
  }
  if (st.ex_joputa) {
    out.push(bannerBtn('night', 'rol_joputa', 'Has pasado el táper.', 'Ya no eres el Joputa y ni tú sabes quién lo tiene. Disimula.'));
  }
  if (st.event) {
    const img = { tormenta: 'ev_tormenta', inspeccion: 'ev_inspeccion', fiesta: 'ev_fiesta', mercadillo: 'ev_mercadillo', corte_agua: 'ev_corte_agua', karaoke: 'ev_fiesta' }[st.event.kind];
    out.push(`<div class="banner event"><img src="${IMG(img)}" alt=""><div><b>Hoy en el camping</b><div class="muted">${esc(st.event.text)}</div></div></div>`);
  }
  if (st.accusation) {
    const a = st.accusation;
    out.push(bannerBtn('alert', 'ico_acusar', `${esc(a.accuser)} acusa a ${esc(a.accused)}.`,
      a.can_vote ? (a.my_vote === null ? 'Vota antes del café.' : `Has votado ${a.my_vote ? 'a favor' : 'en contra'}.`) : 'Se resuelve a la hora del café.', 'pistas'));
  }
  if (st.week.hoguera?.open) {
    out.push(bannerBtn('alert', 'ico_hoguera', `🔥 Hoy hay hoguera · hucha: ${st.week.hucha} fichas`,
      st.week.hoguera.my_vote ? 'Ya has votado. Puedes cambiarlo hasta el café.' : '¿Repartir o desterrar a alguien? Vota antes del café.', 'pistas'));
  }
  if (st.week.caught) {
    out.push(`<div class="banner"><img src="${IMG(st.week.chivato ? 'insignia_chivato' : 'insignia_pillado')}" alt=""><div><b>¡Pillado! ${esc(st.week.caught_name)} tenía el táper.</b>
      <div class="muted">${st.week.chivato ? 'Su cómplice se chivó. ' : ''}Esta semana ya no hay trastadas.</div></div></div>`);
  } else if (!st.week.has_joputa) {
    out.push(`<div class="banner"><img src="${IMG('ico_decimo')}" alt=""><div><b>Esta semana no hay Joputa.</b>
      <div class="muted">${st.players.length < st.group.min_players
        ? `Hacen falta ${st.group.min_players} campistas (sois ${st.players.length}). Comparte el código ${esc(st.group.invite_code)}.`
        : 'Se elegirá en la próxima semana.'}</div></div></div>`);
  }
  for (const e of st.me.effects) {
    const t = EFFECT_TEXT[e.kind]; if (!t || e.kind === 'pillado' || e.kind === 'chivato') continue;
    out.push(`<div class="banner" style="padding:6px 10px"><img src="${IMG(t[0])}" alt="" style="width:36px;height:36px"><div class="muted" style="color:var(--brown)">${t[1]}</div></div>`);
  }
  return out.join('');
}

function viewCamping() {
  const st = S.st;
  const onMap = st.players.slice(0, SPOTS.length);
  const rest = st.players.slice(SPOTS.length);
  const tile = (p, i) => {
    const [x, y] = SPOTS[i];
    return `<button class="parcel" style="left:${x}%;top:${y}%" data-act="player" data-v="${p.id}" aria-label="${esc(p.name)}">
      <img class="tile" src="${IMG(levelImg(p.points_total))}" alt="">
      <span class="badges">${p.chivato ? `<img src="${IMG('insignia_chivato')}" alt="chivato">` : ''}${p.toalla ? `<img src="${IMG('obj_toalla')}" alt="toalla">` : ''}${p.pillado ? `<img src="${IMG('insignia_pillado')}" alt="pillado">` : ''}${p.inocente ? `<img src="${IMG('ico_voto_si')}" alt="inocente">` : ''}</span></button>`;
  };
  const tag = (p, i) => {
    const [x, y] = SPOTS[i];
    const edge = x > 80 ? 'r' : x < 17 ? 'l' : '';
    return `<button class="tag ${edge} ${p.is_me ? 'me' : ''} ${p.is_vip ? 'vip' : ''} ${p.active ? '' : 'zz'}" style="left:${x}%;top:${y}%" data-act="player" data-v="${p.id}">
      <img src="${IMG(p.avatar)}" alt=""><span class="nm">${p.active ? '' : '💤 '}${esc(p.name)}</span></button>`;
  };
  return `${banners()}${S.st.clock.week_day <= 2 ? summaryCard() : ''}${campStrip()}
  <div class="map-wrap"><img class="map" src="img/mapa.webp" alt="Mapa del camping" width="768" height="1376">
    ${onMap.map(tile).join('')}${onMap.map(tag).join('')}</div>
  ${rest.length ? `<div class="overflow-list">${rest.map((p) => `<button class="btn ghost block" data-act="player" data-v="${p.id}"><img src="${IMG(p.avatar)}" alt="">${esc(p.name)}</button>`).join('')}</div>` : ''}
  <p class="muted" style="text-align:center;margin-top:10px">Toca una parcela para asaltar, vigilar o acusar. La etiqueta naranja es la Parcela VIP: ganó el día de ayer y asaltarle sale gratis.</p>`;
}

// Hucha del camping y misión de la semana (resumen)
function campStrip() {
  if (!feat('mision')) return '';
  const wk = S.st.week; const m = wk.mision;
  const pct = m ? Math.min(100, (m.progress / m.goal) * 100) : 0;
  return `<button class="strip" data-act="tab" data-v="jugar">
    <span class="hucha"><img src="${IMG('ico_hucha')}" alt="">Hucha <b>${wk.hucha}</b></span>
    ${m ? `<span class="mis"><span class="mis-name">${esc(m.name)}</span>
      <span class="meter"><i style="width:${pct}%"></i></span>
      <small>${m.status === 'cumplida' ? '¡Cumplida!' : m.status === 'fallida' ? 'Fracasada' : `${m.progress}/${m.goal} ${esc(m.unit)}`}</small></span>` : ''}</button>`;
}

function misionCard() {
  const m = S.st.week.mision; if (!m) return '';
  const pct = Math.min(100, (m.progress / m.goal) * 100);
  const game = GAMES[m.game];
  const status = m.status === 'cumplida' ? '<span class="chip green">¡Cumplida! +100 a la hucha</span>'
    : m.status === 'fallida' ? '<span class="chip red">Fracasada</span>'
    : `<span class="muted">Hasta el café del viernes (${fmtDay(m.deadline)})</span>`;
  return `<div class="section-title">Misión de la semana</div>
  <div class="card mision"><div class="row"><img src="${IMG(game.sprite)}" alt="" style="width:56px"><div class="grow">
    <b>${esc(m.name)}</b><div class="meter big"><i style="width:${pct}%"></i></div>
    <div class="muted">${m.progress} de ${m.goal} ${esc(m.unit)} · tú has aportado ${m.mine}${m.robadas ? ` · <b style="color:var(--danger)">robadas: ${m.robadas}</b>` : ''}</div></div></div>
    <p class="muted" style="margin-bottom:0">Juega a <b>${game.name}</b>: 1 ${esc(m.unit.replace(/s$/, ''))} con buena puntuación, 2 si es excelente. Si se cumple, la hucha sube 100 y quien más aporte gana 30 fichas. ${status}</p></div>`;
}

function torneoCard() {
  const t = S.st.torneo; if (!t || !t.game) return '';
  const g = GAMES[t.game]; const me = S.st.me;
  const mine = t.ranking.findIndex((x) => x.id === me.id);
  return `<div class="section-title">🏆 Torneo del día</div>
  <div class="card torneo"><div class="row"><img src="${IMG(g.sprite)}" alt="" style="width:56px"><div class="grow">
    <b>${g.name}</b><div class="muted">Cuenta tu mejor partida de hoy. Al café: 🥇 30 fichas y 3 puntos, 🥈 15 y 2, 🥉 5 y 1.</div></div>
    <button class="btn green" data-act="game" data-v="${t.game}" ${me.actions_left < 1 ? 'disabled' : ''}>Jugar</button></div>
    ${t.ranking.length ? `<ol class="rank small">${t.ranking.slice(0, 5).map((x, i) => `<li class="${x.id === me.id ? 'me' : ''}"><span class="pos">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span>${esc(x.name)}</span><span class="pts">${x.score}</span></li>`).join('')}</ol>` : '<p class="muted" style="margin:8px 0 0">Nadie ha jugado todavía. ¡Estrénalo!</p>'}
    ${mine > 4 ? `<p class="muted" style="margin:6px 0 0">Tú vas ${mine + 1}.º con ${t.ranking[mine].score}.</p>` : ''}</div>`;
}

function duelosCard() {
  const d = S.st.duels; if (!d) return '';
  const me = S.st.me;
  const inc = d.incoming.map((x) => `<div class="item-row"><img src="${IMG(player(x.from)?.avatar || 'ico_acusar')}" alt="" style="width:44px;height:44px">
      <div class="grow"><b>${esc(x.name)} te reta a ${esc(GAMES[x.game]?.name || x.game)}</b><div class="muted">${x.stake} fichas · ya ha jugado · hasta las ${fmtTime(x.expires)}</div></div>
      <button class="btn orange" data-act="duelAccept" data-v="${x.id}" ${me.actions_left < 1 || me.nevera + me.chiringuito < x.stake ? 'disabled' : ''}>Aceptar</button>
      <button class="btn ghost" data-act="duelDecline" data-v="${x.id}">Rajarse</button></div>`).join('');
  const out = d.outgoing.map((x) => `<div class="item-row"><img src="${IMG(player(x.to)?.avatar || 'ico_acusar')}" alt="" style="width:44px;height:44px">
      <div class="grow"><b>Esperando a ${esc(x.name)}</b><div class="muted">${esc(GAMES[x.game]?.name || x.game)} · ${x.stake} fichas · tu puntuación: ${x.score}</div></div></div>`).join('');
  return `<div class="section-title">🤠 Duelos</div>
  <div class="card duelos">${inc}${out}
    ${d.can_challenge ? `<button class="btn dark block" data-act="sheetDuel" ${me.actions_left < 1 ? 'disabled' : ''}>Retar a alguien (⚡1, apuesta de 10 a 50)</button>`
      : '<p class="muted" style="margin:6px 0 0">Hoy ya has retado a alguien. Mañana más.</p>'}
    <p class="muted" style="margin:8px 0 0">Eliges minijuego y apuesta, y juegas primero; tu puntuación queda en secreto. El retado juega exactamente la misma partida antes del café (o se raja). Gana la mejor puntuación y se lleva las dos apuestas.</p></div>`;
}

function sospechaCard() {
  const sp = S.st.sospecha; if (!sp) return '';
  const st = S.st; const me = st.me;
  const term = sp.termometro.filter((x) => player(x.id));
  const total = term.reduce((a, x) => a + x.n, 0) || 1;
  return `<div class="card sospecha"><h2>🤔 Tu sospecha de hoy</h2>
    <p class="muted" style="margin-top:0">Gratis y secreta. Señala a quien crees que es el Joputa; puedes cambiarla hasta el café. El sábado, +2 puntos por cada día que acertaste.</p>
    ${pickPlayers('sospechar', { exclude: [me.id], selected: sp.mine })}
    ${term.length ? `<h3 style="margin:14px 0 6px">🌡️ Termómetro de ayer</h3><p class="muted" style="margin:0 0 6px">De quién sospechaba el camping (sin nombres de quién votó).</p>
      ${term.map((x) => `<div class="sd"><span class="lbl">${esc(player(x.id).name)}</span><span class="bar"><b style="width:${(x.n / total) * 100}%"></b></span><span class="num">${x.n}</span></div>`).join('')}` : ''}</div>`;
}

function summaryCard() {
  const s = S.st.summary; if (!s || !s.lines?.length) return '';
  return `<div class="card summary"><h2>📋 Resumen de la semana</h2><ul>${s.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>`;
}

function secretRoleCard() {
  const r = S.st.secret_role; if (!r) return '';
  const extra = r.role === 'cotilla'
    ? (r.used ? '<p class="muted">Ya has cotilleado esta semana.</p>' : `<button class="btn dark block" data-act="sheetCotilla" ${S.st.me.actions_left < 1 ? 'disabled' : ''}>Cotillear a alguien (1 acción)</button>`)
    : r.role === 'socorrista' ? '<p class="muted">Haz guardia desde la parcela de cualquiera: te cuesta solo 1 acción.</p>'
    : '<p class="muted">Se nota al contar los votos: el resultado dirá que alguien votó doble.</p>';
  return `<div class="card secret"><div class="row"><img src="${IMG(ROLE_IMG[r.role])}" alt="" style="width:64px"><div class="grow">
    <h2>Rol secreto: ${ROLE_NAME[r.role]}</h2><p class="muted" style="margin:0">${esc(r.text)}</p></div></div>${extra}</div>`;
}

function sabotageBox(v) {
  const m = S.st.week.mision;
  if (!m || m.status !== 'abierta') return '';
  return `<h3 style="margin-top:14px">Sabotear la misión</h3>
    ${v.sabotage_available ? `<button class="btn dark block" data-act="sabotear" ${S.st.me.actions_left < 1 ? 'disabled' : ''}>Robar 2 ${esc(m.unit)} (1 acción)</button>` : `<p class="muted">${m.progress ? 'Hoy ya has saboteado, o ya van 3 sabotajes esta semana.' : 'Todavía no hay nada que robar.'}</p>`}
    <p class="muted">Todos verán a qué hora desaparecieron (y el Cotilla puede verte). Si la misión fracasa y has robado, el táper engorda 40.</p>`;
}

// Selector de trastada para esta noche (lo usan el Joputa y el cómplice)
function trastadaPicker(tonight, enfUsed) {
  const st = S.st;
  if (tonight) {
    return `<p>Esta noche: <b>${TRASTADAS[tonight.kind].name}</b> a <b>${esc(tonight.target)}</b> (a las 02:00).</p>
      <button class="btn dark block" data-act="cancelTrastada">Cancelar la trastada</button>`;
  }
  if (!st.clock.night_open) return '<p class="muted">Las trastadas se preparan entre las 02:00 y las 23:00.</p>';
  if (st.clock.week_day === 7) return '<p class="muted">La semana acaba con el café del sábado: ya no quedan noches.</p>';
  return `<p class="muted">Elige trastada y víctima para esta noche. Puedes elegirte a ti para despistar.</p>
    <div class="tr-grid">${Object.entries(TRASTADAS).filter(([k]) => !(k === 'enfermeria' && (enfUsed || !feat('enfermeria')))).map(([k, t]) => `
      <button data-act="trKind" data-v="${k}" aria-pressed="${S.tr.kind === k}"><img src="${IMG(t.img)}" alt="">
      <span>${t.name}</span><span class="${t.d >= 40 ? 'gorda' : ''}">+${t.d} táper${k === 'enfermeria' ? ' · 1/semana' : ''}</span></button>`).join('')}</div>
    ${S.tr.kind === 'enfermeria' ? '<p class="muted">La víctima no podrá acusar ni votar hasta el café de mañana… pero desde la camilla recordará dos pistas sobre ti.</p>' : ''}
    <div class="pick">${st.players.map((p) => `<button data-act="trTarget" data-v="${p.id}" aria-pressed="${S.tr.target === p.id}"><img src="${IMG(p.avatar)}" alt="">${esc(p.name)}</button>`).join('')}</div>
    <button class="btn orange block" style="margin-top:10px" data-act="scheduleTrastada" ${S.tr.kind && S.tr.target ? '' : 'disabled'}>Programar trastada</button>`;
}

function repartoBox(choice) {
  return `<h3 style="margin-top:14px">El reparto</h3>
    <p class="muted">Antes del café elegís en secreto. Si los dos repartís, cobráis lo pactado +20 %. Si uno se lo queda, se lo lleva todo. Si los dos os lo quedáis, el táper se pierde y pagáis 30 fichas cada uno.</p>
    <div class="btns two"><button class="btn green" data-act="reparto" data-v="repartir">${choice === 'repartir' ? '✔ ' : ''}Repartir</button>
      <button class="btn red" data-act="reparto" data-v="quedarse">${choice === 'quedarse' ? '✔ ' : ''}Quedármelo</button></div>
    <p class="muted">${choice ? `Ahora mismo: ${choice === 'repartir' ? 'repartir' : 'quedártelo'}. Si no eliges, cuenta como repartir.` : 'Si no eliges, cuenta como repartir.'}</p>`;
}

function burlaCard() {
  const b = S.st.burla; if (!b) return '';
  const total = S.st.me.nevera + S.st.me.chiringuito;
  return `<div class="card parrot"><div class="row"><img src="${IMG('insignia_chivato')}" alt="" style="width:72px"><div class="grow">
    <h2>¡El loro se burla de ti!</h2><p class="quote">«${esc(b.text)}»</p></div></div>
    <p class="muted">Elige la réplica que le dé la vuelta. Intentarlo cuesta 10 fichas; si aciertas, ganas 30 y el loro se queda sin palabras. Un solo intento, hasta las ${fmtTime(b.expires)}.</p>
    ${b.megafono_uses > 0 && !b.megafono_used ? `<button class="btn orange block" data-act="megafono" style="margin-bottom:10px"><img src="${IMG('obj_megafono')}" alt="">Usar megáfono: descarta una trampa (te quedan ${b.megafono_uses})</button>` : ''}
    ${b.megafono_used ? '<p class="muted">📣 Megáfono usado: una trampa menos.</p>' : ''}
    <div class="btns">${b.options.map((o) => `<button class="btn ghost reply" data-act="replica" data-v="${o.n}" ${total < 10 ? 'disabled' : ''}>${esc(o.text)}</button>`).join('')}</div></div>`;
}

function roleCards() {
  const st = S.st; let html = burlaCard();
  if (st.offer) {
    html += `<div class="card joputa"><div class="row"><img src="${IMG('rol_complice')}" alt="" style="width:72px"><div class="grow">
      <h2>Oferta secreta</h2><p class="muted" style="margin:0"><b style="color:#fff">${esc(st.offer.from)}</b> es el Joputa y te ofrece el <b style="color:var(--sun)">${st.offer.share} %</b> del táper por ser su cómplice. Caduca a las ${fmtTime(st.offer.expires)}.</p></div></div>
      <p class="muted">Si aceptas, haréis trastadas juntos y os repartiréis el táper el sábado (o no…). Si la rechazas, al menos ya sabes quién es.</p>
      <div class="btns two"><button class="btn green" data-act="offer" data-v="1">Aceptar</button><button class="btn ghost" data-act="offer" data-v="0">Rechazar</button></div></div>`;
  }
  const j = st.joputa;
  if (j) {
    if (j.caught) {
      html += `<div class="card joputa"><h2>Te han pillado</h2><p class="muted">Se acabaron las trastadas esta semana. La próxima, más disimulo.</p></div>`;
    } else {
      let comp = '';
      if (j.complice) {
        comp = `<h3 style="margin-top:14px">Tu cómplice</h3>
          <p>${esc(j.complice.name)} · ${j.complice.share} % del táper${j.complice.exposed ? ' · <b style="color:var(--orange)">descubierto, fuera del reparto</b>' : ''}</p>
          <p class="muted">No sabe cuánto vale el táper: puedes decirle lo que quieras. Si atacáis a la misma víctima la misma noche, la trastada suma el doble.</p>
`;
      } else if (j.offer) {
        comp = `<h3 style="margin-top:14px">Cómplice</h3><p class="muted">Oferta a ${esc(j.offer.to)} (${j.offer.share} %): ${{ pendiente: `pendiente hasta las ${fmtTime(j.offer.expires)}`, rechazada: 'rechazada. Sabe quién eres.', caducada: 'caducada. Sabe quién eres.', aceptada: 'aceptada' }[j.offer.status]}.</p>`;
      } else if (j.can_recruit) {
        comp = `<h3 style="margin-top:14px">Esta semana puedes reclutar un cómplice</h3>
          <p class="muted">Solo domingo y lunes, un único intento. Si te dice que no, sabrá quién eres.</p>
          <div class="pick">${st.players.filter((p) => !p.is_me).map((p) => `<button data-act="recTarget" data-v="${p.id}" aria-pressed="${S.rec.target === p.id}"><img src="${IMG(p.avatar)}" alt="">${esc(p.name)}</button>`).join('')}</div>
          <div class="seg" style="margin-top:10px;grid-template-columns:repeat(4,1fr)">${[20, 30, 40, 50].map((n) => `<button data-act="recShare" data-v="${n}" aria-pressed="${S.rec.share === n}">${n} %</button>`).join('')}</div>
          <button class="btn dark block" data-act="recruit" ${S.rec.target ? '' : 'disabled'}>Ofrecer el ${S.rec.share} % del táper</button>`;
      }
      html += `<div class="card joputa">
        <h2>Eres el Joputa</h2>
        <p class="muted">Haz al menos 3 trastadas o el sábado cobrarás solo la mitad. Llevas ${j.trastadas}.</p>
        <div class="decimo"><img src="${IMG('ico_decimo')}" alt="">${j.decimo} <small style="font-size:16px">fichas en el táper</small></div>
        ${j.reparto ? repartoBox(j.reparto.choice) : `<h3 style="margin-top:14px">Esta noche</h3>${trastadaPicker(j.tonight, j.enfermeria_used)}`}
        ${sabotageBox(j)}
        ${comp}
        ${paseBlock(j)}
        <h3 style="margin-top:14px">Pista falsa</h3>
        ${j.fake_available ? '<button class="btn dark block" data-act="sheetFake" data-v="joputa">Enviar una pista falsa</button>'
          : `<p class="muted">${j.fake_used ? 'Ya la has usado esta semana.' : 'Disponible a partir del miércoles.'}</p>`}
      </div>`;
    }
  }
  const c = st.complice;
  if (c) {
    if (!c.active) {
      html += `<div class="card joputa"><h2>Se acabó la alianza</h2><p class="muted">${c.exposed ? 'Te han descubierto: quedas fuera del reparto.' : 'El Joputa ha caído esta semana.'}</p></div>`;
    } else {
      html += `<div class="card joputa">
        <h2>Eres el cómplice</h2>
        <p class="muted">El Joputa es <b style="color:#fff">${esc(c.joputa)}</b>. Tu parte: ${c.share} % del táper. No sabes cuánto vale: solo lo que él te cuente.</p>
        ${c.reparto ? repartoBox(c.reparto.choice) : `<h3 style="margin-top:14px">Esta noche</h3>${trastadaPicker(c.tonight, c.enfermeria_used)}
          <p class="muted">Si atacáis a la misma víctima la misma noche, el táper suma el doble.</p>`}
        ${sabotageBox(c)}
        <h3 style="margin-top:14px">Coartada</h3>
        ${c.coartada_today ? '<p class="muted">Coartada activa: hoy nadie encuentra pistas del Joputa.</p>'
          : c.coartada_available ? '<button class="btn dark block" data-act="coartadaComplice">Dar coartada hoy (1 por semana)</button><p class="muted">Hasta el café, las investigaciones no encuentran pistas sobre el Joputa.</p>'
          : '<p class="muted">Ya la has usado esta semana.</p>'}
        <h3 style="margin-top:14px">Traición</h3>
        <button class="btn red block" data-act="sheetChivarse">Chivarme</button>
        <p class="muted">Destapas al Joputa al momento y te llevas el 60 % del táper… y la insignia de Chivato.</p>
      </div>`;
    }
  }
  html += secretRoleCard();
  if (st.ex_joputa) {
    html += `<div class="card joputa"><h2>Has pasado el táper</h2><p class="muted">Lo tiene un campista al azar, que ahora es el Joputa. Ni tú sabes quién es. Si le pillan, a ti no te pasa nada.</p></div>`;
  }
  return html;
}

function retosCard() {
  const r = S.st.retos; if (!r.length) return '';
  return `<div class="section-title">Retos de hoy</div><div class="card">${r.map((x) => `
    <div class="item-row"><img src="${IMG(x.done ? 'ico_voto_si' : x.code === 'especial' ? 'ico_trofeo' : 'ico_cartel')}" alt="" style="width:40px;height:40px">
      <div class="grow"><b style="${x.done ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(x.text)}</b><div class="muted">Premio: ${esc(x.reward)}</div></div>
      ${x.done ? '<span class="chip green">Hecho</span>' : ''}</div>`).join('')}</div>`;
}

function viewJugar() {
  const st = S.st; const me = st.me;
  const noActions = me.actions_left < 1;
  const mosq = me.effects.some((e) => e.kind === 'mosquitos');
  const agua = st.event?.kind === 'corte_agua';
  const noItems = me.effects.some((e) => e.kind === 'sin_objetos');
  const total = me.nevera + me.chiringuito;
  return `${roleCards()}
  ${torneoCard()}
  ${duelosCard()}
  ${misionCard()}
  ${retosCard()}
  <div class="section-title">Currar · 1 acción</div>
  ${mosq ? '<p class="muted">Los mosquitos no te dejan jugar hasta el café.</p>' : agua ? '<p class="muted">Corte de agua: hoy nadie puede jugar minijuegos.</p>' : ''}
  <div class="games">${Object.entries(GAMES).map(([k, g]) => `
    <button class="game" data-act="game" data-v="${k}" style="background-image:url(${IMG(g.bg)})" ${noActions || mosq || agua ? 'disabled' : ''}>
      <img src="${IMG(g.sprite)}" alt=""><span>${g.name}</span></button>`).join('')}</div>

  <div class="section-title">Investigar</div>
  <div class="card row"><img src="${IMG('ico_pista')}" alt="" style="width:56px"><div class="grow">
    <b>Husmear por el camping</b><div class="muted">1 acción · 40 % de encontrar una pista · 1 vez al día</div></div>
    <button class="btn blue" data-act="investigar" ${noActions || me.investigated_today ? 'disabled' : ''}>${me.investigated_today ? 'Hecho' : 'Ir'}</button></div>

  <div class="section-title">Tus objetos (${me.items.length}/3)</div>
  <div class="card">${me.items.length ? me.items.map((it) => `
    <div class="item-row"><img src="${IMG('obj_' + it.kind)}" alt=""><div class="grow"><b>${esc(it.name)}</b>${it.kind === 'megafono' ? `<div class="muted">${it.uses} usos · para replicar al loro</div>` : it.kind === 'punal' ? '<div class="muted">Tu voto a favor cuenta doble: en una acusación o en la hoguera</div>' : ''}</div>
      <button class="btn green" data-act="useItem" data-v="${it.id}" ${noActions || noItems ? 'disabled' : ''}>Usar</button></div>`).join('')
    : '<p class="muted" style="margin:0">No tienes objetos. Cómpralos, gánalos con retos o con una puntuación perfecta.</p>'}
    ${noItems ? '<p class="muted">Hoy no puedes usar objetos: te han escondido la ropa.</p>' : ''}</div>

  <div class="section-title">Tienda · 1 compra al día</div>
  <div class="shop">${SHOP.filter(([k]) => k !== 'pista_falsificada' || feat('pistas_falsas')).map(([k, price, desc]) => `
    <button data-act="buy" data-v="${k}" ${me.bought_today || me.items.length >= 3 || total < price ? 'disabled' : ''}>
      <img src="${IMG('obj_' + k)}" alt=""><b>${ITEM_NAMES[k]}</b>
      <span class="price"><img src="${IMG('ico_ficha')}" alt="">${price}</span><span class="muted" style="font-size:12px">${desc}</span></button>`).join('')}</div>
  ${me.bought_today ? '<p class="muted" style="text-align:center">Ya has comprado hoy. Vuelve mañana.</p>' : ''}`;
}

function viewPistas() {
  const st = S.st; const me = st.me; const a = st.accusation;
  const thisWeek = me.clues.filter((c) => c.this_week);
  const lastWeek = me.clues.filter((c) => !c.this_week);
  const canAccuse = st.week.has_joputa && !st.week.caught && !me.accusation_used && !a && !me.enfermeria;
  let accCard = '';
  if (a) {
    const accuser = player(a.accuser_id); const accused = player(a.accused_id);
    accCard = `<div class="card vote"><h2>Acusación abierta</h2>
      <div class="faces"><img src="${IMG(accuser.avatar)}" alt=""><span class="vs">acusa a</span><img src="${IMG(accused.avatar)}" alt=""></div>
      <p><b>${esc(a.accuser)}</b> cree que <b>${esc(a.accused)}</b> es el Joputa. Se resuelve a las ${fmtTime(a.closes_at)}.</p>
      ${me.enfermeria && a.can_vote ? '<p class="muted">Estás en la enfermería: hoy no puedes votar.</p>' : a.can_vote ? `<div class="btns two"><button class="btn green" data-act="vote" data-v="1" ${a.my_vote === true ? 'aria-pressed="true"' : ''}>${a.my_vote === true ? '✔ ' : ''}A favor${a.my_punal ? ' 🗡️×2' : ''}</button>
        <button class="btn red" data-act="vote" data-v="0" ${a.my_punal ? 'disabled' : ''}>${a.my_vote === false ? '✔ ' : ''}En contra</button></div>
        ${me.punales > 0 && !a.my_punal ? `<button class="btn dark block" style="margin-top:8px" data-act="votePunal"><img src="${IMG('obj_punal')}" alt="">A favor con puñal (cuenta doble, se gasta)</button>` : ''}
        <p class="muted" style="margin-bottom:0">Si aciertas: +5 puntos y parte del táper. Si es inocente, pagas 15 fichas. No votar cuenta como en contra; quien lleva 3 días sin entrar no cuenta.</p>`
        : `<p class="muted">${me.id === a.accuser_id ? 'Tu voto ya cuenta a favor.' : 'Te acusan a ti: defiéndete en el grupo.'}</p>`}</div>`;
  }
  const clue = (c) => `<div class="clue"><img src="${IMG(c.kind === 'exclusion' ? 'ico_voto_si' : 'ico_pista')}" alt="">
    <div><p>${esc(c.text)}</p><span class="muted">${fmtDay(c.at)}, ${fmtTime(c.at)}</span></div></div>`;
  return `${accCard}${hogueraCard()}${neverasCard()}${sospechaCard()}
  <div class="card"><div class="row"><img src="${IMG('rol_joputa')}" alt="" style="width:64px"><div class="grow">
    <h2>¿Quién es el Joputa?</h2>
    <p class="muted" style="margin:0">${!st.week.has_joputa ? 'Esta semana no hay Joputa.' : st.week.caught ? `Pillado: era ${esc(st.week.caught_name)}.`
      : me.accusation_used ? 'Ya has usado tu acusación de esta semana.' : 'Tienes una acusación por semana. Si fallas, pagas 40 fichas.'}</p></div></div>
    ${canAccuse ? '<button class="btn red block" style="margin-top:10px" data-act="sheetAccuse"><img src="img/ico_acusar.webp" alt="">Acusar a alguien</button>' : ''}
  </div>
  <div class="section-title">Tus pistas de esta semana</div>
  <div class="card">${thisWeek.length ? thisWeek.map(clue).join('') : '<p class="muted" style="margin:0">Aún no tienes pistas. Investiga o haz guardia por la noche.</p>'}</div>
  <p class="muted" style="padding:0 4px">Ojo: alguna pista puede ser falsa. El sábado se revela cuáles lo eran y quién las envió.</p>
  ${lastWeek.length ? `<div class="section-title">Semana pasada</div><div class="card" style="opacity:.75">${lastWeek.map(clue).join('')}</div>` : ''}`;
}

function paseBlock(j) {
  const p = j.pase; if (!p) return '';
  if (p.unlocked) return `<h3 style="margin-top:14px">🥡 Pasar el táper</h3>
    <p class="muted">${p.open ? `Lo tienes desbloqueado: cobras ${p.pay} fichas ya y el táper pasa a otro campista al azar, que se convierte en el Joputa. Hasta el jueves.` : 'Lo desbloqueaste, pero ya es tarde: desde el viernes no se puede.'}</p>
    ${p.open ? '<button class="btn dark block" data-act="sheetPase">Pasar el táper</button>' : ''}`;
  return `<h3 style="margin-top:14px">🥡 Pasar el táper</h3>
    <p class="muted">${p.open ? `Saca 90 o más en <b>Que no se despierte nadie</b>, tu minijuego secreto (no sale en Noticias), y podrás quitártelo de encima: cobras el 30 % y otro carga con él. Hasta el jueves, 3 intentos al día.` : 'Desde el viernes ya no se puede pasar el táper.'}</p>
    ${p.open && p.tries_left > 0 ? `<button class="btn block" data-act="game" data-v="sigilo"><img src="${IMG('ico_decimo')}" alt="">Que no se despierte nadie (⚡1 · ${p.tries_left} ${p.tries_left === 1 ? 'intento' : 'intentos'} hoy)</button>` : p.open ? '<p class="muted">Hoy ya no te quedan intentos.</p>' : ''}`;
}

function neverasCard() {
  const st = S.st; const n = st.neveras; if (!n) return '';
  const names = n.finalists.map((f) => `<b>${esc(f.name)}</b>`).join(', ');
  const nm = (id) => esc(n.finalists.find((f) => f.id === id)?.name || '?');
  const head = `<div class="card vote"><h2>📦 Cambio de neveras</h2><p>Finalistas: ${names}. Uno de los tres es el Joputa y el táper está en su nevera.</p>`;
  if (!n.open) return `${head}<p class="muted" style="margin:0">El sábado, hasta el café, cada finalista podrá intercambiar en secreto dos neveras. Al café el loro cantará los movimientos (el Joputa mueve el último) y quien tenga el táper, lo cobra.</p></div>`;
  if (!n.mine) return `${head}<p class="muted" style="margin:0">Los finalistas están decidiendo en secreto. Al café el loro cantará los movimientos y se verá en qué nevera acaba el táper.</p></div>`;
  const m = n.mine; const ids = n.finalists.map((f) => f.id); const pairs = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pairs.push(ids[j] === st.me.id ? [ids[j], ids[i]] : [ids[i], ids[j]]);
  pairs.sort((x, y) => (y[0] === st.me.id) - (x[0] === st.me.id));
  const sel = (a, b) => m.chosen && ((m.a === a && m.b === b) || (m.a === b && m.b === a));
  const mineTxt = !m.chosen ? 'Aún no has elegido (si no eliges, no tocas nada).' : m.a ? `Tu elección: cambiar la nevera de <b>${nm(m.a)}</b> con la de <b>${nm(m.b)}</b>.` : 'Tu elección: <b>no tocar nada</b>.';
  if (st.role === 'joputa') {
    const others = n.finalists.filter((f) => f.id !== st.me.id);
    const plan = m.chosen ? (m.b ? `Tu plan: si te lo han quitado, cambias tu nevera con la de <b>${nm(m.b)}</b>.` : 'Tu plan: <b>no tocar nada</b> pase lo que pase.') : 'Aún no has elegido (si no eliges, no tocas nada).';
    return `${head}<p>El táper está en <b>tu</b> nevera y tú mueves <b>el último</b>. Antes de mover, miras dentro: si sigue ahí, no tocas nada; si te lo han quitado, cambias tu nevera con la de quien creas que lo tiene.</p>
    <p>${plan} Puedes cambiarlo hasta las ${fmtTime(st.clock.next_close)}.</p>
    ${others.map((f) => `<button class="btn block" style="margin-bottom:6px" data-act="nevera" data-v="${st.me.id},${f.id}" ${m.chosen && m.b === f.id ? 'aria-pressed="true"' : ''}>${m.chosen && m.b === f.id ? '✔ ' : ''}Si me lo quitan, lo tiene ${esc(f.name)}</button>`).join('')}
    <button class="btn dark block" data-act="nevera" data-v="" ${m.chosen && !m.b ? 'aria-pressed="true"' : ''}>${m.chosen && !m.b ? '✔ ' : ''}No tocar nada pase lo que pase</button></div>`;
  }
  return `${head}<p>${st.role === 'joputa' ? 'El táper está en <b>tu</b> nevera y tú mueves <b>el último</b>, después de los otros dos. ¿Crees que te lo han quitado? Recupéralo… o no toques nada.' : '¿Dónde crees que está el táper? Muévelo a tu nevera… o no. Ojo: el Joputa mueve el último.'} Nadie ve lo que eligen los demás hasta el café.</p>
    <p>${mineTxt} Puedes cambiarlo hasta las ${fmtTime(st.clock.next_close)}.</p>
    ${pairs.map(([a, b]) => `<button class="btn block" style="margin-bottom:6px" data-act="nevera" data-v="${a},${b}" ${sel(a, b) ? 'aria-pressed="true"' : ''}>${sel(a, b) ? '✔ ' : ''}${a === st.me.id ? 'Mi nevera' : nm(a)} ⇄ ${b === st.me.id ? 'mi nevera' : nm(b)}</button>`).join('')}
    <button class="btn dark block" data-act="nevera" data-v="" ${m.chosen && !m.a ? 'aria-pressed="true"' : ''}>${m.chosen && !m.a ? '✔ ' : ''}No tocar nada</button></div>`;
}

function hogueraCard() {
  const st = S.st; const h = st.week.hoguera; if (!h) return '';
  const me = st.me; const mine = h.my_vote;
  const voted = mine === 'repartir' ? 'repartir la hucha' : mine ? `desterrar a ${esc(player(mine)?.name)}` : null;
  if (me.enfermeria) return `<div class="card vote hoguera"><h2>🔥 Hoguera del sábado</h2><p class="muted">Estás en la enfermería: hoy no puedes votar.</p></div>`;
  return `<div class="card vote hoguera"><div class="row"><img src="${IMG('ico_hoguera')}" alt="" style="width:64px"><div class="grow">
    <h2>🔥 Hoguera del sábado</h2><p class="muted" style="margin:0">Hucha: <b>${st.week.hucha} fichas</b> · ${h.votes} ${h.votes === 1 ? 'voto' : 'votos'} · cierra a las ${fmtTime(st.clock.next_close)}</p></div></div>
    <p>El Joputa sigue suelto. <b>Repartir</b>: la hucha a partes iguales entre todos, también para él. <b>Desterrar</b>: si acertáis, pierde el táper y la hucha es para los demás; si desterráis a un inocente, el Joputa se la lleva entera.</p>
    ${voted ? `<p>Tu voto: <b>${voted}</b>${h.my_punal ? ' 🗡️×2' : ''}. Puedes cambiarlo hasta el café.</p>` : ''}
    <button class="btn green block" data-act="hoguera" data-v="" ${mine === 'repartir' ? 'aria-pressed="true"' : ''}>${mine === 'repartir' ? '✔ ' : ''}Repartir la hucha</button>
    <p class="muted" style="margin:10px 0 4px">…o desterrar a:</p>
    ${pickPlayers('hoguera', { exclude: [me.id], selected: mine })}
    ${me.punales > 0 && !h.my_punal ? `<label class="check"><input type="checkbox" data-act="hogueraPunal" ${S.hogueraPunal ? 'checked' : ''}> Clavar el puñal: mi voto cuenta doble (se gasta)</label>` : ''}</div>`;
}

function viewFeed() {
  let lastDay = '';
  const all = S.feedAll;
  const items = S.st.feed.filter((e) => all || e.kind !== 'minijuego').map((e) => {
    const d = fmtDay(e.at);
    const head = d !== lastDay ? `<li class="day">${d}</li>` : '';
    lastDay = d;
    const wide = /^(tr_|ev_)/.test(e.icon || '');
    return `${head}<li class="${e.private ? 'private' : ''} ${wide ? 'wide' : ''}"><img src="${IMG(e.icon || 'ico_aviso')}" alt="">
      <div><span>${esc(e.text)}</span><time>${fmtTime(e.at)}${e.private ? ' · solo lo ves tú' : ''}</time></div></li>`;
  }).join('');
  return `<div class="seg" style="grid-template-columns:1fr 1fr"><button data-act="feedAll" data-v="0" aria-pressed="${!all}">Lo importante</button>
    <button data-act="feedAll" data-v="1" aria-pressed="${!!all}">Todo (con minijuegos)</button></div>
  <div class="card"><ul class="feed">${items || '<li>Todavía no ha pasado nada en el camping.</li>'}</ul></div>
  ${all ? '' : '<p class="muted" style="text-align:center">Quién jugó a qué también es una pista: míralo en «Todo».</p>'}`;
}

function viewRanking() {
  const st = S.st; const mode = S.rank;
  const key = { hoy: 'net_today', semana: 'points_week', mes: 'points_month' }[mode];
  const unit = mode === 'hoy' ? 'fichas' : 'pts';
  const list = [...st.players].sort((a, b) => b[key] - a[key]);
  const titles = st.titles;
  return `<div class="seg">${['hoy', 'semana', 'mes'].map((m) => `<button data-act="rank" data-v="${m}" aria-pressed="${mode === m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div>
  <div class="card"><p class="muted" style="margin-top:0">${mode === 'hoy' ? 'Fichas ganadas hoy. El primero al café gana 10 puntos y la Parcela VIP.' : mode === 'semana' ? 'Puntos de esta semana: 10, 7, 5, 3 y 1 por día, más acusaciones acertadas.' : 'Quien acabe el mes primero es el Campista del mes.'}</p>
    <ol class="rank">${list.map((p, i) => `<li class="${p.is_me ? 'me' : ''}"><span class="pos">${i + 1}</span><img src="${IMG(p.avatar)}" alt="">
      <span>${esc(p.name)}${p.is_vip ? ' <span class="chip">VIP</span>' : ''}</span><span class="pts">${p[key]} <small>${unit}</small></span></li>`).join('')}</ol></div>
  ${st.summary ? `<div class="section-title">Semana pasada</div>${summaryCard()}` : ''}
  ${st.yesterday.length ? `<div class="section-title">Ayer</div><div class="card"><ol class="rank">${st.yesterday.slice(0, 3).map((r) => `
    <li><span class="pos">${r.position}</span><img src="${IMG(player(r.player_id)?.avatar || 'avatar_abuelo')}" alt=""><span>${esc(r.name)}</span><span class="pts">${r.net} <small>fichas</small></span></li>`).join('')}</ol></div>` : ''}
  ${titles.length ? `<div class="section-title">Títulos</div><div class="titles">${titles.map((t) => `
    <div class="card"><img src="${IMG(t.kind === 'campista' ? 'cartel_campista_mes' : 'cartel_joputa_mes')}" alt="">
      <b>${t.kind === 'campista' ? 'Campista' : 'Joputa'} del mes</b><div>${esc(t.name)}</div>
      <div class="muted">${new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(t.month))} · ${t.value} ${t.kind === 'campista' ? 'pts' : 'fichas'}</div></div>`).join('')}</div>` : ''}`;
}

// ---------------------------------------------------------------- hojas
function openSheet(fn, ...args) {
  S.sheet = { fn, args };
  const html = SHEETS[fn](...args);
  if (!html) return closeSheet();
  $sheet.innerHTML = `<div class="sheet-backdrop" data-act="closeSheet"></div>
    <div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
}
function closeSheet() { S.sheet = null; $sheet.innerHTML = ''; }

const pickPlayers = (act, { exclude = [], selected = null, extra = '' } = {}) => `<div class="pick">${S.st.players
  .filter((p) => !exclude.includes(p.id)).map((p) => `<button data-act="${act}" data-v="${p.id}" ${extra} aria-pressed="${selected === p.id}">
  <img src="${IMG(p.avatar)}" alt="">${esc(p.name)}</button>`).join('')}</div>`;

const SHEETS = {
  player(id) {
    const st = S.st; const p = player(id); const me = st.me; if (!p) return '';
    const chips = [p.is_vip && '<span class="chip">Parcela VIP</span>', p.toalla && '<span class="chip blue">Toalla puesta</span>',
      p.inocente && '<span class="chip green">Inocente esta semana</span>', p.pillado && '<span class="chip red">Pillado</span>',
      p.chivato && '<span class="chip red">Chivato</span>',
      p.revenge && '<span class="chip red">Te asaltó: venganza = botín doble</span>',
      !p.active && `<span class="chip">💤 Sin entrar desde ${fmtDay(p.last_active)}</span>`].filter(Boolean).join(' ');
    const head = `<div class="sheet-head"><img src="${IMG(p.avatar)}" alt=""><div><h2>${esc(p.name)}</h2>
      <div>${chips}</div><div class="muted">Hoy: ${p.net_today} fichas · Semana: ${p.points_week} pts</div></div></div>`;
    if (p.is_me) {
      return `${head}<p>Esta es tu parcela. Tu caravana se va montando con los puntos: primero el avance, luego la barbacoa y las luces, y al final, la piscina y la parabólica.</p>
        <button class="btn ghost block" data-act="closeSheet">Cerrar</button>`;
    }
    const noAct = me.actions_left < 1;
    const asaltado = me.asaltados_hoy.includes(p.id);
    const items = me.items.filter((it) => TARGET_ITEMS.includes(it.kind));
    const noItems = me.effects.some((e) => e.kind === 'sin_objetos');
    const canAccuse = st.week.has_joputa && !st.week.caught && !me.accusation_used && !st.accusation && !p.inocente && !me.enfermeria;
    const guarding = me.guard_tonight === p.id;
    const canDuel = st.duels?.can_challenge && me.actions_left >= 1;
    const gCost = st.secret_role?.role === 'socorrista' ? 1 : 2;
    return `${head}<div class="btns">
      <button class="btn orange" data-act="asalto" data-v="${p.id}" ${noAct || asaltado ? 'disabled' : ''}>
        <img src="${IMG('ico_chiringuito')}" alt="">${asaltado ? 'Ya le has asaltado hoy' : p.revenge ? '¡Venganza! Asaltar (botín doble)' : 'Asaltarle'}
        <span class="cost">⚡1 · ${p.is_vip ? 'gratis' : '5 fichas'}</span></button>
      <button class="btn blue" data-act="guardia" data-v="${p.id}" ${me.actions_left < gCost || me.guard_tonight || !st.clock.night_open ? 'disabled' : ''}>
        <img src="${IMG('obj_linterna')}" alt="">${guarding ? 'Esta noche vigilas aquí' : 'Hacer guardia esta noche'}<span class="cost">⚡${gCost}</span></button>
      ${items.map((it) => `<button class="btn green" data-act="useOn" data-v="${it.id}" data-t="${p.id}" ${noAct || noItems ? 'disabled' : ''}>
        <img src="${IMG('obj_' + it.kind)}" alt="">Usar ${esc(it.name)}<span class="cost">⚡1</span></button>`).join('')}
      ${((st.joputa && !st.joputa.caught && !st.joputa.tonight && !st.joputa.reparto) || (st.complice && st.complice.active && !st.complice.tonight && !st.complice.reparto)) && st.clock.night_open && st.clock.week_day !== 7
        ? `<button class="btn dark" data-act="trFor" data-v="${p.id}"><img src="${IMG('rol_joputa')}" alt="">Trastada esta noche</button>` : ''}
      ${st.duels ? `<button class="btn dark" data-act="duelFor" data-v="${p.id}" ${canDuel ? '' : 'disabled'}><img src="${IMG('ico_trofeo')}" alt="">${st.duels.can_challenge ? 'Retarle a un duelo' : 'Hoy ya has retado a alguien'}<span class="cost">⚡1</span></button>` : ''}
      ${canAccuse ? `<button class="btn red" data-act="accuse" data-v="${p.id}"><img src="${IMG('ico_acusar')}" alt="">Acusarle de ser el Joputa</button>` : ''}
    </div>
    <p class="muted">${me.guard_tonight && !guarding ? 'Esta noche ya haces guardia en otra parcela. ' : ''}${!st.clock.night_open ? 'Las guardias se preparan entre las 02:00 y las 23:00. ' : ''}
      La guardia frustra la trastada del Joputa si viene a esta parcela, y te da una pista.</p>`;
  },
  target(itemId) {
    const it = S.st.me.items.find((i) => i.id === itemId); if (!it) return '';
    return `<h2>${esc(it.name)}</h2><p class="muted">¿Sobre quién?</p>
      ${pickPlayers('useOnPick', { exclude: [S.st.me.id], extra: `data-i="${itemId}"` })}`;
  },
  fake(mode, itemId, recipient) {
    const st = S.st; const title = mode === 'joputa' ? 'Pista falsa del Joputa' : 'Pista falsificada';
    if (!recipient) {
      return `<h2>${title}</h2><p class="muted">1. ¿Quién recibe la pista? Le llegará como si fuera del juego.</p>
        ${pickPlayers('fakeRecipient', { exclude: [st.me.id], extra: `data-m="${mode}" data-i="${itemId || ''}"` })}`;
    }
    return `<h2>${title}</h2><p class="muted">2. ¿A quién quieres que apunte? La pista será cierta para esa persona y, si se puede, falsa para el Joputa.</p>
      ${pickPlayers('fakeTarget', { exclude: [st.me.id], extra: `data-m="${mode}" data-i="${itemId || ''}" data-r="${recipient}"` })}
      <p class="muted">El sábado se revela quién la envió.</p>`;
  },
  accuse() {
    const st = S.st;
    return `<h2>Acusar</h2><p class="muted">Todos votan hasta el próximo café. Si el grupo te da la razón y aciertas: +5 puntos y la mitad del táper. Si fallas: −40 fichas.</p>
      ${pickPlayers('accuse', { exclude: [st.me.id, ...st.players.filter((p) => p.inocente).map((p) => p.id)] })}`;
  },
  confirmAccuse(id) {
    const p = player(id);
    return `<div class="sheet-head"><img src="${IMG(p.avatar)}" alt=""><div><h2>¿Acusar a ${esc(p.name)}?</h2>
      <div class="muted">Es tu única acusación de la semana.</div></div></div>
      <div class="btns two"><button class="btn ghost" data-act="closeSheet">Mejor no</button><button class="btn red" data-act="doAccuse" data-v="${id}">Acusar</button></div>`;
  },
  stats() {
    const d = S.stats; if (!d) return '';
    const max = Math.max(d.players, 1);
    const wd = ['', 'L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const ago = (iso) => { const h = (serverNow() - new Date(iso)) / 3600e3; return h < 1 ? 'hace un rato' : h < 24 ? `hace ${Math.floor(h)} h` : `hace ${Math.floor(h / 24)} d`; };
    return `<h2>Actividad del camping</h2>
      <p class="muted">${d.active_now} de ${d.players} campistas activos ahora (han abierto el juego en las últimas 72 h).</p>
      <h3>Últimos 14 días</h3>
      <div class="stats-days">${d.days.map((x) => `<div class="sd ${x.weekday >= 6 ? 'we' : ''}">
        <span class="lbl">${wd[x.weekday]} ${String(x.day).slice(8, 10)}</span>
        <span class="bar"><i style="width:${(x.opened / max) * 100}%"></i><b style="width:${(x.played / max) * 100}%"></b></span>
        <span class="num">${x.opened}/${d.players}</span></div>`).join('')}</div>
      <p class="muted" style="font-size:13px">Barra clara: abrieron el juego · oscura: hicieron algo (jugar, asaltar, investigar, comprar). Sábados y domingos, resaltados.</p>
      <table class="stats-tbl"><tr><th>Día</th><th>Minijuegos</th><th>Asaltos</th><th>Votos</th></tr>
        ${d.days.slice(0, 7).map((x) => `<tr><td>${wd[x.weekday]} ${String(x.day).slice(8, 10)}</td><td>${x.minijuegos}</td><td>${x.asaltos}</td><td>${x.votos}</td></tr>`).join('')}</table>
      <h3>Por campista</h3>
      ${d.per_player.map((p) => `<div class="item-row"><img src="${IMG(p.avatar)}" alt="" style="width:40px;height:40px">
        <div class="grow"><b>${p.active ? '' : '💤 '}${esc(p.name)}</b><div class="muted">${ago(p.last_active)} · ${p.days_14} de 14 días</div></div></div>`).join('')}
      <button class="btn block" data-act="closeSheet" style="margin-top:10px">Cerrar</button>`;
  },
  words() {
    const g = S.st.group;
    return `<h2>Palabras de la sopa de letras</h2>
      <p class="muted">Una por línea (o separadas por comas), de 3 a 16 letras. En cada partida salen hasta 4 de estas y el resto, palabras del camping. Tildes, espacios y un «el/la» inicial se quitan al buscarlas.</p>
      <textarea id="wordsBox" rows="9" class="words-box">${esc((g.words || []).join('\n'))}</textarea>
      <div class="btns two"><button class="btn ghost" data-act="closeSheet">Cancelar</button><button class="btn green" data-act="saveWords">Guardar</button></div>`;
  },
  features() {
    const g = S.st.group;
    return `<h2>Mecánicas del camping</h2>
      <p class="muted">Solo tú, como administrador, ves esta pantalla. Los cambios se anuncian en Noticias. Lo básico (minijuegos, asaltos, el Joputa, pistas y acusaciones) siempre está activo.</p>
      ${FEATURES.map(([k, name, desc]) => `<label class="toggle"><span><b>${name}</b><small class="muted">${desc}</small></span>
        <input type="checkbox" data-act="feature" data-v="${k}" ${g.features[k] ? 'checked' : ''}></label>`).join('')}
      <p class="muted">Al apagar algo se para al momento. Al encenderlo: los roles se reparten enseguida; los eventos y las trastadas del camping vuelven la semana siguiente.</p>
      <button class="btn block" data-act="closeSheet">Hecho</button>`;
  },
  testCreate() {
    return `<h2>🧪 Crear camping de prueba</h2>
      <p class="muted">Un camping solo para ti, con jugadores de prueba (bots), su propio reloj que puedes adelantar y sin avisos al móvil. No afecta a los campings de verdad.</p>
      <label class="field">Nombre<input id="testName" value="Pruebas" maxlength="30"></label>
      <label class="field">Jugadores de prueba<select id="testBots">${[3, 5, 6, 8, 10].map((n) => `<option ${n === 6 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <button class="btn green block" data-act="testCrear">Crear</button>`;
  },
  test() {
    const st = S.st; const t = st.test; if (!t) return '<p>Esto no es un camping de prueba.</p>';
    const nm = (id) => esc(player(id)?.name || '—');
    return `<h2>🧪 Panel de pruebas</h2>
      <p>Reloj del camping: <b>${esc(fmtDay(st.clock.now))}, ${esc(fmtTime(st.clock.now))}</b> (adelantado ${t.offset_h} h). Café a las ${esc(st.group.cafe_time)}.</p>
      <div class="btns two"><button class="btn" data-act="testTiempo" data-v="hora">+1 hora</button><button class="btn" data-act="testTiempo" data-v="noche">Ir a la noche (02:05)</button></div>
      <div class="btns two" style="margin-top:8px"><button class="btn" data-act="testTiempo" data-v="cafe">Ir al café ☕</button><button class="btn" data-act="testTiempo" data-v="dia">+1 día</button></div>
      <p class="muted">Al adelantar el reloj se procesa todo lo que habría pasado: trastadas a las 02:00, cierres del día, sábados… Los bots siguen contando como activos.</p>
      <h3>Bots</h3>
      <div class="btns two"><button class="btn green" data-act="testBots">Que jueguen los bots</button><button class="btn ghost" data-act="testBot">Añadir un bot</button></div>
      <p class="muted">Cada bot juega minijuegos, asalta, investiga, vota y, si es el Joputa, prepara trastada. Hazlo antes de adelantar el reloj para que pasen cosas.</p>
      <h3>Esta semana</h3>
      <p>Joputa: <b>${nm(t.joputa)}</b>${t.complice ? ` · cómplice: <b>${nm(t.complice)}</b>` : ''}${t.caught ? ' · <b>pillado</b>' : ''}</p>
      <p class="muted" style="margin-bottom:4px">Hacer Joputa a:</p>
      ${pickPlayers('testJoputa', { selected: t.joputa })}
      <h3>Jugar como</h3>
      <p class="muted" style="margin-bottom:4px">Ves y juegas el camping como esa persona (para probar el Joputa, el cómplice, los roles…).</p>
      ${pickPlayers('testActuar', { selected: t.acting || t.own })}
      <h3>Minijuegos</h3>
      <button class="btn block" data-act="sheetTestGames">🎮 Probar todos los minijuegos</button>
      <h3>Borrar</h3>
      <button class="btn red block" data-act="testBorrar">Borrar este camping de prueba</button>`;
  },
  testGames() {
    const all = [...Object.entries(GAMES), ...Object.entries(SECRET_GAMES)];
    return `<h2>🎮 Probar minijuegos</h2>
      <p class="muted">Partidas de prueba: no gastan acciones, no dan fichas y no cuentan para nada. Al acabar ves la puntuación (0-100).</p>
      <div class="btns">${all.map(([k, g]) => `<button class="btn ghost block" data-act="practice" data-v="${k}"><img src="${IMG(g.sprite)}" alt="">${esc(g.name)}${SECRET_GAMES[k] ? ' (secreto del Joputa)' : ''}</button>`).join('')}</div>`;
  },
  testBorrar() {
    return `<h2>¿Borrar el camping de prueba?</h2><p>Se borra todo: jugadores de prueba, historial y puntos. No se puede deshacer.</p>
      <div class="btns two"><button class="btn ghost" data-act="sheetTest">Mejor no</button><button class="btn red" data-act="testBorrarOk">Borrar</button></div>`;
  },
  avatar() {
    const cur = S.st.me.avatar;
    return `<h2>Elige tu avatar</h2>
      <div class="avatars" style="max-height:60vh">${AVATARS.map((a) => `<button type="button" data-act="setAvatar" data-v="${a}" aria-pressed="${a === cur}"><img src="${IMG(a)}" alt=""></button>`).join('')}</div>`;
  },
  duel(target) {
    const st = S.st;
    if (!target) {
      return `<h2>🤠 ¿A quién retas?</h2>${pickPlayers('duelFor', { exclude: [st.me.id] })}`;
    }
    const p = player(target); const total = st.me.nevera + st.me.chiringuito;
    return `<div class="sheet-head"><img src="${IMG(p.avatar)}" alt=""><div><h2>Duelo con ${esc(p.name)}</h2>
      <div class="muted">Juegas tú primero; tu puntuación queda en secreto hasta que ${esc(p.name)} juegue la misma partida. Gana la mejor y se lleva las dos apuestas.</div></div></div>
      <h3 style="margin:12px 0 6px">Apuesta</h3>
      <div class="seg" style="grid-template-columns:repeat(5,1fr)">${[10, 20, 30, 40, 50].map((n) => `<button data-act="duelStake" data-v="${n}" aria-pressed="${S.duelStake === n}" ${total < n ? 'disabled' : ''}>${n}</button>`).join('')}</div>
      <h3 style="margin:12px 0 6px">Minijuego</h3>
      <div class="duel-games">${[['azar', '🎲', 'Al azar'], ...Object.entries(GAMES).map(([k, gm]) => [k, `<img src="${IMG(gm.sprite)}" alt="">`, gm.name])].map(([k, ic, nm]) =>
        `<button data-act="duelGame" data-v="${k}" aria-pressed="${(S.duelGame || 'azar') === k}"><span class="ic">${ic}</span><span>${nm}</span></button>`).join('')}</div>
      <button class="btn orange block" style="margin-top:12px" data-act="duelGo" data-v="${target}">🤠 Retar por ${S.duelStake} fichas</button>`;
  },
  cotilla() {
    return `<h2>Cotillear</h2><p class="muted">Verás todo lo que hizo ayer: a quién asaltó, a qué jugó, si usó objetos, investigó, compró o tocó la misión. Solo una vez esta semana.</p>
      ${pickPlayers('cotillear', { exclude: [S.st.me.id] })}`;
  },
  pase() {
    const j = S.st.joputa;
    return `<h2>¿Pasar el táper?</h2>
      <p>Cobras ahora el 30 % del táper (${j.pase.pay} fichas) y el resto pasa a un campista al azar, que se entera y se convierte en el Joputa.</p>
      <p class="muted">Ni tú sabrás quién lo tiene. Si le pillan, a ti no te pasa nada; si llega al sábado, cobra él. Tú ya no podrás hacer trastadas${j.complice ? ` y tu pacto con ${esc(j.complice.name)} se rompe` : ''}.</p>
      <div class="btns two"><button class="btn ghost" data-act="closeSheet">Mejor no</button><button class="btn dark" data-act="doPase">Pasar el táper</button></div>`;
  },
  chivarse() {
    const c = S.st.complice;
    return `<h2>¿Chivarte de ${esc(c.joputa)}?</h2>
      <p>Todo el camping sabrá al momento que es el Joputa. Tú te llevas el 60 % del táper y la insignia de Chivato hasta que acabe la semana.</p>
      <p class="muted">No hay vuelta atrás.</p>
      <div class="btns two"><button class="btn ghost" data-act="closeSheet">Mejor no</button><button class="btn red" data-act="doChivarse">Chivarme</button></div>`;
  },
  menu() {
    const st = S.st; const g = st.group;
    const link = `${location.origin}${location.pathname}?c=${g.invite_code}`;
    return `<h2>${esc(g.name)}</h2>
      <p>Código de invitación: <b style="font-size:22px;letter-spacing:.1em">${esc(g.invite_code)}</b></p>
      <button class="btn block" data-act="share" data-v="${esc(link)}">Invitar amigos</button>
      <p class="muted">Café (cierre del día): ${esc(g.cafe_time)} · ${st.players.length} campistas · mínimo para jugar con Joputa: ${g.min_players}</p>
      ${g.is_owner || g.is_admin ? `<label class="field">Mínimo de jugadores para que haya Joputa
        <select data-act="minPlayers">${[3, 4, 5, 6].map((n) => `<option ${n === g.min_players ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}
      <div class="btns">
        ${pushButton()}
        ${st.test ? '<button class="btn dark block" data-act="sheetTest">🧪 Panel de pruebas</button>' : ''}
        ${g.is_admin ? '<button class="btn dark block" data-act="sheetTestCreate">🧪 Crear camping de prueba (admin)</button>' : ''}
        ${g.is_admin ? '<button class="btn dark block" data-act="sheetFeatures">⚙️ Mecánicas del camping (admin)</button><button class="btn dark block" data-act="sheetStats">📊 Actividad del camping (admin)</button><button class="btn dark block" data-act="sheetWords">🔤 Palabras de la sopa (admin)</button>' : ''}
        <button class="btn ghost block" data-act="sheetAvatar"><img src="${IMG(st.me.avatar)}" alt="">Cambiar mi avatar</button>
        <button class="btn ghost block" data-act="help">Cómo se juega</button>
        ${S.groups.length > 1 ? S.groups.filter((x) => x.group_id !== S.groupId).map((x) => `<button class="btn ghost block" data-act="switchGroup" data-v="${x.group_id}">Ir a ${esc(x.name)}</button>`).join('') : ''}
        <button class="btn ghost block" data-act="newGroup">Unirme o crear otro camping</button>
        <button class="btn ghost block" data-act="logout">Cerrar sesión</button>
      </div>`;
  },
  help() {
    const sec = (title, body, open = false, on = true) => on ? `<details class="rules" ${open ? 'open' : ''}><summary>${title}</summary>${body}</details>` : '';
    const ifon = (k, html) => (feat(k) ? html : '');
    return `<h2>Cómo se juega</h2>
    <p class="muted">Toca cada apartado para desplegarlo. Lo puedes volver a abrir desde el menú (nombre del camping ▾).</p>
    ${sec('🏕️ La idea en 30 segundos', `
      <p>Cada día ganáis fichas y os las robáis. A la hora del café se cierra el día y quien más ha ganado se lleva los puntos. Cada semana uno de vosotros es, en secreto, <b>el Joputa</b>: hace trastadas por la noche y, si nadie le pilla, el sábado al café cobra el táper. El resto tiene que descubrirle.</p>`, true)}
    ${sec('☀️ Un día en el camping', `
      <ul>
        <li>Tienes <b>5 acciones</b> al día. Quien queda último al café tiene una acción extra al día siguiente.</li>
        <li>Quien lleva <b>3 días sin abrir el juego</b> sale con 💤: no cuenta en las votaciones, no puede tocarle ser Joputa ni un rol, y no cobra de la hucha. Basta con abrir la app para volver.</li>
        <li><b>Minijuegos</b> (1 acción, 14 distintos: de puntería, reflejos, memoria, lógica y cotilleo): entre 5 y 25 fichas según lo bien que lo hagas. Con una puntuación casi perfecta, a veces ganas un objeto.</li>
        <li><b>Asaltar</b> (1 acción y 5 fichas, gratis a la Parcela VIP): le robas el 15 % de sus fichas (máx. 30). Solo te protegen los objetos. Solo una vez al día a la misma persona.</li>
        <li><b>Venganza:</b> si alguien te asaltó hoy o ayer (sin coartada), asaltarle roba el doble (30 %, máx. 60).</li>
        <li><b>Investigar</b> (1 acción, una vez al día): 40 % de encontrar una pista del Joputa.</li>
        <li><b>Hacer guardia</b> (2 acciones, entre las 02:00 y las 23:00): esa noche ninguna trastada entra en la parcela que vigilas. Si frustras la del Joputa, ganas una pista.</li>
        <li><b>Tienda</b>: una compra al día, máximo 3 objetos en el inventario.</li>
      </ul>`)}
    ${sec('🏆 Fichas y puntos: quién gana', `
      <ul>
        <li><b>Gana quien más puntos tiene</b> (ranking de la semana y del mes). Las <b>fichas</b> sirven para comprar, apostar en duelos… y para que te las roben.</li>
        <li>En cada café todos cobráis <b>40 fichas</b>. Lo que ganes en el día (minijuegos, asaltos, retos, duelos, torneo) decide los puntos del día.</li>
      </ul>`)}
    ${sec('🏆 Puntos, ranking y títulos', `
      <ul>
        <li>Al café, por fichas ganadas ese día: 10, 7, 5 y 3 puntos a los cuatro primeros y 1 al resto. El ganador ocupa la <b>Parcela VIP</b> y, si nadie le asalta al día siguiente, cobra 15 fichas extra.</li>
        <li>Acertar una acusación da 5 puntos, a quien acusa y a quien vota a favor.</li>
        ${ifon('torneo', '<li>El torneo del día da 3, 2 y 1 puntos a los tres primeros.</li>')}
        ${ifon('sospechas', '<li>Cada sospecha acertada vale 2 puntos (se suman el sábado).</li>')}
        <li>Tu parcela sube de nivel con los puntos: recién llegado (0), bien instalado (40), veterano (120) y el rey del camping (250). Cada nivel, la caravana está más montada.</li>
        <li>Cada mes: <b>Campista del mes</b> (más puntos) y <b>Joputa del mes</b> (mayor táper cobrado). Después todos vuelven a 100 fichas y sin objetos; los puntos y la parcela se quedan.</li>
      </ul>`)}
    ${sec('😈 El Joputa y el táper', `
      <ul>
        <li>Cada semana el juego elige en secreto un Joputa (nunca el de la semana anterior; se avisa al acabar el café del sábado). Hacen falta ${S.st.group.min_players} campistas.</li>
        <li>Cada noche puede programar una trastada sin firmar, que se ejecuta a las 02:00. Cada una engorda el táper con el botín: las leves (luz, colchón, ropa, piquetas) +20 y las gordas (saquear y vaciar la nevera, que roban fichas) +40. Las gordas dejan una pista a la víctima.</li>
        ${ifon('enfermeria', '<li><b>Enfermería</b> (una vez por semana, +60): la víctima no puede acusar ni votar hasta el café del día siguiente, pero recuerda dos pistas.</li>')}
        <li>El táper empieza con 100. Si el Joputa llega al café del sábado sin que le pillen, lo cobra; con menos de 3 trastadas, solo la mitad.</li>
        ${ifon('pase', '<li><b>🥡 Pasar el táper</b> (una vez por semana, de domingo a jueves): el Joputa tiene un minijuego secreto, «Que no se despierte nadie» (cruzar el camping de noche con el táper sin que le pille ninguna linterna; no sale en Noticias, 3 intentos al día). Si saca 90 o más, puede pasar el táper: cobra el 30 % al momento y el resto pasa a un campista activo al azar, que se entera y se convierte en el Joputa (puede hacer trastadas y es al que hay que pillar). Nadie sabe a quién ha ido, ni el que lo pasa; el loro solo canta que ha cambiado de manos. Si tenía cómplice, el pacto se rompe.</li>')}
        ${ifon('trastadas_camping', '<li><b>Ojo:</b> el propio camping también hace 1-3 trastadas al azar cada semana. No todo lo que pasa de noche es cosa del Joputa.</li>')}
      </ul>`)}
    ${sec('🔎 Pistas', `
      <ul>
        <li><b>De comportamiento:</b> qué hizo ayer el Joputa (si asaltó, si usó objetos, a qué jugó, si aportó a la misión). Salen al investigar,${feat('retos') ? ' en los retos' : ''} y si eres víctima de una trastada gorda.</li>
        <li><b>De exclusión:</b> «Fulano no es el Joputa». Solo una por semana: con una guardia que frustra al Joputa ${feat('retos') ? ' o con el reto especial semanal (jugar a 4 minijuegos distintos el mismo día)' : ''}.</li>
        ${ifon('pistas_falsas', `<li><b>Pistas falsas:</b> el Joputa tiene una gratis desde el miércoles, y cualquiera puede comprar una Pista falsificada (300 fichas, una por semana en todo el camping). Llegan como si fueran del juego. El sábado se revela cuáles eran falsas y quién las envió. Si tu pista falsa hace que condenen a un inocente, ganas 5 puntos.</li>`)}
        <li>Quién jugó a qué también es una pista: lo ves en Noticias → «Todo».</li>
      </ul>`)}
    ${sec('🤔 Sospecha diaria', `
      <ul>
        <li>Cada día puedes señalar, gratis y en secreto, a quien crees que es el Joputa (en Pistas). Puedes cambiarla hasta el café.</li>
        <li>Al día siguiente, el <b>termómetro</b> muestra de quién sospechaba el camping, sin decir quién votó.</li>
        <li>El sábado: +2 puntos por cada día que acertaste, y el que más acierta es el <b>Ojo de halcón</b> del resumen. El Joputa también puede sospechar (para disimular), pero no puntúa.</li>
      </ul>`, false, feat('sospechas'))}
    ${sec('🏆 Torneo del día y 🤠 duelos', `
      <ul>
        ${ifon('torneo', '<li><b>Torneo del día:</b> cada día se elige un minijuego. Cuenta tu mejor partida; al café, el 1.º gana 30 fichas y 3 puntos, el 2.º 15 y 2, el 3.º 5 y 1 (si han jugado al menos 2).</li>')}
        ${ifon('duelos', '<li><b>Duelos</b> (1 acción, uno al día): retas a alguien a un minijuego (lo eliges tú o al azar) con una apuesta de 10 a 50 fichas, y juegas primero. El retado juega exactamente la misma partida antes del café, o se raja delante de todos. Gana la mejor puntuación y se lleva las dos apuestas; en empate o si nadie contesta, se devuelve. La partida del duelo no da fichas de minijuego.</li>')}
      </ul>`, false, feat('torneo') || feat('duelos'))}
    ${sec('📋 Resumen del sábado', `
      <p>Al cerrar la semana sale un resumen para comentar en el café: quién era el Joputa y cómo acabó, el Ojo de halcón, quién robó más, a quién le robaron más, quién ganó más días y el favorito del loro.</p>`)}
    ${sec('☝️ Acusar y votar', `
      <ul>
        <li>Cada uno tiene <b>una acusación por semana</b> y solo puede haber una abierta a la vez. Se vota hasta el café; no votar cuenta como en contra.</li>
        <li>Prospera si vota a favor más de la mitad de los campistas activos (sin contar al acusado ni a quien lleva 3 días sin entrar).</li>
        <li><b>Si era el Joputa:</b> queda pillado y pierde el táper. Quien acusa se lleva la mitad del táper y los que votaron a favor se reparten un 30 %.</li>
        ${ifon('complice', `<li><b>Si era su cómplice:</b> medio acierto. El cómplice queda fuera del reparto, quien acusa gana 20 fichas y cada voto a favor, 5. El Joputa sigue suelto.</li>`)}
        <li><b>Si era inocente:</b> quien acusa paga 40, cada voto a favor paga 15${feat('mision') ? ' (todo va a la hucha)' : ''}, el acusado cobra 30 y ya no se le puede acusar esa semana.</li>
      </ul>`)}
    ${sec('🤝 Cómplice y traiciones', `
      <ul>
        <li>Cada semana, si hay 5 o más jugadores activos, el Joputa puede ofrecer a alguien ser su cómplice (domingo y lunes, un solo intento, del 20 al 50 % del táper). Hay 12 horas para contestar; si dice que no, ya sabe quién es el Joputa.</li>
        <li>Si los dos hacen trastada a la misma víctima la misma noche, suma el doble. El cómplice puede dar una <b>coartada</b> (un día sin pistas del Joputa).</li>
        <li><b>Chivarse:</b> el cómplice destapa al Joputa y se lleva el 60 % del táper.</li>

        <li><b>Reparto del sábado</b>, en secreto: si los dos reparten, +20 % sobre lo pactado; si uno se lo queda, se lo lleva todo; si los dos se lo quedan, se pierde y pagan 30 cada uno.</li>
      </ul>`, false, feat('complice'))}
    ${sec('🎪 Misión, hucha y hoguera', `
      <ul>
        <li><b>Misión de la semana:</b> se cumple entre todos jugando a un minijuego concreto (1 pieza con buena puntuación, 2 si es excelente) antes del café del viernes. Si se cumple, la hucha sube 100 y quien más aportó gana 30 fichas.</li>
        <li>El Joputa (y su cómplice) puede <b>robar 2 piezas</b> una vez al día, como mucho 3 veces por semana entre los dos. Todos ven a qué hora desaparecieron. Si la misión fracasa con robos, el táper engorda 40.</li>
        <li>La <b>hucha</b> también se llena con las multas y con 3 fichas por cada reto cumplido.</li>
        <li><b>Hoguera del sábado</b> (si el Joputa sigue suelto), votando hasta el café:
          <ul>
            <li><b>Repartir:</b> la hucha a partes iguales entre todos, también para el Joputa. Gana también si hay empate.</li>
            <li><b>Desterrar al Joputa:</b> pierde el táper y la hucha es para los demás.</li>
            <li><b>Desterrar a un inocente:</b> el Joputa se la lleva entera.</li>
          </ul></li>
        <li>Si el Joputa ya estaba pillado, la hucha se reparte sola.</li>
      </ul>`, false, feat('mision'))}
    ${sec('📦 Cambio de neveras', `
      <ul>
        <li>Si el Joputa sigue suelto, al café del <b>viernes</b> se anuncian 3 finalistas: el Joputa y 2 campistas activos sorteados (cuantos más puntos lleves en la semana, más papeletas). Uno de los tres tiene el táper en su nevera.</li>
        <li>El <b>sábado</b>, hasta el café, cada finalista elige en secreto intercambiar dos neveras (la suya u otras dos) o no tocar nada. Se puede cambiar de idea hasta el café.</li>
        <li>Al café se aplican los cambios en orden: primero los dos inocentes (el que menos puntos lleva, antes) y <b>el Joputa siempre el último</b>. El Joputa mira en su nevera antes de mover: si el táper sigue ahí, no toca nada; si se lo han quitado, cambia su nevera con la que eligió (si acierta quién lo tiene, lo recupera). El orden no se ve hasta el café, y entonces el loro canta los movimientos uno a uno. <b>Quien tenga el táper al final, lo cobra</b>; si no es el Joputa, el Joputa se queda sin nada (y su pacto con el cómplice tampoco cuenta, salvo que el táper acabe en la nevera del cómplice: entonces lo cobra él entero).</li>
        <li>Va después de la hoguera: si la hoguera destierra al Joputa, no hay cambio.</li>
      </ul>`, false, feat('cambio'))}
    ${sec('🎭 Roles secretos', `
      <ul>
        <li>Cada semana tres inocentes reciben un rol que solo ellos ven:
          <ul>
            <li><b>Cotilla:</b> una vez, ve todo lo que hizo alguien ayer, incluido si robó en la misión.</li>
            <li><b>Socorrista:</b> sus guardias cuestan 1 acción y, si frustra al Joputa, gana también una pista de comportamiento.</li>
            <li><b>Alcalde:</b> su voto cuenta doble.</li>
          </ul></li>
      </ul>`, false, feat('roles'))}
    ${sec('🦜 El loro', `
      <ul>
        <li>Tu primer fallo gordo del día en un minijuego, y el loro se burla de ti delante de todos.</li>
        <li>Puedes replicarle hasta el café, con un solo intento: hay una réplica buena y dos trampas que usan las mismas palabras. Intentarlo cuesta 10 fichas; acertar da 30. Si fallas, los 10 van a la hucha.</li>
        <li>El <b>megáfono</b> (lo reparte el karaoke, 3 usos) descarta una trampa.</li>
      </ul>`, false, feat('loro'))}
    ${sec(feat('retos') && feat('eventos') ? '📅 Retos y eventos' : feat('retos') ? '📅 Retos' : '📅 Eventos', `
      <ul>
        ${ifon('retos', '<li>Cada día hay 3 retos con premio (fichas, objetos o pistas), y una vez por semana un reto especial.</li>')}
        ${ifon('eventos', `<li>Cada semana hay 1 o 2 eventos (de 08:00 al café):
          <ul>
            <li><b>Tormenta:</b> todos pierden el 10 % de sus fichas (máx. 30).</li>
            <li><b>Inspección:</b> quien más asaltos lleve en la semana paga 30.</li>
            <li><b>Fiesta:</b> los asaltos roban el doble (30 %, máx. 60).</li>
            <li><b>Mercadillo:</b> más fácil ganar objetos en los minijuegos.</li>
            <li><b>Corte de agua:</b> no hay minijuegos.</li>
            <li><b>Karaoke:</b> todos reciben un megáfono.</li>
          </ul></li>`, false, feat('retos') || feat('eventos'))}
      </ul>`)}
    ${sec('🎒 Objetos', `
      <ul>${SHOP.map(([k, price, desc]) => `<li><b>${ITEM_NAMES[k]}</b> (${price}): ${desc}</li>`).join('')}
        <li>El <b>megáfono</b> no se compra: lo reparte el karaoke.</li></ul>`)}
    <button class="btn block" data-act="closeSheet">Entendido</button>`;
  },
};

// ------------------------------------------------------------ minijuegos
// Lienzo para los minijuegos de dibujo, con la proporción alto/ancho pedida
function mkCanvas(stage, ratio, bg = '#16233f', border = true) {
  const q = stage.getBoundingClientRect();
  let W = Math.min(q.width - 8, 420); let H = W * ratio;
  if (H > q.height - 8) { H = q.height - 8; W = H / ratio; }
  W = Math.round(W); H = Math.round(H);
  stage.innerHTML = `<canvas style="width:${W}px;height:${H}px;touch-action:none;${border ? 'border:3px solid var(--line);' : ''}border-radius:18px;background:${bg}"></canvas>`;
  const cv = stage.querySelector('canvas'); const dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
  return { cv, c, W, H };
}
const loadImg = (n) => { const i = new Image(); i.src = IMG(n); return i; };
// Cada minijuego devuelve una puntuación de 0 a 1 con finish().
// Los de dibujo (petanca, aparcar, mosquitos, sigilo) usan mkCanvas().
function openGame(kind, opts = {}) {
  $toast.className = '';
  const g = GAMES[kind] || SECRET_GAMES[kind];
  const duel = !!opts.submit;                       // partida de duelo: no paga fichas, solo cuenta la puntuación
  const practice = !!opts.practice;                 // modo test: no gasta acciones ni cuenta
  const rnd = opts.seed != null ? seeded(opts.seed) : Math.random;
  const ov = document.createElement('div');
  ov.className = 'mg'; ov.style.backgroundImage = `url(${IMG(g.bg)})`;
  ov.innerHTML = `<h2>${duel ? `🤠 Duelo: ${g.name}` : g.name}</h2><p class="hint">${g.hint}${duel ? '<br>Misma partida para los dos: gana la mejor puntuación.' : ''}</p>
    <div class="stage"></div>
    <div class="result" aria-live="polite"></div>
    <div class="ctrl"></div>
    <div class="btns two"><button class="btn ghost" data-mg="close">Salir</button><button class="btn green" data-mg="go">${duel ? '¡Al duelo! (⚡1)' : practice ? 'Empezar (prueba)' : 'Empezar (⚡1)'}</button></div>`;
  document.body.appendChild(ov);
  const stage = ov.querySelector('.stage'); const ctrl = ov.querySelector('.ctrl');
  const result = ov.querySelector('.result'); const goBtn = ov.querySelector('[data-mg="go"]');
  let state = 'ready'; let cleanup = () => {}; let doneAt = 0;
  const close = () => { cleanup(); ov.remove(); };

  async function finish(score, label) {
    state = 'sending'; cleanup(); goBtn.disabled = true; doneAt = performance.now();
    if (duel) {
      score = Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;
      result.textContent = `${label ? `${label} ` : ''}Tu puntuación: ${Math.round(score * 100)}.`;
      const r = await opts.submit(score);
      if (r) result.textContent += ` ${r.msg}`;
      goBtn.textContent = 'Cerrar'; goBtn.disabled = false; state = 'done';
      return;
    }
    score = Math.max(0, Math.min(1, score));
    if (practice) {
      result.textContent = `${label ? `${label} ` : ''}Puntuación: ${Math.round(score * 100)} (prueba).`;
      goBtn.textContent = 'Cerrar'; goBtn.disabled = false; state = 'done';
      return;
    }
    result.textContent = label || (score >= 0.99 ? '¡Perfecto!' : score > 0.6 ? '¡Bien!' : score > 0.25 ? 'Regular…' : '¡Uf!');
    const r = kind === 'sigilo'
      ? await rpc('jp_sigilo', { p_group: S.groupId, p_score: Math.round(score * 100) / 100 }, { quiet: true })
      : await rpc('jp_minigame', { p_group: S.groupId, p_game: kind, p_score: Math.round(score * 100) / 100 }, { quiet: true });
    if (r) result.textContent += ` ${r.msg}`;
    goBtn.textContent = 'Cerrar'; goBtn.disabled = false; state = 'done';
    refresh();
  }

  const games = {
    // Petanca de verdad, vista desde arriba: el boliche y dos bolas rivales ya están en la pista;
    // tiras 3 bolas arrastrando hacia atrás (dirección y fuerza). Las bolas ruedan, frenan y chocan.
    petanca() {
      const { c, W, H, cv } = mkCanvas(stage, 1.5, 'transparent', false);
      const I = { pista: loadImg('pt_pista'), plata: loadImg('pt_bola_plata'), oro: loadImg('pt_bola_oro'), bol: loadImg('pt_boliche'), circ: loadImg('pt_circulo') };
      const R = W * 0.05; const r = W * 0.026;
      const box = { x0: W * 0.1, x1: W * 0.9, y0: H * 0.055, y1: H * 0.945 };
      const clampIn = (b) => { b.x = Math.max(box.x0 + b.R, Math.min(box.x1 - b.R, b.x)); b.y = Math.max(box.y0 + b.R, Math.min(box.y1 - b.R, b.y)); };
      const jack = { x: W * (0.3 + rnd() * 0.4), y: H * (0.18 + rnd() * 0.16), vx: 0, vy: 0, R: r, m: 0.35, kind: 'bol' };
      const balls = [jack];
      for (let k = 0; k < 2; k += 1) {
        const a = rnd() * Math.PI * 2; const d = W * (0.1 + rnd() * 0.14);
        const b = { x: jack.x + Math.cos(a) * d, y: jack.y + Math.sin(a) * d, vx: 0, vy: 0, R, m: 1, kind: 'oro' }; clampIn(b); balls.push(b);
      }
      const ring = { x: W / 2, y: H * 0.86 };
      let left = 3; let cur = null; let aim = null; let rolling = false; let raf = 0; let last = 0; let msg = '';
      const spawn = () => { cur = { x: ring.x, y: ring.y, vx: 0, vy: 0, R, m: 1, kind: 'plata' }; };
      spawn();
      const MU = W * 1.6; const VMAX = W * 2.4;
      const gap = (b) => Math.max(0, Math.hypot(b.x - jack.x, b.y - jack.y) - b.R - jack.R);
      const pos = (e) => { const q = cv.getBoundingClientRect(); return { x: ((e.clientX - q.left) * W) / q.width, y: ((e.clientY - q.top) * H) / q.height }; };
      const down = (e) => { if (rolling || !cur || state !== 'running') return; e.preventDefault(); aim = { s: pos(e), e: pos(e) }; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } };
      const move = (e) => { if (aim) aim.e = pos(e); };
      const up = () => {
        if (!aim) return;
        const dx = aim.s.x - aim.e.x; const dy = aim.s.y - aim.e.y; aim = null;
        const L = Math.hypot(dx, dy); if (L < W * 0.04) return;
        const v = Math.min(1, L / (W * 0.6)) * VMAX;
        cur.vx = (dx / L) * v; cur.vy = (dy / L) * v; balls.push(cur); rolling = true; left -= 1; msg = '';
      };
      cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
      const physics = (dt) => {
        for (const b of balls) {
          const s = Math.hypot(b.vx, b.vy); if (!s) continue;
          const ns = Math.max(0, s - MU * dt * (b.kind === 'bol' ? 1.4 : 1));
          b.vx *= ns / s; b.vy *= ns / s; b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.x < box.x0 + b.R) { b.x = box.x0 + b.R; b.vx = Math.abs(b.vx) * 0.45; }
          if (b.x > box.x1 - b.R) { b.x = box.x1 - b.R; b.vx = -Math.abs(b.vx) * 0.45; }
          if (b.y < box.y0 + b.R) { b.y = box.y0 + b.R; b.vy = Math.abs(b.vy) * 0.45; }
          if (b.y > box.y1 - b.R) { b.y = box.y1 - b.R; b.vy = -Math.abs(b.vy) * 0.45; }
        }
        for (let i = 0; i < balls.length; i += 1) for (let j = i + 1; j < balls.length; j += 1) {
          const a = balls[i]; const b = balls[j]; const dx = b.x - a.x; const dy = b.y - a.y; const d = Math.hypot(dx, dy); const min = a.R + b.R;
          if (d >= min || d === 0) continue;
          const nx = dx / d; const ny = dy / d; const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          const over = min - d; const ia = 1 / a.m; const ib = 1 / b.m;
          a.x -= nx * over * ia / (ia + ib); a.y -= ny * over * ia / (ia + ib); b.x += nx * over * ib / (ia + ib); b.y += ny * over * ib / (ia + ib);
          if (rel < 0) { const jimp = (-(1 + 0.8) * rel) / (ia + ib); a.vx -= jimp * nx * ia; a.vy -= jimp * ny * ia; b.vx += jimp * nx * ib; b.vy += jimp * ny * ib; }
        }
      };
      const draw = () => {
        c.clearRect(0, 0, W, H);
        if (I.pista.complete) c.drawImage(I.pista, 0, 0, W, H); else { c.fillStyle = '#d9c39a'; c.fillRect(0, 0, W, H); }
        if (I.circ.complete) c.drawImage(I.circ, ring.x - R * 1.8, ring.y - R * 1.8, R * 3.6, R * 3.6);
        for (const b of [...balls, ...(rolling ? [] : [cur])]) {
          if (!b) continue;
          const img = b.kind === 'bol' ? I.bol : b.kind === 'oro' ? I.oro : I.plata;
          c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(b.x + b.R * 0.15, b.y + b.R * 0.25, b.R, b.R * 0.8, 0, 0, Math.PI * 2); c.fill();
          if (img.complete) c.drawImage(img, b.x - b.R, b.y - b.R, b.R * 2, b.R * 2);
        }
        if (aim && cur) {
          const dx = aim.s.x - aim.e.x; const dy = aim.s.y - aim.e.y; const L = Math.min(Math.hypot(dx, dy), W * 0.6);
          const a = Math.atan2(dy, dx); const len = L * 1.3;
          c.strokeStyle = 'rgba(214,64,52,.9)'; c.lineWidth = 5; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(cur.x, cur.y); c.lineTo(cur.x + Math.cos(a) * len, cur.y + Math.sin(a) * len); c.stroke(); c.setLineDash([]);
          c.fillStyle = '#fff'; c.font = '800 15px Nunito, sans-serif'; c.fillText(`Fuerza ${Math.round((L / (W * 0.6)) * 100)} %`, 10, H - 12);
        }
        c.fillStyle = '#fff'; c.strokeStyle = 'rgba(60,40,20,.8)'; c.lineWidth = 4; c.font = '800 18px Nunito, sans-serif';
        const txt = `Bolas: ${left}${msg ? ` · ${msg}` : ''}`; c.strokeText(txt, 10, 26); c.fillText(txt, 10, 26);
      };
      const loop = (t) => {
        const dt = last ? Math.min((t - last) / 1000, 0.033) : 0; last = t;
        for (let k = 0; k < 3; k += 1) physics(dt / 3);
        if (rolling && balls.every((b) => !Math.hypot(b.vx, b.vy))) {
          rolling = false;
          const mine = balls.filter((b) => b.kind === 'plata'); const best = Math.min(...mine.map(gap)); const rival = Math.min(...balls.filter((b) => b.kind === 'oro').map(gap));
          msg = best < rival ? '¡ganas el punto!' : 'el rival gana';
          if (left === 0) {
            draw();
            const score = Math.max(0, Math.min(1, 1.05 - best / (W * 0.32) + (best < rival ? 0.1 : 0)));
            return finish(score, best < rival ? `¡Punto! Tu mejor bola a ${Math.round((best / W) * 100)} cm del boliche.` : `El rival se queda el punto. Tu mejor bola, a ${Math.round((best / W) * 100)} cm.`);
          }
          spawn();
        }
        draw(); raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      goBtn.textContent = 'Arrastra hacia atrás y suelta'; goBtn.disabled = true;
      cleanup = () => { cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      return null;
    },
    // Aparcar la caravana marcha atrás en la parcela (vista desde arriba). La caravana gira al revés
    // que el volante al ir hacia atrás, como en la vida real. Sin tocar setos ni la mesa; los conos restan.
    aparcar() {
      const { c, W, H } = mkCanvas(stage, 1.45);
      const I = { coche: loadImg('ap_coche'), car: loadImg('ap_caravana'), par: loadImg('ap_parcela'), cono: loadImg('ap_cono'), mesa: loadImg('ap_mesa') };
      const pw = W * 0.7; const ph = (pw * 341) / 493; const px = (W - pw) / 2 + (rnd() - 0.5) * W * 0.1; const py = H - ph - W * 0.02;
      const inner = { x0: px + pw * 0.11, x1: px + pw * 0.89, y0: py + ph * 0.04, y1: py + ph * 0.8 };
      const walls = [{ x0: px, x1: px + pw * 0.11, y0: py + ph * 0.02, y1: py + ph }, { x0: px + pw * 0.89, x1: px + pw, y0: py + ph * 0.02, y1: py + ph }, { x0: px, x1: px + pw, y0: py + ph * 0.8, y1: py + ph }];
      const mLeft = rnd() < 0.5; const mw = W * 0.12; const mh = W * 0.1;
      const mesa = { x0: mLeft ? inner.x0 + W * 0.01 : inner.x1 - mw - W * 0.01, x1: 0, y0: inner.y1 - mh - W * 0.01, y1: inner.y1 - W * 0.01 }; mesa.x1 = mesa.x0 + mw;
      const cones = [{ x: inner.x0 - W * 0.03, y: py - W * 0.05, r: W * 0.03, hit: false }, { x: inner.x1 + W * 0.03, y: py - W * 0.05, r: W * 0.03, hit: false }];
      // vehículo: P = eje trasero del coche, th = rumbo del coche, ph2 = rumbo de la caravana (hacia el enganche)
      const L = W * 0.12; const HOFF = W * 0.05; const LT = W * 0.2;
      const st = { x: W * 0.5 + (rnd() - 0.5) * W * 0.3, y: H * 0.17, th: -Math.PI / 2 + (rnd() - 0.5) * 0.3, ph2: -Math.PI / 2 + (rnd() - 0.5) * 0.4, delta: 0, gear: 0, t: 0, hits: 0, over: null, still: 0 };
      const dir = (a) => [Math.cos(a), Math.sin(a)];
      const hitch = () => { const [dx, dy] = dir(st.th); return [st.x - dx * HOFF, st.y - dy * HOFF]; };
      const carBox = () => { const [dx, dy] = dir(st.th); return { cx: st.x + dx * W * 0.06, cy: st.y + dy * W * 0.06, a: st.th, l: W * 0.2, w: W * 0.105 }; };
      const vanBox = () => { const [hx, hy] = hitch(); const [dx, dy] = dir(st.ph2); return { cx: hx - dx * W * 0.18, cy: hy - dy * W * 0.18, a: st.ph2, l: W * 0.26, w: W * 0.13 }; };
      const corners = (b) => { const [dx, dy] = dir(b.a); const nx = -dy; const ny = dx; const pts = []; for (const [u, v] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]) pts.push([b.cx + dx * u * b.l / 2 + nx * v * b.w / 2, b.cy + dy * u * b.l / 2 + ny * v * b.w / 2]); return pts; };
      const inRect = ([x, y], q) => x > q.x0 && x < q.x1 && y > q.y0 && y < q.y1;
      const circHit = (b, o) => { const [dx, dy] = dir(b.a); const rx = o.x - b.cx; const ry = o.y - b.cy; const u = rx * dx + ry * dy; const v = -rx * dy + ry * dx; return Math.abs(u) < b.l / 2 + o.r && Math.abs(v) < b.w / 2 + o.r; };
      const startY = vanBox().cy; const goalY = (inner.y0 + inner.y1) / 2;
      ctrl.innerHTML = `<div class="drive"><button class="btn" data-gear="1">▲ Adelante</button>
        <label class="wheel">🛞 Volante<input type="range" min="-100" max="100" value="0" data-wheel></label>
        <button class="btn" data-gear="-1">▼ Atrás</button></div>`;
      const wheel = ctrl.querySelector('[data-wheel]');
      const onWheel = () => { st.delta = (Number(wheel.value) / 100) * 0.6; };
      wheel.addEventListener('input', onWheel);
      const gearDown = (e) => { const b = e.target.closest('[data-gear]'); if (!b || state !== 'running') return; e.preventDefault(); st.gear = Number(b.dataset.gear); };
      const gearUp = () => { st.gear = 0; };
      ctrl.addEventListener('pointerdown', gearDown); window.addEventListener('pointerup', gearUp); ctrl.addEventListener('pointercancel', gearUp);
      const angd = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
      const drawImg = (img, cx, cy, w, h, rot) => { c.save(); c.translate(cx, cy); c.rotate(rot); if (img.complete) c.drawImage(img, -w / 2, -h / 2, w, h); c.restore(); };
      const draw = () => {
        c.fillStyle = '#9CCB6B'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#D8C7A0'; c.fillRect(0, 0, W, py - W * 0.01);
        drawImg(I.par, px + pw / 2, py + ph / 2, pw, ph, Math.PI);
        if (I.mesa.complete) c.drawImage(I.mesa, mesa.x0, mesa.y0, mw, mh);
        for (const o of cones) if (!o.hit) drawImg(I.cono, o.x, o.y, o.r * 2.2, o.r * 2.2, 0);
        const vb = vanBox(); const cb = carBox();
        drawImg(I.car, vb.cx, vb.cy + 0, W * 0.16, W * 0.27, vb.a - Math.PI / 2);
        drawImg(I.coche, cb.cx, cb.cy, W * 0.125, W * 0.2, cb.a - Math.PI / 2);
        c.fillStyle = '#fff'; c.strokeStyle = 'rgba(60,40,20,.8)'; c.lineWidth = 4; c.font = '800 17px Nunito, sans-serif';
        const txt = `${Math.max(0, Math.ceil(60 - st.t))} s${st.hits ? ` · conos: ${st.hits}` : ''}`; c.strokeText(txt, 10, 24); c.fillText(txt, 10, 24);
      };
      const end = (ok, label) => {
        st.over = label; draw();
        const vb = vanBox(); const prog = Math.max(0, Math.min(1, (vb.cy - startY) / (goalY - startY)));
        const angErr = Math.abs(angd(st.ph2, -Math.PI / 2));
        finish(ok ? Math.max(0.45, Math.min(1, 1.05 - st.hits * 0.15 - Math.max(0, st.t - 25) / 90 - angErr * 0.5)) : 0.4 * prog, label);
      };
      let raf = 0; let last = 0;
      const loop = (t) => {
        const dt = last ? Math.min((t - last) / 1000, 0.033) : 0; last = t; st.t += dt;
        const v = st.gear > 0 ? W * 0.16 : st.gear < 0 ? -W * 0.12 : 0;
        if (v) {
          const [dx, dy] = dir(st.th); const tn = Math.tan(st.delta);
          st.x += dx * v * dt; st.y += dy * v * dt;
          const dth = (v / L) * tn; const rel = st.th - st.ph2;
          st.ph2 += ((v / LT) * Math.sin(rel) - ((v * HOFF) / (L * LT)) * Math.cos(rel) * tn) * dt;
          st.th += dth * dt;
        }
        const vb = vanBox(); const cb = carBox(); const pts = [...corners(vb), ...corners(cb)];
        if (pts.some((p) => walls.some((q) => inRect(p, q)) || inRect(p, mesa))) return end(false, '¡Te has llevado el seto por delante!');
        if (pts.some(([x, y]) => x < 0 || y < 0 || x > W || y > H)) return end(false, '¡Te has salido del camino!');
        if (Math.abs(angd(st.th, st.ph2)) > 1.45) return end(false, '¡Tijera! La caravana se ha cruzado.');
        for (const o of cones) if (!o.hit && (circHit(vb, o) || circHit(cb, o))) { o.hit = true; st.hits += 1; }
        const parked = corners(vb).slice(0, 4).every((p) => inRect(p, inner)) && Math.abs(angd(st.ph2, -Math.PI / 2)) < 0.35;
        st.still = parked && !v ? st.still + dt : 0;
        if (st.still > 0.6) return end(true, `¡Aparcada en ${Math.round(st.t)} s${st.hits ? ` (y ${st.hits} cono${st.hits > 1 ? 's' : ''} por los aires)` : ''}!`);
        if (st.t >= 60) return end(false, 'Se ha hecho de noche y la caravana sigue en el camino.');
        draw(); raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      goBtn.textContent = 'Mete la caravana en la parcela'; goBtn.disabled = true;
      cleanup = () => { cancelAnimationFrame(raf); wheel.removeEventListener('input', onWheel); ctrl.removeEventListener('pointerdown', gearDown); window.removeEventListener('pointerup', gearUp); };
      return null;
    },
    // Montar el avance: 6 piquetas, cada una necesita 2 martillazos buenos (en el verde).
    // Un martillazo fuera del verde la dobla; con 2 dobladas, esa piqueta se queda mal.
    tienda() {
      const N = 6; let k = 0; let good = 0; let bentTotal = 0; let raf = 0; let t0 = 0; let lock = false;
      const pegs = Array.from({ length: N }, () => ({ depth: 0, bent: 0 }));
      stage.innerHTML = `<div class="avance"><img class="av-bg" src="${IMG('parcela_2_iglu')}" alt="">
        <div class="pq-row">${pegs.map((_, i) => `<div class="pq" data-i="${i}"><img src="${IMG('mj_piqueta')}" alt=""></div>`).join('')}</div><div class="hammer">🔨</div></div>`;
      ctrl.innerHTML = '<div class="bar"><div class="zone best"></div><div class="marker"></div></div>';
      const zone = ctrl.querySelector('.zone'); const marker = ctrl.querySelector('.marker');
      const els = [...stage.querySelectorAll('.pq')]; const hammer = stage.querySelector('.hammer');
      let zx = 0; let zw = 0; let pos = 0;
      const setup = () => {
        if (k >= N) return finish(Math.max(0, (good - bentTotal * 0.5) / (N * 2)), `${pegs.filter((p) => p.depth >= 2).length} de ${N} piquetas bien clavadas.`);
        zw = 0.24 - k * 0.022; zx = 0.08 + rnd() * (0.84 - zw);
        zone.style.left = `${zx * 100}%`; zone.style.width = `${zw * 100}%`;
        els.forEach((el, i) => el.classList.toggle('cur', i === k));
        hammer.style.left = `${((k + 0.5) / N) * 100}%`; t0 = performance.now();
      };
      const loop = (t) => { const el = (t - t0) / 1000; const sp = 0.8 + k * 0.18; pos = (Math.sin(el * sp * Math.PI - Math.PI / 2) + 1) / 2; marker.style.left = `${pos * 100}%`; raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      setup();
      goBtn.textContent = '¡Martillazo!';
      return () => {
        if (lock || k >= N) return;
        const p = pegs[k]; const el = els[k]; const ok = pos >= zx && pos <= zx + zw;
        hammer.classList.remove('hit'); void hammer.offsetWidth; hammer.classList.add('hit');
        if (ok) { p.depth += 1; good += 1; } else { p.bent += 1; bentTotal += 1; }
        el.style.setProperty('--d', p.depth); el.style.setProperty('--b', p.bent);
        el.classList.toggle('bent', p.bent > 0);
        result.textContent = ok ? (p.depth >= 2 ? '¡Clavada!' : '¡Toc!') : '¡Doblada!';
        if (p.depth >= 2 || p.bent >= 2) { k += 1; lock = true; setTimeout(() => { lock = false; result.textContent = ''; setup(); }, 380); }
      };
    },
    // Cazar mosquitos con la raqueta eléctrica: arrastra la raqueta por la pantalla y fríelos.
    // Cuidado con la vecina, que pasa de vez en cuando.
    mosquitos() {
      const { c, W, H, cv } = mkCanvas(stage, 1.35, 'rgba(25,30,70,.35)');
      const I = { mos: loadImg('mj_mosquito'), raq: loadImg('mj_raqueta'), zap: loadImg('mj_chispa'), vec: loadImg(AVATARS[Math.floor(rnd() * AVATARS.length)]) };
      const DUR = 25; const TOTAL = 14; let spawned = 0; let zapped = 0; let escaped = 0; let vecHits = 0;
      const bugs = []; const sparks = []; let vec = null; let nextVec = 6 + rnd() * 5;
      const rq = { x: W / 2, y: H * 0.75, on: false };
      const head = () => ({ x: rq.x, y: rq.y - W * 0.16, r: W * 0.1 });
      const pos = (e) => { const q = cv.getBoundingClientRect(); return { x: ((e.clientX - q.left) * W) / q.width, y: ((e.clientY - q.top) * H) / q.height }; };
      const down = (e) => { if (state !== 'running') return; e.preventDefault(); Object.assign(rq, pos(e), { on: true }); try { cv.setPointerCapture(e.pointerId); } catch { /* */ } };
      const move = (e) => { if (rq.on) Object.assign(rq, pos(e)); };
      const up = () => { rq.on = false; };
      cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
      let raf = 0; let last = 0; let t = 0; let nextBug = 0.4;
      const loop = (ts) => {
        const dt = last ? Math.min((ts - last) / 1000, 0.033) : 0; last = ts; t += dt;
        if (spawned < TOTAL && t >= nextBug && bugs.filter((b) => !b.done).length < 4) {
          const side = rnd() < 0.5; bugs.push({ x: side ? -20 : W + 20, y: H * (0.1 + rnd() * 0.55), ph: rnd() * 6, sp: 0.6 + spawned * 0.05, life: 0, dur: 4.2 - spawned * 0.12, tx: W * (0.2 + rnd() * 0.6), ty: H * (0.15 + rnd() * 0.5), done: false });
          spawned += 1; nextBug = t + 1.1 - spawned * 0.04;
        }
        for (const b of bugs) {
          if (b.done) continue; b.life += dt; b.ph += dt * 7 * b.sp;
          if (b.life > b.dur) { b.tx = b.x < W / 2 ? -60 : W + 60; }
          if (rnd() < dt * 1.2) { b.tx = W * (0.1 + rnd() * 0.8); b.ty = H * (0.1 + rnd() * 0.6); }
          b.x += (b.tx - b.x) * dt * 1.4 * b.sp + Math.cos(b.ph) * 60 * dt; b.y += (b.ty - b.y) * dt * 1.4 * b.sp + Math.sin(b.ph * 1.3) * 80 * dt;
          if (b.x < -50 || b.x > W + 50) { b.done = true; escaped += 1; }
          const hd = head(); if (rq.on && Math.hypot(b.x - hd.x, b.y - hd.y) < hd.r) { b.done = true; zapped += 1; sparks.push({ x: b.x, y: b.y, t: 0.35 }); }
        }
        if (!vec && t > nextVec) vec = { x: -W * 0.2, y: H * (0.3 + rnd() * 0.3), v: W * 0.28, hit: false };
        if (vec) {
          vec.x += vec.v * dt; const hd = head();
          if (!vec.hit && rq.on && Math.hypot(vec.x - hd.x, vec.y - hd.y) < hd.r + W * 0.07) { vec.hit = true; vecHits += 1; sparks.push({ x: vec.x, y: vec.y, t: 0.6, big: true }); }
          if (vec.x > W * 1.25) { vec = null; nextVec = t + 6 + rnd() * 5; }
        }
        c.clearRect(0, 0, W, H);
        if (vec && I.vec.complete) { const s = W * 0.2; c.drawImage(I.vec, vec.x - s / 2, vec.y - s / 2, s, s); if (vec.hit) { c.fillStyle = '#fff'; c.font = '800 16px Nunito'; c.fillText('¡AY!', vec.x - 16, vec.y - s / 2); } }
        for (const b of bugs) if (!b.done && I.mos.complete) { const s = W * 0.13; c.save(); c.translate(b.x, b.y); c.scale(b.tx < b.x ? 1 : -1, 1); c.drawImage(I.mos, -s / 2, -s / 2, s, s); c.restore(); }
        for (const s of sparks) { if (s.t <= 0) continue; s.t -= dt; const z = W * (s.big ? 0.3 : 0.18); if (I.zap.complete) c.drawImage(I.zap, s.x - z / 2, s.y - z / 2, z, z); }
        if (I.raq.complete) { const s = W * 0.42; c.save(); c.globalAlpha = rq.on ? 1 : 0.6; c.translate(rq.x, rq.y); c.rotate(0.6); c.drawImage(I.raq, -s * 0.66, -s * 0.66, s, s); c.restore(); }
        c.fillStyle = '#fff'; c.strokeStyle = 'rgba(60,40,20,.8)'; c.lineWidth = 4; c.font = '800 18px Nunito, sans-serif';
        const txt = `${Math.max(0, Math.ceil(DUR - t))} s · fritos ${zapped}${vecHits ? ` · vecina ${vecHits}` : ''}`; c.strokeText(txt, 10, 26); c.fillText(txt, 10, 26);
        if (t >= DUR || (spawned === TOTAL && bugs.every((b) => b.done))) {
          return finish(Math.max(0, Math.min(1, zapped / 11 - vecHits * 0.15)), `${zapped} mosquitos fritos${vecHits ? ` y ${vecHits} calambrazo${vecHits > 1 ? 's' : ''} a la vecina` : ''}.`);
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      goBtn.textContent = 'Arrastra la raqueta'; goBtn.disabled = true;
      cleanup = () => { cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      return null;
    },
    // El café de la cafetera italiana: quítala del fuego justo cuando sube (ni antes ni quemado)
    // y luego llena 3 tazas manteniendo pulsado, hasta su raya.
    cafe() {
      stage.innerHTML = `<div class="moka"><div class="stove"><img class="pot" src="${IMG('mj_moka')}" alt=""><img class="fire" src="${IMG('mj_hornillo')}" alt=""></div><div class="cups"></div><div class="cnt"></div></div>`;
      const pot = stage.querySelector('.pot'); const cups = stage.querySelector('.cups'); const cnt = stage.querySelector('.cnt'); const stove = stage.querySelector('.stove');
      const tUp = 2.6 + rnd() * 2.6; const WIN = 1.5; const t0 = performance.now(); let phase = 'fuego'; let a = 0; let raf = 0;
      const targets = [0.45 + rnd() * 0.15, 0.6 + rnd() * 0.15, 0.75 + rnd() * 0.12]; const fills = [0, 0, 0]; let ci = 0; let pouring = false; let last = 0; const scores = [];
      cnt.textContent = 'Espera a que suba el café…';
      const heat = (t) => {
        const el = (t - t0) / 1000;
        if (el >= tUp) pot.src = IMG('mj_moka_vapor');
        if (el >= tUp + WIN) { stove.classList.add('burnt'); cnt.textContent = '¡Huele a quemado!'; }
        if (el >= tUp + WIN + 1.2) { a = 0; return startCups('Se te ha quemado el café.'); }
        raf = requestAnimationFrame(heat);
      };
      const startCups = (label) => {
        cancelAnimationFrame(raf); phase = 'tazas'; stove.classList.add('off');
        cups.innerHTML = targets.map((tg, i) => `<div class="cup ${i === 0 ? 'cur' : ''}"><img src="${IMG('mj_taza_vacia')}" alt=""><div class="gauge"><div class="fill"></div><div class="line" style="bottom:${tg * 100}%"></div></div></div>`).join('');
        cnt.textContent = `${label} Ahora llena las tazas hasta la raya.`; goBtn.textContent = 'Mantén para servir';
        raf = requestAnimationFrame(pour);
      };
      const pour = (t) => {
        const dt = last ? (t - last) / 1000 : 0; last = t;
        if (pouring && ci < 3) {
          fills[ci] += dt * (0.32 + fills[ci] * 0.5);
          cups.children[ci].querySelector('.fill').style.height = `${Math.min(fills[ci], 1) * 100}%`;
          if (fills[ci] >= 1) { pouring = false; nextCup(); }
        }
        if (ci < 3) raf = requestAnimationFrame(pour);
      };
      const nextCup = () => {
        const d = Math.abs(fills[ci] - targets[ci]); const s = fills[ci] >= 1 ? 0 : fills[ci] < 0.05 ? 0 : d <= 0.04 ? 1 : Math.max(0, 1 - (d - 0.04) / 0.3);
        scores.push(s); const el = cups.children[ci]; el.classList.remove('cur'); if (s > 0.5) el.querySelector('img').src = IMG('mj_taza_llena'); el.classList.add(s > 0.7 ? 'ok' : 'ko');
        ci += 1; if (ci < 3) cups.children[ci].classList.add('cur');
        if (ci >= 3) { const b = scores.reduce((x, y) => x + y, 0) / 3; finish(Math.max(0, Math.min(1, a + 0.6 * b)), a >= 0.35 ? '¡Café en su punto!' : a > 0.1 ? 'El café estaba flojo…' : 'El café sabía a quemado…'); }
      };
      const down = (e) => { if (phase !== 'tazas' || state !== 'running' || ci >= 3) return; e.preventDefault(); pouring = true; };
      const up = () => { if (!pouring) return; pouring = false; nextCup(); };
      goBtn.addEventListener('pointerdown', down); goBtn.addEventListener('pointerup', up); goBtn.addEventListener('pointerleave', up);
      raf = requestAnimationFrame(heat);
      goBtn.textContent = 'Quitar del fuego';
      cleanup = () => { cancelAnimationFrame(raf); goBtn.removeEventListener('pointerdown', down); goBtn.removeEventListener('pointerup', up); goBtn.removeEventListener('pointerleave', up); };
      return () => {
        if (phase !== 'fuego') return;
        const el = (performance.now() - t0) / 1000;
        if (el < tUp) { a = 0.1 * (el / tUp); startCups('¡Aún no había subido!'); }
        else if (el <= tUp + WIN) { a = 0.4; startCups('¡En su punto!'); }
        else { a = 0.05; startCups('Un poco tarde…'); }
      };
    },
    // Las hamacas, como el Simón: cada hamaca tiene su color y su nota. Cada ronda, una más.
    hamacas() {
      const COLORS = [['#E5484D', 262], ['#3E7BFA', 330], ['#30A46C', 392], ['#F5B700', 440], ['#8E4EC6', 523], ['#F76B15', 587]];
      const MAXR = 8; const seq = []; while (seq.length < MAXR) { const n = Math.floor(rnd() * 6); if (n !== seq.at(-1)) seq.push(n); }
      stage.innerHTML = `<div class="hammocks simon">${COLORS.map(([col], n) => `<button class="hm" data-h="${n}" style="--c:${col}" disabled><img src="${IMG('obj_toalla')}" alt=""></button>`).join('')}</div><div class="cnt"></div>`;
      const cells = [...stage.querySelectorAll('.hm')]; const cnt = stage.querySelector('.cnt');
      let ac = null; try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* sin sonido */ }
      const beep = (n, ms = 300) => { if (!ac) return; try { const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.value = COLORS[n][1]; o.type = 'triangle'; g.gain.setValueAtTime(0.15, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + ms / 1000); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + ms / 1000); } catch { /* */ } };
      const flash = (n, ms = 380) => { cells[n].classList.add('lit'); beep(n, ms); setTimeout(() => cells[n].classList.remove('lit'), ms); };
      let round = 3; let k = 0; let listening = false; let tms = [];
      const play = () => {
        listening = false; k = 0; cells.forEach((cl) => { cl.disabled = true; });
        cnt.textContent = `Ronda ${round - 2}: mira bien… (${round} hamacas)`; goBtn.textContent = 'Mira…'; goBtn.disabled = true;
        const gap = Math.max(380, 650 - round * 35);
        for (let i = 0; i < round; i += 1) tms.push(setTimeout(() => flash(seq[i], gap - 120), 600 + i * gap));
        tms.push(setTimeout(() => { listening = true; cells.forEach((cl) => { cl.disabled = false; }); cnt.textContent = `Ronda ${round - 2}: ¡tu turno!`; goBtn.textContent = 'Repite el orden'; }, 600 + round * gap));
      };
      cells.forEach((cl) => {
        cl.onpointerdown = (e) => {
          e.preventDefault(); if (!listening || state !== 'running') return;
          const n = Number(cl.dataset.h); flash(n, 220);
          if (n !== seq[k]) { listening = false; cl.classList.add('bad'); const done = round - 3; return finish(done / (MAXR - 2), done ? `Llegaste a ${round - 1} hamacas seguidas.` : 'A la primera… ¡ni una!'); }
          k += 1;
          if (k === round) {
            listening = false;
            if (round >= MAXR) return finish(1, `¡${MAXR} hamacas seguidas! Memoria de elefante.`);
            round += 1; tms.push(setTimeout(play, 700));
          }
        };
      });
      play();
      cleanup = () => { tms.forEach(clearTimeout); cells.forEach((cl) => { cl.onpointerdown = null; }); try { ac?.close(); } catch { /* */ } };
      return null;
    },
    // Sardinas a la plancha: mueve la plancha para atraparlas y tócalas para servirlas cuando
    // estén doradas. Si las dejas mucho, se queman.
    sardinas() {
      stage.innerHTML = `<div class="sky grill"><div class="plate"><img src="${IMG('sd_plancha')}" alt=""><div class="slots"></div></div><div class="cnt"></div></div>`;
      const sky = stage.querySelector('.sky'); const plate = stage.querySelector('.plate'); const slots = stage.querySelector('.slots'); const cnt = stage.querySelector('.cnt');
      const TOTAL = 12; const COOK = 2.2; const BURN = 5.2;
      let px = 0.5; let raf = 0; let last = 0; let spawned = 0; let nextAt = 600; const fish = []; const onPlate = []; let served = 0; let burnt = 0; let raw = 0; let missed = 0;
      const move = (e) => { const r = sky.getBoundingClientRect(); px = Math.max(0.2, Math.min(0.8, (e.clientX - r.left) / r.width)); };
      sky.addEventListener('pointermove', move); sky.addEventListener('pointerdown', move);
      const serve = (o) => {
        if (o.gone) return; o.gone = true; const i = onPlate.indexOf(o); if (i >= 0) onPlate.splice(i, 1);
        if (o.cook >= BURN) burnt += 1; else if (o.cook >= COOK) served += 1; else raw += 1;
        o.el.classList.add('served'); setTimeout(() => o.el.remove(), 300); layout();
      };
      const layout = () => onPlate.forEach((o, i) => { o.el.style.left = `${12 + i * 25}%`; });
      const loop = (t) => {
        const dt = last ? (t - last) / 1000 : 0; last = t;
        plate.style.left = `${px * 100}%`;
        if (spawned < TOTAL && t >= nextAt) {
          const f = document.createElement('img'); f.src = IMG('sd_cruda'); f.className = 'sardine';
          const o = { el: f, x: 0.12 + rnd() * 0.76, y: -0.1, v: 0.3 + spawned * 0.03 };
          f.style.left = `${o.x * 100}%`; sky.appendChild(f); fish.push(o); spawned += 1; nextAt = t + 1700 - spawned * 60;
        }
        for (const o of fish) {
          if (o.done) continue; o.y += o.v * dt; o.el.style.top = `${o.y * 100}%`;
          if (o.y >= 0.74) {
            o.done = true;
            if (Math.abs(o.x - px) < 0.19 && onPlate.length < 4) {
              o.el.remove(); const s = document.createElement('img'); s.className = 'grilled'; s.src = IMG('sd_cruda'); slots.appendChild(s);
              const g = { el: s, cook: 0, gone: false }; onPlate.push(g); layout();
              s.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); serve(g); });
            } else { missed += 1; o.el.classList.add('miss'); setTimeout(() => o.el.remove(), 300); }
          }
        }
        for (const g of onPlate) {
          g.cook += dt; const img = g.cook >= BURN ? 'sd_quemada' : g.cook >= COOK ? 'sd_hecha' : 'sd_cruda';
          if (!g.el.src.endsWith(`${img}.webp`)) g.el.src = IMG(img);
          g.el.classList.toggle('ready', g.cook >= COOK && g.cook < BURN);
          if (g.cook >= BURN + 2.5) serve(g);
        }
        cnt.textContent = `Servidas ${served} · quemadas ${burnt}`;
        if (spawned === TOTAL && fish.every((o) => o.done) && !onPlate.length) {
          return finish(Math.max(0, Math.min(1, (served - raw * 0.3) / (TOTAL * 0.75))), `${served} sardinas en su punto, ${burnt} quemadas y ${missed} al suelo.`);
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      goBtn.textContent = 'Mueve la plancha · toca las doradas'; goBtn.disabled = true;
      cleanup = () => { cancelAnimationFrame(raf); sky.removeEventListener('pointermove', move); sky.removeEventListener('pointerdown', move); };
      return null;
    },
    // La barra del chiringuito: tres clientes a la vez piden con un dibujo; arrastra (o toca
    // y toca) lo que pide cada uno antes de que se canse.
    chiringuito() {
      const MENU = ['ch_cana', 'ch_tinto', 'ch_helado', 'ch_bocata', 'ch_granizado'];
      const TOTAL = 15; let made = 0; let served = 0; let angry = 0; let raf = 0; let sel = null; let drag = null;
      const seats = [null, null, null]; const plan = Array.from({ length: TOTAL }, () => ({ want: Math.floor(rnd() * MENU.length), face: AVATARS[Math.floor(rnd() * AVATARS.length)], seat: Math.floor(rnd() * 3) }));
      stage.innerHTML = `<div class="barra">${seats.map((_, i) => `<div class="seat" data-s="${i}"><div class="who"></div></div>`).join('')}<div class="cnt"></div></div>`;
      ctrl.innerHTML = `<div class="tray2">${MENU.map((m, i) => `<button class="dk" data-d="${i}"><img src="${IMG(m)}" alt=""></button>`).join('')}</div>`;
      const seatEls = [...stage.querySelectorAll('.seat')]; const cnt = stage.querySelector('.cnt');
      let nextAt = performance.now() + 400;
      const sit = (i) => {
        if (made >= TOTAL) return; const p = plan[made]; made += 1;
        const life = 7000 - made * 220; seats[i] = { ...p, t0: performance.now(), life };
        seatEls[i].querySelector('.who').innerHTML = `<div class="bubble2"><img src="${IMG(MENU[p.want])}" alt=""></div><img class="face" src="${IMG(p.face)}" alt=""><div class="qbar"><i></i></div>`;
        seatEls[i].className = 'seat in';
      };
      const leave = (i, ok) => {
        if (!seats[i]) return; if (ok) served += 1; else angry += 1;
        seatEls[i].className = `seat ${ok ? 'happy' : 'angry'}`; seatEls[i].querySelector('.bubble2').innerHTML = ok ? '😋' : '😠';
        seats[i] = null; setTimeout(() => { if (!seats[i]) { seatEls[i].className = 'seat'; seatEls[i].querySelector('.who').innerHTML = ''; } }, 600);
      };
      const give = (d, i) => { if (seats[i] == null || state !== 'running') return; leave(i, seats[i].want === d); sel = null; paintSel(); };
      const paintSel = () => ctrl.querySelectorAll('.dk').forEach((b, k) => b.classList.toggle('sel', k === sel));
      const loop = (t) => {
        if (t >= nextAt && made < TOTAL) { const free = seats.map((s, i) => (s ? -1 : i)).filter((i) => i >= 0); if (free.length) sit(free[Math.floor(rnd() * free.length)]); nextAt = t + Math.max(700, 1700 - made * 70); }
        seats.forEach((s, i) => { if (!s) return; const left = 1 - (t - s.t0) / s.life; const bar = seatEls[i].querySelector('.qbar i'); if (bar) bar.style.width = `${Math.max(0, left) * 100}%`; if (left <= 0) leave(i, false); });
        cnt.textContent = `Contentos ${served} · enfadados ${angry}`;
        if (made >= TOTAL && seats.every((s) => !s)) return finish(served / TOTAL, `${served} de ${TOTAL} clientes contentos.`);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      const pd = (e) => {
        const b = e.target.closest('[data-d]'); if (!b || state !== 'running') return; e.preventDefault();
        sel = Number(b.dataset.d); paintSel();
        const g = document.createElement('img'); g.src = IMG(MENU[sel]); g.className = 'drag-ghost'; document.body.appendChild(g);
        drag = { g, moved: false }; g.style.left = `${e.clientX}px`; g.style.top = `${e.clientY}px`;
      };
      const pm = (e) => { if (!drag) return; drag.moved = true; drag.g.style.left = `${e.clientX}px`; drag.g.style.top = `${e.clientY}px`; };
      const pu = (e) => {
        if (!drag) return; drag.g.remove(); const was = drag; drag = null;
        const seat = document.elementFromPoint(e.clientX, e.clientY)?.closest('.seat');
        if (seat && was.moved) give(sel, Number(seat.dataset.s));
      };
      const tapSeat = (e) => { const seat = e.target.closest('.seat'); if (!seat || sel == null) return; give(sel, Number(seat.dataset.s)); };
      ctrl.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu); stage.addEventListener('click', tapSeat);
      goBtn.textContent = 'Arrastra lo que piden'; goBtn.disabled = true;
      cleanup = () => { cancelAnimationFrame(raf); ctrl.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); stage.removeEventListener('click', tapSeat); document.querySelectorAll('.drag-ghost').forEach((x) => x.remove()); };
      return null;
    },
    // Aguantar la sombrilla 15 s contra las rachas: inclina el móvil hacia el lado contrario
    // del viento, o arrastra el dedo hacia ese lado.
    sombrilla() {
      const DUR = 15; const gusts = Array.from({ length: 20 }, (_, k) => (rnd() < 0.5 ? -1 : 1) * (18 + rnd() * (10 + k * 2.5)));
      stage.innerHTML = `<div class="umb"><img class="pole" src="${IMG('mj_sombrilla')}" alt=""><div class="windfx"></div><div class="wind"></div><div class="cnt"></div></div>`;
      const pole = stage.querySelector('.pole'); const windEl = stage.querySelector('.wind'); const cnt = stage.querySelector('.cnt'); const box = stage.querySelector('.umb'); const fx = stage.querySelector('.windfx');
      let angle = 0; let vel = 0; let control = 0; let touching = false; let tilt = null; let inZone = 0; let raf = 0; let last = 0; const t0 = performance.now();
      const onTilt = (e) => { if (e.gamma != null) tilt = Math.max(-1, Math.min(1, e.gamma / 25)); };
      const listenTilt = () => window.addEventListener('deviceorientation', onTilt);
      try {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          DeviceOrientationEvent.requestPermission().then((r) => { if (r === 'granted') listenTilt(); }).catch(() => {});
        } else listenTilt();
      } catch { /* sin sensor: se juega con el dedo */ }
      const drag = (e) => { const r = box.getBoundingClientRect(); control = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2.4)); };
      const pd = (e) => { e.preventDefault(); touching = true; drag(e); };
      const pm = (e) => { if (touching) drag(e); };
      const up = () => { touching = false; control = 0; };
      box.addEventListener('pointerdown', pd); box.addEventListener('pointermove', pm); window.addEventListener('pointerup', up);
      goBtn.textContent = 'Aguanta…'; goBtn.disabled = true;
      const loop = (t) => {
        const dt = last ? Math.min((t - last) / 1000, 0.05) : 0; last = t;
        const el = (t - t0) / 1000; const g = gusts[Math.min(gusts.length - 1, Math.floor(el / 1.1))];
        const ctl = touching ? control : tilt ?? 0;
        vel += (g + angle * 1.1 + ctl * 120) * dt; vel *= 0.94; angle += vel * dt;
        pole.style.transform = `rotate(${angle}deg)`;
        windEl.textContent = `Viento ${g > 0 ? '→' : '←'} ${Math.round(Math.abs(g) / 8)}`;
        fx.className = `windfx ${g > 0 ? 'r' : 'l'}`;
        if (Math.abs(angle) <= 15) inZone += dt;
        cnt.textContent = `${Math.max(0, DUR - el).toFixed(1)} s · recta ${inZone.toFixed(1)} s${tilt == null ? ' · usa el dedo' : ''}`;
        box.classList.toggle('ok', Math.abs(angle) <= 15);
        if (Math.abs(angle) > 70) return finish(inZone / DUR, `¡Se ha volado! Aguantó recta ${inZone.toFixed(1)} s.`);
        if (el >= DUR) return finish(Math.min(1, inZone / (DUR * 0.9)), `Aguantó recta ${inZone.toFixed(1)} de ${DUR} s.`);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      cleanup = () => { cancelAnimationFrame(raf); window.removeEventListener('deviceorientation', onTilt); box.removeEventListener('pointerdown', pd); box.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', up); };
      return null;
    },
    // Que no se despierte nadie (secreto del Joputa): la lógica está en sigilo.js
    sigilo() {
      const rect = stage.getBoundingClientRect();
      const W = Math.round(Math.min(rect.width - 8, 420)); const H = Math.round(Math.min(rect.height - 8, W * 1.45));
      const w = SIG.makeWorld(Math.random, W, H);
      stage.innerHTML = `<canvas style="width:${W}px;height:${H}px;touch-action:none;border:3px solid var(--line);border-radius:18px;background:#16233f"></canvas>`;
      const cv = stage.querySelector('canvas'); const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
      const I = { taper: loadImg('sg_taper'), nevera: loadImg('sg_nevera'), lata: loadImg('sg_lata'), tienda: loadImg('sg_tienda'), caravana: loadImg('sg_caravana'), campista: loadImg('sg_campista'), cesped: loadImg('sg_cesped') };
      let target = null;
      const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }; };
      const down = (e) => { e.preventDefault(); target = pos(e); try { cv.setPointerCapture(e.pointerId); } catch { /* sin captura */ } };
      const move = (e) => { if (target) target = pos(e); };
      const up = () => { target = null; };
      cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move);
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      goBtn.textContent = 'Arrastra el dedo'; goBtn.disabled = true;
      const fit = (img, cx, cy, w2) => { if (!img.complete || !img.naturalWidth) return; const h2 = (w2 * img.naturalHeight) / img.naturalWidth; c.drawImage(img, cx - w2 / 2, cy - h2 / 2, w2, h2); };
      const draw = () => {
        c.clearRect(0, 0, W, H);
        if (I.cesped.complete) c.drawImage(I.cesped, -W * 0.03, -H * 0.03, W * 1.06, H * 1.06);
        c.fillStyle = 'rgba(10,20,45,.35)'; c.fillRect(0, 0, W, H);
        for (const g2 of w.guards) {
          const pts = SIG.beam(w, g2); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
          for (const [x, y] of pts.slice(1)) c.lineTo(x, y);
          c.closePath(); c.fillStyle = 'rgba(255,226,110,.36)'; c.fill();
        }
        for (const t of w.tents) fit(t.kind === 'caravana' ? I.caravana : I.tienda, t.x, t.y, t.r * (t.kind === 'caravana' ? 2.7 : 2.4));
        for (const k of w.cans) fit(I.lata, k.x, k.y, k.r * 3.4);
        for (const g2 of w.guards) {   // el campista gira con su linterna (en el dibujo apunta hacia abajo a la izquierda)
          const img = I.campista; if (!img.complete || !img.naturalWidth) continue;
          const sh = W * 0.2; const sw = (sh * img.naturalWidth) / img.naturalHeight;
          c.save(); c.translate(g2.x, g2.y); c.rotate(g2.a - 2.12); c.drawImage(img, -sw * 0.68, -sh * 0.25, sw, sh); c.restore();
        }
        fit(I.nevera, w.goal.x, w.goal.y, w.R * 2.8);
        if (w.expo > 0) { c.beginPath(); c.arc(w.p.x, w.p.y, w.R * 1.4, 0, Math.PI * 2); c.fillStyle = `rgba(214,64,52,${Math.min(0.8, w.expo / SIG.EXPOSE)})`; c.fill(); }
        fit(I.taper, w.p.x, w.p.y, w.R * 2.6);
        c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 4; c.font = '800 18px Nunito, sans-serif'; const tt = `${Math.max(0, Math.ceil(SIG.LIMIT - w.t))} s`; c.strokeText(tt, 10, 24); c.fillText(tt, 10, 24);
      };
      let raf = 0; let last = 0;
      const loop = (t) => {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
        const st = SIG.step(w, target, dt); draw();
        if (st === 'playing') { raf = requestAnimationFrame(loop); return; }
        const label = { nevera: `¡Táper en la nevera en ${w.t.toFixed(1)} s!`, pillado: '¡Te ha pillado una linterna!', lata: '¡Has pisado una lata! Medio camping despierto.', tiempo: 'Se ha hecho de día.' }[st];
        finish(SIG.score(w), label);
      };
      raf = requestAnimationFrame(loop);
      cleanup = () => { cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); };
      return null;
    },
    // La ruta del camping (lógica, como el Zip): un solo trazo que pasa por las 36
    // casillas y por los números en orden. Cuanto antes, más puntos.
    ruta() {
      const N = 6; const CELLS = N * N;
      const nb = (c) => { const r = Math.floor(c / N); const k = c % N; return [[r - 1, k], [r + 1, k], [r, k - 1], [r, k + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N).map(([a, b]) => a * N + b); };
      // camino hamiltoniano aleatorio (heurística de Warnsdorff), con reintentos
      let path = null;
      for (let tries = 0; tries < 200 && !path; tries += 1) {
        const seen = new Set(); let cur = Math.floor(rnd() * CELLS); const p = [cur]; seen.add(cur);
        while (p.length < CELLS) {
          const opts2 = nb(cur).filter((x) => !seen.has(x));
          if (!opts2.length) break;
          const deg = (x) => nb(x).filter((y) => !seen.has(y) && y !== x).length;
          const minDeg = Math.min(...opts2.map(deg));
          const best = opts2.filter((x) => deg(x) === minDeg);     // sin sort aleatorio: igual en todos los navegadores
          cur = best[Math.floor(rnd() * best.length)]; p.push(cur); seen.add(cur);
        }
        if (p.length === CELLS) path = p;
      }
      // carteles: el 1 al principio, el último al final y 6 intermedios
      const marks = [0];
      for (let i = 1; i <= 6; i += 1) marks.push(Math.min(CELLS - 2, Math.round((i * (CELLS - 1)) / 7 + (rnd() - 0.5) * 3)));
      marks.push(CELLS - 1);
      const uniq = [...new Set(marks)].sort((a, b) => a - b);
      const num = new Map(uniq.map((idx, i) => [path[idx], i + 1])); const LAST = uniq.length;
      stage.innerHTML = `<div class="zip"><div class="zip-grid">${Array.from({ length: CELLS }, (_, c) =>
        `<div class="zc" data-c="${c}">${num.has(c) ? `<b>${num.get(c)}</b>` : ''}</div>`).join('')}</div><div class="zip-time">0 s</div></div>`;
      const cells = [...stage.querySelectorAll('.zc')]; const grid = stage.querySelector('.zip-grid'); const clock = stage.querySelector('.zip-time');
      const t0 = performance.now(); let route = []; let down = false; let doneFlag = false;
      const timer = setInterval(() => { clock.textContent = `${Math.floor((performance.now() - t0) / 1000)} s`; }, 250);
      const nextNum = () => { let n = 1; for (const c of route) if (num.has(c)) n = num.get(c) + 1; return n; };
      const draw = () => {
        cells.forEach((el, c) => { el.classList.toggle('on', route.includes(c)); el.classList.toggle('head', route.at(-1) === c); el.style.setProperty('--i', route.indexOf(c)); });
        grid.querySelectorAll('.lnk').forEach((x) => x.remove());
        for (let i = 1; i < route.length; i += 1) {
          const a = route[i - 1]; const b = route[i]; const l = document.createElement('i'); l.className = 'lnk';
          const r = Math.min(Math.floor(a / N), Math.floor(b / N)); const k = Math.min(a % N, b % N); const hor = Math.floor(a / N) === Math.floor(b / N);
          l.style.left = `calc(${(k + (hor ? 0.5 : 0.5)) * (100 / N)}% - ${hor ? 0 : 6}px)`; l.style.top = `calc(${(r + (hor ? 0.5 : 0.5)) * (100 / N)}% - ${hor ? 6 : 0}px)`;
          l.style.width = hor ? `${100 / N}%` : '12px'; l.style.height = hor ? '12px' : `${100 / N}%`;
          grid.appendChild(l);
        }
      };
      const tryAdd = (c) => {
        if (doneFlag || c == null) return;
        if (!route.length) { if (num.get(c) === 1) { route = [c]; draw(); } return; }
        const head = route.at(-1);
        if (c === head) return;
        if (route.length > 1 && c === route.at(-2)) { route.pop(); draw(); return; }        // volver atrás
        const at = route.indexOf(c);
        if (at >= 0) { route = route.slice(0, at + 1); draw(); return; }                       // recortar hasta ahí
        if (!nb(head).includes(c)) return;
        if (num.has(c) && num.get(c) !== nextNum()) return;                                   // los números, en orden
        route.push(c); draw();
        if (route.length === CELLS && num.get(c) === LAST) {
          doneFlag = true; const t = (performance.now() - t0) / 1000;
          finish(t <= 25 ? 1 : Math.max(0.15, 1 - (t - 25) / 95), `¡Ruta completa en ${Math.round(t)} s!`);
        }
      };
      const cellAt = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.zc'); return el ? Number(el.dataset.c) : null; };
      const pd = (e) => { e.preventDefault(); down = true; grid.setPointerCapture?.(e.pointerId); tryAdd(cellAt(e)); };
      const pm = (e) => { if (down) tryAdd(cellAt(e)); };
      const pu = () => { down = false; };
      grid.addEventListener('pointerdown', pd); grid.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu);
      goBtn.textContent = 'Rendirse';
      cleanup = () => { clearInterval(timer); grid.removeEventListener('pointerdown', pd); grid.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); };
      return () => finish(0, `Te has rendido con ${route.length} de ${CELLS} casillas.`);
    },
    // Cotilleo exprés: 5 preguntas sobre hechos públicos de los últimos días
    cotilleo() {
      goBtn.textContent = 'Preparando preguntas…'; goBtn.disabled = true;
      stage.innerHTML = '<div class="quiz"><div class="qn"></div><div class="qt"></div><div class="qbar"><i></i></div><div class="qopts"></div></div>';
      const qn = stage.querySelector('.qn'); const qt = stage.querySelector('.qt'); const qo = stage.querySelector('.qopts'); const bar = stage.querySelector('.qbar i');
      const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
      const name = (id) => player(id)?.name;
      const dayName = (d) => new Intl.DateTimeFormat('es-ES', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${String(d).slice(0, 10)}T12:00:00Z`));
      const others = (excl, n = 3) => shuffle(S.st.players.map((p) => p.name).filter((x) => !excl.includes(x))).slice(0, n);
      let tm = 0; let raf = 0; let alive = true;
      cleanup = () => { alive = false; clearTimeout(tm); cancelAnimationFrame(raf); };
      api.rpc('jp_cotilleo', { p_group: S.groupId }).catch(() => ({})).then((d) => {
        if (!alive) return;
        const qs = [];
        for (const a of d.asaltos || []) {
          if (name(a.by) && name(a.to)) {
            const same = (d.asaltos || []).filter((x) => x.by === a.by && x.day === a.day).map((x) => name(x.to));
            qs.push([`¿A quién asaltó ${name(a.by)} el ${dayName(a.day)}?`, name(a.to), others([name(a.by), ...same])]);
            const who = (d.asaltos || []).filter((x) => x.to === a.to && x.day === a.day).map((x) => name(x.by));
            qs.push([`¿Quién asaltó a ${name(a.to)} el ${dayName(a.day)}?`, name(a.by), others([name(a.to), ...who])]);
          }
        }
        for (const w of d.ganadores || []) if (name(w.id)) qs.push([`¿Quién ganó el día del ${dayName(w.day)} en el café?`, name(w.id), others([name(w.id)])]);
        for (const j of d.juegos || []) {
          if (!name(j.id) || !GAMES[j.game]) continue;
          const played = (d.juegos || []).filter((x) => x.id === j.id && x.day === j.day).map((x) => x.game);
          qs.push([`¿A qué jugó ${name(j.id)} el ${dayName(j.day)}?`, GAMES[j.game].name, shuffle(Object.keys(GAMES).filter((k) => !played.includes(k))).slice(0, 3).map((k) => GAMES[k].name)]);
        }
        for (const u of d.duelos || []) if (name(u.win) && name(u.lose)) qs.push([`¿Quién ganó el duelo de ${GAMES[u.game]?.name || u.game} entre ${name(u.win)} y ${name(u.lose)}?`, name(u.win), [name(u.lose)]]);
        let pick = shuffle(qs).slice(0, 5);
        if (pick.length < 5) pick = pick.concat(shuffle(RULES_TRIVIA).slice(0, 5 - pick.length));
        let i = 0; let total = 0; let ok = 0; const LIMIT = 8000;
        const ask = () => {
          if (i >= pick.length) return finish(total, `${ok} de ${pick.length} aciertos.`);
          const [q, correct, wrong] = pick[i]; const opts3 = shuffle([correct, ...wrong.filter(Boolean).slice(0, 3)]);
          qn.textContent = `Pregunta ${i + 1} de ${pick.length}`; qt.textContent = q;
          qo.innerHTML = opts3.map((o) => `<button class="qo">${esc(o)}</button>`).join('');
          const t0 = performance.now();
          const tick = () => { const left = Math.max(0, 1 - (performance.now() - t0) / LIMIT); bar.style.width = `${left * 100}%`; if (left > 0) raf = requestAnimationFrame(tick); };
          raf = requestAnimationFrame(tick);
          const answer = (btn) => {
            if (!alive) return; cancelAnimationFrame(raf); clearTimeout(tm);
            const el = performance.now() - t0; const good = btn && btn.textContent === correct;
            qo.querySelectorAll('.qo').forEach((b) => { b.disabled = true; if (b.textContent === correct) b.classList.add('good'); });
            if (btn && !good) btn.classList.add('bad');
            if (good) { ok += 1; total += 0.2 * (0.5 + 0.5 * Math.max(0, 1 - el / LIMIT)); }
            i += 1; tm = setTimeout(ask, 700);
          };
          qo.querySelectorAll('.qo').forEach((b) => { b.onclick = () => answer(b); });
          tm = setTimeout(() => answer(null), LIMIT);
        };
        goBtn.textContent = 'Contestando…';
        ask();
      });
      return null;
    },
    // Toallas en la piscina: encajar piezas en las tumbonas libres (5×5)
    toallas() {
      const N = 5; const cellsN = N * N;
      const blocked = new Set(); const nBlock = 3 + Math.floor(rnd() * 3);
      while (blocked.size < nBlock) blocked.add(Math.floor(rnd() * cellsN));
      const owner = new Array(cellsN).fill(-1); const pieces = [];
      const nb = (c) => { const r = Math.floor(c / N); const k = c % N; return [[r - 1, k], [r + 1, k], [r, k - 1], [r, k + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N).map(([a, b]) => a * N + b); };
      const free = []; for (let c = 0; c < cellsN; c += 1) if (!blocked.has(c)) free.push(c);
      for (const c0 of free) {
        if (owner[c0] !== -1) continue;
        const want = 2 + Math.floor(rnd() * 3); const cells = [c0]; owner[c0] = pieces.length;
        while (cells.length < want) {
          const cand = cells.flatMap(nb).filter((x) => !blocked.has(x) && owner[x] === -1);
          if (!cand.length) break;
          const x = cand[Math.floor(rnd() * cand.length)]; owner[x] = pieces.length; cells.push(x);
        }
        pieces.push(cells);
      }
      // una toalla de una sola casilla se une a una vecina
      for (let i = pieces.length - 1; i >= 0; i -= 1) {
        if (pieces[i].length !== 1) continue;
        const nbOwner = nb(pieces[i][0]).map((x) => owner[x]).filter((o) => o >= 0 && o !== i && pieces[o].length < 5);
        if (!nbOwner.length) continue;
        const into = nbOwner[0]; pieces[into].push(pieces[i][0]); pieces.splice(i, 1);
        owner.fill(-1); pieces.forEach((cs, k) => cs.forEach((c) => { owner[c] = k; }));
      }
      const norm = (pts) => { const r0 = Math.min(...pts.map((p) => p[0])); const c0 = Math.min(...pts.map((p) => p[1])); return pts.map(([r, c]) => [r - r0, c - c0]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
      const rot = (pts) => norm(pts.map(([r, c]) => [c, -r]));
      const shapes = pieces.map((cells) => { let sh = norm(cells.map((c) => [Math.floor(c / N), c % N])); const turns = Math.floor(rnd() * 4); for (let t = 0; t < turns; t += 1) sh = rot(sh); return sh; });
      const placed = new Map(); let sel = null;                     // pieza -> celdas que ocupa
      const occ = () => { const m = new Map(); for (const [pi, cs] of placed) for (const c of cs) m.set(c, pi); return m; };
      const hue = (i) => `hsl(${(i * 67) % 360} 70% 62%)`;
      stage.innerHTML = '<div class="pool"><div class="pool-grid"></div><div class="tray"></div><div class="zip-time">0 s</div></div>';
      ctrl.innerHTML = '<button class="btn ghost block" data-rot>↻ Girar toalla</button>';
      const grid = stage.querySelector('.pool-grid'); const tray = stage.querySelector('.tray'); const clock = stage.querySelector('.zip-time');
      const t0 = performance.now(); const timer = setInterval(() => { clock.textContent = `${Math.floor((performance.now() - t0) / 1000)} s`; }, 250);
      const render = () => {
        const o = occ();
        grid.innerHTML = Array.from({ length: cellsN }, (_, c) => `<button class="pc ${blocked.has(c) ? 'blk' : ''}" data-c="${c}" style="${o.has(c) ? `background:${hue(o.get(c))}` : ''}">${blocked.has(c) ? '🧍' : ''}</button>`).join('');
        tray.innerHTML = shapes.map((sh, i) => placed.has(i) ? '' : `<button class="piece ${sel === i ? 'sel' : ''}" data-p="${i}" style="--w:${Math.max(...sh.map((p) => p[1])) + 1};--h:${Math.max(...sh.map((p) => p[0])) + 1}">${sh.map(([r, c]) => `<i style="grid-row:${r + 1};grid-column:${c + 1};background:${hue(i)}"></i>`).join('')}</button>`).join('');
      };
      const onClick = (e) => {
        if (state !== 'running') return;
        const pb = e.target.closest('[data-p]'); const cb = e.target.closest('[data-c]'); const rb = e.target.closest('[data-rot]');
        if (rb && sel != null) { shapes[sel] = rot(shapes[sel]); render(); return; }
        if (pb) { sel = Number(pb.dataset.p); render(); return; }
        if (!cb) return;
        const c = Number(cb.dataset.c); const o = occ();
        if (o.has(c)) { placed.delete(o.get(c)); sel = o.get(c); render(); return; }
        if (sel == null || blocked.has(c)) return;
        const r = Math.floor(c / N); const k = c % N; let ids = null;
        for (const [ar, ac] of shapes[sel]) {          // la casilla tocada puede ser cualquiera de la toalla
          const target = shapes[sel].map(([pr, pc]) => [r + pr - ar, k + pc - ac]);
          if (target.some(([a, b]) => a < 0 || b < 0 || a >= N || b >= N)) continue;
          const cand = target.map(([a, b]) => a * N + b);
          if (cand.some((x) => blocked.has(x) || o.has(x))) continue;
          ids = cand; break;
        }
        if (!ids) { cb.classList.add('nope'); setTimeout(() => cb.classList.remove('nope'), 250); return; }
        placed.set(sel, ids); sel = shapes.findIndex((_, i) => !placed.has(i)); if (sel < 0) sel = null; render();
        if (placed.size === shapes.length) {
          const t = (performance.now() - t0) / 1000;
          finish(t <= 30 ? 1 : Math.max(0.15, 1 - (t - 30) / 90), `¡Todas colocadas en ${Math.round(t)} s!`);
        }
      };
      sel = 0; render();
      ov.addEventListener('click', onClick);
      goBtn.textContent = 'Rendirse';
      cleanup = () => { clearInterval(timer); ov.removeEventListener('click', onClick); };
      return () => { const done = [...placed.values()].reduce((a, x) => a + x.length, 0); finish(0.5 * done / free.length, `Te has rendido con ${done} de ${free.length} huecos.`); };
    },
    // Sopa de letras con las palabras del grupo y del camping
    sopa() {
      const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
      const own = (S.st.group.words || []).map((w) => [w, soupWord(w)]).filter(([, x]) => x.length >= 3 && x.length <= 12);
      const camp = CAMPING_WORDS.map((w) => [w, soupWord(w)]);
      const chosen = [];
      for (const [w, x] of [...shuffle(own).slice(0, 4), ...shuffle(camp)]) { if (chosen.length >= 6) break; if (!chosen.some((c) => c[1] === x)) chosen.push([w, x]); }
      const N = Math.max(9, ...chosen.map((c) => c[1].length));
      const grid = Array(N * N).fill(''); const dirs = [[0, 1], [1, 0], [1, 1]];   // solo en sentido de lectura: → ↓ ↘
      const words = [];
      for (const [w, x] of chosen) {
        for (let t = 0; t < 300; t += 1) {
          const [dr, dc] = dirs[Math.floor(rnd() * dirs.length)]; const r0 = Math.floor(rnd() * N); const c0 = Math.floor(rnd() * N);
          const cells = [...x].map((_, k) => [r0 + dr * k, c0 + dc * k]);
          if (cells.some(([r, c]) => r < 0 || c < 0 || r >= N || c >= N)) continue;
          if (cells.some(([r, c], k) => grid[r * N + c] && grid[r * N + c] !== x[k])) continue;
          cells.forEach(([r, c], k) => { grid[r * N + c] = x[k]; });
          words.push({ w, x, cells: cells.map(([r, c]) => r * N + c), found: false });
          break;
        }
      }
      const AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let k = 0; k < grid.length; k += 1) if (!grid[k]) grid[k] = AB[Math.floor(rnd() * AB.length)];
      stage.innerHTML = `<div class="soup"><div class="soup-grid" style="--n:${N}">${grid.map((ch, k) => `<div class="sc" data-c="${k}">${ch}</div>`).join('')}</div>
        <div class="soup-words"></div><div class="zip-time">0 s</div></div>`;
      const g = stage.querySelector('.soup-grid'); const list = stage.querySelector('.soup-words'); const clock = stage.querySelector('.zip-time');
      const cellsEl = [...g.querySelectorAll('.sc')];
      const drawList = () => { list.innerHTML = words.map((o) => (o.found ? `<span class="got">${esc(o.w)}</span>` : `<span class="hid">${'·'.repeat(o.x.length)} <small>(${o.x.length})</small></span>`)).join(''); };
      drawList();
      const t0 = performance.now(); const timer = setInterval(() => { clock.textContent = `${Math.floor((performance.now() - t0) / 1000)} s`; }, 250);
      let a = null; let line = [];
      const lineOf = (s0, e0) => {
        const r1 = Math.floor(s0 / N); const c1 = s0 % N; const r2 = Math.floor(e0 / N); const c2 = e0 % N;
        const dr = Math.sign(r2 - r1); const dc = Math.sign(c2 - c1); const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
        if (!(r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1))) return [s0];
        return Array.from({ length: len + 1 }, (_, k) => (r1 + dr * k) * N + (c1 + dc * k));
      };
      const paint = () => cellsEl.forEach((el, k) => el.classList.toggle('sel', line.includes(k)));
      const cellAt = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.sc'); return el ? Number(el.dataset.c) : null; };
      const pd = (e) => { if (state !== 'running') return; e.preventDefault(); const c = cellAt(e); if (c == null) return; a = c; line = [c]; paint(); g.setPointerCapture?.(e.pointerId); };
      const pm = (e) => { if (a == null) return; const c = cellAt(e); if (c == null) return; line = lineOf(a, c); paint(); };
      const pu = () => {
        if (a == null) return;
        const str = line.map((k) => grid[k]).join(''); const rev = [...str].reverse().join('');
        const hit = words.find((o) => !o.found && (o.x === str || o.x === rev) && o.cells.length === line.length);
        if (hit) { hit.found = true; hit.cells.forEach((k) => cellsEl[k].classList.add('found')); drawList(); }
        a = null; line = []; paint();
        if (words.every((o) => o.found)) { const t = (performance.now() - t0) / 1000; finish(t <= 45 ? 1 : Math.max(0.15, 1 - (t - 45) / 135), `¡Todas en ${Math.round(t)} s!`); }
      };
      g.addEventListener('pointerdown', pd); g.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu);
      goBtn.textContent = 'Rendirse';
      cleanup = () => { clearInterval(timer); g.removeEventListener('pointerdown', pd); g.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); };
      return () => { const f = words.filter((o) => o.found).length; finish(0.5 * f / words.length, `Te has rendido con ${f} de ${words.length} palabras.`); };
    },
    // Encestar en la papelera: tirachinas con gravedad y viento, 5 tiros
    papelera() {
      const SHOTS = 5; let shot = 0; let hits = 0; let raf = 0; let flying = false;
      stage.innerHTML = '<div class="throw"><div class="wind"></div><div class="bin">🗑️</div><div class="paper">📄</div><div class="aim"></div><div class="cnt"></div></div>';
      const box = stage.querySelector('.throw'); const bin = stage.querySelector('.bin'); const paper = stage.querySelector('.paper');
      const windEl = stage.querySelector('.wind'); const aim = stage.querySelector('.aim'); const cnt = stage.querySelector('.cnt');
      const plan = Array.from({ length: SHOTS }, (_, k) => ({ bx: rnd() < 0.5 ? 0.12 + rnd() * 0.24 : 0.64 + rnd() * 0.24, wind: (rnd() * 2 - 1) * (0.25 + k * 0.12) }));
      let cur; let p; let start = null;
      const setup = () => {
        if (shot >= SHOTS) return finish(hits / SHOTS, `${hits} de ${SHOTS} canastas.`);
        cur = plan[shot]; p = { x: 0.5, y: 0.86 };
        bin.style.left = `${cur.bx * 100}%`;
        windEl.textContent = `Viento ${cur.wind > 0.03 ? '→' : cur.wind < -0.03 ? '←' : '·'} ${Math.abs(Math.round(cur.wind * 10))}`;
        cnt.textContent = `Tiro ${shot + 1} de ${SHOTS} · canastas ${hits}`;
        paper.style.left = `${p.x * 100}%`; paper.style.top = `${p.y * 100}%`; paper.className = 'paper';
      };
      const rect = () => box.getBoundingClientRect();
      const pd = (e) => { if (flying || state !== 'running') return; e.preventDefault(); start = { x: e.clientX, y: e.clientY }; box.setPointerCapture?.(e.pointerId); };
      const pm = (e) => { if (!start) return; const dx = start.x - e.clientX; const dy = start.y - e.clientY; aim.style.cssText = `left:${p.x * 100}%;top:${p.y * 100}%;width:${Math.hypot(dx, dy)}px;transform:rotate(${Math.atan2(dy, dx)}rad)`; };
      const pu = (e) => {
        if (!start) return;
        const r = rect(); const vx = ((start.x - e.clientX) / r.width) * 2.6; const vy = ((start.y - e.clientY) / r.height) * 2.6; start = null; aim.style.cssText = '';
        if (Math.hypot(vx, vy) < 0.15) return;
        flying = true; let last = 0; let v = { x: vx, y: vy };
        const fly = (t) => {
          const dt = last ? Math.min((t - last) / 1000, 0.05) : 0; last = t;
          v.x += cur.wind * 0.9 * dt; v.y += 1.7 * dt; const py = p.y; p.x += v.x * dt; p.y += v.y * dt;
          paper.style.left = `${p.x * 100}%`; paper.style.top = `${p.y * 100}%`;
          if (v.y > 0 && py < 0.8 && p.y >= 0.8 && Math.abs(p.x - cur.bx) < 0.065) { hits += 1; paper.className = 'paper in'; return end(true); }
          if (p.y > 1.05 || p.x < -0.1 || p.x > 1.1) return end(false);
          raf = requestAnimationFrame(fly);
        };
        const end = (ok) => { cnt.textContent = ok ? '¡Dentro!' : 'Fuera…'; shot += 1; setTimeout(() => { flying = false; setup(); }, 650); };
        raf = requestAnimationFrame(fly);
      };
      box.addEventListener('pointerdown', pd); box.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu);
      goBtn.textContent = 'Arrastra y suelta'; goBtn.disabled = true;
      setup();
      cleanup = () => { cancelAnimationFrame(raf); box.removeEventListener('pointerdown', pd); box.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); };
      return null;
    },
  };

  let action = null;
  stage.innerHTML = `<img class="sprite" src="${IMG(g.sprite)}" alt="">`;
  ov.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mg]'); if (!b) return;
    if (b.dataset.mg === 'close') { if (state !== 'sending') close(); return; }
    if (state === 'ready') { state = 'running'; action = games[kind](); }
    else if (state === 'running' && action) action();
    else if (state === 'done' && performance.now() - doneAt > 600) close();   // que el mismo toque que acaba no cierre el resultado
  });
}

// ---------------------------------------------------------------- eventos
const ACTIONS = {
  tab: (v) => { S.tab = v; closeSheet(); render(); window.scrollTo(0, 0); },
  rank: (v) => { S.rank = v; render(); },
  feedAll: (v) => { S.feedAll = v === '1'; render(); },
  player: (v) => openSheet('player', v),
  closeSheet: () => closeSheet(),
  menu: () => openSheet('menu'),
  help: () => openSheet('help'),
  asalto: (v) => act('jp_asalto', { p_target: v }),
  guardia: (v) => act('jp_guardia', { p_target: v }),
  investigar: () => act('jp_investigar', {}),
  mover: (v) => act('jp_mover', { p_amount: Number(v) }),
  buy: (v) => act('jp_comprar', { p_kind: v }),
  game: (v) => openGame(v),
  useItem: (v) => {
    const it = S.st.me.items.find((i) => i.id === v);
    if (it.kind === 'megafono') return toast('El megáfono se usa al replicar al loro: aparece en la burla cuando se burle de ti.');
    if (it.kind === 'pista_falsificada') return openSheet('fake', 'item', v);
    if (TARGET_ITEMS.includes(it.kind)) return openSheet('target', v);
    return act('jp_usar', { p_item: v });
  },
  useOn: (v, el) => act('jp_usar', { p_item: v, p_target: el.dataset.t }),
  useOnPick: (v, el) => act('jp_usar', { p_item: el.dataset.i, p_target: v }),
  sheetFake: (v) => openSheet('fake', v),
  fakeRecipient: (v, el) => openSheet('fake', el.dataset.m, el.dataset.i, v),
  fakeTarget: (v, el) => (el.dataset.m === 'joputa'
    ? act('jp_pista_falsa', { p_recipient: el.dataset.r, p_target: v })
    : act('jp_usar', { p_item: el.dataset.i, p_recipient: el.dataset.r, p_target: v })),
  sheetAccuse: () => openSheet('accuse'),
  accuse: (v) => openSheet('confirmAccuse', v),
  doAccuse: (v) => act('jp_acusar', { p_target: v }),
  vote: (v) => act('jp_votar', { p_accusation: S.st.accusation.id, p_yes: v === '1' }),
  votePunal: () => act('jp_votar', { p_accusation: S.st.accusation.id, p_yes: true, p_punal: true }),
  nevera: (v) => { const [a, b] = v ? v.split(',') : [null, null]; return act('jp_nevera', { p_a: a, p_b: b }); },
  hoguera: async (v) => { const r = await act('jp_hoguera', { p_target: v || null, p_punal: !!S.hogueraPunal }); if (r) S.hogueraPunal = false; },
  sabotear: () => act('jp_sabotear', {}),
  sheetCotilla: () => openSheet('cotilla'),
  sospechar: (v) => act('jp_sospechar', { p_suspect: v }),
  sheetDuel: () => openSheet('duel'),
  duelFor: (v) => { S.duelStake = S.duelStake || 20; openSheet('duel', v); },
  duelStake: (v) => { S.duelStake = Number(v); openSheet('duel', S.sheet.args[0]); },
  duelGame: (v) => { S.duelGame = v; openSheet('duel', S.sheet.args[0]); },
  duelGo: (v) => {
    const stake = S.duelStake; const keys = Object.keys(GAMES);
    const game = !S.duelGame || S.duelGame === 'azar' ? keys[Math.floor(Math.random() * keys.length)] : S.duelGame;
    const seed = Math.floor(Math.random() * 2 ** 31);
    closeSheet();
    openGame(game, { seed, submit: async (score) => { const r = await rpc('jp_retar', { p_group: S.groupId, p_target: v, p_stake: stake, p_game: game, p_seed: seed, p_score: score }, { quiet: true }); refresh(); return r; } });
  },
  duelAccept: (v) => {
    const d = S.st.duels.incoming.find((x) => x.id === v); if (!d) return;
    openGame(d.game, { seed: d.seed, submit: async (score) => { const r = await rpc('jp_duelo', { p_group: S.groupId, p_duel: v, p_accept: true, p_score: score }, { quiet: true }); refresh(); return r; } });
  },
  duelDecline: (v) => act('jp_duelo', { p_duel: v, p_accept: false }),
  sheetAvatar: () => openSheet('avatar'),
  sheetFeatures: () => openSheet('features'),
  sheetWords: () => openSheet('words'),
  saveWords: () => act('jp_set_words', { p_words: document.getElementById('wordsBox').value }),
  sheetStats: async () => { const r = await rpc('jp_admin_stats', { p_group: S.groupId }, { quiet: true }); if (r) { S.stats = r; openSheet('stats'); } },
  setAvatar: (v) => act('jp_set_avatar', { p_avatar: v }),
  cotillear: (v) => act('jp_cotillear', { p_target: v }),
  trKind: (v) => { S.tr.kind = v; render(); },
  trTarget: (v) => { S.tr.target = v; render(); },
  trFor: (v) => { S.tr.target = v; S.tab = 'jugar'; closeSheet(); render(); },
  scheduleTrastada: async () => { const r = await act('jp_trastada', { p_kind: S.tr.kind, p_target: S.tr.target }); if (r) S.tr = { kind: null, target: null }; },
  cancelTrastada: () => act('jp_cancelar_trastada', {}),
  offer: (v) => act('jp_responder_oferta', { p_accept: v === '1' }),
  recTarget: (v) => { S.rec.target = v; render(); },
  recShare: (v) => { S.rec.share = Number(v); render(); },
  recruit: async () => { const r = await act('jp_reclutar', { p_target: S.rec.target, p_share: S.rec.share }); if (r) S.rec.target = null; },
  sheetPase: () => openSheet('pase'),
  doPase: () => act('jp_pasar_taper', {}),
  sheetChivarse: () => openSheet('chivarse'),
  doChivarse: () => act('jp_chivarse', {}),
  coartadaComplice: () => act('jp_coartada_complice', {}),
  reparto: (v) => act('jp_reparto', { p_choice: v }),
  replica: (v) => act('jp_replicar', { p_burla: S.st.burla.id, p_option: Number(v) }),
  megafono: () => act('jp_megafono', { p_burla: S.st.burla.id }),
  pushOn: () => enablePush(),
  pushOff: () => disablePush(),
  share: async (v) => {
    const text = `Únete a mi camping en ${GAME_NAME}: ${v}`;
    if (navigator.share) { try { await navigator.share({ title: GAME_NAME, text, url: v }); } catch { /* cancelado */ } }
    else { await navigator.clipboard?.writeText(v); toast('Enlace copiado.'); }
  },
  sheetTest: () => openSheet('test'),
  sheetTestCreate: () => openSheet('testCreate'),
  sheetTestGames: () => openSheet('testGames'),
  testCrear: async () => {
    const name = document.getElementById('testName')?.value || 'Pruebas'; const bots = Number(document.getElementById('testBots')?.value || 6);
    const r = await rpc('jp_test_crear', { p_name: name, p_player_name: S.st?.me.name || 'Admin', p_avatar: S.st?.me.avatar || 'avatar_abuelo', p_bots: bots });
    if (!r) return;
    S.groupId = r.group_id; localStorage.setItem('joputa.group', r.group_id); closeSheet(); S.st = null;
    await loadGroups(); toast('Camping de prueba creado. Abre el panel 🧪 de arriba.');
  },
  testTiempo: async (v) => { await rpc('jp_test_tiempo', { p_group: S.groupId, p_mode: v }); await refresh(); if (S.sheet) openSheet('test'); },
  testBots: async () => { await rpc('jp_test_bots', { p_group: S.groupId }); await refresh(); if (S.sheet) openSheet('test'); },
  testBot: async () => { await rpc('jp_test_bot', { p_group: S.groupId }); await refresh(); if (S.sheet) openSheet('test'); },
  testJoputa: async (v) => { await rpc('jp_test_joputa', { p_group: S.groupId, p_player: v }); await refresh(); if (S.sheet) openSheet('test'); },
  testActuar: async (v) => { await rpc('jp_test_actuar', { p_group: S.groupId, p_player: v }); closeSheet(); S.tab = 'camping'; await refresh(); },
  practice: (v) => { closeSheet(); openGame(v, { practice: true }); },
  testBorrar: () => openSheet('testBorrar'),
  testBorrarOk: async () => {
    const r = await rpc('jp_test_borrar', { p_group: S.groupId }); if (!r) return;
    closeSheet(); S.st = null; S.groupId = null; localStorage.removeItem('joputa.group'); await loadGroups();
  },
  switchGroup: async (v) => { S.groupId = v; localStorage.setItem('joputa.group', v); closeSheet(); S.st = null; await refresh(); },
  newGroup: () => { closeSheet(); S.view = 'onboard'; render(); },
  backToGame: () => { S.view = 'game'; render(); },
  onboardTab: (v) => { S.onboard = v; render(); },
  pickAvatar: (v) => {
    S.avatar = v;
    document.querySelectorAll('[data-act="pickAvatar"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v));
  },
  resetLogin: () => { S.codeSent = false; render(); },
  logout: async () => { await api.signOut(); localStorage.removeItem('joputa.group'); location.href = location.pathname; },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'SELECT' || el.tagName === 'INPUT') return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset.v, el); }
});

document.addEventListener('change', async (e) => {
  if (e.target.dataset.act === 'hogueraPunal') { S.hogueraPunal = e.target.checked; return; }
  if (e.target.dataset.act === 'feature') {
    const r = await rpc('jp_set_feature', { p_group: S.groupId, p_key: e.target.dataset.v, p_on: e.target.checked });
    if (!r) e.target.checked = !e.target.checked;
    await refresh();
    return;
  }
  if (e.target.dataset.act === 'minPlayers') {
    await rpc('jp_set_min_players', { p_group: S.groupId, p_n: Number(e.target.value) });
    refresh();
  }
});

document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target; const d = Object.fromEntries(new FormData(f));
  const kind = f.dataset.form;
  try {
    if (kind === 'sendCode') {
      S.email = d.email.trim();
      await api.sendCode(S.email); S.codeSent = true; render();
    } else if (kind === 'verify') {
      await api.verifyCode(S.email, d.code.trim()); await loadGroups();
    } else if (kind === 'join' || kind === 'create') {
      const r = kind === 'join'
        ? await api.rpc('jp_join_group', { p_code: d.code, p_player_name: d.name, p_avatar: S.avatar })
        : await api.rpc('jp_create_group', { p_name: d.camp, p_player_name: d.name, p_avatar: S.avatar, p_cafe: d.cafe, p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid' });
      S.groupId = r.group_id; localStorage.setItem('joputa.group', r.group_id);
      history.replaceState(null, '', location.pathname);
      await loadGroups();
      if (kind === 'create') setTimeout(() => openSheet('menu'), 300);
    }
  } catch (err) { toast(err.message || 'Algo ha fallado.', true); }
});

// --------------------------------------------------------------- avisos
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !!window.JOPUTA_CONFIG?.VAPID_PUBLIC_KEY;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

function pushButton() {
  if (!window.JOPUTA_CONFIG?.VAPID_PUBLIC_KEY) return '';
  if (isIOS() && !standalone()) return '<p class="muted">Para recibir avisos en iPhone, primero añade la app a la pantalla de inicio (Compartir → Añadir a pantalla de inicio) y ábrela desde ahí.</p>';
  if (!pushSupported()) return '<p class="muted">Este navegador no admite avisos.</p>';
  if (Notification.permission === 'denied') return '<p class="muted">Has bloqueado los avisos. Actívalos en los ajustes del navegador para este sitio.</p>';
  return localStorage.getItem('joputa.push') === '1'
    ? '<button class="btn ghost block" data-act="pushOff">Desactivar avisos en este móvil</button>'
    : '<button class="btn green block" data-act="pushOn">Activar avisos en este móvil</button>';
}

function b64ToBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function enablePush() {
  try {
    if ((await Notification.requestPermission()) !== 'granted') return toast('Sin permiso no podemos avisarte.', true);
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(window.JOPUTA_CONFIG.VAPID_PUBLIC_KEY) });
    const j = sub.toJSON();
    await rpc('jp_push_subscribe', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
    localStorage.setItem('joputa.push', '1');
  } catch (e) { toast(`No se han podido activar los avisos: ${e.message}`, true); }
  if (S.sheet) openSheet(S.sheet.fn, ...S.sheet.args);
}

async function disablePush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) { await rpc('jp_push_unsubscribe', { p_endpoint: sub.endpoint }); await sub.unsubscribe(); }
  } catch { /* nada */ }
  localStorage.removeItem('joputa.push');
  if (S.sheet) openSheet(S.sheet.fn, ...S.sheet.args);
}

// ------------------------------------------------------------- arranque
async function loadGroups() {
  S.groups = await api.rpc('jp_my_groups', {});
  if (!S.groups.length) { S.view = 'onboard'; S.onboard = new URLSearchParams(location.search).get('c') ? 'join' : 'create'; return render(); }
  const invite = new URLSearchParams(location.search).get('c');
  if (invite) { S.view = 'onboard'; S.onboard = 'join'; return render(); }
  if (!S.groups.some((g) => g.group_id === S.groupId)) S.groupId = S.groups[0].group_id;
  localStorage.setItem('joputa.group', S.groupId);
  S.view = 'game';
  await refresh();
  // la primera vez que se entra, se abren las reglas
  let seen = false;
  try { seen = !!localStorage.getItem('joputa.helpSeen'); localStorage.setItem('joputa.helpSeen', '1'); } catch { /* sin almacenamiento */ }
  if (!seen && S.st) openSheet('help');
}

async function makeSupabaseApi() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const cfg = window.JOPUTA_CONFIG;
  const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return {
    async session() { return (await sb.auth.getSession()).data.session; },
    async sendCode(email) { const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } }); if (error) throw error; },
    async verifyCode(email, token) { const { error } = await sb.auth.verifyOtp({ email, token, type: 'email' }); if (error) throw new Error('Código incorrecto o caducado.'); },
    async signOut() { await sb.auth.signOut(); },
    async rpc(fn, args) { const { data, error } = await sb.rpc(fn, args); if (error) throw new Error(error.message); return data; },
  };
}

async function boot() {
  api = window.__JOPUTA_TEST_API__ || await makeSupabaseApi();
  if (!(await api.session())) { S.view = 'login'; return render(); }
  await loadGroups();
}

setInterval(() => {
  const el = document.getElementById('countdown'); if (el) el.textContent = countdown();
  if (S.st && new Date(S.st.clock.next_close) <= serverNow() && !S.busy) refresh();
}, 15000);
setInterval(() => { if (document.visibilityState === 'visible' && S.view === 'game' && !S.sheet) refresh(); }, 45000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.view === 'game') refresh(); });
if ('serviceWorker' in navigator && !window.__JOPUTA_TEST_API__) navigator.serviceWorker.register('sw.js').catch(() => {});

boot().catch((e) => { $app.innerHTML = `<div class="splash"><p>No se ha podido abrir el camping.</p><p class="muted">${esc(e.message)}</p></div>`; });
