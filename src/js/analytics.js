const analyticsPage = document.querySelector("#analytics-page");
const analyticsPeriod = document.querySelector("#analytics-period");
const analyticsSeries = [
  { key: "wishlists", title: "Steam Wishlists", color: "#557bea", description: "Wishlist activity attributed to your campaign." },
  { key: "members", title: "New Members", color: "#b983d0", description: "New community members across connected applications." },
  { key: "traffic", title: "Steam Traffic", color: "#dfe2e9", description: "Visits to your Steam store page." },
  { key: "touchpoints", title: "Touchpoints", color: "#474747", description: "Published posts, press features, and storefront updates." },
];
const analyticsSampleHeights = [9, 5, 6, 5, 4, 5, 5, 5, 7, 11, 4, 8, 5, 4, 7, 11, 8, 4, 4, 4, 4, 4, 6, 4, 4, 6, 8, 12, 15, 10, 9, 8];
const analyticsSources = [
  { key: "wishlists", title: "Steam Wishlists", color: "#557bea" },
  { key: "members", title: "Discord Members", color: "#b983d0" },
  { key: "tiktok", title: "TikTok", color: "#474747" },
  { key: "youtube", title: "YouTube", color: "#474747" },
  { key: "events", title: "Events", color: "#474747" },
  { key: "press", title: "Press", color: "#474747" },
];
let hideAnalyticsChartDetail = () => {};

function analyticsSourceEnabled(key) {
  return !activeProject.analyticsHiddenSources?.includes(key);
}

function analyticsRange() {
  const period = analyticsPeriod.value;
  if (period === "custom" && activeProject.analyticsCustomRange) {
    const { start: lower, end: upper } = activeProject.analyticsCustomRange;
    const start = new Date(`${lower}T12:00:00`);
    const end = new Date(`${upper}T12:00:00`);
    if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && start <= end) {
      const days = Math.round((Date.parse(`${upper}T00:00:00Z`) - Date.parse(`${lower}T00:00:00Z`)) / 86400000) + 1;
      return { days, spanDays: days, start, end, lower, upper };
    }
  }
  const days = [7, 28, 60, 365].includes(Number(period)) ? Number(period) : 7;
  const sample = analyticsIsSample();
  const end = new Date(`${sample ? "2026-08-07" : localDateKey()}T12:00:00`);
  const start = new Date(end);
  // The reference demo includes both endpoints: July 31 through August 7.
  const spanDays = sample ? days + 1 : days;
  start.setDate(start.getDate() - spanDays + 1);
  return { days, spanDays, start, end, lower: planDateKey(start), upper: planDateKey(end) };
}

function analyticsIsSample() {
  return activeProject.isDefaultGame || gameDashboardData(activeProject).touchpoints.some((record) => record.demo);
}

function analyticsDot(color) {
  const dot = settingsNode("span", "analytics-series-dot");
  dot.style.backgroundColor = color;
  dot.setAttribute("aria-hidden", "true");
  return dot;
}

function analyticsDateTile(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  const tile = settingsNode("time", "analytics-date");
  tile.dateTime = dateKey;
  tile.append(settingsNode("small", "", date.toLocaleDateString("en-US", { month: "short" })), settingsNode("strong", "", String(date.getDate()).padStart(2, "0")));
  return tile;
}

function analyticsNavigate(section, panel) {
  selectWorkspaceSection(section);
  const heading = document.querySelector(`#${panel}-title`);
  heading.tabIndex = -1;
  heading.scrollIntoView({ block: "start", behavior: "instant" });
  heading.focus({ preventScroll: true });
}

