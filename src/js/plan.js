// Plan shares the dashboard's records, filters and editing dialogs.
const planPage = document.querySelector("#plan-page");
const planPanelHomes = ["milestones", "touchpoints"].map((kind) => {
  const panel = document.querySelector(`#${kind}-panel`);
  const anchor = document.createComment(`${kind} home position`);
  panel.before(anchor);
  return { panel, anchor };
});
let planMonth = null;
let planSelectedDate = null;
let planFeaturedMilestone = null;
let planCalendarEntries = [];
const planCategories = { milestone: "Milestones", goal: "Goals", event: "Events", fund: "Funds" };
const planOpportunityExamples = [
  { id: "early-growth", kind: "fund", title: "Early stage growth program", organization: "DIGIBC", date: "2026-08-12", days: 6, description: "Up to $5,000 per project", audience: "Fund for early stage studios", saved: true },
  { id: "interactive-media", kind: "fund", title: "Interactive digital media program", organization: "Creative BC", date: "2026-08-20", days: 14, description: "Provincial fund for B.C. studio", audience: "Fund for early stage studios", saved: true },
  { id: "project-development", kind: "fund", title: "Project Development Fund", organization: "DIGIBC", date: "2026-09-22", days: 47, description: "Up to $5,000 per project", audience: "Fund for early stage studios", saved: false },
  { id: "next-fest", kind: "event", title: "Steam Next Fest", organization: "EVENT · ONLINE", date: "2026-08-12", endDate: "2026-08-19", days: 6, description: "Demo Festival", audience: "Players & Press", saved: true },
  { id: "pax-west", kind: "event", title: "PAX West Event In Seattle", organization: "EVENT · SEATTLE", date: "2026-08-29", endDate: "2026-09-01", days: 23, description: "Booth 2184", audience: "Players & Press", saved: true },
  { id: "vancouver-showcase", kind: "event", title: "Vancouver Indie Showcase", organization: "EVENT · VANCOUVER", date: "2026-09-18", days: 43, description: "Demo unreleased games", audience: "Developers & Funders", saved: true },
];
const planOpportunityDetails = {
  "next-fest": { title: "Steam Next Fest", location: "Online", type: "Demo festival", about: "An online demo festival on Steam where players and press try free demos of upcoming games.", url: "https://store.steampowered.com/sale/nextfest" },
  "pax-west": { title: "PAX West", location: "Seattle", booth: "2184", about: "PAX West in Seattle, a gaming expo where you show your game to players and press. Your setup is at booth 2184.", url: "https://west.paxsite.com/" },
  "vancouver-showcase": { title: "Vancouver Indie Showcase", location: "Vancouver", type: "Demo unreleased games", about: "A Vancouver showcase for demoing unreleased games to other developers and funders." },
  "early-growth": { title: "Early Stage Growth", organization: "DigiBC", about: "The Early Stage Growth Program helps early stage studios in B.C. take a project to its next milestone. Studios can put the funding toward a playable demo, a vertical slice, or getting a build ready for showcases and festivals.", url: "https://digibc.org/" },
  "interactive-media": { title: "Interactive Digital Media Program", organization: "Creative BC", about: "A provincial fund from Creative BC for B.C. studios building interactive digital media projects, including games.", url: "https://creativebc.com/" },
  "project-development": { title: "Project Development Fund", organization: "DigiBC", about: "Project development support for early stage studios in B.C. working toward their next milestone.", url: "https://digibc.org/" },
};
const planExpandedMilestones = new WeakSet();
const planExpandedTouchpoints = new WeakSet();
let planDisclosureSequence = 0;

function selectPlanDate(key) {
  const date = new Date(`${key}T12:00:00`);
  planMonth = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  planSelectedDate = key;
  renderPlanCalendar();
}

function planUrgency(record) {
  const days = planDaysUntil(record);
  return days <= 7 ? "soon" : days <= 21 ? "upcoming" : "later";
}

function planCountdownLabel(record) {
  const days = planDaysUntil(record);
  return days < 0 ? `${Math.abs(days)} days ago` : days === 0 ? "Today" : `${record.kind === "fund" ? "Due in" : "Starts in"} ${days} days`;
}

function planBookmark(record, onToggle) {
  const button = planNode("button", "plan-opportunity-bookmark");
  button.type = "button";
  button.setAttribute("aria-label", `Save ${record.title} to plan`);
  button.setAttribute("aria-pressed", String(record.saved));
  button.innerHTML = '<svg viewBox="0 0 20 26" aria-hidden="true"><path d="M3 2h14v21l-7-5-7 5Z"/></svg>';
  button.addEventListener("click", () => {
    record.saved = !record.saved;
    saveProject(activeProject);
    button.setAttribute("aria-pressed", String(record.saved));
    renderPlanPage(activeProject, "Plan");
    onToggle?.();
  });
  return button;
}

function planNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function planDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function planDaysUntil(record) {
  if (record.demo && Number.isFinite(record.demoDaysUntil)) return record.demoDaysUntil;
  return Math.round((Date.parse(`${record.date}T00:00:00Z`) - Date.parse(`${localDateKey()}T00:00:00Z`)) / 86400000);
}

function planOpportunities(card) {
  if (!card.planOpportunities) {
    // Reference opportunities are simulated, just like the existing demo connections.
    const demo = card.isDefaultGame || gameDashboardData(card).milestones.some((record) => record.demo);
    card.planOpportunities = demo ? planOpportunityExamples.map((record) => ({ ...record, demo: true, demoDaysUntil: record.days })) : [];
  }
  return card.planOpportunities;
}

function renderPlanPage(card, section) {
  const visible = section === "Plan";
  planPage.hidden = !visible;
  for (const { panel, anchor } of planPanelHomes) {
    if (visible) document.querySelector("#plan-record-panels").append(panel);
    else anchor.after(panel);
  }
  document.querySelector("#milestones-title").textContent = visible ? "Milestones" : "Upcoming Milestones";
  document.querySelector("#touchpoints-title").textContent = visible ? "Connections" : "Connection Updates";
  const addTouchpoint = document.querySelector("#touchpoints-panel .panel-add");
  addTouchpoint.replaceChildren("Add Connection ", dashboardIcon("plus"));
  if (visible) delete addTouchpoint.dataset.dashboardSection;
  else addTouchpoint.dataset.dashboardSection = "Connect";
  connectionFilterHint.textContent = "Applies as you select";
  if (!visible) return;
  const milestones = [...gameDashboardData(card).milestones].sort((a, b) => a.date.localeCompare(b.date));
  planFeaturedMilestone = milestones.find((record) => planDaysUntil(record) >= 0) || milestones[0] || null;
  if (!planMonth) {
    const date = new Date(`${planFeaturedMilestone?.date || localDateKey()}T12:00:00`);
    planMonth = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  }
  renderPlanMilestone(card);
  renderPlanOpportunities(card);
  planCalendarEntries = [
    ...milestones.map((record) => ({ date: record.date, title: record.title, kind: "milestone", record })),
    ...gameDashboardData(card).goals.map((record) => ({ date: record.date, title: record.title, kind: "goal", record })),
    ...planOpportunities(card).filter((record) => record.saved).map((record) => ({ date: record.date, title: record.title, kind: record.kind, record })),
  ];
  renderPlanCalendar();
}

function renderPlanMilestone(card) {
  const overview = document.querySelector("#plan-milestone-overview");
  const edit = document.querySelector("#plan-edit-milestone");
  overview.replaceChildren();
  edit.replaceChildren(planFeaturedMilestone ? "Edit Milestone " : "Add Milestone ", dashboardIcon("edit"));
  const summary = planNode("div", "plan-milestone-summary");
  const goals = planNode("div", "plan-milestone-goals");
  if (!planFeaturedMilestone) {
    summary.append(planNode("h2", "", "Your next milestone starts here"), planNode("p", "plan-empty", "Add a deadline, launch or event to start planning."));
    goals.append(planNode("h2", "", "Goals for upcoming milestone"), planNode("p", "plan-empty", "Link goals to your milestone to track your progress here."));
    overview.append(summary, goals);
    return;
  }
  const record = planFeaturedMilestone;
  const days = planDaysUntil(record);
  const countdown = planNode("p", "plan-countdown");
  countdown.append(planNode("strong", "", String(Math.abs(days))), days < 0 ? "Days overdue" : days === 1 ? "Day" : "Days");
  const date = planNode("button", "plan-milestone-date", new Date(`${record.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }));
  date.type = "button";
  date.addEventListener("click", () => {
    selectPlanDate(record.date);
    document.querySelector(".plan-calendar-panel").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    document.querySelector(`#plan-days [data-date="${record.date}"]`)?.focus({ preventScroll: true });
  });
  summary.append(planNode("h2", "", record.title), countdown, date);
  goals.append(planNode("h2", "", "Goal for upcoming milestone"));
  const grid = planNode("div", "plan-goal-grid");
  const linked = record.goals || (record.goal ? [record.goal] : []);
  linked.forEach((goal) => {
    const panel = planNode("div", "plan-goal");
    const { current, target } = planLinkedGoalProgress(record, goal);
    const percentage = Math.min(100, Math.round(current / target * 100));
    const value = planNode("div", "plan-goal-value");
    value.append(planNode("strong", "", current.toLocaleString("en-US")), ` / ${target.toLocaleString("en-US")}`);
    const bar = planNode("progress");
    bar.max = target;
    bar.value = current;
    bar.setAttribute("aria-label", `${goal.metric}: ${current.toLocaleString("en-US")} of ${target.toLocaleString("en-US")}`);
    const detail = planNode("div", "plan-goal-detail");
    detail.append(planNode("span", "", `${percentage}% done`), planNode("span", "", `${Math.max(0, target - current).toLocaleString("en-US")} to go`));
    panel.append(planNode("span", "plan-goal-badge", goal.metric), value, bar, detail);
    grid.append(panel);
  });
  goals.append(linked.length ? grid : planNode("p", "plan-empty", "Edit this milestone to add the goals you’re working toward."));
  overview.append(summary, goals);
}

