/* ===== Placeholder company logos (deterministic color + initial per company name) ===== */
const LOGO_COLORS = ['#3D4F8A', '#2B6F6B', '#1E5FD9', '#A6650C', '#B23131', '#4A5568', '#5B76B8', '#1D4F4C'];
function logoColorFor(name){
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return LOGO_COLORS[hash % LOGO_COLORS.length];
}

/* ===== Company card industry banner (flat vector icon per industry, no external photos) =====
   Keyed by the `industry` field in company-data.js. Falls back to the facility-management
   icon for any industry not in this map. Icon fill/stroke color is passed in so it always
   matches the card's own logo color (see logoColorFor). */
const INDUSTRY_ICONS = {
  '시설관리': (c) => `<rect x="5" y="4" width="14" height="17" rx="1" fill="rgba(255,255,255,.85)"/><rect x="7.5" y="6.5" width="2" height="2" fill="${c}"/><rect x="11" y="6.5" width="2" height="2" fill="${c}"/><rect x="14.5" y="6.5" width="2" height="2" fill="${c}"/><rect x="7.5" y="10" width="2" height="2" fill="${c}"/><rect x="11" y="10" width="2" height="2" fill="${c}"/><rect x="14.5" y="10" width="2" height="2" fill="${c}"/><rect x="7.5" y="13.5" width="2" height="2" fill="${c}"/><rect x="11" y="13.5" width="2" height="2" fill="${c}"/><rect x="14.5" y="13.5" width="2" height="2" fill="${c}"/><rect x="9.5" y="17" width="5" height="4" fill="${c}"/>`,
  '요양·돌봄': (c) => `<path d="M12 20s-7-4.35-9.5-9C0.8 7.3 2 3.5 5.5 3c2-.3 3.7.8 4.5 2.4C10.8 3.8 12.5 2.7 14.5 3c3.5.5 4.7 4.3 3 8-2.5 4.65-9.5 9-9.5 9z" fill="rgba(255,255,255,.85)"/><rect x="10.8" y="8.5" width="2.4" height="7" fill="${c}"/><rect x="7.8" y="11.5" width="8.4" height="2.4" fill="${c}"/>`,
  '유통': (c) => `<path d="M6 8h12l-1 12a2 2 0 01-2 2H9a2 2 0 01-2-2L6 8z" fill="rgba(255,255,255,.85)"/><path d="M9 8V6a3 3 0 016 0v2" stroke="${c}" stroke-width="1.6" fill="none"/>`,
  '공공기관': (c) => `<circle cx="12" cy="9" r="6" fill="rgba(255,255,255,.85)"/><rect x="10.5" y="14" width="3" height="7" fill="rgba(255,255,255,.85)"/>`,
  '물류': (c) => `<rect x="2" y="9" width="11" height="8" rx="1" fill="rgba(255,255,255,.85)"/><path d="M13 12h4l3 3v2h-7v-5z" fill="rgba(255,255,255,.85)"/><circle cx="6.5" cy="18" r="1.8" fill="${c}"/><circle cx="16.5" cy="18" r="1.8" fill="${c}"/>`
};
function industryIconHTML(industry, color){
  const paths = (INDUSTRY_ICONS[industry] || INDUSTRY_ICONS['시설관리'])(color);
  return `<svg class="company-card-icon" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
}

/* ===== Login modal ===== */
function openLoginModal(){
  const el = document.getElementById('loginModal');
  if (el) el.classList.add('open');
}
function closeLoginModal(){
  const el = document.getElementById('loginModal');
  if (el) el.classList.remove('open');
}

/* ===== Mobile nav drawer ===== */
function toggleMobileNav(){
  const nav = document.getElementById('mobileNav');
  const backdrop = document.getElementById('mobileNavBackdrop');
  const btn = document.querySelector('.nx-hamburger');
  if (!nav || !backdrop) return;
  const isOpen = nav.classList.toggle('open');
  backdrop.classList.toggle('open', isOpen);
  if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}
function closeMobileNav(){
  const nav = document.getElementById('mobileNav');
  const backdrop = document.getElementById('mobileNavBackdrop');
  const btn = document.querySelector('.nx-hamburger');
  if (nav) nav.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

/* ===== Job application state (client-side demo persistence — no backend to talk to,
   so "applying" just means marking the job in localStorage; survives reloads/nav so the
   "재지원 불가" rule actually holds up while browsing the static prototype). ===== */
const APPLIED_STORAGE_KEY = 'np_applied_jobs';
function getAppliedJobIds(){
  try { return new Set(JSON.parse(localStorage.getItem(APPLIED_STORAGE_KEY) || '[]')); }
  catch(e) { return new Set(); }
}
function saveAppliedJobIds(set){
  localStorage.setItem(APPLIED_STORAGE_KEY, JSON.stringify([...set]));
}
function isJobApplied(id){
  const job = typeof jobById === 'function' ? jobById(id) : null;
  return (job && job.applied) || getAppliedJobIds().has(id);
}
function applyToJob(id){
  const set = getAppliedJobIds();
  set.add(id);
  saveAppliedJobIds(set);
}
function cancelApplication(id){
  const set = getAppliedJobIds();
  set.delete(id);
  saveAppliedJobIds(set);
  const job = typeof jobById === 'function' ? jobById(id) : null;
  if (job) job.applied = false;
}
function renderApplyButton(overlay, job){
  const btn = overlay.querySelector('.detail-apply-btn');
  if (!btn) return;
  if (isJobApplied(job.id)) {
    btn.textContent = '지원 취소하기';
    btn.className = 'btn btn-outline detail-apply-btn';
    btn.style.color = 'var(--gray700)';
    btn.style.borderColor = 'var(--gray300)';
    btn.onclick = () => {
      if (!confirm('지원을 취소하시겠습니까? 취소 후 다시 지원할 수 있어요.')) return;
      cancelApplication(job.id);
      renderApplyButton(overlay, job);
    };
  } else {
    btn.textContent = '즉시 지원 →';
    btn.className = 'btn btn-primary detail-apply-btn';
    btn.style.color = '';
    btn.style.borderColor = '';
    btn.onclick = () => {
      applyToJob(job.id);
      renderApplyButton(overlay, job);
      alert('지원이 완료되었습니다. 취소하기 전까지는 같은 공고에 재지원할 수 없어요.');
    };
  }
}

/* ===== Job contact person + 1:1 inquiry (both opt-in per job, set by the company rep) ===== */
let inquiryJobId = null;
function renderContactSection(overlay, job){
  const wrap = overlay.querySelector('.detail-contact-wrap');
  if (!wrap) return;
  const showContact = job.contactVisible && job.contact;
  const showInquiry = !!job.inquiryEnabled;
  if (!showContact && !showInquiry) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `
    <div class="detail-h4">담당자 정보</div>
    <div class="detail-contact-card">
      ${showContact ? `
        <div class="dcon-row"><span class="dcon-label">담당자</span><span class="dcon-value">${job.contact.name} · ${job.contact.position}</span></div>
        <div class="dcon-row"><span class="dcon-label">연락처</span><span class="dcon-value">${job.contact.phone}</span></div>
      ` : `<div class="dcon-row"><span class="dcon-value" style="color:var(--gray500);">담당자 정보는 비공개로 설정되어 있어요.</span></div>`}
      ${showInquiry ? `<button class="btn btn-outline dcon-inquiry-btn" onclick="openInquiryModal('${job.id}')">💬 담당자에게 문의하기</button>` : ''}
    </div>`;
}
function openInquiryModal(id){
  const job = typeof jobById === 'function' ? jobById(id) : null;
  const modal = document.getElementById('inquiryModal');
  if (!job || !modal) return;
  inquiryJobId = id;
  const target = modal.querySelector('#inquiryTarget');
  if (target) target.textContent = `${job.title} (${job.company}) 공고에 대해 궁금한 점을 남겨주세요`;
  const textEl = modal.querySelector('#inquiryText');
  if (textEl) textEl.value = '';
  modal.classList.add('open');
}
function closeInquiryModal(){
  const el = document.getElementById('inquiryModal');
  if (el) el.classList.remove('open');
  inquiryJobId = null;
}
function submitInquiry(){
  const modal = document.getElementById('inquiryModal');
  const textEl = modal ? modal.querySelector('#inquiryText') : null;
  const text = textEl ? textEl.value.trim() : '';
  if (!text) { alert('문의 내용을 입력해주세요.'); return; }
  closeInquiryModal();
  alert('문의가 등록되었습니다. 담당자 확인 후 답변드립니다.');
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
  const dcLogo = overlay.querySelector('.dc-logo');
  if (dcLogo) {
    dcLogo.style.background = logoColorFor(job.companyInfo.name);
    dcLogo.textContent = job.companyInfo.name.charAt(0);
  }

  renderContactSection(overlay, job);
  renderApplyButton(overlay, job);

  overlay.classList.add('open');
  const card = overlay.querySelector('.detail-card');
  const scroll = overlay.querySelector('.detail-scroll');
  if (card) card.classList.remove('is-scrolled');
  if (scroll) {
    scroll.scrollTop = 0;
    if (!scroll.dataset.collapseBound) {
      scroll.dataset.collapseBound = '1';
      scroll.addEventListener('scroll', () => {
        if (card) card.classList.toggle('is-scrolled', scroll.scrollTop > 24);
      });
    }
  }
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

/* ===== Header height sync (keeps scroll-snap offset accurate — CSS var, not a guessed px value) ===== */
function syncHeaderHeight(){
  const header = document.querySelector('.nx-header');
  if (header) document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
}
document.addEventListener('DOMContentLoaded', syncHeaderHeight);
window.addEventListener('resize', syncHeaderHeight);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeaderHeight);

/* ===== Overlay close on backdrop click + Escape =====
   Every .login-modal-overlay closes through a same-named closeXxx() function
   (id "serviceModal" -> closeServiceModal()) rather than a plain classList.remove,
   since some of these modals (ServiceDetailModal, PackageModal on ai.html) have
   scroll-lock + focus-return side effects that a bare class toggle would leave stuck. */
function closeOverlayById(id){
  const fnName = 'close' + id.charAt(0).toUpperCase() + id.slice(1);
  if (typeof window[fnName] === 'function') window[fnName]();
  else { const el = document.getElementById(id); if (el) el.classList.remove('open'); }
}
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('login-modal-overlay')) closeOverlayById(e.target.id);
  if (e.target.classList && e.target.classList.contains('detail-overlay')) closeJobDetail();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.login-modal-overlay.open').forEach(el => closeOverlayById(el.id));
    closeJobDetail(); closeMobileNav();
  }
});