function renderAnalyticsOverview() {
  const content = document.querySelector("#analytics-overview-content");
  content.replaceChildren();
  const data = gameDashboardData(activeProject);
  for (const [kind, title, records] of [
    ["goals", "Goals", data.goals.slice(0, 3)],
    ["milestones", "Next Milestone", [...data.milestones].sort((a, b) => a.date.localeCompare(b.date)).filter((record) => planDaysUntil(record) >= 0).slice(0, 3)],
    ["touchpoints", "Updates", data.touchpoints.slice(0, 4)],
  ]) {
    const section = settingsNode("section", "analytics-overview-section");
    const heading = settingsNode("header", "analytics-section-heading");
    const view = settingsNode("button", "text-link", "View all");
    view.type = "button";
    view.setAttribute("aria-label", `View all ${kind}`);
    view.addEventListener("click", () => analyticsNavigate(kind === "milestones" ? "Plan" : "Home", kind));
    heading.append(settingsNode("h3", "", title), view);
    const list = settingsNode("div", "analytics-overview-list");
    records.forEach((record) => {
      const item = settingsNode("button", "analytics-overview-item");
      item.type = "button";
      item.title = record.title;
      const copy = settingsNode("span", "analytics-overview-copy");
      if (kind === "touchpoints") {
        const icon = settingsNode("span", "analytics-update-icon");
        icon.append(dashboardIcon(record.icon || "megaphone"));
        item.append(icon);
        copy.append(settingsNode("small", "", `${record.category || "UPDATE"} · ${record.platform || ""}`), settingsNode("strong", "", record.title));
        item.addEventListener("click", () => openPlanTouchpointEditor(record));
      } else {
        item.append(analyticsDateTile(record.date));
        copy.append(settingsNode("strong", "", kind === "goals" ? record.metric || record.title : record.title));
        copy.append(settingsNode("small", "", kind === "goals" ? `${Number(record.current || 0).toLocaleString("en-US")} / ${Number(record.target).toLocaleString("en-US")}` : `${record.category || record.type || "Milestone"} · ${record.channel || "Planned"}`));
        item.addEventListener("click", () => openDashboardForm(kind === "goals" ? "goal" : "milestone", record));
      }
      item.append(copy);
      if (kind === "goals") item.append(settingsNode("small", "", `${goalProgress(record).percentage}%`));
      else if (kind === "milestones") item.append(settingsNode("small", "", planDaysUntil(record) === 0 ? "Today" : `in ${planDaysUntil(record)}d`));
      list.append(item);
    });
    if (!records.length) list.append(settingsNode("p", "analytics-empty", `No ${title.toLowerCase()} yet.`));
    section.append(heading, list);
    content.append(section);
  }
}

