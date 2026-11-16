// Reference values for the prototype's simulated application connections.
const dashboardMetricExamples = [
  { title: "Steam Wishlists", value: 12480, gain: 842, updated: "4h", icon: "heart", trend: [3, 5, 4, 8, 7, 10, 14, 12, 16, 15, 20, 18, 24, 26, 25, 27, 28] },
  { title: "Discord Members", value: 3214, gain: 127, updated: "1h", icon: "users", trend: [7, 9, 8, 12, 16, 20, 18, 13, 11, 14, 13, 17, 20, 19, 22, 24, 23] },
  { title: "Patreon Patrons", value: 186, gain: 9, updated: "30m", icon: "crown", trend: [5, 5, 6, 5, 5, 12, 12, 11, 12, 12, 19, 19, 18, 19, 24, 24, 25] },
  { title: "Connections Live", value: 24, detail: "6 scheduled next 14d", updated: "10m", icon: "signal", trend: [14, 12, 17, 15, 10, 13, 18, 16, 12, 14, 19, 16, 11, 14, 17, 15, 16] },
  { title: "Press Mentions", value: 37, gain: 4, updated: "20m", icon: "newspaper", trend: [5, 6, 5, 5, 17, 10, 7, 8, 7, 22, 14, 11, 12, 26, 18, 15, 19] },
  { title: "YouTube Subs", value: 1942, gain: 88, updated: "2h", icon: "video", trend: [4, 7, 10, 13, 16, 18, 19, 18, 16, 17, 19, 21, 23, 24, 25, 24, 26] },
  { title: "TikTok Followers", value: 8730, gain: 1204, updated: "1h", icon: "music", trend: [4, 8, 6, 15, 10, 7, 19, 13, 9, 22, 16, 25, 19, 15, 24, 21, 28] },
  { title: "Newsletter Subs", value: 412, gain: 31, updated: "1d", icon: "mail", trend: [5, 7, 9, 10, 11, 12, 11, 12, 11, 12, 13, 15, 18, 22, 25, 26, 27] },
];
const dashboardMetricIcons = {
  heart: '<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-4 4 1 9 8 15 7-6 12-11 8-15Z"/>',
  users: '<circle cx="10" cy="7" r="3"/><path d="M3 21v-3a7 7 0 0 1 14 0v3M17 4a3 3 0 0 1 0 6m3 11v-3a6 6 0 0 0-3-5"/>',
  crown: '<path d="m3 6 4 4 5-6 5 6 4-4-2 12H5ZM5 21h14"/>',
  signal: '<circle cx="12" cy="12" r="2"/><path d="M7 7a7 7 0 0 0 0 10m10-10a7 7 0 0 1 0 10M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16"/>',
  newspaper: '<rect x="5" y="3" width="15" height="18" rx="1"/><path d="M5 8H2v13h3m3-14h9m-9 4h9m-9 4h3m3 0h3m-9 3h9"/>',
  video: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3Z"/>',
  music: '<path d="M9 18V5l12-3v14M9 9l12-3"/><ellipse cx="6" cy="19" rx="3" ry="2"/><ellipse cx="18" cy="17" rx="3" ry="2"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/>',
};
const metricsPanel = document.querySelector("#dashboard-metrics");
const metricsTrack = document.querySelector("#metrics-track");
const metricsPagination = document.querySelector("#metrics-pagination");
const metricsPeriod = document.querySelector("#metrics-period");
const metricsHorizon = document.querySelector("#metrics-horizon");
let metricsAnimationFrame = null;

for (const [select, label, iconName] of [[metricsPeriod, "Reporting period", "calendar"], [metricsHorizon, "Upcoming period", "clock"]]) {
  const caption = document.querySelector(`label[for="${select.id}"]`);
  caption.id = `${select.id}-caption`;
  enhanceFormDropdown(select, caption, { id: select.id, name: label });
  const trigger = document.querySelector(`#${select.id}-trigger`);
  const menu = document.querySelector(`#${select.id}-menu`);
  menu.classList.add("metrics-period-menu");
  menu.querySelectorAll(".filter-option").forEach((option) => option.append(dashboardIcon("check")));
  const helper = document.createElement("p");
  helper.className = "metrics-dropdown-help";
  helper.textContent = select === metricsPeriod ? "Goals and Upcoming Milestones use the Due in control instead." : "Only changes Goals and Upcoming Milestones.";
  menu.append(helper);
  if (iconName === "calendar") trigger.prepend(dashboardIcon("calendar"));
  else {
    const clock = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    clock.setAttribute("class", "icon");
    clock.setAttribute("viewBox", "0 0 24 24");
    clock.setAttribute("aria-hidden", "true");
    clock.innerHTML = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>';
    trigger.prepend(clock);
  }
}

