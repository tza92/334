// Multiple optional goals share one milestone form and one save operation.
let milestoneGoalSequence = 0;
let milestoneFormBaseline = null;

function readMilestoneGoals() {
  return Array.from(dashboardFields.querySelectorAll(".milestone-goal-row")).flatMap((row) => {
    const metric = row.querySelector("select").value;
    const target = goalTargetNumber(row.querySelector("input").value);
    return metric && target !== null ? [{ metric, target: String(target) }] : [];
  });
}

function milestoneFormSnapshot() {
  const fields = dashboardForm.elements;
  return JSON.stringify({ title: fields.title.value.trim(), type: fields.type.value, date: fields.date.value,
    event: fields.type.value === "Event" ? fields.event.value : "", goals: readMilestoneGoals() });
}

function addMilestoneGoalRow(goal, draft = false) {
  const id = `milestone-goal-${++milestoneGoalSequence}`;
  const row = document.createElement("div");
  row.className = "milestone-goal-row";
  row.dataset.draft = String(draft);
  const metricField = document.createElement("div");
  metricField.className = "field";
  const metricLabel = document.createElement("label");
  metricLabel.id = `${id}-caption`;
  metricLabel.className = "visually-hidden";
  metricLabel.textContent = "Goal metric";
  const metric = document.createElement("select");
  metric.name = `milestoneMetric-${id}`;
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Metric";
  placeholder.disabled = true;
  placeholder.selected = true;
  metric.append(placeholder);
  ["Steam wishlists", "Discord members", "Patreon members", "Press features", "Newsletter subscribers"].forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    metric.append(option);
  });
  metric.value = goal?.metric || "";
  metricField.append(metricLabel, metric);
  const targetField = document.createElement("div");
  targetField.className = "field";
  const targetLabel = document.createElement("label");
  targetLabel.className = "visually-hidden";
  targetLabel.htmlFor = `${id}-target`;
  targetLabel.textContent = "Goal target";
  const target = document.createElement("input");
  target.id = `${id}-target`;
  target.name = `milestoneTarget-${id}`;
  target.type = "text";
  target.inputMode = "numeric";
  target.placeholder = "Target";
  target.maxLength = 21;
  if (goal) target.value = Number(goal.target).toLocaleString("en-US");
  targetField.append(targetLabel, target);
  const action = document.createElement("button");
  action.type = "button";
  function configureAction() {
    const pending = row.dataset.draft === "true";
    action.className = pending ? "milestone-goal-remove milestone-goal-add" : "milestone-goal-remove";
    action.setAttribute("aria-label", pending ? "Add another goal to milestone" : `Remove ${metric.value || "goal"} from milestone`);
    action.replaceChildren(dashboardIcon(pending ? "plus" : "close"));
  }
  action.addEventListener("click", () => {
    if (row.dataset.draft === "true") {
      if (!metric.value || goalTargetNumber(target.value) === null) return;
      row.dataset.draft = "false";
      configureAction();
      const next = addMilestoneGoalRow(null, true);
      next.querySelector(".goal-type-trigger").focus();
    } else {
      row.querySelectorAll(":popover-open").forEach((menu) => menu.hidePopover());
      row.remove();
      dashboardFields.querySelector('.milestone-goal-row[data-draft="true"] .goal-type-trigger').focus();
    }
    updatePlanningSaveState();
  });
  configureAction();
  row.append(metricField, targetField, action);
  dashboardFields.querySelector(".milestone-goal-rows").append(row);
  enhanceFormDropdown(metric, metricLabel, { id, placeholder: "Metric", name: "Milestone goal metric" });
  const index = dashboardFields.querySelectorAll(".milestone-goal-row").length - 1;
  enableSuggestedCompletion(target, [["15,000", "4,000", "250"][index] || "1,000"]);
  return row;
}

function initializeMilestoneForm(record) {
  const eventField = document.createElement("div");
  eventField.className = "field milestone-event-field";
  const caption = document.createElement("label");
  caption.id = "milestone-event-caption";
  caption.textContent = "Event";
  const select = document.createElement("select");
  select.name = "event";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a saved event";
  placeholder.disabled = true;
  placeholder.selected = true;
  select.append(placeholder);
  const events = new Set(["Steam Next Fest", "PAX West", "Gamescom", record?.event].filter(Boolean));
  events.forEach((event) => {
    const option = document.createElement("option");
    option.value = event;
    option.textContent = `${event} · Saved`;
    select.append(option);
  });
  select.value = record?.event || "";
  eventField.append(caption, select);
  dashboardFields.append(eventField);
  enhanceFormDropdown(select, caption, { id: "milestone-event", placeholder: "Select a saved event", name: "Saved event" });
  const group = document.createElement("div");
  group.className = "milestone-goal";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", "milestone-goal-title");
  const title = document.createElement("h3");
  title.id = "milestone-goal-title";
  title.textContent = "Goal for this milestone";
  const rows = document.createElement("div");
  rows.className = "milestone-goal-rows";
  group.append(title, rows);
  dashboardFields.append(group);
  const goals = record?.goals || (record?.goal ? [record.goal] : []);
  goals.forEach((goal) => addMilestoneGoalRow(goal));
  addMilestoneGoalRow(null, true);
  milestoneFormBaseline = record ? milestoneFormSnapshot() : null;
}

function updateMilestoneForm() {
  const fields = dashboardForm.elements;
  const eventField = dashboardFields.querySelector(".milestone-event-field");
  eventField.hidden = fields.type.value !== "Event";
  fields.event.disabled = eventField.hidden;
  if (eventField.hidden) eventField.querySelectorAll(":popover-open").forEach((menu) => menu.hidePopover());
  let goalsValid = true;
  dashboardFields.querySelectorAll(".milestone-goal-row").forEach((row) => {
    const metric = row.querySelector("select");
    const target = row.querySelector("input");
    const started = Boolean(metric.value || target.value.trim());
    metric.required = started;
    target.required = started;
    const validTarget = goalTargetNumber(target.value) !== null;
    target.setCustomValidity(target.value && !validTarget ? "Enter a positive whole number." : "");
    const valid = Boolean(metric.value && validTarget);
    if (started && !valid) goalsValid = false;
    if (row.dataset.draft === "true") row.querySelector(".milestone-goal-add").disabled = !valid;
  });
  dashboardSaveButton.disabled = !fields.title.value.trim() || !fields.type.value || !fields.date.value
    || !fields.date.validity.valid || !goalsValid || Boolean(editingMilestone && milestoneFormSnapshot() === milestoneFormBaseline);
}
