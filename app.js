const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let opening = false;

const discovered = new Set();
regalo.tarjetas.forEach((item, i) => {
  const card = document.createElement('button');
  card.className = `card ${item.color}`;
  card.setAttribute('aria-pressed', 'false');
  card.setAttribute('aria-label', `Descubrir: ${item.titulo}`);
  const inner = document.createElement('span'); inner.className = 'card-inner';
  const front = document.createElement('span'); front.className = 'card-front';
  const number = document.createElement('span'); number.className = 'card-number'; number.textContent = `0${i + 1} / PARA TI`;
  const art = document.createElement('span'); art.className = 'card-art'; art.textContent = item.simbolo; if (i === 0 || i === 5) { const kitty = document.createElement('img'); kitty.src = 'kitty-small.webp'; kitty.alt = ''; art.replaceChildren(kitty); } art.setAttribute('aria-hidden', 'true');
  if (item.foto) { const img = document.createElement('img'); img.src = item.foto; img.alt = item.titulo; art.replaceChildren(img); art.classList.add('with-photo'); }
  const title = document.createElement('strong'); title.textContent = item.titulo;
  const detail = document.createElement('span'); detail.className = 'card-detail'; detail.textContent = item.detalle;
  const back = document.createElement('span'); back.className = 'card-back'; back.textContent = item.mensaje; back.setAttribute('aria-hidden', 'true');
  front.append(number, art, title, detail); inner.append(front, back); card.append(inner);
  card.addEventListener('click', () => {
    const flipped = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', String(flipped));
    front.setAttribute('aria-hidden', String(flipped)); back.setAttribute('aria-hidden', String(!flipped));
    card.setAttribute('aria-label', flipped ? `${item.titulo}: ${item.mensaje}. Toca para volver.` : `Descubrir: ${item.titulo}`);
    discovered.add(i); $('#progress').textContent = discovered.size === 6 ? 'Las seis sorpresas, para ti ♡' : `${discovered.size} de 6 sorpresas descubiertas`;
    if (flipped && discovered.size === 6) hearts(18);
  });
  $('#cards').append(card);
});
regalo.carta.forEach(text => { const p = document.createElement('p'); p.textContent = text; $('#letter-body').append(p); });
const particles = $('#particles');
const compactEffects = matchMedia('(pointer: coarse), (max-width: 650px)').matches;
function clearParticles() { particles.replaceChildren(); }
function hearts(count = 30) {
  if (scene?.classList.contains('interacting')) return;
  count = Math.min(count, compactEffects ? 12 : 30);
  const remaining = (compactEffects ? 18 : 45) - particles.childElementCount;
  count = Math.max(0, Math.min(count, remaining));
  if (reduced) { $('#particles').textContent = '♡'; setTimeout(() => $('#particles').textContent = '', 1500); return; }
  for (let i = 0; i < count; i++) {
    const h = document.createElement('span'); h.className = 'heart'; h.textContent = ['♡', '♥', '✧'][i % 3];
    h.style.left = `${Math.random() * 100}%`; h.style.setProperty('--drift', `${Math.random() * 160 - 80}px`); h.style.fontSize = `${14 + Math.random() * 24}px`; h.style.animationDelay = `${Math.random() * .8}s`;
    $('#particles').append(h); setTimeout(() => h.remove(), 5500);
  }
}

