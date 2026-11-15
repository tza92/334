const milestoneFilterTrigger = document.querySelector("#milestones-filter-trigger");
const milestoneFilterPopup = document.querySelector("#milestones-filter-popup");

function milestoneFilterState(card) {
  return card.milestoneFilters ??= new Set();
}

function filterMilestoneRecords(records, card) {
  const selected = milestoneFilterState(card);
  return records.filter((record) => {
    const type = record.category || record.type;
    return !selected.size || selected.has(type === "Funding" ? "Fund" : type);
  });
}

function syncMilestoneFilterControls(card) {
  const selected = milestoneFilterState(card);
  milestoneFilterPopup.querySelectorAll("[data-milestone-type]").forEach((button) => {
    const checked = button.dataset.milestoneType === "all" ? !selected.size : selected.has(button.dataset.milestoneType);
    button.setAttribute("aria-checked", String(checked));
  });
  milestoneFilterTrigger.classList.toggle("has-filters", selected.size > 0);
  milestoneFilterPopup.querySelector(".milestone-filter-count").textContent = `${Math.max(1, selected.size)} selected`;
}

const milestoneFilterTitle = document.createElement("h3");
milestoneFilterTitle.textContent = "Type";
const milestoneFilterOptions = document.createElement("div");
milestoneFilterOptions.className = "goal-filter-options";
milestoneFilterOptions.setAttribute("role", "group");
milestoneFilterOptions.setAttribute("aria-label", "Milestone type");
[["all", "All types"], ...["Deliverable", "Content", "Event", "Fund", "Press", "Revenue"].map((type) => [type, type])].forEach(([value, label]) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "goal-filter-option";
  button.dataset.milestoneType = value;
  button.setAttribute("role", "checkbox");
  button.setAttribute("aria-checked", "false");
  const text = document.createElement("span");
  text.textContent = label;
  button.append(text, dashboardIcon("check"));
  milestoneFilterOptions.append(button);
});
const milestoneFilterFooter = document.createElement("div");
milestoneFilterFooter.className = "goal-filter-footer";
const clearMilestoneFilters = document.createElement("button");
clearMilestoneFilters.type = "button";
clearMilestoneFilters.className = "text-link";
clearMilestoneFilters.textContent = "Clear all";
const milestoneFilterCount = document.createElement("span");
milestoneFilterCount.className = "milestone-filter-count";
milestoneFilterFooter.append(clearMilestoneFilters, milestoneFilterCount);
milestoneFilterPopup.append(milestoneFilterTitle, milestoneFilterOptions, milestoneFilterFooter);

function applyMilestoneFilters() {
  syncMilestoneFilterControls(activeProject);
  renderDashboardRecords("milestones", gameDashboardData(activeProject).milestones);
}

milestoneFilterPopup.addEventListener("click", (event) => {
  const option = event.target.closest("[data-milestone-type]");
  if (!option) return;
  const selected = milestoneFilterState(activeProject);
  const type = option.dataset.milestoneType;
  if (type === "all") selected.clear();
  else if (selected.has(type)) selected.delete(type);
  else selected.add(type);
  applyMilestoneFilters();
});
clearMilestoneFilters.addEventListener("click", () => {
  milestoneFilterState(activeProject).clear();
  applyMilestoneFilters();
});
milestoneFilterOptions.addEventListener("keydown", (event) => {
  const options = Array.from(milestoneFilterOptions.children);
  const index = options.indexOf(event.target);
  if (index < 0) return;
  let next;
  if (event.key === "ArrowDown") next = (index + 1) % options.length;
  if (event.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = options.length - 1;
  if (next !== undefined) {
    event.preventDefault();
    options[next].focus();
  }
});
connectFilterPopover(milestoneFilterTrigger, milestoneFilterPopup, { width: 320, onOpen: () => {
  syncMilestoneFilterControls(activeProject);
  milestoneFilterPopup.querySelector('[aria-checked="true"]').focus({ preventScroll: true });
} });