function analyticsSvgNode(tag, attributes, text) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderAnalyticsChart() {
  hideAnalyticsChartDetail();
  const container = document.querySelector("#analytics-chart");
  const range = analyticsRange();
  const sample = analyticsIsSample();
  const selected = analyticsSeries.filter((series) => series.key === "traffic" || (series.key === "touchpoints" ? analyticsSources.slice(2).some((source) => analyticsSourceEnabled(source.key)) : analyticsSourceEnabled(series.key))).map((series) => series.key);
  const compact = matchMedia("(max-width: 600px)").matches;
  // Match chart coordinates to its displayed width so labels retain their size.
  const width = container.clientWidth || (compact ? 360 : 880);
  const baseline = compact ? 250 : 360;
  const blockStep = compact ? 13 : 20;
  const firstX = compact ? 52 : 64;
  const count = range.days <= 7 ? range.spanDays * (compact ? 2 : 4) : compact ? 16 : analyticsSampleHeights.length;
  const columnStep = (width - firstX - 48) / (count - 1);
  const svg = analyticsSvgNode("svg", { viewBox: `0 0 ${width} ${baseline + 50}`, class: "analytics-chart-svg", role: "group", tabindex: sample ? "0" : "-1", "aria-labelledby": "analytics-chart-title", "aria-describedby": "analytics-chart-description" });
  svg.append(analyticsSvgNode("title", { id: "analytics-chart-title" }, "Campaign activity over time"), analyticsSvgNode("desc", { id: "analytics-chart-description" }, sample ? `Illustrative sample activity for ${range.days} days. Each block represents 25 points on a relative activity index. Use Left and Right arrows to inspect time buckets, Home or End to jump, and Escape to dismiss. Tap a column to keep its details open.` : "No activity history has been imported yet."));
  for (let value = 0; value <= 400; value += 100) {
    const y = baseline - value / 25 * blockStep;
    svg.append(analyticsSvgNode("line", { x1: firstX - 12, x2: width - 26, y1: y, y2: y, class: value === 0 ? "analytics-axis" : "analytics-gridline" }), analyticsSvgNode("text", { x: firstX - 20, y: y + 4, "text-anchor": "end" }, value));
  }
  const points = [];
  if (sample) Array.from({ length: count }, (_, index) => index).forEach((index) => {
    const offset = range.days === 7 ? 0 : range.days === 28 ? 5 : 11;
    const total = analyticsSampleHeights[(Math.round(index * (analyticsSampleHeights.length - 1) / (count - 1)) + offset) % analyticsSampleHeights.length];
    const source = analyticsSources[2 + Math.floor(index / 6) % 4].key;
    const point = { wishlists: analyticsSourceEnabled("wishlists") ? Math.max(1, Math.round(total * .38)) : 0, members: analyticsSourceEnabled("members") ? Math.round(total * .32) : 0, traffic: Math.round(total * .3), touchpoints: index % 6 === 2 && analyticsSourceEnabled(source) ? 1 : 0 };
    points.push(point);
    let row = 0;
    for (const series of [analyticsSeries[3], ...analyticsSeries.slice(0, 3)]) {
      if (!selected.includes(series.key)) continue;
      for (let block = 0; block < point[series.key]; block++) {
        const rect = analyticsSvgNode("rect", { x: firstX + index * columnStep, y: baseline - (row + 1) * blockStep, width: Math.max(2, Math.min(compact ? 14 : 20, columnStep - 3)), height: blockStep - 4, rx: 1, fill: series.color });
        svg.append(rect);
        row++;
      }
    }
  });
  const ticks = Math.min(range.spanDays, Math.max(2, Math.min(compact ? 4 : 8, Math.floor((width - firstX) / 80))));
  for (let index = 0; index < ticks; index++) {
    const fraction = ticks === 1 ? 0 : index / (ticks - 1);
    const x = firstX + fraction * (count - 1) * columnStep;
    const date = new Date(range.start);
    date.setDate(date.getDate() + Math.round(fraction * (range.spanDays - 1)));
    svg.append(analyticsSvgNode("line", { x1: x + 10, x2: x + 10, y1: baseline + 10, y2: baseline + 18, class: "analytics-axis" }), analyticsSvgNode("text", { x: x + 10, y: baseline + 34, "text-anchor": "middle" }, date.toLocaleDateString("en-US", { month: "short", day: "numeric" })));
  }
  if (!sample || !selected.length) svg.append(analyticsSvgNode("text", { x: width / 2, y: baseline / 2, "text-anchor": "middle" }, sample ? "Select a series to display activity." : compact ? "Awaiting imported activity data." : "Activity history will appear after analytics are imported."));
  container.replaceChildren(svg);
  if (sample) connectAnalyticsChartDetails(container, svg, points, { range, baseline, blockStep, firstX, columnStep, compact });
  const legend = document.querySelector("#analytics-chart-legend");
  legend.replaceChildren();
  analyticsSeries.filter((series) => selected.includes(series.key)).forEach((series) => {
    const label = settingsNode("span", "", series.title.replace("Steam ", ""));
    label.prepend(analyticsDot(series.color));
    legend.append(label);
  });
  document.querySelector("#analytics-data-note").textContent = sample ? "Relative activity · Sample data" : "Awaiting imported data";
}

function analyticsMetricValues() {
  const range = analyticsRange();
  const factor = range.days / 7;
  const sample = analyticsIsSample();
  const touchpoints = gameDashboardData(activeProject).touchpoints.filter((record) => record.date >= range.lower && record.date <= range.upper).length;
  return [
    { title: "New Touchpoints", key: "touchpoints", value: sample ? Math.round(6 * factor) : touchpoints, gain: "+100%", delta: "+3 this week", updated: "4h" },
    { title: "New Wishlists", key: "wishlists", value: sample ? Math.round(5118 * factor) : null, gain: "+89.1%", delta: "+2,412 this week", updated: "4h" },
    { title: "Avg. Wishlists/day", key: "wishlists", value: sample ? 186 : null, gain: "+132.5%", delta: "+106 this week", updated: "30m" },
    { title: "New Members", key: "members", value: sample ? Math.round(2349 * factor) : null, gain: "+276%", delta: "+1725 this week", updated: "10m", ungrouped: true },
    { title: "New Traffic", key: "traffic", value: sample ? Math.round(132000 * factor) : null, gain: "+57.6%", delta: "+121,412 this week", updated: "1h" },
  ];
}