function hasDashboardConnections(card) {
  return card.connections?.some((item) => item.status === "preview" || item.status === "connected");
}

function metricsPeriodValue(card) {
  const value = String(card.metricsPeriod || "7");
  return { "30": "month", "90": "campaign" }[value] || (["7", "14", "month", "campaign"].includes(value) ? value : "7");
}

function metricsHorizonValue(card) {
  const value = String(card.metricsHorizon || "3months");
  return { "1": "month", "3": "3months", "6": "all", "12": "all" }[value] || (["week", "2weeks", "month", "3months", "all"].includes(value) ? value : "3months");
}

function metricsReportingRange(card) {
  const period = metricsPeriodValue(card);
  const today = localDateKey();
  const end = new Date(`${today}T12:00:00`);
  const start = new Date(end);
  if (period === "month") start.setDate(1);
  else if (period === "campaign") {
    const dates = Object.values(gameDashboardData(card)).flat().map((record) => record.date).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today);
    const campaignStart = card.campaignStart || dates.sort()[0] || today;
    const parsed = new Date(`${campaignStart}T12:00:00`);
    if (Number.isFinite(parsed.getTime()) && parsed <= end) start.setTime(parsed.getTime());
  } else start.setDate(start.getDate() - Number(period) + 1);
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  const lower = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  const label = period === "month" ? "this month" : period === "campaign" ? "since campaign start" : `last ${days} days`;
  const comparison = period === "month" ? "compared with the previous month" : period === "campaign" ? "since campaign start" : `compared with the ${days} days before`;
  return { lower, upper: today, days, label, comparison };
}

function filterDashboardMetricDates(kind, records, card) {
  if (gameWorkspace.dataset.section !== "Home" || !hasDashboardConnections(card)) return records;
  const today = localDateKey();
  if (kind === "touchpoints") {
    const range = metricsReportingRange(card);
    return records.filter((record) => !record.date || record.date >= range.lower && record.date <= range.upper);
  }
  const horizon = metricsHorizonValue(card);
  if (horizon === "all") return records;
  const limit = new Date(`${today}T12:00:00`);
  if (horizon === "week" || horizon === "2weeks") limit.setDate(limit.getDate() + (horizon === "week" ? 7 : 14));
  else {
    const day = limit.getDate();
    limit.setDate(1);
    limit.setMonth(limit.getMonth() + (horizon === "month" ? 1 : 3));
    const lastDay = new Date(limit.getFullYear(), limit.getMonth() + 1, 0).getDate();
    limit.setDate(Math.min(day, lastDay));
  }
  // Keep overdue items visible alongside the selected upcoming period.
  return records.filter((record) => !record.date || new Date(`${record.date}T12:00:00`) <= limit);
}

function metricCard(metric, range) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "metrics-card";
  card.dataset.metric = metric.title;
  card.setAttribute("aria-label", `${metric.title}: ${metric.value.toLocaleString("en-US")}. View in Analytics`);
  const header = document.createElement("span");
  header.className = "metrics-card-heading";
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = dashboardMetricIcons[metric.icon];
  const badge = document.createElement("span");
  badge.className = "metrics-card-icon";
  badge.append(icon);
  header.append(badge, metric.title);
  const values = document.createElement("span");
  values.className = "metrics-card-values";
  const value = document.createElement("strong");
  value.textContent = metric.value.toLocaleString("en-US");
  const chart = document.createElementNS(icon.namespaceURI, "svg");
  chart.setAttribute("viewBox", "0 0 80 32");
  chart.setAttribute("aria-hidden", "true");
  chart.classList.add("metrics-sparkline");
  const line = document.createElementNS(icon.namespaceURI, "polyline");
  line.setAttribute("points", metric.trend.map((value, index, trend) => `${index * 80 / (trend.length - 1)},${30 - value}`).join(" "));
  chart.append(line);
  values.append(value, chart);
  const change = document.createElement("span");
  change.className = metric.detail ? "metrics-card-detail" : "metrics-card-gain";
  change.textContent = metric.detail || `▲ +${Math.round(metric.gain * range.days / 7).toLocaleString("en-US")} ${range.label}`;
  const footer = document.createElement("span");
  footer.className = "metrics-card-footer";
  const updated = document.createElement("span");
  updated.className = "metrics-card-updated";
  updated.textContent = `Last updated ${metric.updated} ago`;
  const link = document.createElement("span");
  link.className = "metrics-card-link";
  link.append("View in Analytics", dashboardIcon("arrow"));
  footer.append(updated, link);
  card.append(header, values, change, footer);
  card.addEventListener("click", () => selectWorkspaceSection("Analytics"));
  return card;
}