function planDot(kind) {
  const dot = planNode("span", "plan-dot");
  dot.dataset.planCategory = kind;
  dot.setAttribute("aria-hidden", "true");
  return dot;
}

function planDetailIcon(name) {
  const paths = {
    location: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
    tag: '<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="7" cy="7" r="1"/>',
    users: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m3 11v-3a6 6 0 0 0-3-5"/>',
    building: '<path d="m4 21 0-16 8-3 8 3v16H4Zm5 0v-7h6v7"/>',
    funding: '<circle cx="12" cy="12" r="9"/><path d="M15 8c-6-3-8 4-3 4s3 7-3 4m3-11v14"/>',
    external: '<path d="M14 3h7v7m0-7L11 13M10 5H4v15h15v-6"/>',
  };
  if (!paths[name]) return dashboardIcon(name);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = paths[name];
  return svg;
}

function planLinkedGoalProgress(record, goal) {
  const matching = gameDashboardData(activeProject).goals.find((item) => item.metric === goal.metric);
  const sample = { "Steam wishlists": 12480, "Discord members": 3214, "Patreon members": 186, "Newsletter subscribers": 412 };
  return {
    current: Math.max(0, Number(goal.current ?? (record.demo && hasDashboardConnections(activeProject) ? sample[goal.metric] : undefined) ?? matching?.current ?? 0)),
    target: Math.max(1, Number(goal.target) || 1),
  };
}

function planEditMilestone(record, goalIndex) {
  openDashboardForm("milestone", record);
  if (goalIndex !== undefined) {
    const rows = dashboardFields.querySelectorAll(".milestone-goal-row");
    const row = goalIndex === "new" ? rows[rows.length - 1] : rows[goalIndex];
    row?.querySelector(goalIndex === "new" ? ".goal-type-trigger" : "input")?.focus();
  }
}

function planDisclosure(record, kind) {
  const details = planNode("details", "plan-disclosure");
  const expanded = kind === "milestone" ? planExpandedMilestones : planExpandedTouchpoints;
  details.open = expanded.has(record);
  const summary = planNode("summary", kind === "milestone" ? "milestone-row" : "connection-update");
  const panel = planNode("div", "plan-disclosure-panel");
  panel.id = `plan-disclosure-${++planDisclosureSequence}`;
  summary.setAttribute("aria-controls", panel.id);
  summary.setAttribute("aria-expanded", String(details.open));
  details.addEventListener("toggle", () => {
    if (details.open) expanded.add(record);
    else expanded.delete(record);
    summary.setAttribute("aria-expanded", String(details.open));
  });
  details.append(summary, panel);
  return { details, summary, panel };
}

function renderPlanMilestoneRow(record) {
  const item = planNode("li");
  const { details, summary, panel } = planDisclosure(record, "milestone");
  const date = new Date(`${record.date}T12:00:00`);
  const tile = planNode("time", "milestone-date-tile");
  tile.dateTime = record.date;
  tile.append(planNode("span", "", date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()), planNode("strong", "", String(date.getDate())));
  const copy = planNode("span", "milestone-row-copy");
  copy.append(planNode("span", "milestone-row-title", record.title), planNode("span", "milestone-row-detail", [record.category || record.type, record.channel].filter(Boolean).join(" · ")));
  const days = planDaysUntil(record);
  summary.classList.toggle("milestone-row--soon", days >= 0 && days <= 7);
  summary.append(tile, copy, planNode("span", "milestone-countdown", days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? "Today" : `in ${days}d`), dashboardIcon("chevron-right"));
  panel.append(planNode("h3", "", "Goals"));
  const goals = record.goals || (record.goal ? [record.goal] : []);
  goals.forEach((goal, index) => {
    const { current, target } = planLinkedGoalProgress(record, goal);
    const row = planNode("div", "plan-linked-goal");
    const content = planNode("div");
    const caption = planNode("div", "plan-linked-goal-caption");
    caption.append(planNode("span", "", goal.metric), planNode("span", "", `${current.toLocaleString("en-US")} / ${target.toLocaleString("en-US")}`));
    const progress = planNode("progress");
    progress.max = target;
    progress.value = current;
    progress.setAttribute("aria-label", `${goal.metric} progress`);
    content.append(caption, progress);
    const edit = planNode("button", "icon-button");
    edit.type = "button";
    edit.setAttribute("aria-label", `Edit ${goal.metric} target`);
    edit.append(dashboardIcon("edit"));
    edit.addEventListener("click", () => planEditMilestone(record, index));
    row.append(content, edit);
    panel.append(row);
  });
  if (!goals.length) panel.append(planNode("p", "plan-empty", "No goals linked yet. Add a goal to track this milestone."));
  const actions = planNode("div", "plan-disclosure-actions");
  for (const [label, icon, primary, index] of [["Edit milestone", "edit", false, undefined], ["Add Goals", "plus", true, "new"]]) {
    const button = planNode("button", `button ${primary ? "button--primary" : "button--secondary"}`, `${label} `);
    button.type = "button";
    button.append(dashboardIcon(icon));
    button.addEventListener("click", () => planEditMilestone(record, index));
    actions.append(button);
  }
  panel.append(actions);
  item.append(details);
  return item;
}