function analyticsMetricCard(metric, color, sample) {
  const card = settingsNode("article", "analytics-metric");
  const header = settingsNode("header");
  const label = settingsNode("span", "analytics-metric-label", metric.title);
  label.prepend(analyticsDot(color));
  header.append(label);
  if (sample && (metric.gain || metric.share)) header.append(settingsNode("span", metric.gain ? "analytics-metric-gain" : "analytics-metric-share", metric.gain || metric.share));
  const footer = settingsNode("footer", "analytics-metric-footer");
  footer.append(settingsNode("span", "", sample ? metric.delta : metric.value === null ? "Awaiting import" : "In selected period"));
  if (sample) footer.append(settingsNode("span", "", `LU: ${metric.updated}`));
  card.append(header, settingsNode("strong", "", metric.value === null ? "—" : metric.ungrouped ? String(metric.value) : metric.value.toLocaleString("en-US")), footer);
  return card;
}

function analyticsBreakdownMetrics() {
  // Reference values belong to the demo; imported-data workspaces keep empty states.
  const sample = analyticsIsSample();
  const factor = analyticsRange().days / 7;
  const section = (key, title, color, total, rows) => ({ key, title, color, total: sample ? Math.round(total * factor) : null, rows: rows.map(([title, value, change, delta, updated, fixed]) => ({ title, value: sample ? fixed ? value : Math.round(value * factor) : null, ...(change.startsWith("+") ? { gain: change } : { share: change }), delta, updated })) });
  return [
    section("wishlists", "Steam Wishlists", "#557bea", 5118, [
      ["Total Wishlists", 23142, "+25.1%", "+5,118 this week", "10m", true],
      ["New Wishlists", 5118, "+61.7%", "+3,412 this week", "4h"],
      ["Avg. Wishlists/day", 731, "+6.41%", "+2.32% CVR this week", "10m", true],
      ["Internal → Wishlist", 800, "6.4%", "+206 this week", "1h"],
      ["Tiktok → Wishlist", 1200, "9.62%", "+432 this week", "4h"],
      ["YouTube → Wishlist", 2100, "16.8%", "+560 this week", "30m"],
      ["Events → Wishlist", 500, "4.0%", "+103 this week", "10m"],
      ["Press → Wishlist", 318, "2.6%", "+123 this week", "30m"],
      ["Other → Wishlist", 200, "1.6%", "+83 this week", "10m"],
    ]),
    section("steam-traffic", "Steam Traffic", "#cdd2dc", 124124, [
      ["Total Traffic", 132000, "+69.5%", "+121,412 this week", "10m", true],
      ["New Traffic → Steam", 124124, "+94.0%", "+32,313 this week", "4h"],
      ["Avg. Total Traffic/day", 46303, "+36.2%", "+12,302 this week", "1h", true],
      ["Tiktok → Steam", 24825, "20.0%", "+15,992 this week", "4h"],
      ["YouTube → Steam", 43443, "35.0%", "+29,807 this week", "30m"],
      ["Youtube → Steam", 37237, "30.0%", "+21,734 this week", "10m"],
      ["Events → Steam", 8689, "7.0%", "+6865 this week", "30m"],
      ["Press → Steam", 6206, "5.0%", "+4694 this week", "10m"],
      ["Other → Wishlist", 3724, "3.0%", "+2447 this week", "10m"],
    ]),
    section("members", "Discord Members", "#b983d0", 2349, [
      ["Total Discord Members", 4532, "+25.1%", "+2349 this week", "10m", true],
      ["New Discord Members", 2349, "+107%", "+1725 this week", "4h"],
      ["Avg. Members/day", 336, "+59.2%", "+125 this week", "1h", true],
      ["Steam → Member", 550, "31.9%", "+150 this week", "4h"],
      ["Tiktok → Member", 420, "24.3%", "+200 this week", "30m"],
      ["YouTube → Member", 310, "18.0%", "+30 this week", "10m"],
      ["Events → Member", 200, "11.6%", "+30 this week", "30m"],
      ["Press → Member", 145, "8.4%", "+20 this week", "10m"],
      ["Other → Member", 100, "5.8%", "+6 this week", "10m"],
    ]),
    section("discord-traffic", "Discord Traffic", "#cdd2dc", 7876, [
      ["Total Traffic", 132000, "+25.1%", "+121,412 this week", "10m", true],
      ["New Traffic → Discord", 7876, "+76.4%", "+3,412 prev.", "4h"],
      ["Avg. Traffic/day", 1125, "+83.8%", "+513 this week", "1h", true],
      ["Steam → Discord", 1980, "25.1%", "+890 this week", "4h"],
      ["Tiktok → Discord", 1570, "19.9%", "+640 this week", "30m"],
      ["YouTube → Discord", 2450, "31.1%", "+1,120 this week", "10m"],
      ["Events → Discord", 920, "11.7%", "+380 this week", "30m"],
      ["Press → Discord", 586, "7.4%", "+210 this week", "10m"],
      ["Other → Discord", 370, "4.7%", "+172 this week", "10m"],
    ]),
  ];
}

