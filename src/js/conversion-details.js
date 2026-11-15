// One detail card shared by pointer, keyboard, and touch interactions.
const conversionFunnel = document.querySelector('.conversion-funnel');
const conversionDetail = document.createElement('div');
conversionDetail.id = 'conversion-detail';
conversionDetail.className = 'conversion-detail';
conversionDetail.setAttribute('popover', 'manual');
conversionDetail.setAttribute('role', 'tooltip');
document.body.append(conversionDetail);
const conversionBreakdowns = [
  ['Total impressions', 'Share of funnel', '100%', '8.2%', 'TikTok (58%)'],
  ['Store + profile clicks', 'From impressions', '11.9%', '0.6%', 'Steam (46%)'],
  ['Wishlists + follows', 'From profile clicks', '12.7%', '1.4%', 'TikTok (41%)'],
  ['Paying patrons', 'From wishlists', '3.0%', '0.3%', 'Discord (62%)'],
  ['Orders', 'From wishlists', '2.0%', '-0.2%', 'Patreon (48%)'],
];
let activeConversionStage = null;
let conversionHideTimer;
function hideConversionDetail() {
  clearTimeout(conversionHideTimer);
  conversionDetail.hidePopover();
  activeConversionStage?.removeAttribute('aria-describedby');
  activeConversionStage?.removeAttribute('aria-expanded');
  activeConversionStage = null;
  conversionFunnel.classList.remove('showing-detail');
  conversionFunnel.querySelectorAll('.is-active').forEach(row => row.classList.remove('is-active'));
}
function showConversionDetail(row) {
  if (!conversionFunnel.classList.contains('has-data')) return;
  clearTimeout(conversionHideTimer);
  if (activeConversionStage === row) return;
  hideConversionDetail();
  activeConversionStage = row;
  const [totalLabel, rateLabel, rate, change, source] = conversionBreakdowns[Number(row.dataset.conversionStage)];
  const title = document.createElement('h3');
  title.textContent = row.children[0].textContent;
  const details = document.createElement('dl');
  [[totalLabel, row.children[1].textContent], [rateLabel, rate], ['vs last month', `${change.startsWith('-') ? '▼' : '▲'} ${change.replace('-', '')}`], ['Top source', source]].forEach(([label, value], index) => {
    const term = document.createElement('dt');
    term.textContent = label;
    const detail = document.createElement('dd');
    detail.textContent = value;
    if (index === 2) detail.className = change.startsWith('-') ? 'is-negative' : 'is-positive';
    details.append(term, detail);
  });
  conversionDetail.replaceChildren(title, details);
  conversionFunnel.classList.add('showing-detail');
  row.classList.add('is-active');
  row.setAttribute('aria-describedby', conversionDetail.id);
  row.setAttribute('aria-expanded', 'true');
  conversionDetail.showPopover();
  const bounds = row.getBoundingClientRect();
  const funnelBounds = conversionFunnel.getBoundingClientRect();
  const stage = Number(row.dataset.conversionStage);
  const narrow = funnelBounds.width < 400;
  const width = narrow ? Math.min(340, innerWidth - 32)
    : Math.min(386, Math.max(280, funnelBounds.width * 0.495));
  conversionDetail.style.width = `${width}px`;
  const height = conversionDetail.offsetHeight;
  // The reference places impressions below-right, clicks below-left,
  // and the three smaller stages beside their bar, vertically centered.
  let left;
  let top;
  if (narrow) {
    left = funnelBounds.left;
    top = bounds.bottom + 12;
  } else if (stage === 0) {
    left = funnelBounds.left + funnelBounds.width * 0.505;
    top = bounds.bottom + 16;
  } else if (stage === 1) {
    left = funnelBounds.left + funnelBounds.width * 0.22;
    top = bounds.bottom + 16;
  } else {
    left = bounds.right + 18;
    top = bounds.top + (bounds.height - height) / 2;
  }
  conversionDetail.dataset.placement = !narrow && stage >= 2 ? 'side' : 'below';
  conversionDetail.style.left = `${Math.max(16, Math.min(left, innerWidth - width - 16))}px`;
  conversionDetail.style.top = `${Math.max(16, Math.min(top, innerHeight - height - 16))}px`;
}
conversionFunnel.querySelectorAll('li').forEach(row => {
  row.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') showConversionDetail(row); });
  row.addEventListener('pointerleave', () => { conversionHideTimer = setTimeout(hideConversionDetail, 160); });
  row.addEventListener('focus', () => showConversionDetail(row));
  row.addEventListener('blur', hideConversionDetail);
  row.addEventListener('click', () => showConversionDetail(row));
  row.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showConversionDetail(row); }
  });
});
conversionDetail.addEventListener('pointerenter', () => clearTimeout(conversionHideTimer));
conversionDetail.addEventListener('pointerleave', () => {
  conversionHideTimer = setTimeout(hideConversionDetail, 160);
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') hideConversionDetail(); });
document.addEventListener('pointerdown', event => {
  if (!conversionDetail.contains(event.target) && !activeConversionStage?.contains(event.target)) hideConversionDetail();
});
window.addEventListener('resize', hideConversionDetail);
window.addEventListener('scroll', hideConversionDetail, true);