function planConnectionKind(record) {
  if (["press", "store", "community", "event"].includes(record.type)) return record.type;
  const platform = record.platform?.trim().toLowerCase();
  return ["tiktok", "youtube", "instagram"].includes(platform) ? platform : platform === "discord" ? "community" : "other";
}

function planTouchpointAnalytics(record) {
  const examples = {
    tiktok: [["Views", "48,214", "▲ +12% vs median"], ["Engagement rate", "14.2%", "▲ +2.1pp vs median"], ["Wishlists attributed", "+84", "via UTM link"], ["Discord joins", "+21", "via tracked invite"]],
    youtube: [["Views", "9,412", "▲ +8% vs median"], ["Engagement rate", "6.5%", "▲ +0.9pp vs median"], ["Wishlists attributed", "+58", "via description link"], ["Avg. watch time", "4:12", "38% of video"]],
    press: [["Article reads", "12,040", "▲ +35% vs median"], ["Click-through", "3.8%", "of article reads"], ["Wishlists attributed", "+221", "via referral link"], ["Steam clicks", "457", "via article link"]],
    store: [["Page visits", "6,120", "▲ +18% vs last week"], ["Wishlist rate", "14.1%", "▲ +2.3pp vs before update"], ["Wishlists added", "+863", "since the update"], ["Trailer plays", "2,410", "avg 0:41 watched"]],
    instagram: [["Reach", "41,000", "Promoted post"], ["Spend", "$120", "Campaign spend"], ["Wishlists attributed", "+67", "via UTM link"]],
    community: [["Reactions", "312", "Announcement engagement"], ["New members", "+46", "Since the announcement"]],
    event: [["Registrations", "—", "No data yet"], ["Attendees", "—", "No data yet"]],
    other: [["Views", "—", "No data yet"], ["Engagement rate", "—", "No data yet"]],
  };
  const kind = planConnectionKind(record);
  const metrics = examples[kind].map(([label, value, note]) => {
    const saved = record.analytics?.find(([name]) => name === label);
    if (saved) {
      // Correct only the old sample captions; retain edited values and context.
      if (kind === "youtube" && label === "Wishlists attributed" && saved[2] === "via UTM link") return [label, saved[1], "via description link"];
      if (kind === "press" && label === "Click-through" && saved[2] === "457 clicks to Steam") return [label, saved[1], "of article reads"];
      return [...saved];
    }
    return record.demo ? [label, value, note] : [label, "—", "No data yet"];
  });
  if (kind === "instagram") {
    const number = (label) => {
      const value = metrics.find(([name]) => name === label)?.[1] || "";
      return /\d/.test(value) ? Number(value.replace(/[$,+\s]/g, "")) : NaN;
    };
    const spend = number("Spend");
    const wishlists = number("Wishlists attributed");
    metrics.push(["Cost per attributed wishlist", Number.isFinite(spend) && spend >= 0 && wishlists > 0 ? `$${(spend / wishlists).toFixed(2)}` : "—", "spend ÷ attributed wishlists"]);
  }
  return metrics;
}

function renderPlanTouchpointRecord(record) {
  const item = planNode("li");
  const { details, summary, panel } = planDisclosure(record, "touchpoint");
  const icon = planNode("span", `connection-update-icon${record.icon === "video" ? " connection-update-icon--video" : ""}`);
  if (record.icon !== "video") icon.append(dashboardIcon(record.icon || "megaphone"));
  const body = planNode("span", "connection-update-body");
  body.append(planNode("span", "connection-update-category", `${record.category || ({ post: "SHORT-FORM", press: "PRESS", store: "STOREFRONT" }[record.type] || "CONNECTION")} · ${record.platform}`), planNode("span", "connection-update-title", record.title), planNode("span", "connection-update-summary", record.summary || "Performance updates will appear here."));
  summary.append(icon, body, planNode("span", "connection-update-time", connectionRecordTime(record)), dashboardIcon("chevron-right"));
  const heading = planNode("div", "plan-analytics-heading");
  const edit = planNode("button", "icon-button");
  edit.type = "button";
  edit.setAttribute("aria-label", `Edit analytics for ${record.title}`);
  edit.append(dashboardIcon("edit"));
  edit.addEventListener("click", () => openPlanTouchpointEditor(record));
  heading.append(planNode("h3", "", "Analytics"), edit);
  const grid = planNode("div", "plan-analytics-grid");
  planTouchpointAnalytics(record).forEach(([label, value, note]) => {
    const card = planNode("div", "plan-analytics-card");
    card.append(planNode("span", "", label), planNode("strong", "", value), planNode("small", note.startsWith("▲") ? "is-positive" : "", note));
    grid.append(card);
  });
  panel.append(heading, grid);
  if (record.url) {
    const link = planNode("a", "text-link", "Open original ");
    link.href = record.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(planDetailIcon("external"));
    panel.append(link);
  }
  item.append(details);
  return item;
}