function renderAnalyticsMetrics() {
  const metrics = document.querySelector("#analytics-metrics");
  const values = analyticsMetricValues();
  const sample = analyticsIsSample();
  metrics.replaceChildren();
  values.forEach((metric, index) => {
    if (activeProject.analyticsHiddenMetrics?.includes(index)) return;
    metrics.append(analyticsMetricCard(metric, analyticsSeries.find((series) => series.key === metric.key).color, sample));
  });
  const breakdowns = document.querySelector("#analytics-breakdowns");
  const open = new Set([...breakdowns.querySelectorAll("details[open]")].map((detail) => detail.dataset.series));
  breakdowns.replaceChildren();
  for (const series of analyticsBreakdownMetrics()) {
    const details = settingsNode("details", "analytics-card analytics-breakdown");
    details.dataset.series = series.key;
    details.open = open.has(series.key);
    const summary = settingsNode("summary");
    const title = settingsNode("span", "analytics-breakdown-title", series.title);
    title.prepend(analyticsDot(series.color));
    const value = series.total;
    summary.append(title, settingsNode("strong", "", value === null ? "—" : `+${value.toLocaleString("en-US")}`), dashboardIcon("chevron-right"));
    const body = settingsNode("div", "analytics-breakdown-body");
    const grid = settingsNode("div", "analytics-metrics analytics-breakdown-metrics");
    series.rows.forEach((metric) => grid.append(analyticsMetricCard(metric, series.color, sample)));
    const spacer = settingsNode("div", "analytics-metric analytics-metric-spacer");
    spacer.setAttribute("aria-hidden", "true");
    grid.append(spacer);
    body.append(grid, settingsNode("p", "analytics-metrics-note", "**Est. Based on UTM Traffic / # of x gained that day**"));
    details.append(summary, body);
    breakdowns.append(details);
  }
}

function renderAnalyticsPage(visible) {
  analyticsPage.hidden = !visible;
  if (!visible) { hideAnalyticsChartDetail(); return; }
  const storedPeriod = String(activeProject.analyticsPeriod || "7");
  analyticsPeriod.value = [...analyticsPeriod.options].some((option) => option.value === storedPeriod) ? storedPeriod : "7";
  refreshAnalyticsPeriodMenu();
  const range = analyticsRange();
  const format = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  document.querySelector("#analytics-date-range").textContent = `${format(range.start)} – ${format(range.end)}`;
  const hidden = Boolean(activeProject.analyticsOverviewHidden);
  analyticsPage.dataset.overviewHidden = String(hidden);
  document.querySelector("#analytics-overview").hidden = hidden;
  document.querySelector("#analytics-overview-open").hidden = !hidden;
  document.querySelector("#analytics-overview-close").setAttribute("aria-controls", "analytics-overview");
  document.querySelector("#analytics-overview-close").setAttribute("aria-expanded", String(!hidden));
  document.querySelectorAll("#analytics-filter-menu [data-source]").forEach((option) => { option.setAttribute("aria-checked", String(analyticsSourceEnabled(option.dataset.source))); });
  renderAnalyticsOverview();
  renderAnalyticsChart();
  renderAnalyticsMetrics();
}

