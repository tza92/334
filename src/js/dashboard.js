// Dashboard records belong to the selected project for this browser session.
const dashboardDialog = document.querySelector("#dashboard-dialog");
const dashboardForm = document.querySelector("#dashboard-form");
const dashboardFields = document.querySelector("#dashboard-form-fields");
const dashboardSaveButton = document.querySelector("#dashboard-save");
let dashboardAction = null;
let dashboardProject = null;
let editingMilestone = null;
let editingGoal = null;
let goalFormBaseline = null;
let goalSampleOpened = false;
let goalSampleEligible = false;
let goalSampleTimer = null;
const goalSampleEditedFields = new Set();

const dashboardEmptyStates = {
  goals: {
    icon: "target", title: "No goals yet",
    description: "Set a target like 25,000 wishlists by launch and track it here automatically.",
    action: "goal", label: "Add a goal",
  },
  milestones: {
    icon: "calendar", title: "No milestones yet",
    description: "Add deadlines, events and funds you’re working toward.",
    action: "milestone", label: "Add a milestone",
  },
  touchpoints: {
    icon: "plus", title: "Add your first connection",
    description: "Connect an application to start tracking performance and seeing connection updates.",
    action: "touchpoint", label: "New Connection", primary: true,
  },

};

function gameDashboardData(card) {
  card.dashboardData ??= { goals: [], milestones: [], touchpoints: [] };
  return card.dashboardData;
}

function dashboardIcon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("icon");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(svg.namespaceURI, "use");
  use.setAttribute("href", `#${name}`);
  svg.append(use);
  return svg;
}

function dashboardButton(label, action, primary = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = primary ? "button button--primary" : "text-link";
  if (action === "touchpoint") button.dataset.dashboardSection = "Connect";
  else button.dataset.dashboardAction = action;
  button.append(label, dashboardIcon(primary ? "plus" : "arrow"));
  return button;
}

function localDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function dashboardDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function shortDashboardDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function goalProgress(record) {
  const current = Math.max(0, Number(record.current) || 0);
  const target = Math.max(1, Number(record.target) || 1);
  const complete = current >= target;
  let status = "on-track";
  if (complete) status = "completed";
  else if (record.status === "on-track") status = "on-track";
  else if (record.status === "behind" || record.date < localDateKey()) status = "behind";
  else if (current === 0) status = "not-started";
  const percentage = Math.min(complete ? 100 : 99, Math.round(current / target * 100));
  return { current, target, complete, status, percentage };
}

function renderGoalRecord(record) {
  const progress = goalProgress(record);
  const item = document.createElement("li");
  item.className = "goal-record";
  item.dataset.status = progress.status;
  const content = document.createElement("div");
  content.className = "goal-record-content";
  const heading = document.createElement("div");
  heading.className = "goal-record-heading";
  const title = document.createElement("h3");
  title.textContent = record.title;
  const summary = document.createElement("span");
  summary.className = "goal-progress-summary";
  const badge = document.createElement("span");
  badge.className = "goal-status";
  badge.textContent = { "on-track": "On track", behind: "Behind", completed: "Completed", "not-started": "Not started" }[progress.status];
  const percentage = document.createElement("span");
  percentage.className = "goal-percentage";
  percentage.textContent = `${progress.percentage}%`;
  summary.append(badge, percentage);
  heading.append(title, summary);
  const bar = document.createElement("div");
  bar.className = "goal-progress-bar";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", `${record.title} progress`);
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  bar.setAttribute("aria-valuenow", String(progress.percentage));
  bar.setAttribute("aria-valuetext", `${progress.current.toLocaleString("en-US")} of ${progress.target.toLocaleString("en-US")}`);
  const fill = document.createElement("span");
  fill.style.width = `${progress.percentage}%`;
  bar.append(fill);
  const detail = document.createElement("p");
  detail.className = "goal-record-detail";
  const ending = progress.complete
    ? record.completedAt ? `Completed ${shortDashboardDate(record.completedAt)}` : "Completed"
    : `Due ${shortDashboardDate(record.date)}`;
  detail.textContent = `${progress.current.toLocaleString("en-US")} / ${progress.target.toLocaleString("en-US")}${record.metric === "Press features" ? " secured" : record.metric === "Short-form videos" ? " posted" : ""} · ${ending}`;
  content.append(heading, bar, detail);
  const edit = document.createElement("button");
  edit.className = "record-edit";
  edit.type = "button";
  edit.setAttribute("aria-label", `Edit ${record.title}`);
  edit.append(dashboardIcon("edit"));
  edit.addEventListener("click", () => openDashboardForm("goal", record));
  item.append(content, edit);
  return item;
}