function openPlanTouchpointEditor(record) {
  preparePlanDialog(record ? "Edit Connection" : "Add Connection");
  const form = planNode("form", "plan-touchpoint-form");
  const fields = [
    ["title", "Title", "text", record?.title || ""], ["type", "Type", "select", record?.type || "post"],
    ["platform", "Platform", "text", record?.platform || ""], ["date", "Date", "date", record?.date || localDateKey()],
    ["url", "Link (optional)", "url", record?.url || ""],
  ];
  fields.forEach(([name, caption, type, value]) => {
    const label = planNode("label", "plan-editor-field", caption);
    const input = planNode(type === "select" ? "select" : "input");
    input.name = name;
    if (type === "select") {
      [["post", "Short-form"], ["press", "Press"], ["store", "Storefront"], ["event", "Event"], ["devlog", "Devlog"], ["community", "Community"]].forEach(([key, title]) => { const option = planNode("option", "", title); option.value = key; input.append(option); });
    } else input.type = type;
    input.value = value;
    input.required = name !== "url";
    if (type === "text") input.maxLength = 200;
    label.append(input);
    form.append(label);
  });
  if (record) {
    const fieldset = planNode("fieldset", "plan-analytics-editor");
    fieldset.append(planNode("legend", "", "Analytics"));
    planTouchpointAnalytics(record).filter(([label]) => label !== "Cost per attributed wishlist").forEach(([label, value, note], index) => {
      const group = planNode("div", "plan-analytics-editor-row");
      [[`metric-${index}`, label, value], [`note-${index}`, "Context", note]].forEach(([name, caption, initial]) => {
        const wrapper = planNode("label", "plan-editor-field", caption);
        const input = planNode("input");
        input.name = name;
        input.value = initial;
        input.required = true;
        input.maxLength = 200;
        wrapper.append(input);
        group.append(wrapper);
      });
      fieldset.append(group);
    });
    form.append(fieldset);
  }
  const actions = planNode("footer", "plan-search-footer");
  const save = planNode("button", "button button--primary", "Save");
  save.type = "submit";
  actions.append(save);
  form.append(actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = new FormData(form);
    if (!values.get("title").trim() || !values.get("platform").trim()) return;
    const updated = Object.fromEntries(fields.map(([name]) => [name, String(values.get(name)).trim()]));
    updated.category = { post: "SHORT-FORM", press: "PRESS", store: "STOREFRONT", event: "EVENT", devlog: "DEVLOG", community: "COMMUNITY" }[updated.type];
    updated.icon = { youtube: "play", tiktok: "video", press: "newspaper", store: "storefront", community: "link", event: "calendar" }[planConnectionKind(updated)] || "megaphone";
    if (record) {
      updated.analytics = planTouchpointAnalytics(record).filter(([label]) => label !== "Cost per attributed wishlist").map(([label], index) => [label, values.get(`metric-${index}`).trim(), values.get(`note-${index}`).trim()]);
      if (planConnectionKind(updated) !== planConnectionKind(record)) {
        updated.analytics = [];
        updated.demo = false;
      }
      updated.summary = updated.analytics.slice(0, 3).filter(([, value]) => value !== "—").map(([label, value]) => `${value} ${label.toLowerCase()}`).join(" · ");
      if (updated.date !== record.date) updated.relativeTime = "";
      Object.assign(record, updated);
      planExpandedTouchpoints.add(record);
    } else {
      gameDashboardData(activeProject).touchpoints.unshift(updated);
    }
    saveProject(activeProject);
    renderDashboardRecords("touchpoints", gameDashboardData(activeProject).touchpoints);
    planOpportunityDialog.close();
    document.querySelector("#dashboard-status").textContent = "Connection saved.";
  });
  planOpportunityDialog.append(form);
  planOpportunityDialog.showModal();
}