analyticsPeriod.addEventListener("change", () => {
  if (analyticsPeriod.value === "custom") {
    queueMicrotask(openAnalyticsCustomRange);
    return;
  }
  activeProject.analyticsPeriod = analyticsPeriod.value;
  saveProject(activeProject);
  renderAnalyticsPage(true);
});
for (const [selector, hidden] of [["#analytics-overview-close", true], ["#analytics-overview-open", false]]) {
  document.querySelector(selector).addEventListener("click", () => {
    activeProject.analyticsOverviewHidden = hidden;
    saveProject(activeProject);
    renderAnalyticsPage(true);
    document.querySelector(hidden ? "#analytics-overview-open" : "#analytics-overview-close").focus();
  });
}
const analyticsFilterTrigger = document.querySelector("#analytics-filter-trigger");
const analyticsFilterMenu = document.querySelector("#analytics-filter-menu");
for (const source of analyticsSources) {
  const option = settingsNode("button", "filter-option");
  option.type = "button";
  option.tabIndex = -1;
  option.dataset.source = source.key;
  option.setAttribute("role", "menuitemcheckbox");
  option.setAttribute("aria-checked", String(analyticsSourceEnabled(source.key)));
  const text = settingsNode("span", "", source.title);
  text.prepend(analyticsDot(source.color));
  option.append(text, dashboardIcon("check"));
  analyticsFilterMenu.append(option);
}
connectFilterPopover(analyticsFilterTrigger, analyticsFilterMenu, { width: 252, onOpen: () => analyticsFilterMenu.querySelector("button").focus() });
analyticsFilterMenu.addEventListener("click", (event) => {
  const option = event.target.closest("[data-source]");
  if (!option) return;
  const hidden = new Set(activeProject.analyticsHiddenSources || []);
  if (hidden.has(option.dataset.source)) hidden.delete(option.dataset.source);
  else hidden.add(option.dataset.source);
  activeProject.analyticsHiddenSources = [...hidden];
  option.setAttribute("aria-checked", String(!hidden.has(option.dataset.source)));
  saveProject(activeProject);
  renderAnalyticsChart();
});
analyticsFilterMenu.addEventListener("keydown", (event) => {
  const options = [...analyticsFilterMenu.querySelectorAll("button")];
  const index = options.indexOf(document.activeElement);
  const next = { ArrowDown: (index + 1) % options.length, ArrowUp: (index - 1 + options.length) % options.length, Home: 0, End: options.length - 1 }[event.key];
  if (next !== undefined) { event.preventDefault(); options[next].focus(); }
  if (event.key === "Tab") analyticsFilterMenu.hidePopover();
});
document.querySelector("#analytics-add").addEventListener("click", () => openPlanTouchpointEditor());
for (const dialog of [dashboardDialog, planOpportunityDialog]) dialog.addEventListener("close", () => {
  if (gameWorkspace.dataset.section === "Analytics") renderAnalyticsPage(true);
});
matchMedia("(max-width: 600px)").addEventListener("change", () => {
  if (gameWorkspace.dataset.section === "Analytics") renderAnalyticsChart();
});
let analyticsChartWidth = 0;
new ResizeObserver(([entry]) => {
  const width = entry.contentRect.width;
  if (analyticsPage.hidden || !width || Math.abs(width - analyticsChartWidth) < 1) return;
  analyticsChartWidth = width;
  renderAnalyticsChart();
}).observe(document.querySelector("#analytics-chart"));

const analyticsPeriodTrigger = document.querySelector("#analytics-period-trigger");
const analyticsMetricsMenu = document.querySelector("#analytics-metrics-menu");
analyticsMetricValues().forEach((metric, index) => {
  const label = settingsNode("label", "", metric.title);
  const input = settingsNode("input");
  input.type = "checkbox";
  input.checked = !activeProject.analyticsHiddenMetrics?.includes(index);
  input.addEventListener("change", () => {
    const inputs = [...analyticsMetricsMenu.querySelectorAll("input")];
    if (inputs.every((option) => !option.checked)) { input.checked = true; return; }
    activeProject.analyticsHiddenMetrics = inputs.flatMap((option, itemIndex) => option.checked ? [] : [itemIndex]);
    saveProject(activeProject);
    renderAnalyticsMetrics();
  });
  label.prepend(input);
  analyticsMetricsMenu.append(label);
});
connectFilterPopover(document.querySelector("#analytics-metrics-edit"), analyticsMetricsMenu, { width: 250, onOpen: () => analyticsMetricsMenu.querySelector("input").focus() });
const analyticsPeriodMenu = document.querySelector("#analytics-period-menu");
for (const item of analyticsPeriod.options) {
  const option = settingsNode("button", "filter-option");
  option.type = "button";
  option.tabIndex = -1;
  option.dataset.value = item.value;
  option.setAttribute("role", "menuitemradio");
  option.setAttribute("aria-checked", String(item.value === "7"));
  option.append(settingsNode("span", "", item.textContent), dashboardIcon("check"));
  analyticsPeriodMenu.append(option);
}
connectDropdown(analyticsPeriodTrigger, analyticsPeriodMenu, (option) => {
  analyticsPeriod.value = option.dataset.value;
  analyticsPeriod.dispatchEvent(new Event("change"));
});

