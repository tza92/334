const setupFinishedDialog = document.createElement('dialog');
setupFinishedDialog.className = 'setup-finished-dialog';
setupFinishedDialog.setAttribute('aria-labelledby', 'setup-finished-title');
setupFinishedDialog.setAttribute('aria-describedby', 'setup-finished-description');
setupFinishedDialog.innerHTML = '<svg class="setup-finished-check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28"/><path d="m17 32 11 11 20-22"/></svg><h2 id="setup-finished-title">All Set Up!</h2><p id="setup-finished-description"></p><button class="button button--primary" type="button">Finish</button>';
document.body.append(setupFinishedDialog);
setupFinishedDialog.addEventListener('cancel', event => event.preventDefault());
let setupFinishTimer = null;
function setupRequirementsMet(card) {
  return Boolean((card.goalSetupComplete || gameDashboardData(card).goals.length)
    && (card.platformSetupComplete || card.connections?.length));
}
function renderHomeSetup(card, section) {
  const home = section === 'Home';
  const finished = home && Boolean(card.setupFinished);
  gameWorkspace.dataset.setupFinished = String(finished);
  document.querySelector('#campaign-header').hidden = !finished;
  document.querySelector('.dashboard-intro').hidden = finished;
  document.querySelector('#dashboard-setup').hidden = !home || finished;
  document.querySelector('#dashboard-setup-heading').hidden = !home || finished;
  gameWorkspace.setAttribute('aria-labelledby', finished ? 'campaign-title' : 'workspace-page-title');
  document.querySelector('#campaign-title').textContent = card.name;
  document.querySelector('#campaign-cover-name').textContent = card.name;
  document.querySelector('#campaign-platforms').textContent = (card.connections || [])
    .map(record => connectionProviders.find(provider => provider.id === record.provider)?.name || record.provider).join(', ');
  const cover = document.querySelector('.campaign-cover');
  cover.style.backgroundImage = card.coverImage ? `url("${card.coverImage.replaceAll('"', '%22')}")` : '';
  if (!home || card.setupFinished || !setupRequirementsMet(card)) {
    clearTimeout(setupFinishTimer);
    setupFinishTimer = null;
    return;
  }
  if (setupFinishTimer !== null || setupFinishedDialog.open) return;
  const showWhenReady = () => {
    if (gameWorkspace.dataset.section !== 'Home' || card.setupFinished || !setupRequirementsMet(card)) {
      setupFinishTimer = null;
      return;
    }
    if (document.querySelector('dialog[open]') || gameWorkspace.dataset.revealing === 'true') {
      setupFinishTimer = setTimeout(showWhenReady, 250);
      return;
    }
    setupFinishTimer = null;
    document.querySelector('#setup-finished-description').textContent = `Congrats! ${card.name} is now ready to go.`;
    setupFinishedDialog.showModal();
  };
  setupFinishTimer = setTimeout(showWhenReady, 3000);
}
setupFinishedDialog.querySelector('button').addEventListener('click', async () => {
  if (setupFinishedDialog.dataset.transitioning === 'true') return;
  await dissolveToWorkspace(setupFinishedDialog, () => {
    activeProject.setupFinished = true;
    saveProject(activeProject);
    selectWorkspaceSection('Home');
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  document.querySelector('#campaign-title').focus({ preventScroll: true });
});