function renderPlanCalendar() {
  document.querySelector("#plan-month").textContent = planMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const days = document.querySelector("#plan-days");
  days.replaceChildren();
  const first = new Date(planMonth);
  first.setDate(1 - first.getDay());
  const count = Math.ceil((new Date(planMonth.getFullYear(), planMonth.getMonth() + 1, 0).getDate() + planMonth.getDay()) / 7) * 7;
  for (let index = 0; index < count; index++) {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    const key = planDateKey(date);
    const entries = planCalendarEntries.filter((entry) => entry.date === key);
    const button = planNode("button", "plan-day");
    button.type = "button";
    button.classList.toggle("plan-day--outside", date.getMonth() !== planMonth.getMonth());
    button.classList.toggle("plan-day--populated", entries.length > 0);
    button.classList.toggle("plan-day--today", key === localDateKey());
    button.setAttribute("aria-pressed", String(key === planSelectedDate));
    button.setAttribute("aria-label", `${dashboardDate(key)}${key === localDateKey() ? ", today" : ""}: ${entries.length ? entries.map((entry) => entry.title).join(", ") : "No scheduled items"}`);
    if (key === localDateKey()) button.setAttribute("aria-current", "date");
    const dots = planNode("span", "plan-day-dots");
    [...new Set(entries.map((entry) => entry.kind))].forEach((kind) => dots.append(planDot(kind)));
    button.append(planNode("span", "", String(date.getDate())), dots);
    button.addEventListener("click", () => {
      if (date.getMonth() !== planMonth.getMonth()) planMonth = new Date(date.getFullYear(), date.getMonth(), 1, 12);
      planSelectedDate = planSelectedDate === key ? null : key;
      renderPlanCalendar();
      // Preserve keyboard focus when the calendar's day buttons are rebuilt.
      document.querySelector(`#plan-days [data-date="${key}"]`)?.focus({ preventScroll: true });
    });
    button.dataset.date = key;
    days.append(button);
  }
  renderPlanAgenda();
}

function renderPlanAgenda() {
  const agenda = document.querySelector("#plan-agenda-list");
  agenda.replaceChildren();
  const prefix = planDateKey(planMonth).slice(0, 7);
  const entries = planCalendarEntries.filter((entry) => planSelectedDate ? entry.date === planSelectedDate : entry.date?.startsWith(prefix));
  const dates = [...new Set(entries.map((entry) => entry.date))].sort();
  dates.forEach((date) => {
    const group = planNode("section", "plan-agenda-group");
    group.classList.toggle("is-selected", date === planSelectedDate);
    group.append(planNode("h3", "", new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })));
    entries.filter((entry) => entry.date === date).forEach((entry) => {
      const button = planNode("button", "plan-agenda-item");
      button.type = "button";
      button.append(planDot(entry.kind), planNode("span", "", entry.title));
      button.addEventListener("click", () => {
        if (entry.kind === "milestone" || entry.kind === "goal") openDashboardForm(entry.kind, entry.record);
        else openPlanOpportunity(entry.record);
      });
      group.append(button);
    });
    agenda.append(group);
  });
  if (!dates.length) agenda.append(planNode("p", "plan-empty", planSelectedDate ? "Nothing scheduled for this date. Add a milestone to plan your next step." : "Nothing scheduled this month. Add a milestone or browse saved opportunities."));
  document.querySelector("#plan-show-month").hidden = !planSelectedDate;
  document.querySelector("#plan-selection").hidden = !planSelectedDate;
}

function renderPlanOpportunities(card) {
  for (const kind of ["fund", "event"]) {
    const grid = document.querySelector(kind === "fund" ? "#plan-funds" : "#plan-events");
    grid.replaceChildren();
    planOpportunities(card).filter((record) => record.kind === kind && !record.removed).forEach((record) => grid.append(planOpportunityCard(card, record)));
    const more = planNode("button", "plan-find-more");
    more.type = "button";
    const plural = kind === "fund" ? "Funds" : "Events";
    more.append(planNode("span", "", "+"), planNode("strong", "", `Find More ${plural}`), planNode("small", "", `Find more ${plural.toLowerCase()} available`));
    more.addEventListener("click", () => openPlanDiscovery(kind));
    grid.append(more);
  }
}