let viewX = -22, viewY = -26, manualLift = null;
let transitionTimer, revealTimer, turning = false, suppressClickUntil = 0;
const scene = $('#scene'), gift = $('#gift');
function setView(x, y) {
  const minX = compactEffects ? (opening ? -57 : -40) : -70;
  const maxX = -18;
  const maxY = compactEffects ? 30 : 55;
  viewX = Math.max(minX, Math.min(maxX, x)); viewY = Math.max(-maxY, Math.min(maxY, y));
  gift.style.transform = `scale3d(var(--camera-scale),var(--camera-scale),var(--camera-scale)) translate3d(0,${manualLift === null ? 'var(--camera-lift)' : `${manualLift}px`},0) rotateX(${viewX}deg) rotateY(${viewY}deg)`;
}
function openGift() {
  if (opening || turning) return;
  opening = true; turning = true; manualLift = null; gift.classList.remove('manual-view'); gift.classList.add('opened');
  $('#lid').setAttribute('aria-expanded', 'true'); $('#lid').setAttribute('aria-label', 'Cerrar la tapa de la caja');
  $('#hint').textContent = 'Abriendo tu cajita, mi amor…';
  // Primero se levanta la tapa; luego la vista descubre el interior.
  clearTimeout(revealTimer);
  revealTimer = setTimeout(() => { setView(-49, -12); hearts(18); }, reduced ? 0 : 650);
  clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => {
    turning = false; $('#floor-items').inert = false;
    $('#hint').textContent = 'Toca cada regalito para descubrirlo. La tapa se cierra con otro toque.';
  }, reduced ? 0 : 2200);
}
function closeGift() {
  if (turning) return;
  opening = false; manualLift = null; gift.classList.remove('manual-view', 'opened'); $('#floor-items').inert = true;
  $('#lid').setAttribute('aria-expanded', 'false'); $('#lid').setAttribute('aria-label', 'Abrir la tapa de la caja');
  setView(-22,-26); $('#hint').textContent = 'Toca la tapa, mi amor. Hay algo bonito dentro.';
}
function toggleGift() { opening ? closeGift() : openGift(); }
gift.addEventListener('click', e => {
  if (performance.now() < suppressClickUntil) return;
  if (e.target.closest('[data-surprise]')) return;
  if (!opening || e.target.closest('#lid')) toggleGift();
});
gift.onkeydown = e => {
  if (e.target !== gift && e.target !== $('#lid')) return;
  if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGift(); }
  const moves = {ArrowLeft:[0,-10],ArrowRight:[0,10],ArrowUp:[-8,0],ArrowDown:[8,0]};
  if(moves[e.key]) { e.preventDefault(); const [x,y]=moves[e.key]; setView(viewX+x,viewY+y); }
};
let gesture, dragFrame = 0, pendingView;
function flushDrag() {
  dragFrame = 0;
  if (!pendingView) return;
  const { x, y } = pendingView; pendingView = null; setView(x, y);
}
function endGesture(e) {
  if(!gesture || gesture.id !== e.pointerId) return;
  if(gesture.moved) {
    suppressClickUntil=performance.now()+400;
    if(dragFrame) cancelAnimationFrame(dragFrame);
    flushDrag();
  }
  gesture=null; gift.classList.remove('dragging'); scene.classList.remove('interacting');
  // manual-view stays: releasing must never restart the camera transition.
  if(scene.hasPointerCapture(e.pointerId)) scene.releasePointerCapture(e.pointerId);
}
scene.addEventListener('pointerdown', e => {
  if(e.button !== 0 || gesture) return;
  let startX = viewX, startY = viewY, lift = manualLift;
  if(turning && typeof DOMMatrixReadOnly !== 'undefined') {
    const m = new DOMMatrixReadOnly(getComputedStyle(gift).transform);
    const scale = Math.hypot(m.m21,m.m22,m.m23) || 1;
    startX = Math.atan2(m.m23,m.m22)*180/Math.PI;
    startY = Math.atan2(m.m31,m.m11)*180/Math.PI;
    lift = m.m42/scale;
  }
  gesture = { id:e.pointerId, x:e.clientX, y:e.clientY, viewX:startX, viewY:startY, lift, moved:false };
});
scene.addEventListener('pointermove', e => {
  if(!gesture || gesture.id !== e.pointerId) return;
  const dx=e.clientX-gesture.x, dy=e.clientY-gesture.y;
  if(!gesture.moved && Math.hypot(dx,dy)>9) {
    gesture.moved=true;
    if(turning) {
      clearTimeout(revealTimer); clearTimeout(transitionTimer); turning=false;
      manualLift=gesture.lift;
      $('#floor-items').inert = !opening;
      $('#hint').textContent = opening ? 'Toca cada regalito para descubrirlo. La tapa se cierra con otro toque.' : 'Toca la tapa, mi amor. Hay algo bonito dentro.';
    }
    scene.setPointerCapture(e.pointerId);
    gift.classList.add('dragging','manual-view'); scene.classList.add('interacting'); clearParticles();
  }
  if(gesture.moved) {
    pendingView = {x:gesture.viewX-dy*.3,y:gesture.viewY+dx*.35};
    if(!dragFrame) dragFrame=requestAnimationFrame(flushDrag);
  }
}, {passive:true});
scene.addEventListener('pointerup', endGesture);
scene.addEventListener('pointercancel', endGesture);
scene.addEventListener('lostpointercapture', endGesture);
scene.addEventListener('click', e => { if(performance.now()<suppressClickUntil) { e.preventDefault(); e.stopImmediatePropagation(); } },true);
scene.addEventListener('dragstart', e=>e.preventDefault());
document.addEventListener('visibilitychange', () => {
  if(document.hidden) { if(gesture) endGesture({pointerId:gesture.id}); clearParticles(); }
});
const focusBeforeDialog = new Map();
function showSurprise(name) {
  if(name === 'hearts') { hearts(40); $('#hint').textContent = 'Te quiero 3.000.000, mi amor ♡'; return; }
  const dialog = document.getElementById(name);
  focusBeforeDialog.set(name, document.activeElement); dialog.showModal();
}
 document.querySelectorAll('[data-surprise]').forEach(button => button.addEventListener('click', e => { e.stopPropagation(); showSurprise(button.dataset.surprise); }));
 document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => document.getElementById(button.dataset.close).close());
 document.querySelectorAll('dialog').forEach(dialog => {
   dialog.addEventListener('close', () => focusBeforeDialog.get(dialog.id)?.focus());
   dialog.addEventListener('click', e => { if(e.target !== dialog) return; const r=dialog.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) dialog.close(); });
 });
$('#rain').onclick = () => hearts(35);
$('#letter-rain').onclick = () => hearts(35);
$('#hug-hearts').onclick = () => hearts(35);

const chocolateWords = [
  'Me encantas, mi vida. Y cada día encuentro otra cosita tuya que me gusta.',
  'Gracias por compartir tus días conmigo, amor. Hasta lo más simple lo haces bonito.',
  'Quiero más tardes contigo, más risas y más abrazos de los nuestros.',
  'Te quiero 3.000.000, mi amor. Y me sigo quedando corto.'
];
document.querySelectorAll('[data-chocolate]').forEach(chocolate => chocolate.onclick = () => {
  chocolate.classList.add('tasted'); chocolate.textContent='♡';
  $('#chocolate-message').textContent=chocolateWords[Number(chocolate.dataset.chocolate)];
});
const perfumeWords = [
  'Mi vida, qué bonito haberte encontrado.',
  'Con un mensajito tuyo ya me cambias el día, amor.',
  'Estoy feliz contigo. De verdad, muchísimo.',
  'Quiero que nos queden muchas cosas por vivir juntos.',
  'Te mando un abrazo enorme, mi amor. De esos que duran un ratito más.'
];
let sprayIndex=0;
$('#spray').onclick = () => {
  $('#perfume-message').textContent=perfumeWords[sprayIndex++ % perfumeWords.length];
  $('#spray').classList.remove('spritz'); void $('#spray').offsetWidth; $('#spray').classList.add('spritz'); hearts(5);
};
