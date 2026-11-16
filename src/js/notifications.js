const notificationsTrigger = document.querySelector("#notifications-trigger");
const notificationsPopup = document.querySelector("#notifications-popup");
const notificationsReadAll = document.querySelector("#notifications-read-all");

function workspaceNotificationItems() {
  const data = gameDashboardData(activeProject);
  const items = [];
  const touchpoint = data.touchpoints.find((record) => record.type === "post");
  if (touchpoint) items.push({
    id: `post:${touchpoint.title}:${touchpoint.summary}`, icon: "video", panel: "touchpoints",
    title: touchpoint.demo && touchpoint.title.includes("save file corrupts") ? `${touchpoint.title} passed 48K views` : touchpoint.title,
    detail: touchpoint.demo && touchpoint.title.includes("save file corrupts") ? `+84 wishlists attributed · ${connectionRecordTime(touchpoint)}` : touchpoint.summary,
  });
  const milestone = [...data.milestones].sort((a, b) => a.date.localeCompare(b.date)).find((record) => planDaysUntil(record) >= 0);
  if (milestone) {
    const days = planDaysUntil(milestone);
    items.push({ id: `milestone:${milestone.title}:${milestone.date}:${days}`, icon: "calendar", panel: "milestones", title: `${milestone.title} ${days === 0 ? "is due today" : `is due in ${days} ${days === 1 ? "day" : "days"}`}`, detail: `Milestone · ${shortDashboardDate(milestone.date)}` });
  }
  const goal = data.goals.find((record) => goalProgress(record).status === "behind");
  if (goal) items.push({ id: `goal:${goal.title}:${goal.current}:${goal.target}`, icon: "newspaper", panel: "goals", title: `${goal.title} is Behind`, detail: `Goal · ${Number(goal.current || 0).toLocaleString("en-US")} of ${Number(goal.target).toLocaleString("en-US")} ${goal.metric === "Press features" ? "secured" : "complete"}` });
  const store = data.touchpoints.find((record) => record.type === "store");
  if (store) items.push({ id: `store:${store.title}:${store.summary}`, icon: "storefront", panel: "touchpoints", title: store.demo ? "Steam wishlist rate up 2.3% after the screenshot update" : store.title, detail: `Storefront · ${connectionRecordTime(store)}` });
  return items;
}

function renderWorkspaceNotifications() {
  const list = document.querySelector("#notifications-list");
  const items = workspaceNotificationItems();
  const read = new Set(activeProject.readNotifications || []);
  list.replaceChildren();
  for (const item of items) {
    const button = settingsNode("button", "notification-item");
    button.type = "button";
    button.dataset.read = String(read.has(item.id));
    button.setAttribute("aria-label", `${read.has(item.id) ? "" : "Unread: "}${item.title}. ${item.detail || ""}`);
    const icon = settingsNode("span", "notification-icon");
    icon.append(dashboardIcon(item.icon));
    const copy = settingsNode("span", "notification-copy");
    copy.append(settingsNode("strong", "", item.title), settingsNode("small", "", item.detail || "Connection update"));
    const dot = settingsNode("span", "notification-unread");
    dot.setAttribute("aria-hidden", "true");
    button.append(icon, copy, dot);
    button.addEventListener("click", () => {
      activeProject.readNotifications = [...new Set([...(activeProject.readNotifications || []), item.id])];
      saveProject(activeProject);
      notificationsPopup.hidePopover();
      selectWorkspaceSection("Home");
      const heading = document.querySelector(`#${item.panel}-title`);
      heading.tabIndex = -1;
      heading.scrollIntoView({ block: "center", behavior: "instant" });
      heading.focus({ preventScroll: true });
    });
    list.append(button);
  }
  if (!items.length) list.append(settingsNode("p", "notifications-empty", "You’re all caught up. Updates for your goals, milestones, and connections will appear here."));
  const unread = items.filter((item) => !read.has(item.id)).length;
  notificationsReadAll.disabled = unread === 0;
  notificationsTrigger.dataset.unread = String(unread > 0);
  notificationsTrigger.setAttribute("aria-label", unread ? `Notifications, ${unread} unread` : "Notifications");
}

function syncWorkspaceNotifications() {
  const completed = Boolean(activeProject.setupFinished);
  notificationsTrigger.hidden = !completed;
  if (!completed) {
    if (notificationsPopup.matches(":popover-open")) notificationsPopup.hidePopover();
    return;
  }
  renderWorkspaceNotifications();
}

connectFilterPopover(notificationsTrigger, notificationsPopup, { width: 560, onOpen: () => {
  renderWorkspaceNotifications();
  (notificationsReadAll.disabled ? document.querySelector("#notifications-settings") : notificationsReadAll).focus({ preventScroll: true });
} });
notificationsReadAll.addEventListener("click", () => {
  activeProject.readNotifications = [...new Set([...(activeProject.readNotifications || []), ...workspaceNotificationItems().map((item) => item.id)])];
  saveProject(activeProject);
  renderWorkspaceNotifications();
  document.querySelector("#notifications-status").textContent = "All notifications marked as read.";
  document.querySelector("#notifications-settings").focus({ preventScroll: true });
});
document.querySelector("#notifications-settings").addEventListener("click", () => {
  notificationsPopup.hidePopover();
  selectWorkspaceSection("Settings");
  selectSettingsTab(document.querySelector("#settings-notifications-tab"));
  document.querySelector("#settings-notifications-tab").focus();
});
