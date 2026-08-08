/* ===== Login modal ===== */
function openLoginModal(){
  const el = document.getElementById('loginModal');
  if (el) el.classList.add('open');
}
function closeLoginModal(){
  const el = document.getElementById('loginModal');
  if (el) el.classList.remove('open');
}

/* ===== Job detail modal ===== */
function openJobDetail(id){
  const job = typeof jobById === 'function' ? jobById(id) : null;
  const overlay = document.getElementById('detailModal');
  if (!job || !overlay) return;

  overlay.querySelector('.detail-crumb').textContent = job.crumb;
  overlay.querySelector('.detail-title').textContent = job.title;
  overlay.querySelector('.detail-company').textContent = job.company + ' · ' + job.location;
  overlay.querySelector('.detail-price').textContent = job.price;

  const tagsWrap = overlay.querySelector('.detail-tags-top');
  tagsWrap.innerHTML = job.tags.map(t => `<span class="pill ${t.cls}">${t.t}</span>`).join('');

  const infoGrid = overlay.querySelector('.detail-info-grid');
  infoGrid.innerHTML = Object.entries(job.info).map(([label, value]) =>
    `<div class="detail-info-item"><div class="di-label">${label}</div><div class="di-value">${value}</div></div>`
  ).join('');

  overlay.querySelector('.detail-desc').textContent = job.desc;
  overlay.querySelector('.detail-duties').innerHTML = job.duties.map(d => `<li>${d}</li>`).join('');
  overlay.querySelector('.detail-quals').innerHTML = job.quals.map(q => `<span class="detail-tag">${q}</span>`).join('');
  overlay.querySelector('.detail-benefits').innerHTML = job.benefits.map(b => `<span class="detail-tag">${b}</span>`).join('');
  overlay.querySelector('.dc-name').textContent = job.companyInfo.name;
  overlay.querySelector('.dc-sub').textContent = job.companyInfo.sub;

  overlay.classList.add('open');
  overlay.scrollTop = 0;
}
function closeJobDetail(){
  const el = document.getElementById('detailModal');
  if (el) el.classList.remove('open');
}

/* ===== Heart (찜하기) toggle ===== */
function toggleHeart(btn, event){
  if (event) event.stopPropagation();
  btn.classList.toggle('on');
  btn.textContent = btn.classList.contains('on') ? '♥' : '♡';
}

/* ===== Accessibility widget (font size / line height) ===== */
const A11Y_FONT_STEPS = [1, 1.125, 1.25, 1.375];
const A11Y_FONT_LABELS = ['보통', '크게', '더 크게', '가장 크게'];
const A11Y_LINE_STEPS = [1, 1.15, 1.3];
const A11Y_LINE_LABELS = ['보통', '넓게', '가장 넓게'];

function a11yState(){
  try {
    return JSON.parse(localStorage.getItem('nx-a11y')) || { fontStep: 0, lineStep: 0 };
  } catch (e) {
    return { fontStep: 0, lineStep: 0 };
  }
}
function a11ySave(state){
  localStorage.setItem('nx-a11y', JSON.stringify(state));
}
function a11yApply(){
  const state = a11yState();
  document.documentElement.style.setProperty('--font-scale', A11Y_FONT_STEPS[state.fontStep]);
  document.documentElement.style.setProperty('--line-scale', A11Y_LINE_STEPS[state.lineStep]);
  const fontLabel = document.getElementById('a11yFontLabel');
  const lineLabel = document.getElementById('a11yLineLabel');
  if (fontLabel) fontLabel.textContent = A11Y_FONT_LABELS[state.fontStep];
  if (lineLabel) lineLabel.textContent = A11Y_LINE_LABELS[state.lineStep];
}
function a11yIncFont(){
  const state = a11yState();
  state.fontStep = Math.min(state.fontStep + 1, A11Y_FONT_STEPS.length - 1);
  a11ySave(state); a11yApply();
}
function a11yDecFont(){
  const state = a11yState();
  state.fontStep = Math.max(state.fontStep - 1, 0);
  a11ySave(state); a11yApply();
}
function a11yToggleLine(){
  const state = a11yState();
  state.lineStep = (state.lineStep + 1) % A11Y_LINE_STEPS.length;
  a11ySave(state); a11yApply();
}
function a11yReset(){
  a11ySave({ fontStep: 0, lineStep: 0 }); a11yApply();
}
function a11yTogglePanel(){
  const panel = document.getElementById('a11yPanel');
  if (panel) panel.classList.toggle('open');
}
document.addEventListener('DOMContentLoaded', a11yApply);

/* ===== Overlay close on backdrop click + Escape ===== */
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('login-modal-overlay')) closeLoginModal();
  if (e.target.classList && e.target.classList.contains('detail-overlay')) closeJobDetail();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeLoginModal(); closeJobDetail(); }
});