function renderMilestoneRecord(record) {
  const date = new Date(`${record.date}T12:00:00`);
  const difference = record.demo && Number.isFinite(record.demoDaysUntil) ? record.demoDaysUntil : Math.round((Date.parse(`${record.date}T00:00:00Z`) - Date.parse(`${localDateKey()}T00:00:00Z`)) / 86400000);
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "milestone-row";
  button.classList.toggle("milestone-row--soon", difference <= 7);
  button.setAttribute("aria-label", `Edit ${record.title}, ${dashboardDate(record.date)}`);
  const tile = document.createElement("time");
  tile.className = "milestone-date-tile";
  tile.dateTime = record.date;
  const month = document.createElement("span");
  month.textContent = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = document.createElement("strong");
  day.textContent = String(date.getDate());
  tile.append(month, day);
  const copy = document.createElement("span");
  copy.className = "milestone-row-copy";
  const title = document.createElement("span");
  title.className = "milestone-row-title";
  title.textContent = record.title;
  const detail = document.createElement("span");
  detail.className = "milestone-row-detail";
  detail.textContent = [record.category || record.type, record.channel].filter(Boolean).join(" · ");
  copy.append(title, detail);
  const relative = document.createElement("span");
  relative.className = "milestone-countdown";
  relative.textContent = difference === 0 ? "Today" : difference < 0 ? `${Math.abs(difference)}d ago` : `in ${difference}d`;
  button.append(tile, copy, relative, dashboardIcon("chevron-right"));
  button.addEventListener("click", () => openDashboardForm("milestone", record));
  item.append(button);
  return item;
}

function renderPlanningRecords(kind, records, content) {
  const limit = kind === "goals" ? 4 : 5;
  const ordered = kind === "milestones" ? [...records].sort((a, b) => a.date.localeCompare(b.date)) : records;
  const visible = ordered.slice(0, limit);
  const list = document.createElement("ul");
  list.className = kind === "goals" ? "goal-records" : "milestone-records";
  visible.forEach((record) => list.append(kind === "goals" ? renderGoalRecord(record) : renderMilestoneRecord(record)));
  const footer = document.createElement("div");
  footer.className = "records-footer";
  const count = document.createElement("span");
  count.textContent = `Showing ${visible.length} of ${records.length}`;
  footer.append(count);
  const viewAll = document.createElement("button");
  viewAll.type = "button";
  viewAll.className = "text-link";
  viewAll.dataset.dashboardSection = "Plan";
  viewAll.append("View all", dashboardIcon("arrow"));
  footer.append(viewAll);
  content.append(list, footer);
}

function renderDashboardRecords(kind, records) {
  if (kind === "touchpoints" && !hasDashboardConnections(activeProject)) records = [];
  const content = document.querySelector(`#${kind}-content`);
  const config = dashboardEmptyStates[kind];
  let filtered = kind === "goals" ? filterGoalRecords(records, activeProject)
    : kind === "milestones" ? filterMilestoneRecords(records, activeProject)
    : filterTouchpointRecords(records, activeProject);
  filtered = filterDashboardMetricDates(kind, filtered, activeProject);
  content.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "dashboard-empty";
    const icon = document.createElement("span");
    icon.className = "dashboard-icon";
    icon.append(dashboardIcon(config.icon));
    const title = document.createElement("h3");
    title.textContent = records.length ? `No matching ${kind === "touchpoints" ? "connections" : kind}` : config.title;
    const description = document.createElement("p");
    description.textContent = records.length ? "Try a different filter to see your updates." : config.description;
    empty.append(icon, title, description, dashboardButton(config.label, config.action, config.primary));
    content.append(empty);
    return;
  }

  if (kind === "goals" || kind === "milestones") {
    renderPlanningRecords(kind, filtered, content);
    return;
  }

  const list = document.createElement("ul");
  list.className = "connection-updates";
  [...filtered].sort((a, b) => b.date.localeCompare(a.date)).forEach((record) => {
    const item = document.createElement("li");
    const row = document.createElement(record.url ? "a" : "button");
    row.className = "connection-update";
    if (record.url) {
      row.href = record.url;
      row.target = "_blank";
      row.rel = "noopener noreferrer";
    } else {
      row.type = "button";
      row.dataset.dashboardSection = "Connect";
    }
    const icon = document.createElement("span");
    icon.className = `connection-update-icon${record.icon === "video" ? " connection-update-icon--video" : ""}`;
    if (record.icon !== "video") icon.append(dashboardIcon(record.icon || "link"));
    const body = document.createElement("span");
    body.className = "connection-update-body";
    const category = document.createElement("span");
    category.className = "connection-update-category";
    category.textContent = `${record.category || ({ post: "SHORT-FORM", press: "PRESS", store: "STOREFRONT" }[record.type] || "CONNECTION")} · ${record.platform}`;
    const title = document.createElement("span");
    title.className = "connection-update-title";
    title.textContent = record.title;
    const detail = document.createElement("span");
    detail.className = "connection-update-summary";
    detail.textContent = record.summary || "Performance updates will appear here.";
    const time = document.createElement("span");
    time.className = "connection-update-time";
    time.textContent = record.relativeTime || dashboardDate(record.date);
    body.append(category, title, detail);
    row.append(icon, body, time, dashboardIcon("chevron-right"));
    item.append(row);
    list.append(item);
  });
  content.append(list);
}