function refreshAnalyticsPeriodMenu() {
  analyticsPeriodTrigger.querySelector("[data-dropdown-label]").textContent = analyticsPeriod.selectedOptions[0].textContent;
  analyticsPeriodMenu.querySelectorAll("[data-value]").forEach((option) => option.setAttribute("aria-checked", String(option.dataset.value === analyticsPeriod.value)));
}

const analyticsCustomDialog = settingsNode("dialog", "settings-dialog");
analyticsCustomDialog.setAttribute("aria-labelledby", "analytics-custom-title");
document.body.append(analyticsCustomDialog);

function openAnalyticsCustomRange() {
  analyticsCustomDialog.replaceChildren();
  const heading = settingsNode("h2", "", "Custom reporting period");
  heading.id = "analytics-custom-title";
  const form = settingsNode("form", "analytics-custom-range");
  const previous = activeProject.analyticsCustomRange;
  const fallback = analyticsRange();
  const fields = {};
  for (const [name, title, initial] of [["start", "Start date", previous?.start || fallback.lower], ["end", "End date", previous?.end || fallback.upper]]) {
    const label = settingsNode("label", "", title);
    const input = settingsNode("input");
    input.name = name;
    input.type = "date";
    input.required = true;
    input.max = localDateKey();
    input.value = initial;
    label.append(input);
    form.append(label);
    fields[name] = input;
  }
  const error = settingsNode("p", "analytics-custom-error");
  error.setAttribute("role", "alert");
  const footer = settingsNode("footer");
  const cancel = settingsNode("button", "button button--secondary", "Cancel");
  cancel.type = "button";
  cancel.addEventListener("click", () => analyticsCustomDialog.close());
  const apply = settingsNode("button", "button button--primary", "Apply dates");
  apply.type = "submit";
  footer.append(cancel, apply);
  form.append(error, footer);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const start = fields.start.value;
    const end = fields.end.value;
    if (start > end) { error.textContent = "Choose an end date on or after the start date."; fields.end.focus(); return; }
    activeProject.analyticsCustomRange = { start, end };
    activeProject.analyticsPeriod = "custom";
    saveProject(activeProject);
    analyticsCustomDialog.close();
  });
  analyticsCustomDialog.append(heading, form);
  analyticsCustomDialog.showModal();
  fields.start.focus();
}
analyticsCustomDialog.addEventListener("close", () => {
  renderAnalyticsPage(gameWorkspace.dataset.section === "Analytics");
  analyticsPeriodTrigger.focus();
});

