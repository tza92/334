// Per-game goal filters apply immediately while the popup stays open.
const goalFilterTrigger = document.querySelector("#goals-filter-trigger");
const goalFilterPopup = document.querySelector("#goals-filter-popup");
const goalFilterGroups = [
  { key: "status", label: "Status", options: [["all", "All goals"], ["on-track", "On track"], ["behind", "Behind"], ["completed", "Completed"], ["not-started", "Not started"]] },
  { key: "type", label: "Type of goal", options: [["all", "All types"], ["wishlists", "Wishlists"], ["community", "Community"], ["press", "Press"], ["content", "Content"], ["revenue", "Revenue"]] },
  { key: "sort", label: "Sort by", options: [["date", "Due date"], ["progress", "Progress"], ["name", "Name"]] },
];

function goalFilterState(card) {
  return card.goalFilters ??= { status: "all", type: "all", sort: "default" };
}

function goalTypeGroup(metric) {
  return {
    "Steam wishlists": "wishlists", "Discord members": "community", "Patreon members": "revenue",
    "Press features": "press", "Short-form videos": "content", "Newsletter subscribers": "content",
  }[metric];
}

function filterGoalRecords(records, card) {
  const state = goalFilterState(card);
  const filtered = records.filter((record) => (state.status === "all" || goalProgress(record).status === state.status)
    && (state.type === "all" || goalTypeGroup(record.metric) === state.type));
  if (state.sort === "default") return filtered;
  return [...filtered].sort((a, b) => {
    if (state.sort === "name") return a.title.localeCompare(b.title);
    if (state.sort === "progress") return goalProgress(b).percentage - goalProgress(a).percentage;
    return a.date.localeCompare(b.date);
  });
}

function syncGoalFilterControls(card) {
  const state = goalFilterState(card);
  goalFilterPopup.querySelectorAll("[data-goal-filter]").forEach((button) => {
    const checked = state[button.dataset.goalFilter] === button.dataset.value;
    button.setAttribute("aria-checked", String(checked));
    button.tabIndex = checked || (button.dataset.goalFilter === "sort" && state.sort === "default" && button.dataset.value === "date") ? 0 : -1;
  });
  goalFilterTrigger.classList.toggle("has-filters", state.status !== "all" || state.type !== "all" || state.sort !== "default");
}

goalFilterGroups.forEach((group) => {
  const section = document.createElement("section");
  section.className = `goal-filter-group goal-filter-group--${group.key}`;
  const title = document.createElement("h3");
  title.id = `goal-filter-${group.key}-title`;
  title.textContent = group.label;
  const options = document.createElement("div");
  options.className = "goal-filter-options";
  options.setAttribute("role", "radiogroup");
  options.setAttribute("aria-labelledby", title.id);
  group.options.forEach(([value, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "goal-filter-option";
    button.dataset.goalFilter = group.key;
    button.dataset.value = value;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", "false");
    const text = document.createElement("span");
    text.textContent = label;
    button.append(text, dashboardIcon("check"));
    options.append(button);
  });
  section.append(title, options);
  goalFilterPopup.append(section);
});
const goalFilterFooter = document.createElement("div");
goalFilterFooter.className = "goal-filter-footer";
const clearGoalFilters = document.createElement("button");
clearGoalFilters.type = "button";
clearGoalFilters.className = "text-link";
clearGoalFilters.textContent = "Clear all";
const applyHint = document.createElement("span");
applyHint.textContent = "Applies as you select";
goalFilterFooter.append(clearGoalFilters, applyHint);
goalFilterPopup.append(goalFilterFooter);

function applyGoalFilters() {
  syncGoalFilterControls(activeProject);
  renderDashboardRecords("goals", gameDashboardData(activeProject).goals);
}

goalFilterPopup.addEventListener("click", (event) => {
  const button = event.target.closest("[data-goal-filter]");
  if (!button) return;
  goalFilterState(activeProject)[button.dataset.goalFilter] = button.dataset.value;
  applyGoalFilters();
});
clearGoalFilters.addEventListener("click", () => {
  activeProject.goalFilters = { status: "all", type: "all", sort: "default" };
  applyGoalFilters();
});
goalFilterPopup.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    goalFilterPopup.hidePopover();
    goalFilterTrigger.focus();
    return;
  }
  const button = event.target.closest("[data-goal-filter]");
  if (!button) return;
  const options = Array.from(button.parentElement.children);
  const index = options.indexOf(button);
  let next;
  if (["ArrowDown", "ArrowRight"].includes(event.key)) next = (index + 1) % options.length;
  if (["ArrowUp", "ArrowLeft"].includes(event.key)) next = (index - 1 + options.length) % options.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = options.length - 1;
  if (next !== undefined) {
    event.preventDefault();
    options[next].click();
    options[next].focus();
  }
});

connectFilterPopover(goalFilterTrigger, goalFilterPopup, { width: 560, onOpen: () => {
  syncGoalFilterControls(activeProject);
  goalFilterPopup.querySelector('[aria-checked="true"]').focus({ preventScroll: true });
} });