function renderConversionMetrics(card) {
  const funnel = document.querySelector(".conversion-funnel");
  const metrics = hasDashboardConnections(card) ? card.conversionMetrics : null;
  funnel.classList.toggle("has-data", Boolean(metrics));
  if (!metrics) hideConversionDetail();
  Array.from(funnel.children).forEach((row, index) => {
    row.children[1].textContent = metrics?.[index]?.value || "0";
    row.querySelector("small").textContent = metrics?.[index]?.detail || "No data yet";
    row.tabIndex = metrics ? 0 : -1;
    if (metrics) row.setAttribute("role", "button");
    else row.removeAttribute("role");
    row.dataset.conversionStage = index;
  });
}

function updateSetupCard(checkId, complete, initialLabel, completedLabel, delay = 0) {
  const check = document.getElementById(checkId);
  const card = check.closest(".setup-card");
  clearTimeout(card.completionTimer);
  card.classList.toggle("setup-card--static", !delay);
  const update = () => {
    card.classList.toggle("is-complete", complete);
    check.setAttribute("aria-hidden", String(!complete));
    const button = card.querySelector("button");
    button.classList.toggle("button--primary", !complete);
    button.classList.toggle("button--secondary", complete);
    button.querySelector(".setup-action-label").textContent = complete ? completedLabel : initialLabel;
    button.querySelector(".icon").toggleAttribute("hidden", complete);
  };
  if (delay && complete && !card.classList.contains("is-complete")) {
    card.completionTimer = setTimeout(update, delay);
  } else update();
}