function planOpportunityCard(card, record) {
  const article = planNode("article", "plan-opportunity-card");
  const urgency = planUrgency(record);
  article.dataset.urgency = urgency;
  const days = planDaysUntil(record);
  const label = days < 0 ? `${Math.abs(days)} days ago` : days === 0 ? "Today" : `${record.kind === "fund" ? "Due in" : "Starts in"} ${days} days`;
  const bookmark = planNode("button", "plan-opportunity-bookmark");
  bookmark.type = "button";
  bookmark.setAttribute("aria-label", `Save ${record.title} to plan`);
  bookmark.setAttribute("aria-pressed", String(record.saved));
  bookmark.innerHTML = '<svg viewBox="0 0 20 26" aria-hidden="true"><path d="M3 2h14v21l-7-5-7 5Z"/></svg>';
  bookmark.addEventListener("click", () => {
    record.saved = !record.saved;
    saveProject(card);
    renderPlanPage(card, "Plan");
    document.querySelector(`#plan-${record.kind === "fund" ? "funds" : "events"} [data-opportunity-id="${record.id}"] .plan-opportunity-bookmark`)?.focus({ preventScroll: true });
  });
  article.dataset.opportunityId = record.id;
  const heading = planNode("button", "plan-opportunity-heading");
  heading.type = "button";
  heading.addEventListener("click", () => openPlanOpportunity(record));
  const tile = planNode("time", "milestone-date-tile");
  tile.dateTime = record.date;
  const date = new Date(`${record.date}T12:00:00`);
  tile.append(planNode("span", "", date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()), planNode("strong", "", String(date.getDate())));
  const title = planNode("span");
  title.append(planNode("small", "", record.organization), planNode("strong", "", record.title));
  heading.append(tile, title);
  const copy = planNode("div", "plan-opportunity-copy");
  copy.append(planNode("p", "", record.description), planNode("p", "", record.audience));
  const ending = record.kind === "fund" ? `Deadline ${dashboardDate(record.date)}` : record.endDate ? `${shortDashboardDate(record.date)} – ${dashboardDate(record.endDate)}` : dashboardDate(record.date);
  article.append(planNode("span", "plan-opportunity-countdown", label), bookmark, heading, copy, planNode("footer", "", ending));
  return article;
}

const planOpportunityDialog = planNode("dialog", "plan-opportunity-dialog");
planOpportunityDialog.setAttribute("aria-labelledby", "plan-opportunity-dialog-title");
document.body.append(planOpportunityDialog);

function preparePlanDialog(title) {
  planOpportunityDialog.replaceChildren();
  planOpportunityDialog.classList.remove("plan-detail-dialog", "plan-search-dialog");
  const header = planNode("header");
  const heading = planNode("h2", "", title);
  heading.id = "plan-opportunity-dialog-title";
  const close = planNode("button", "icon-button");
  close.type = "button";
  close.setAttribute("aria-label", "Close");
  close.append(dashboardIcon("close"));
  close.addEventListener("click", () => planOpportunityDialog.close());
  header.append(heading, close);
  planOpportunityDialog.append(header);
}

function openPlanOpportunity(record) {
  const details = { ...planOpportunityDetails[record.id], ...record.details };
  preparePlanDialog(details.title || record.title);
  planOpportunityDialog.classList.add("plan-detail-dialog");
  planOpportunityDialog.dataset.urgency = planUrgency(record);
  const header = planOpportunityDialog.querySelector("header");
  const title = header.querySelector("h2");
  const close = header.querySelector("button");
  const toolbar = planNode("div", "plan-detail-toolbar");
  const controls = planNode("div", "plan-detail-controls");
  controls.append(planBookmark(record), close);
  toolbar.append(planNode("span", "plan-opportunity-countdown", planCountdownLabel(record)), controls);
  const heading = planNode("div", "plan-detail-heading");
  const date = new Date(`${record.date}T12:00:00`);
  const tile = planNode("time", "milestone-date-tile");
  tile.dateTime = record.date;
  tile.append(planNode("span", "", date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()), planNode("strong", "", String(date.getDate())));
  const copy = planNode("div");
  copy.append(planNode("small", "", record.kind === "fund" ? `${record.organization} · FUND` : record.organization), title);
  heading.append(tile, copy);
  header.replaceChildren(toolbar, heading);
  const about = planNode("section", "plan-detail-about");
  about.append(planNode("h3", "", "About"), planNode("p", "", details.about || record.description));
  const section = planNode("section", "plan-detail-section");
  section.append(planNode("h3", "", "Details"));
  const table = planNode("dl", "plan-detail-table");
  const range = record.endDate ? `${shortDashboardDate(record.date)} – ${dashboardDate(record.endDate)}` : dashboardDate(record.date);
  const rows = record.kind === "fund" ? [
    ["funding", "Funding", record.description], ["calendar", "Deadline", dashboardDate(record.date)],
    ["users", "Who it’s for", "Early stage studios in B.C."], ["building", "Organizer", details.organization || record.organization],
  ] : [
    ["calendar", record.endDate ? "Dates" : "Date", range], ["location", "Location", details.location || "Online"],
    ["tag", details.booth ? "Booth" : "Type", details.booth || details.type || record.description], ["users", "Audience", record.audience],
  ];
  rows.forEach(([icon, label, value]) => {
    const row = planNode("div");
    const term = planNode("dt");
    term.append(planDetailIcon(icon), label);
    row.append(term, planNode("dd", "", value));
    table.append(row);
  });
  section.append(table);
  const footer = planNode("footer", "plan-detail-footer");
  const remove = planNode("button", "button plan-remove", "Remove ");
  remove.type = "button";
  remove.append(dashboardIcon("trash"));
  remove.addEventListener("click", () => {
    record.saved = false;
    record.removed = true;
    saveProject(activeProject);
    renderPlanPage(activeProject, "Plan");
    planOpportunityDialog.close();
    document.querySelector(`#plan-${record.kind === "fund" ? "funds" : "events"} .plan-find-more`).focus({ preventScroll: true });
  });
  footer.append(remove);
  const url = record.url || details.url;
  if (url) {
    const link = planNode("a", "button plan-see-more", "See more ");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(planDetailIcon("external"));
    footer.append(link);
  } else {
    footer.append(planNode("span", "plan-source-note", "Source link not added yet"));
  }
  planOpportunityDialog.append(about, section, footer);
  planOpportunityDialog.showModal();
}