function connectAnalyticsChartDetails(container, svg, points, { range, baseline, blockStep, firstX, columnStep, compact }) {
  const crosshair = analyticsSvgNode("line", { y1: baseline - 16 * blockStep, y2: baseline, class: "analytics-crosshair", visibility: "hidden" });
  const marker = analyticsSvgNode("circle", { r: 4, class: "analytics-hover-marker", visibility: "hidden" });
  svg.append(crosshair, marker);
  const detail = settingsNode("div", "analytics-chart-detail");
  detail.id = "analytics-chart-detail";
  detail.setAttribute("role", "tooltip");
  detail.hidden = true;
  const status = settingsNode("p", "visually-hidden");
  status.setAttribute("role", "status");
  container.append(detail, status);
  let activeIndex = -1;
  let pinnedIndex = -1;

  function hide() {
    activeIndex = -1;
    pinnedIndex = -1;
    detail.hidden = true;
    crosshair.setAttribute("visibility", "hidden");
    marker.setAttribute("visibility", "hidden");
    svg.setAttribute("aria-describedby", "analytics-chart-description");
    status.textContent = "";
  }
  hideAnalyticsChartDetail = hide;

  function show(index, announce = false) {
    index = Math.max(0, Math.min(index, points.length - 1));
    activeIndex = index;
    const point = points[index];
    const bucketMs = range.spanDays * 86400000 / points.length;
    const startMs = Date.parse(`${range.lower}T00:00:00Z`) + Math.floor(index * bucketMs);
    const endMs = Date.parse(`${range.lower}T00:00:00Z`) + Math.floor((index + 1) * bucketMs);
    const start = new Date(startMs);
    const end = new Date(endMs);
    const dayLabel = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    const timeLabel = (date) => date.toLocaleTimeString("en-US", { hour: "numeric", minute: date.getUTCMinutes() ? "2-digit" : undefined, hour12: true, timeZone: "UTC" });
    const heading = bucketMs > 86400000 ? `${dayLabel(start)} – ${dayLabel(new Date(endMs - 1))}` : dayLabel(start);
    const interval = bucketMs <= 86400000 ? `${timeLabel(start)} – ${timeLabel(end)}` : "Grouped activity";
    detail.replaceChildren(settingsNode("strong", "", heading), settingsNode("small", "", interval));
    const table = settingsNode("dl");
    for (const [key, label, title] of [["touchpoints", "TP(S)", "Touchpoints"], ["traffic", "TT", "Traffic activity"], ["wishlists", "WL", "Wishlist activity"], ["members", "NDM", "Discord member activity"]]) {
      const term = settingsNode("dt", "", `${label}:`);
      term.title = title;
      term.prepend(analyticsDot(analyticsSeries.find((series) => series.key === key).color));
      table.append(term, settingsNode("dd", "", String(point[key] * (key === "touchpoints" ? 1 : 25))));
    }
    detail.append(table, settingsNode("small", "analytics-detail-note", "Sample activity index"));
    detail.hidden = false;
    const centerX = firstX + index * columnStep + Math.max(2, Math.min(compact ? 14 : 20, columnStep - 3)) / 2;
    const top = baseline - Object.values(point).reduce((sum, value) => sum + value, 0) * blockStep + (blockStep - 4) / 2;
    crosshair.setAttribute("x1", centerX);
    crosshair.setAttribute("x2", centerX);
    crosshair.setAttribute("visibility", "visible");
    marker.setAttribute("cx", centerX);
    marker.setAttribute("cy", top);
    marker.setAttribute("visibility", "visible");
    const screen = new DOMPoint(centerX, top).matrixTransform(svg.getScreenCTM());
    const bounds = container.getBoundingClientRect();
    const x = screen.x - bounds.left;
    const y = screen.y - bounds.top;
    const left = x + detail.offsetWidth + 16 < bounds.width ? x + 16 : x - detail.offsetWidth - 16;
    detail.style.left = `${Math.max(0, Math.min(left, bounds.width - detail.offsetWidth))}px`;
    detail.style.top = `${Math.max(0, Math.min(y - 30, bounds.height - detail.offsetHeight))}px`;
    svg.setAttribute("aria-describedby", "analytics-chart-description analytics-chart-detail");
    if (announce) status.textContent = `${heading}, ${interval}. Touchpoints ${point.touchpoints}; traffic ${point.traffic * 25}; wishlists ${point.wishlists * 25}; Discord members ${point.members * 25}. Sample activity index.`;
  }

  function pointerIndex(event) {
    const position = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    if (position.x < firstX - columnStep / 2 || position.x > firstX + (points.length - .5) * columnStep || position.y > baseline || position.y < baseline - 16 * blockStep) return -1;
    return Math.max(0, Math.min(points.length - 1, Math.round((position.x - firstX) / columnStep)));
  }
  svg.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || pinnedIndex >= 0) return;
    const index = pointerIndex(event);
    if (index < 0) hide();
    else if (index !== activeIndex) show(index);
  });
  svg.addEventListener("pointerleave", () => { if (pinnedIndex < 0) hide(); });
  svg.addEventListener("click", (event) => {
    const index = pointerIndex(event);
    if (index < 0 || pinnedIndex === index) { hide(); return; }
    pinnedIndex = index;
    show(index);
  });
  svg.addEventListener("focus", () => { if (activeIndex < 0) show(0, true); });
  svg.addEventListener("blur", hide);
  svg.addEventListener("keydown", (event) => {
    const next = { ArrowRight: Math.min(points.length - 1, activeIndex + 1), ArrowLeft: Math.max(0, activeIndex - 1), Home: 0, End: points.length - 1 }[event.key];
    if (next !== undefined) { event.preventDefault(); pinnedIndex = -1; show(next, true); }
    if (event.key === "Escape") { event.preventDefault(); hide(); }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pinnedIndex = activeIndex; }
  });
}

document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest("#analytics-chart")) hideAnalyticsChartDetail();
});
window.addEventListener("scroll", () => hideAnalyticsChartDetail(), true);