function updateSetupProgress(complete, animate) {
  const progress = document.querySelector("#setup-progress");
  clearTimeout(progress.completionTimer);
  progress.completionAnimation?.cancel();
  const label = `${complete} of 3`;
  if (progress.querySelector("strong")?.textContent === label) return;
  const update = () => {
    const count = document.createElement("strong");
    count.textContent = label;
    progress.replaceChildren(count, " complete");
  };
  if (!animate) {
    update();
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  progress.completionTimer = setTimeout(async () => {
    if (!reduced) {
      progress.completionAnimation = progress.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 140, easing: "ease-in", fill: "forwards",
      });
      try { await progress.completionAnimation.finished; } catch { return; }
      progress.completionAnimation.cancel();
    }
    update();
    if (!reduced) {
      progress.completionAnimation = progress.animate([
        { opacity: 0, transform: "translateY(3px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 260, easing: "ease-out" });
    }
  }, reduced ? 500 : 360);
}

let goalSetupAnimationPending = false;

function celebrateSetupCompletion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const shower = document.createElement("div");
  shower.className = "goal-celebration";
  shower.setAttribute("aria-hidden", "true");
  const emojis = ["🎉", "✨", "🎊", "⭐", "🙌"];
  const animations = [];
  for (let index = 0; index < 32; index++) {
    const emoji = document.createElement("span");
    emoji.textContent = emojis[index % emojis.length];
    emoji.style.left = `${(index + Math.random()) / 32 * 100}%`;
    emoji.style.fontSize = `${22 + Math.random() * 14}px`;
    shower.append(emoji);
  }
  document.body.append(shower);
  for (const emoji of shower.children) {
    const drift = Math.random() * 120 - 60;
    const rotation = Math.random() * 240 - 120;
    const animation = emoji.animate([
      { transform: "translate(0, -60px) rotate(0deg)", opacity: 0 },
      { opacity: 1, offset: 0.12 },
      { opacity: 1, offset: 0.8 },
      { transform: `translate(${drift}px, ${window.innerHeight + 60}px) rotate(${rotation}deg)`, opacity: 0 },
    ], { duration: 2200 + Math.random() * 800, delay: Math.random() * 650, easing: "ease-in", fill: "both" });
    animations.push(animation.finished);
  }
  Promise.allSettled(animations).then(() => shower.remove());
}

function updateDashboardSetup(card, animate = false) {
  if (gameWorkspace.dataset.section !== "Home") return;
  const complete = Boolean(card.goalSetupComplete || gameDashboardData(card).goals.length);
  const platformComplete = Boolean(card.platformSetupComplete || card.connections?.length);
  if (complete) card.goalSetupComplete = true;
  if (platformComplete) card.platformSetupComplete = true;
  const playAnimation = animate && goalSetupAnimationPending;
  const playPlatformAnimation = animate && card.platformSetupCelebrationPending && platformComplete;
  goalSetupAnimationPending = false;
  if (card.platformSetupCelebrationPending) {
    delete card.platformSetupCelebrationPending;
    saveProject(card);
  }
  updateSetupProgress(1 + Number(complete) + Number(platformComplete), playAnimation || playPlatformAnimation);
  updateSetupCard("goal-complete", complete, "Add a Goal", "Add another goal", playAnimation ? 500 : 0);
  updateSetupCard("platform-complete", platformComplete, "New Connection", "Add Connection", playPlatformAnimation ? 500 : 0);
  if (playAnimation || playPlatformAnimation) celebrateSetupCompletion();
}

function renderDashboard(card, section) {
  const sameGame = dashboardProject === card;
  if (dashboardProject !== card) {
    gameWorkspace.querySelectorAll(".dashboard-filter").forEach((filter) => { filter.value = "all"; });
    dashboardProject = card;
  }
  syncGoalFilterControls(card);
  syncMilestoneFilterControls(card);
  syncTouchpointFilterControls(card);
  gameWorkspace.dataset.section = section;
  const data = gameDashboardData(card);
  if (hasDashboardConnections(card)) extendConnectionDemo(card);
  renderConversionMetrics(card);
  const name = card.name;
  const home = section === "Home";
  document.querySelector("#dashboard-game-name").textContent = name;
  workspacePageTitle.replaceChildren(home ? "Welcome " : section);
  if (home) {
    const wave = document.createElement("span");
    wave.className = "welcome-wave";
    wave.setAttribute("aria-hidden", "true");
    wave.textContent = "👋";
    workspacePageTitle.append(wave);
  }
  document.querySelector("#dashboard-setup").hidden = !home;
  document.querySelector("#dashboard-setup-heading").hidden = !home;
  if (gameWorkspace.dataset.revealing !== "true" || !sameGame) {
    updateDashboardSetup(card, home);
  }

  const panels = {
    goals: home,
    milestones: home,
    conversion: home,
    touchpoints: home,
  };
  Object.entries(panels).forEach(([name, visible]) => {
    document.querySelector(`#${name}-panel`).hidden = !visible;
  });
  Object.keys(dashboardEmptyStates).forEach((kind) => renderDashboardRecords(kind, data[kind]));
  renderDashboardMetrics(card, section);
  renderHomeSetup(card, section);
}

gameWorkspace.addEventListener("workspace:revealed", () => {
  if (!activeProject || gameWorkspace.dataset.section !== "Home") return;
  updateDashboardSetup(activeProject, true);
});

const dashboardForms = {
  goal: {
    title: "Add Goal", collection: "goals",
    fields: [
      { name: "title", label: "Your Goal", placeholder: "e.g. Reach 25,000 Steam wishlists by launch", suggestions: ["Reach 25,000 Steam wishlists by launch"] },
      { name: "metric", label: "Type", placeholder: "Select a type", options: ["Steam wishlists", "Discord members", "Patreon members", "Press features", "Short-form videos", "Newsletter subscribers", "Custom"] },
      { name: "target", label: "Target", placeholder: "Target", numeric: true, suggestions: ["25,000"] },
      { name: "date", label: "Date", type: "date", today: true },
    ],
  },
  milestone: {
    title: "Add Milestone", collection: "milestones",
    fields: [
      { name: "title", label: "Milestone", placeholder: "e.g. Steam Next Fest demo submission", suggestions: ["Steam Next Fest demo submission"] },
      { name: "type", label: "Type", options: ["Event", "Deliverable", "Content", "Fund", "Press", "Revenue", "Deadline", "Funding"] },
      { name: "date", label: "Date", type: "date", today: true },
    ],
  },
  touchpoint: {
    title: "New Connection", collection: "touchpoints",
    fields: [
      { name: "title", label: "Title", placeholder: "Our first gameplay trailer", suggestions: ["Our first gameplay trailer"] },
      { name: "type", label: "Type", options: [{ value: "post", label: "Post" }, { value: "press", label: "Press piece" }, { value: "store", label: "Store update" }] },
      { name: "platform", label: "Platform", placeholder: "Steam, YouTube, Instagram…", suggestions: ["Steam", "YouTube", "Instagram"] },
      { name: "url", label: "Link (optional)", type: "url", optional: true, placeholder: "https://" },
      { name: "date", label: "Date", type: "date", today: true },
    ],
  },

  name: {
    title: "Edit game name",
    fields: [{ name: "title", label: "Game name", maxLength: 60, suggestions: ["Hollow Signal"] }],
  },
};

function goalTargetNumber(value) {
  if (!/^(?:[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)$/.test(value.trim())) return null;
  const number = Number(value.replaceAll(",", ""));
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function goalCurrentNumber(value) {
  return value.trim() === "0" ? 0 : goalTargetNumber(value);
}

function goalFormSnapshot() {
  const fields = dashboardForm.elements;
  return JSON.stringify({
    title: fields.title.value.trim(), metric: fields.metric.value,
    target: goalTargetNumber(fields.target.value), date: fields.date.value,
    current: fields.current ? goalCurrentNumber(fields.current.value) : 0,
  });
}

function syncGoalCurrentProgress() {
  const input = dashboardForm.elements.current;
  if (!input) return;
  const metric = dashboardForm.elements.metric.value;
  const automatic = ["Steam wishlists", "Discord members", "Patreon members"].includes(metric);
  input.readOnly = automatic;
  document.querySelector("#goal-current-label").textContent = automatic ? "Current progress" : "Current progress (manual)";
  const unit = { "Steam wishlists": "wishlists", "Discord members": "members", "Patreon members": "members", "Press features": "secured", "Short-form videos": "posted", "Newsletter subscribers": "subscribers" }[metric] || "";
  const target = goalTargetNumber(dashboardForm.elements.target.value);
  document.querySelector("#goal-current-suffix").textContent = `of ${target === null ? "—" : target.toLocaleString("en-US")} ${unit}`.trim();
  document.querySelector("#goal-current-note").textContent = automatic
    ? "Progress updates from your platform when connected."
    : `${metric || "Custom goals"} aren't tracked automatically. Wishlist, Discord and Patreon goals update when connected.`;
  input.style.width = `${Math.max(1, input.value.length)}ch`;
}

function buildGoalCurrentProgress(record) {
  const field = document.createElement("div");
  field.className = "field goal-current-field";
  field.dataset.field = "current";
  const label = document.createElement("label");
  label.id = "goal-current-label";
  label.htmlFor = "goal-current";
  const control = document.createElement("div");
  control.className = "current-progress-control";
  const input = document.createElement("input");
  input.id = "goal-current";
  input.name = "current";
  input.type = "text";
  input.inputMode = "numeric";
  input.maxLength = 21;
  input.value = Math.max(0, Number(record.current) || 0).toLocaleString("en-US");
  input.setAttribute("aria-describedby", "goal-current-suffix goal-current-note");
  const suffix = document.createElement("span");
  suffix.id = "goal-current-suffix";
  const note = document.createElement("p");
  note.id = "goal-current-note";
  control.append(input, suffix);
  field.append(label, control, note);
  dashboardFields.insertBefore(field, dashboardFields.querySelector('[data-field="target"]'));
  syncGoalCurrentProgress();
}

function updatePlanningSaveState() {
  if (dashboardAction === "milestone") {
    updateMilestoneForm();
    return;
  }
  if (dashboardAction !== "goal") return;
  syncGoalCurrentProgress();
  const fields = dashboardForm.elements;
  const targetValid = goalTargetNumber(fields.target.value) !== null;
  fields.target.setCustomValidity(fields.target.value && !targetValid ? "Enter a positive whole number, such as 25,000." : "");
  let currentValid = true;
  if (fields.current) {
    currentValid = goalCurrentNumber(fields.current.value) !== null;
    fields.current.setCustomValidity(currentValid ? "" : "Enter zero or a positive whole number.");
  }
  dashboardSaveButton.disabled = !fields.title.value.trim()
    || !fields.metric.value || !targetValid || !fields.date.validity.valid || !fields.date.value
    || !currentValid || Boolean(editingGoal && goalFormSnapshot() === goalFormBaseline);
}

function enhanceFormDropdown(select, caption, { id = "goal-type", placeholder = "Select a type", name = "Goal type" } = {}) {
  const root = document.createElement("div");
  root.className = "goal-type-dropdown";
  const trigger = document.createElement("button");
  trigger.id = `${id}-trigger`;
  trigger.className = "goal-type-trigger";
  trigger.type = "button";
  trigger.setAttribute("popovertarget", `${id}-menu`);
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", `${id}-menu`);
  trigger.setAttribute("aria-labelledby", `${caption.id} ${id}-label`);
  const text = document.createElement("span");
  text.id = `${id}-label`;
  text.dataset.dropdownLabel = "";
  text.textContent = select.value ? select.selectedOptions[0].textContent : placeholder;
  trigger.classList.toggle("has-value", Boolean(select.value));
  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chevron.classList.add("icon");
  chevron.setAttribute("viewBox", "0 0 24 24");
  chevron.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(chevron.namespaceURI, "path");
  path.setAttribute("d", "m8 10 4 5 4-5");
  chevron.append(path);
  trigger.append(text, chevron);
  const menu = document.createElement("div");
  menu.id = `${id}-menu`;
  menu.className = "filter-menu goal-type-menu";
  menu.setAttribute("popover", "auto");
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", name);
  Array.from(select.options).filter((option) => option.value).forEach((option) => {
    const button = document.createElement("button");
    button.className = "filter-option";
    button.type = "button";
    button.tabIndex = -1;
    button.dataset.value = option.value;
    button.setAttribute("role", "menuitemradio");
    button.setAttribute("aria-checked", String(select.value === option.value));
    const label = document.createElement("span");
    label.textContent = option.textContent;
    button.append(label);
    menu.append(button);
  });
  select.replaceWith(root);
  root.append(select, trigger, menu);
  select.hidden = true;
  caption.htmlFor = trigger.id;
  select.addEventListener("invalid", (event) => {
    event.preventDefault();
    trigger.focus();
  });
  function refresh() {
    text.textContent = select.value ? select.selectedOptions[0].textContent : placeholder;
    trigger.classList.toggle("has-value", Boolean(select.value));
    menu.querySelectorAll("[data-value]").forEach((option) => {
      option.setAttribute("aria-checked", String(option.dataset.value === select.value));
    });
  }
  select.addEventListener("change", refresh);
  connectDropdown(trigger, menu, (option) => {
    select.value = option.dataset.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, { placement: "below" });
}

function openDashboardForm(action, record = null) {
  const config = dashboardForms[action];
  const goal = action === "goal";
  const milestone = action === "milestone";
  const planning = goal || milestone;
  clearTimeout(goalSampleTimer);
  goalSampleEligible = goal && !record && !goalSampleOpened;
  if (goal && !record) goalSampleOpened = true;
  goalSampleEditedFields.clear();
  editingMilestone = milestone ? record : null;
  editingGoal = goal ? record : null;
  dashboardAction = action;
  dashboardDialog.querySelectorAll(":popover-open").forEach((menu) => menu.hidePopover());
  dashboardDialog.classList.toggle("goal-dialog", goal);
  dashboardDialog.classList.toggle("planning-dialog", planning);
  dashboardDialog.classList.toggle("milestone-dialog", milestone);
  const description = document.querySelector("#dashboard-dialog-description");
  description.hidden = !planning;
  description.textContent = editingMilestone ? "Edit your milestone and your goals" : editingGoal ? "Edit your goal" : milestone ? "Add milestones and goals for your game." : "Set a target for your game and track your progress.";
  document.querySelector("#dashboard-cancel").hidden = planning;
  document.querySelector("#dashboard-delete").hidden = !editingMilestone && !editingGoal;
  document.querySelector("#dashboard-delete-label").textContent = editingGoal ? "Remove" : "Delete";
  document.querySelector("#goal-save-check").toggleAttribute("hidden", !planning);
  dashboardSaveButton.disabled = planning;
  if (planning) dashboardDialog.setAttribute("aria-describedby", "dashboard-dialog-description");
  else dashboardDialog.removeAttribute("aria-describedby");
  document.querySelector("#dashboard-dialog-title").textContent = editingMilestone ? "Edit Milestone" : editingGoal ? "Edit Goal" : config.title;
  dashboardFields.replaceChildren();
  config.fields.forEach((field) => {
    const label = document.createElement("div");
    label.className = "field";
    label.dataset.field = field.name;
    const caption = document.createElement("label");
    caption.id = `dashboard-${field.name}-label`;
    caption.htmlFor = `dashboard-${field.name}`;
    caption.textContent = field.label;
    if (planning) {
      const required = document.createElement("span");
      required.className = "required-mark";
      required.setAttribute("aria-hidden", "true");
      required.textContent = " *";
      caption.append(required);
    }
    const input = document.createElement(field.options ? "select" : "input");
    input.id = `dashboard-${field.name}`;
    input.name = field.name;
    input.required = !field.optional;
    if (field.options) {
      if (field.placeholder) {
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = field.placeholder;
        placeholder.disabled = true;
        placeholder.selected = true;
        input.append(placeholder);
      }
      field.options.forEach((choice) => {
        const option = document.createElement("option");
        option.value = choice.value || choice;
        option.textContent = choice.label || choice;
        input.append(option);
      });
    } else {
      input.type = field.type || "text";
      if (field.numeric) input.inputMode = "numeric";
      if (input.type === "text" || input.type === "url") input.maxLength = field.maxLength || (input.type === "url" ? 2048 : 120);
      if (input.type === "number") {
        input.min = "1";
        input.step = "1";
      }
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.today) input.value = localDateKey();
      if (action === "name") input.value = activeProject.name;
    }
    label.append(caption, input);
    dashboardFields.append(label);
    if (record && record[field.name] !== undefined) {
      input.value = field.numeric ? Number(record[field.name]).toLocaleString("en-US") : record[field.name];
    }
    if (field.suggestions && (!goal || goalSampleEligible)) {
      enableSuggestedCompletion(input, field.suggestions);
    }
    if (goal && field.name === "metric") enhanceFormDropdown(input, caption);
    if (milestone && field.name === "type") {
      enhanceFormDropdown(input, caption, { id: "milestone-type", name: "Milestone type" });
    }
    if (field.type === "date") enhanceDatePicker(input, caption);
  });
  if (milestone) initializeMilestoneForm(record);
  if (editingGoal) buildGoalCurrentProgress(editingGoal);
  goalFormBaseline = editingGoal ? goalFormSnapshot() : null;
  updatePlanningSaveState();
  dashboardDialog.showModal();
  dashboardFields.querySelector("input, select").focus();
}

gameWorkspace.addEventListener("click", (event) => {
  const action = event.target.closest("[data-dashboard-action]");
  if (action) openDashboardForm(action.dataset.dashboardAction);
  const section = event.target.closest("[data-dashboard-section]");
  if (section) {
    selectWorkspaceSection(section.dataset.dashboardSection);
    window.scrollTo(0, 0);
  }
});

gameWorkspace.addEventListener("change", (event) => {
  if (event.target.matches(".dashboard-filter")) {
    const kind = event.target.id.replace("-filter", "");
    renderDashboardRecords(kind, gameDashboardData(activeProject)[kind]);
  }
});

function scheduleGoalSample() {
  clearTimeout(goalSampleTimer);
  if (!goalSampleEligible || dashboardAction !== "goal" || editingGoal) return;
  const title = dashboardForm.elements.title;
  if (title.value.trim().toLowerCase() !== "reach 25,000 steam wishlists by launch") return;
  goalSampleTimer = setTimeout(() => {
    if (!dashboardDialog.open || !goalSampleEligible ||
        title.value.trim().toLowerCase() !== "reach 25,000 steam wishlists by launch") return;
    goalSampleEligible = false;
    const fields = dashboardForm.elements;
    for (const [name, value] of [["metric", "Steam wishlists"], ["target", "25,000"]]) {
      if (fields[name].value || goalSampleEditedFields.has(name)) continue;
      fields[name].value = value;
      fields[name].dispatchEvent(new Event(name === "metric" ? "change" : "input", { bubbles: true }));
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        fields[name].closest(".field").animate([
          { opacity: .3, transform: "translateY(4px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 320, easing: "ease-out" });
      }
    }
    updatePlanningSaveState();
  }, 500);
}

dashboardDialog.addEventListener("close", () => {
  clearTimeout(goalSampleTimer);
  goalSampleEligible = false;
});

dashboardForm.addEventListener("input", (event) => {
  event.target.setCustomValidity("");
  if (dashboardAction === "goal") {
    goalSampleEditedFields.add(event.target.name);
    if (event.target.name === "title") scheduleGoalSample();
  }
  updatePlanningSaveState();
});
dashboardForm.addEventListener("change", (event) => {
  if (dashboardAction === "goal") goalSampleEditedFields.add(event.target.name);
  updatePlanningSaveState();
});
dashboardForm.addEventListener("focusout", (event) => {
  if (event.target.name === "current") {
    const current = goalCurrentNumber(event.target.value);
    if (current !== null) event.target.value = current.toLocaleString("en-US");
    syncGoalCurrentProgress();
  }
  if ((dashboardAction === "goal" && event.target.name === "target") || event.target.name?.startsWith("milestoneTarget-")) {
    const target = goalTargetNumber(event.target.value);
    if (target !== null) event.target.value = target.toLocaleString("en-US");
  }
});
dashboardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (dashboardDialog.dataset.transitioning === "true") return;
  const config = dashboardForms[dashboardAction];
  const record = Object.fromEntries(new FormData(dashboardForm));
  Object.keys(record).forEach((key) => { record[key] = record[key].trim(); });
  if (dashboardAction === "goal") {
    updatePlanningSaveState();
    if (dashboardSaveButton.disabled) return;
    record.target = String(goalTargetNumber(record.target));
    if (editingGoal) record.current = String(goalCurrentNumber(record.current));
  }
  if (dashboardAction === "milestone") {
    updatePlanningSaveState();
    if (dashboardSaveButton.disabled) return;
    record.goals = readMilestoneGoals();
    record.event = dashboardForm.elements.event.disabled ? "" : dashboardForm.elements.event.value;
    Object.keys(record).forEach((key) => {
      if (key.startsWith("milestoneMetric-") || key.startsWith("milestoneTarget-")) delete record[key];
    });
  }
  for (const input of dashboardFields.querySelectorAll("input")) {
    if (input.required && !input.value.trim()) {
      input.setCustomValidity("Enter a value.");
      input.reportValidity();
      return;
    }
    if (input.type === "url" && record[input.name] && !/^https?:\/\//i.test(record[input.name])) {
      input.setCustomValidity("Enter a link starting with https:// or http://.");
      input.reportValidity();
      return;
    }
  }
  if (dashboardAction === "name") {
    activeProject.name = record.title;
  } else if (dashboardAction === "goal" && editingGoal) {
    const before = Number(editingGoal.current) || 0;
    if (Number(record.current) !== before) {
      editingGoal.history ??= [];
      editingGoal.history.push({ date: new Date().toISOString(), current: Number(record.current) });
    }
    Object.assign(editingGoal, record);
    if (Number(record.current) >= Number(record.target)) editingGoal.completedAt ||= localDateKey();
    else delete editingGoal.completedAt;
  } else if (dashboardAction === "milestone" && editingMilestone) {
    if (editingMilestone.date !== record.date) delete editingMilestone.demoDaysUntil;
    if (editingMilestone.type !== record.type) {
      delete editingMilestone.category;
      delete editingMilestone.channel;
    }
    delete editingMilestone.goal;
    Object.assign(editingMilestone, record);
  } else {
    if (dashboardAction === "goal" && !activeProject.goalSetupComplete
        && !gameDashboardData(activeProject).goals.length) {
      activeProject.goalSetupComplete = true;
      goalSetupAnimationPending = true;
    }
    gameDashboardData(activeProject)[config.collection].push(record);
    if (dashboardAction === "touchpoint") seedConnectionDemo(activeProject);
    if (["goal", "milestone"].includes(dashboardAction)) {
      seedPlanningDemo(activeProject, config.collection, record);
    }
  }
  const section = workspaceSidebar.querySelector('[aria-current="page"]').dataset.section;
  dissolveToWorkspace(dashboardDialog, () => {
    selectWorkspaceSection(section);
    document.querySelector("#dashboard-status").textContent = dashboardAction === "name" ? "Game name updated." : `${record.title} ${editingGoal || editingMilestone ? "updated" : "added"}.`;
  });
});

document.querySelector("#dashboard-delete").addEventListener("click", () => {
  if (editingGoal) {
    document.querySelector("#remove-goal-description").textContent = `\u201c${editingGoal.title}\u201d and its progress history will be removed. Milestones linked to it are kept.`;
    document.querySelector("#remove-goal-dialog").showModal();
    return;
  }
  if (!editingMilestone) return;
  const data = gameDashboardData(activeProject);
  const name = editingMilestone.title;
  data.milestones = data.milestones.filter((record) => record !== editingMilestone);
  dashboardDialog.close();
  selectWorkspaceSection("Home");
  document.querySelector("#dashboard-status").textContent = `${name} deleted.`;
  editingMilestone = null;
});

document.querySelector("#confirm-remove-goal").addEventListener("click", () => {
  if (!editingGoal) return;
  const data = gameDashboardData(activeProject);
  const title = editingGoal.title;
  data.goals = data.goals.filter((goal) => goal !== editingGoal);
  document.querySelector("#remove-goal-dialog").close();
  dashboardDialog.close();
  editingGoal = null;
  goalFormBaseline = null;
  selectWorkspaceSection("Home");
  document.querySelector("#dashboard-status").textContent = `${title} removed.`;
});