function openPlanDiscovery(kind) {
  preparePlanDialog(kind === "fund" ? "Find Funds" : "Find Events");
  planOpportunityDialog.classList.add("plan-search-dialog");
  planOpportunityDialog.append(planNode("p", "", `Explore more ${kind === "fund" ? "funds" : "events"} for your project`));
  const label = planNode("label", "plan-search-label", "Search");
  label.htmlFor = "plan-opportunity-search";
  const search = planNode("input", "plan-search-input");
  search.id = "plan-opportunity-search";
  search.type = "search";
  search.placeholder = "Search name, organization, city";
  const status = planNode("span", "visually-hidden");
  status.setAttribute("role", "status");
  const list = planNode("div", "plan-discover-list");
  function results() {
  list.replaceChildren();
  const query = search.value.trim().toLowerCase();
  if (!query) { status.textContent = "Type to search sample opportunities."; return; }
  planOpportunityExamples.filter((record) => record.kind === kind).forEach((example) => {
    const details = planOpportunityDetails[example.id] || {};
    if (![example.title, example.organization, example.description, details.location].join(" ").toLowerCase().includes(query)) return;
    const item = planNode("article", "plan-discover-item");
    const existing = planOpportunities(activeProject).find((record) => record.id === example.id);
    const button = planNode("button", "button button--primary", existing?.saved ? "Saved to plan" : "Save to plan");
    button.type = "button";
    button.disabled = Boolean(existing?.saved);
    button.addEventListener("click", () => {
      if (existing) existing.saved = true;
      else planOpportunities(activeProject).push({ ...example, demo: true, demoDaysUntil: example.days, saved: true });
      if (existing) existing.removed = false;
      saveProject(activeProject);
      renderPlanPage(activeProject, "Plan");
      button.textContent = "Saved to plan";
      button.disabled = true;
    });
    item.append(planNode("strong", "", example.title), planNode("p", "", `${example.organization} · ${dashboardDate(example.date)} · ${example.description}`), button);
    list.append(item);
  });
  status.textContent = `${list.children.length} results`;
  if (!list.children.length) list.append(planNode("p", "plan-empty", "No matching opportunities. Try a different name, organization or city."));
  }
  search.addEventListener("input", results);
  const footer = planNode("footer", "plan-search-footer");
  const done = planNode("button", "button button--primary", "Done");
  done.type = "button";
  done.addEventListener("click", () => planOpportunityDialog.close());
  footer.append(done);
  planOpportunityDialog.append(label, search, status, list, footer);
  planOpportunityDialog.showModal();
  search.focus();
}

const planAddTrigger = document.querySelector("#plan-add-trigger");
const planAddMenu = document.querySelector("#plan-add-menu");
connectDropdown(planAddTrigger, planAddMenu, () => {});
planAddMenu.addEventListener("click", (event) => {
  const option = event.target.closest("[data-plan-add]");
  if (!option) return;
  planAddMenu.hidePopover();
  planAddTrigger.focus();
  const kind = option.dataset.planAdd;
  if (kind === "milestone" || kind === "goal") openDashboardForm(kind);
  else openPlanDiscovery(kind);
});

document.querySelector("#plan-edit-milestone").addEventListener("click", () => openDashboardForm("milestone", planFeaturedMilestone));
document.querySelector("#touchpoints-panel .panel-add").addEventListener("click", () => {
  if (gameWorkspace.dataset.section === "Plan") openPlanTouchpointEditor();
});
document.querySelector("#plan-clear-selection").addEventListener("click", () => {
  planSelectedDate = null;
  renderPlanCalendar();
  document.querySelector("#plan-month-next").focus({ preventScroll: true });
});
document.querySelector("#plan-month-previous").addEventListener("click", () => changePlanMonth(-1));
document.querySelector("#plan-month-next").addEventListener("click", () => changePlanMonth(1));
document.querySelector("#plan-show-month").addEventListener("click", () => {
  planSelectedDate = null;
  renderPlanCalendar();
});
function changePlanMonth(offset) {
  planMonth = new Date(planMonth.getFullYear(), planMonth.getMonth() + offset, 1, 12);
  planSelectedDate = null;
  renderPlanCalendar();
}
for (const [kind, label] of Object.entries(planCategories)) {
  const legend = planNode("span");
  legend.append(planDot(kind), label);
  document.querySelector("#plan-legend").append(legend);
}
