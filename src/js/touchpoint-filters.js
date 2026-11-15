const touchpointFilterTrigger = document.querySelector("#touchpoints-filter-trigger");
const touchpointFilterPopup = document.querySelector("#touchpoints-filter-popup");
const connectionFilterGroups = [
  { key: "type", label: "Type", options: [["all", "All types"], ["post", "Short-form"], ["press", "Press"], ["store", "Storefront"], ["event", "Event"]] },
  { key: "platform", label: "Platform", options: [["all", "All platforms"], ["tiktok", "TikTok"], ["instagram", "Instagram"], ["youtube", "YouTube"], ["steam", "Steam"], ["discord", "Discord"]] },
];
function touchpointFilterState(card) {
  return card.connectionUpdateFilters ??= { type: "all", platform: "all" };
}
function filterTouchpointRecords(records, card) {
  const state = touchpointFilterState(card);
  return records.filter(record => (state.type === "all" || record.type === state.type)
    && (state.platform === "all" || record.platform.toLowerCase() === state.platform));
}
function syncTouchpointFilterControls(card) {
  const state = touchpointFilterState(card);
  touchpointFilterPopup.querySelectorAll("[data-connection-filter]").forEach(button => {
    const checked = state[button.dataset.connectionFilter] === button.dataset.value;
    button.setAttribute("aria-checked", String(checked));
    button.tabIndex = checked ? 0 : -1;
  });
  touchpointFilterTrigger.classList.toggle("has-filters", state.type !== "all" || state.platform !== "all");
}
connectionFilterGroups.forEach(group => {
  const section = document.createElement("section");
  const title = document.createElement("h3");
  title.id = `connection-filter-${group.key}-title`;
  title.textContent = group.label;
  const options = document.createElement("div");
  options.className = "goal-filter-options";
  options.setAttribute("role", "radiogroup");
  options.setAttribute("aria-labelledby", title.id);
  group.options.forEach(([value, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "goal-filter-option";
    button.dataset.connectionFilter = group.key;
    button.dataset.value = value;
    button.setAttribute("role", "radio");
    const text = document.createElement("span");
    text.textContent = label;
    button.append(text, dashboardIcon("check"));
    options.append(button);
  });
  section.append(title, options);
  touchpointFilterPopup.append(section);
});
const connectionFilterFooter = document.createElement("div");
connectionFilterFooter.className = "goal-filter-footer";
const clearTouchpointFilters = document.createElement("button");
clearTouchpointFilters.type = "button";
clearTouchpointFilters.className = "text-link";
clearTouchpointFilters.textContent = "Clear all";
const connectionFilterHint = document.createElement("span");
connectionFilterHint.textContent = "Applies as you select";
connectionFilterFooter.append(clearTouchpointFilters, connectionFilterHint);
touchpointFilterPopup.append(connectionFilterFooter);
function applyTouchpointFilters() {
  syncTouchpointFilterControls(activeProject);
  renderDashboardRecords("touchpoints", gameDashboardData(activeProject).touchpoints);
  saveProject(activeProject);
}
touchpointFilterPopup.addEventListener("click", event => {
  const option = event.target.closest("[data-connection-filter]");
  if (!option) return;
  touchpointFilterState(activeProject)[option.dataset.connectionFilter] = option.dataset.value;
  applyTouchpointFilters();
});
clearTouchpointFilters.addEventListener("click", () => {
  activeProject.connectionUpdateFilters = { type: "all", platform: "all" };
  applyTouchpointFilters();
});
touchpointFilterPopup.addEventListener("keydown", event => {
  const button = event.target.closest("[data-connection-filter]");
  if (!button) return;
  const options = Array.from(button.parentElement.children);
  const index = options.indexOf(button);
  let next;
  if (["ArrowDown", "ArrowRight"].includes(event.key)) next = (index + 1) % options.length;
  if (["ArrowUp", "ArrowLeft"].includes(event.key)) next = (index - 1 + options.length) % options.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = options.length - 1;
  if (next !== undefined) { event.preventDefault(); options[next].click(); options[next].focus(); }
});
connectFilterPopover(touchpointFilterTrigger, touchpointFilterPopup, { width: 560, onOpen: () => {
  syncTouchpointFilterControls(activeProject);
  touchpointFilterPopup.querySelector('[aria-checked="true"]').focus({ preventScroll: true });
} });