function renderDashboardMetrics(card, section) {
  metricsPanel.hidden = section !== "Home" || !hasDashboardConnections(card);
  if (metricsPanel.hidden) return;
  metricsPeriod.value = metricsPeriodValue(card);
  metricsHorizon.value = metricsHorizonValue(card);
  for (const select of [metricsPeriod, metricsHorizon]) {
    document.querySelector(`#${select.id}-label`).textContent = select.selectedOptions[0].textContent;
    document.querySelectorAll(`#${select.id}-menu [data-value]`).forEach((option) => option.setAttribute("aria-checked", String(option.dataset.value === select.value)));
  }
  const range = metricsReportingRange(card);
  document.querySelector("#metrics-comparison").textContent = range.comparison;
  metricsTrack.replaceChildren(...dashboardMetricExamples.map((metric) => metricCard(metric, range)));
  metricsTrack.scrollLeft = 0;
  updateMetricsNavigation();
}

function scrollMetricsPage(page) {
  const max = metricsTrack.scrollWidth - metricsTrack.clientWidth;
  const pages = Math.max(1, Math.ceil(max / metricsTrack.clientWidth) + 1);
  const target = Math.max(0, Math.min(page, pages - 1));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  metricsTrack.scrollTo({ left: Math.min(target * metricsTrack.clientWidth, max), behavior: reduced ? "instant" : "smooth" });
}

function updateMetricsNavigation() {
  if (metricsPanel.hidden || !metricsTrack.clientWidth) return;
  const max = Math.max(0, metricsTrack.scrollWidth - metricsTrack.clientWidth);
  const pages = Math.ceil(max / metricsTrack.clientWidth) + 1;
  const current = max < 1 ? 0 : Math.min(pages - 1, Math.round(metricsTrack.scrollLeft / metricsTrack.clientWidth));
  // The last page can contain fewer cards than the available width.
  const active = max > 0 && metricsTrack.scrollLeft >= max - 2 ? pages - 1 : current;
  document.querySelector("#metrics-previous").disabled = metricsTrack.scrollLeft < 2;
  document.querySelector("#metrics-next").disabled = metricsTrack.scrollLeft >= max - 2;
  document.querySelector("#metrics-carousel").dataset.start = String(metricsTrack.scrollLeft < 2);
  document.querySelector("#metrics-carousel").dataset.end = String(metricsTrack.scrollLeft >= max - 2);
  if (metricsPagination.children.length !== pages) {
    metricsPagination.replaceChildren(...Array.from({ length: pages }, (_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Show metrics page ${index + 1}`);
      dot.addEventListener("click", () => scrollMetricsPage(index));
      return dot;
    }));
  }
  Array.from(metricsPagination.children).forEach((dot, index) => dot.setAttribute("aria-current", String(index === active)));
  metricsPagination.hidden = pages === 1;
  document.querySelector("#metrics-status").textContent = `Metrics page ${active + 1} of ${pages}`;
}

document.querySelector("#metrics-previous").addEventListener("click", () => scrollMetricsPage(Math.ceil(metricsTrack.scrollLeft / metricsTrack.clientWidth) - 1));
document.querySelector("#metrics-next").addEventListener("click", () => scrollMetricsPage(Math.floor(metricsTrack.scrollLeft / metricsTrack.clientWidth) + 1));
metricsTrack.addEventListener("scroll", () => {
  if (metricsAnimationFrame) cancelAnimationFrame(metricsAnimationFrame);
  metricsAnimationFrame = requestAnimationFrame(updateMetricsNavigation);
});
metricsTrack.addEventListener("keydown", (event) => {
  if (event.target !== metricsTrack) return;
  if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    const page = event.key === "Home" ? 0 : event.key === "End" ? 100 : Math.round(metricsTrack.scrollLeft / metricsTrack.clientWidth) + (event.key === "ArrowRight" ? 1 : -1);
    scrollMetricsPage(page);
  }
});
new ResizeObserver(updateMetricsNavigation).observe(metricsTrack);
for (const select of [metricsPeriod, metricsHorizon]) {
  select.addEventListener("change", () => {
    activeProject.metricsPeriod = metricsPeriod.value;
    activeProject.metricsHorizon = metricsHorizon.value;
    saveProject(activeProject);
    renderDashboardMetrics(activeProject, "Home");
    for (const kind of Object.keys(dashboardEmptyStates)) renderDashboardRecords(kind, gameDashboardData(activeProject)[kind]);
  });
}
