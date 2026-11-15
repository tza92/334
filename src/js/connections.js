// Connection previews and preferences belong to the selected project's session.
const connectionProviders = [
  { id: "discord", name: "Discord", type: "community", group: "recommended", subtitle: "Connect a Discord Server", description: "Track community growth, member counts, and aggregate server activity.", logo: '<path fill="currentColor" d="M20 5a18 18 0 0 0-4-1l-.5 1a15 15 0 0 0-7 0L8 4a18 18 0 0 0-4 1C1 9 0 13 1 17a16 16 0 0 0 5 3l1-2-2-1 1-.5a15 15 0 0 0 12 0l1 .5-2 1 1 2a16 16 0 0 0 5-3c1-4 0-8-3-12Z"/><ellipse cx="8" cy="12" rx="1.7" ry="2" fill="#5865f2"/><ellipse cx="16" cy="12" rx="1.7" ry="2" fill="#5865f2"/>' },
  { id: "steamworks", name: "Steamworks", type: "store", group: "recommended", subtitle: "Import Wishlist Performance", description: "Import wishlist additions, removals, and historical growth.", logo: '<circle cx="12" cy="12" r="11" fill="currentColor"/><g stroke="#000" fill="none" stroke-width="1.5"><circle cx="15.5" cy="8.5" r="4"/><circle cx="15.5" cy="8.5" r="2.4"/><circle cx="8" cy="16" r="3"/><path d="m10 17 7-5M7 13l-6-2m10 3 2-3"/></g><path d="m2 12 6 3" stroke="#000" stroke-width="2"/>' },
  { id: "youtube", name: "YouTube", type: "video", group: "recommended", subtitle: "Import Channel Performance", description: "Track video views, subscriber growth, watch time, and engagement.", logo: '<rect x="1" y="5" width="22" height="15" rx="5" fill="#ff0033"/><path d="m10 9 6 3.5-6 3.5Z" fill="#fff"/>' },
  { id: "tiktok", name: "TikTok", type: "video", group: "recommended", subtitle: "Import Video Performance", description: "Track video views, likes, comments, shares, and follower growth.", logo: '<path d="M14 3v12a5 5 0 1 1-4-5m4-7c0 4 3 6 6 6" fill="none" stroke="#25f4ee" stroke-width="3" transform="translate(-1 1)"/><path d="M14 3v12a5 5 0 1 1-4-5m4-7c0 4 3 6 6 6" fill="none" stroke="#fe2c55" stroke-width="3" transform="translate(1)"/><path d="M14 3v12a5 5 0 1 1-4-5m4-7c0 4 3 6 6 6" fill="none" stroke="#fff" stroke-width="2.5"/>' },
  { id: "itch", name: "itch.io", type: "store", group: "more", subtitle: "Import Project Analytics", description: "Track game-page visits, downloads, and available engagement statistics.", logo: '<path d="M3 3h18l2 5c0 2-4 3-4 0 0 3-4 3-4 0 0 3-6 3-6 0 0 3-4 3-4 0 0 3-4 2-4 0Z" fill="currentColor"/><path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 13h6c1 0 1.5 1 1.8 2l.8 3c.2 1-1 1.5-1.7.8L14 17h-4l-1.9 1.8c-.7.7-1.9.2-1.7-.8l.8-3c.3-1 .8-2 1.8-2Z" fill="currentColor"/><path d="M10 14v3m-1.5-1.5h3m3-1h.1m1 1h.1" stroke="#ff555b" stroke-width="1.2"/>' },
];

const connectionSettings = {
  discord: {
    description: "Configure your server tracking and bot settings.", account: "Connected Server",
    identity: "Connect a Discord Server", access: "Aggro Bot installed",
    groups: [
      { title: "Community Insights", fields: [
        ["members", "Server Member Count", "Track your total server membership over time."],
        ["growth", "Member Growth", "Track members joining and leaving your server."],
        ["messages", "Message Activity", "Count messages posted in selected channels."],
        { id: "viewedChannel", label: "Viewed Channels", depends: "messages", options: ["#general", "#marketing-updates"], hint: "Message content will not be analyzed." },
      ] },
      { title: "Aggro Bot Notifications", fields: [
        ["notifications", "Allow Campaign Notifications", "Let Aggro post marketing reminders, milestone updates, and performance summaries."],
        { id: "notificationChannel", label: "Notification Channel", depends: "notifications", options: ["#general", "#marketing-updates"], hint: "Aggro will send a Test Message to verify the bot’s posting permissions after setup." },
      ] },
    ],
  },
  steamworks: {
    description: "Configure wishlist and traffic for your game.", account: "Connected Publisher",
    identity: "MC Game Studio", access: "Authorized reporting connection",
    groups: [
      { fields: [{ id: "game", label: "Select a game", options: "game", hint: "Only games you are authorized to access should appear." }] },
      { title: "Wishlist insights", fields: [
        ["wishlists", "Wishlist Count", "Track the total number of outstanding wishlists."],
        ["wishlistActivity", "Daily Wishlist Activity", "Track wishlist additions and removals."],
        ["conversions", "Wishlist Conversions", "Include reported purchases from wishlists."],
        ["regions", "Regional Insights", "Import wishlist activity by country or region."],
        ["refresh", "Automatic Data Refresh", "Refresh available wishlist reports daily."],
      ] },
      { title: "Storefront Traffic", fields: [
        ["traffic", "Total Store Traffic", "Track visits to your Steam store page over time."],
        ["sources", "Traffic Sources", "See where visitors discover your game, including Steam discovery features and external websites."],
      ] },
    ],
  },
  youtube: {
    description: "Choose how Aggro tracks your channel's performance.", account: "Connected Channel",
    access: "Read-only channel analytics",
    groups: [
      { title: "Channel Insights", fields: [
        ["performance", "Video Performance", "Track views, likes, comments, and shares on your videos."],
        ["followers", "Subscriber Growth", "Track subscribers gained and lost over time."],
        ["watchTime", "Watch Time & Retention", "Import watch time and average view duration."],
        ["tracking", "Automatic Video Tracking", "Add newly published videos to your Aggro timeline."],
      ] },
      { title: "Video Selection", description: "Choose which videos Aggro should include in your marketing reports.", fields: "videos" },
    ],
  },
  tiktok: {
    description: "Choose how Aggro tracks your short-form content.", account: "Connected Channel",
    identity: "Import Video Performance", access: "Public video access authorized",
    groups: [
      { title: "Content Insights", fields: [
        ["performance", "Video Performance", "Track views, likes, comments, and shares across your videos."],
        ["followers", "Follower Growth", "Record changes in your follower count over time."],
        ["history", "Performance History", "Save periodic performance snapshots."],
        ["tracking", "Automatic Video Tracking", "Add newly published videos to your Aggro timeline."],
      ] },
      { title: "Content Selection", description: "Choose which videos Aggro should include in your marketing reports.", fields: "videos" },
    ],
  },
  itch: {
    description: "Manage how Aggro uses your itch.io connection.", account: "Connected Account",
    identity: "@mcgamestudio", access: "Account successfully linked",
    groups: [{ title: "Connection preferences", fields: [
      ["listings", "Game Listings", "Access the titles, cover images, and page links of games."],
      { id: "game", label: "Link a game to Aggro", options: ["Import Project Analytics"] },
      ["refresh", "Keep Game Details Updated", "Periodically refresh basic game information."],
    ] }],
  },
};

const connectionDialog = document.querySelector("#connection-dialog");
const connectionForm = document.querySelector("#connection-form");
const connectionContent = document.querySelector("#connection-dialog-content");
const connectionRemove = document.querySelector("#connection-remove");
const connectionSave = document.querySelector("#connection-save");
const removeConnectionDialog = document.querySelector("#remove-connection-dialog");
let connectionRemovalTarget = null;
const connectionFailures = new Map();
let editingConnection = null;
let connectionOpener = null;
let pendingConnection = null;
const authorizationWindow = document.querySelector("#authorization-window");
const authorizationTitleBar = document.querySelector(".authorization-window-bar");
let authorizationDrag = null;

function positionAuthorizationWindow(left, top) {
  const bounds = authorizationWindow.getBoundingClientRect();
  authorizationWindow.style.inset = "auto";
  authorizationWindow.style.margin = "0";
  authorizationWindow.style.left = `${Math.max(8, Math.min(left, innerWidth - bounds.width - 8))}px`;
  authorizationWindow.style.top = `${Math.max(8, Math.min(top, innerHeight - bounds.height - 8))}px`;
}

function stopAuthorizationDrag() {
  if (!authorizationDrag) return;
  const pointerId = authorizationDrag.pointerId;
  authorizationDrag = null;
  delete authorizationWindow.dataset.dragging;
  if (authorizationTitleBar.hasPointerCapture(pointerId)) authorizationTitleBar.releasePointerCapture(pointerId);
}

authorizationTitleBar.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button !== 0 || event.target.closest(".authorization-window-controls")) return;
  event.preventDefault();
  const bounds = authorizationWindow.getBoundingClientRect();
  authorizationDrag = { pointerId: event.pointerId, offsetX: event.clientX - bounds.left, offsetY: event.clientY - bounds.top };
  authorizationWindow.dataset.dragging = "true";
  authorizationTitleBar.setPointerCapture(event.pointerId);
});
authorizationTitleBar.addEventListener("pointermove", (event) => {
  if (authorizationDrag?.pointerId !== event.pointerId) return;
  positionAuthorizationWindow(event.clientX - authorizationDrag.offsetX, event.clientY - authorizationDrag.offsetY);
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) {
  authorizationTitleBar.addEventListener(event, stopAuthorizationDrag);
}
window.addEventListener("resize", () => {
  if (!authorizationWindow.open || !authorizationWindow.style.left) return;
  stopAuthorizationDrag();
  const bounds = authorizationWindow.getBoundingClientRect();
  positionAuthorizationWindow(bounds.left, bounds.top);
});

function connectedApplications() {
  // Earlier saved URLs are references, not authorized accounts.
  return (activeProject.connections || []).filter((item) => item.status === "connected" || item.status === "preview");
}

function connectionLogo(provider) {
  const logo = document.createElement("span");
  logo.className = `connection-logo connection-logo--${provider.id}`;
  // Artwork is static catalog content, never account-supplied markup.
  logo.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${provider.logo}</svg>`;
  return logo;
}

function connectionCard(provider, saved) {
  const card = document.createElement("article");
  card.className = "connection-card";
  card.dataset.provider = provider.id;
  const heading = document.createElement("div");
  heading.className = "connection-card-heading";
  const details = document.createElement("div");
  details.className = "connection-card-details";
  const name = document.createElement("h3");
  name.textContent = provider.name;
  const subtitle = document.createElement("p");
  const gameName = activeProject.temporary ? "HOLLOW SIGNAL" : activeProject.name;
  const accountLabel = provider.id === "steamworks" ? saved?.settings?.game || gameName
    : provider.id === "itch" ? saved?.settings?.game || provider.subtitle : saved?.name;
  subtitle.textContent = saved ? accountLabel : provider.subtitle;
  if (saved) subtitle.className = "connection-account-status";
  const status = document.createElement("div");
  status.className = "connection-card-status";
  status.append(subtitle);
  details.append(name, status);
  const failure = connectionFailures.get(provider.id);
  if (failure && !saved) {
    const error = document.createElement("p");
    error.className = "connection-error";
    error.setAttribute("role", "alert");
    error.textContent = failure;
    status.append(error);
  }
  const action = document.createElement("button");
  action.type = "button";
  action.className = saved ? "connection-edit" : "button button--primary connection-connect";
  action.setAttribute("aria-label", `${saved ? "Edit" : "Connect"} ${provider.name}`);
  if (saved) {
    action.append(dashboardIcon("edit"));
    action.addEventListener("click", () => openConnectionSettings(saved, action));
  } else {
    action.append("Connect", dashboardIcon("plus"));
    action.addEventListener("click", () => beginConnection(provider, action));
  }
  heading.append(connectionLogo(provider), details, action);
  const description = document.createElement("p");
  description.className = "connection-description";
  description.textContent = provider.description;
  card.append(heading, description);
  return card;
}

function renderConnections() {
  const saved = connectedApplications();
  document.querySelector("#connections-title").textContent = saved.length
    ? `${saved.length} ${saved.length === 1 ? "Connection" : "Connections"}`
    : "Connections";
  for (const group of ["saved", "recommended", "more"]) {
    const container = document.querySelector(`#${group}-connections`);
    const type = document.querySelector(`[data-connections-filter="${group}"]`).value;
    const providers = connectionProviders.filter((provider) =>
      (group === "saved" ? saved.some((item) => item.provider === provider.id) : provider.group === group)
      && (type === "all" || provider.type === type));
    container.replaceChildren(...providers.map((provider) => connectionCard(provider, saved.find((item) => item.provider === provider.id))));
    container.hidden = providers.length === 0;
    document.querySelector(`[data-connection-no-results="${group}"]`).hidden = providers.length > 0 || (group === "saved" && saved.length === 0);
  }
  document.querySelector("#connections-empty").hidden = saved.length > 0;
}

function connectionStatus(message) {
  document.querySelector("#dashboard-status").textContent = message;
}

function restoreConnectionFocus() {
  if (connectionOpener?.isConnected && !connectionOpener.closest("[hidden]")) connectionOpener.focus();
  else {
    const provider = editingConnection?.provider || pendingConnection?.id;
    const card = Array.from(document.querySelectorAll(".connection-card")).find((item) => item.dataset.provider === provider && !item.closest("[hidden]"));
    if (card) card.querySelector("button").focus();
    else workspacePageTitle.focus();
  }
}

function beginConnection(provider, opener) {
  stopAuthorizationDrag();
  for (const property of ["inset", "margin", "left", "top"]) authorizationWindow.style.removeProperty(property);
  connectionOpener = opener;
  editingConnection = null;
  pendingConnection = provider;
  document.querySelector("#authorization-window-title").replaceChildren(connectionLogo(provider), `Authorize with ${provider.name} App`);
  const domain = { discord: "discord.com", steamworks: "partner.steamgames.com", youtube: "accounts.google.com", tiktok: "www.tiktok.com", itch: "itch.io" }[provider.id];
  document.querySelector("#authorization-window-address").textContent = `${domain}/auth/authorize/?client_key=UUID&response_type=code&redirect_uri=https://auth.aggro.com/connect`;
  const account = { discord: "Discord account", steamworks: "Steamworks publisher account", youtube: "YouTube channel", tiktok: "TikTok account", itch: "itch.io account" }[provider.id];
  document.querySelector("#authorization-title").textContent = `Aggro wants to access your ${account}`;
  document.querySelector("#authorization-terms").textContent = `By connecting, you agree to Aggro’s Terms of Service and acknowledge that you have read the Privacy Policy. You can always see or remove access in the ${provider.name} App.`;
  authorizationWindow.returnValue = "";
  authorizationWindow.showModal();
}

function finishConnection(accepted, failure = "Failed to connect. Please try again.") {
  if (!pendingConnection) return;
  const provider = pendingConnection;
  if (!accepted) {
    connectionFailures.set(provider.id, failure);
    renderConnections();
    restoreConnectionFocus();
    pendingConnection = null;
    return;
  }
  // Simulated authorization never contacts a provider or requests credentials.
  const settings = connectionSettings[provider.id];
  const record = {
    provider: provider.id, status: "preview",
    name: settings.identity || (activeProject.temporary ? "HOLLOW SIGNAL" : activeProject.name),
    settings: {},
  };
  activeProject.connections = (activeProject.connections || []).filter((item) => item.provider !== record.provider);
  activeProject.connections.push(record);
  if (!activeProject.platformSetupComplete) {
    activeProject.platformSetupComplete = true;
    activeProject.platformSetupCelebrationPending = true;
  }
  saveProject(activeProject);
  connectionFailures.delete(record.provider);
  connectionStatus(`${provider.name} connected in the simulation.`);
  // A type filter should not hide the account that was just connected.
  document.querySelector('[data-connections-filter="saved"]').value = "all";
  document.querySelector('[data-connections-filter="saved"]').dispatchEvent(new Event("change"));
  renderConnections();
  openConnectionSettings(record, connectionOpener);
  pendingConnection = null;
}

document.querySelector("#authorization-connect").addEventListener("click", () => authorizationWindow.close("connect"));
document.querySelector("#authorization-cancel").addEventListener("click", () => authorizationWindow.close("cancel"));

document.querySelector("#authorization-window-close").addEventListener("click", () => authorizationWindow.close("cancel"));
authorizationWindow.addEventListener("close", () => {
  stopAuthorizationDrag();
  finishConnection(authorizationWindow.returnValue === "connect");
});

function connectionToggle(field, values) {
  const [id, title, description] = field;
  const row = document.createElement("label");
  row.className = "connection-setting-row";
  const copy = document.createElement("span");
  const label = document.createElement("strong");
  label.textContent = title;
  copy.append(label);
  if (description) {
    const detail = document.createElement("small");
    detail.textContent = description;
    copy.append(detail);
  }
  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = id;
  input.setAttribute("role", "switch");
  input.checked = values[id] ?? true;
  input.className = "connection-switch";
  row.append(copy, input);
  return row;
}

function connectionSelect(field, values, record) {
  const wrapper = document.createElement("div");
  wrapper.className = "connection-select-setting";
  const label = document.createElement("div");
  label.className = "field";
  const labelText = document.createElement("label");
  labelText.textContent = field.label;
  if (field.depends) {
    const required = document.createElement("span");
    required.className = "connection-required";
    required.textContent = " *";
    labelText.append(required);
  }
  if (field.hideLabel) labelText.className = "visually-hidden";
  label.append(labelText);
  const select = document.createElement("select");
  select.name = field.id;
  const options = field.options === "game" ? [activeProject.temporary ? "HOLLOW SIGNAL" : activeProject.name] : field.options;
  select.add(new Option(field.placeholder || (field.options === "game" ? "Select a game" : "Choose a Channel"), ""));
  // Live integrations must supply their authorized resources on the account record.
  const resources = record.status === "preview" ? options : (record.resources?.[field.id] || []);
  resources.forEach((item) => select.add(new Option(item, item)));
  const previous = values[field.id];
  select.value = resources.includes(previous) ? previous : (field.id === "game" ? resources[0] || "" : "");
  select.required = true;
  label.append(select);
  wrapper.append(label);
  if (field.hint) {
    const hint = document.createElement("p");
    hint.className = "connection-setting-hint";
    hint.textContent = field.hint;
    wrapper.append(hint);
  }
  if (field.depends) wrapper.dataset.depends = field.depends;
  enhanceConnectionSelect(select, labelText, field, record.provider);
  return wrapper;
}

function enhanceConnectionSelect(select, caption, field, provider) {
  const id = `connection-${provider}-${field.id}`;
  const trigger = document.createElement("button");
  trigger.id = `${id}-trigger`;
  trigger.type = "button";
  trigger.className = "connection-select-trigger";
  trigger.setAttribute("popovertarget", `${id}-popup`);
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", `${id}-popup`);
  caption.htmlFor = trigger.id;
  const text = document.createElement("span");
  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chevron.setAttribute("class", "icon");
  chevron.setAttribute("viewBox", "0 0 24 24");
  chevron.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(chevron.namespaceURI, "path");
  path.setAttribute("d", "m8 10 4 5 4-5");
  chevron.append(path);
  trigger.append(text, chevron);
  const popup = document.createElement("div");
  popup.id = `${id}-popup`;
  popup.className = "connection-select-popup";
  popup.setAttribute("popover", "auto");
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-label", field.label);
  const kind = field.id === "video" ? "videos" : field.id === "game" ? "games" : "channels";
  const searchBox = document.createElement("div");
  searchBox.className = "connection-select-search";
  const searchIcon = document.createElementNS(chevron.namespaceURI, "svg");
  searchIcon.setAttribute("viewBox", "0 0 24 24");
  searchIcon.setAttribute("aria-hidden", "true");
  searchIcon.innerHTML = '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>';
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = `Search ${kind}`;
  search.setAttribute("aria-label", `Search ${kind}`);
  search.autocomplete = "off";
  searchBox.append(searchIcon, search);
  const heading = document.createElement("p");
  heading.className = "connection-select-caption";
  heading.textContent = `Detected ${kind[0].toUpperCase()}${kind.slice(1)}`;
  const list = document.createElement("div");
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", field.label);
  const empty = document.createElement("p");
  empty.className = "connection-select-empty";
  empty.textContent = `No ${kind} found.`;
  empty.setAttribute("role", "status");
  const error = document.createElement("p");
  error.id = `${id}-error`;
  error.className = "connection-select-error";
  error.textContent = "Please choose an option.";
  error.hidden = true;
  trigger.setAttribute("aria-describedby", error.id);
  const options = Array.from(select.options).filter((item) => item.value).map((item) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "connection-select-option";
    option.textContent = item.textContent;
    option.dataset.value = item.value;
    option.setAttribute("role", "option");
    option.tabIndex = -1;
    option.addEventListener("click", () => {
      select.value = item.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      popup.hidePopover();
      trigger.focus();
    });
    list.append(option);
    return option;
  });
  popup.append(searchBox, heading, list, empty);
  select.hidden = true;
  select.after(trigger, popup, error);
  function refresh() {
    text.textContent = select.selectedOptions[0]?.textContent || field.placeholder;
    options.forEach((option) => option.setAttribute("aria-selected", String(option.dataset.value === select.value)));
    if (select.value) { error.hidden = true; trigger.removeAttribute("aria-invalid"); }
  }
  function filter() {
    const query = search.value.trim().toLowerCase();
    options.forEach((option) => { option.hidden = !option.textContent.toLowerCase().includes(query); });
    empty.hidden = options.some((option) => !option.hidden);
  }
  function position() {
    const bounds = trigger.getBoundingClientRect();
    const width = Math.min(bounds.width, innerWidth - 32);
    const below = innerHeight - bounds.bottom - 16;
    const above = bounds.top - 16;
    popup.style.width = `${width}px`;
    popup.style.left = `${Math.max(16, Math.min(bounds.left, innerWidth - width - 16))}px`;
    const upward = below < 160 && above > below;
    popup.style.maxHeight = `${Math.min(260, upward ? above - 6 : below - 6)}px`;
    popup.style.top = `${upward ? bounds.top - popup.offsetHeight - 6 : bounds.bottom + 6}px`;
  }
  let positioning;
  popup.addEventListener("toggle", () => {
    const open = popup.matches(":popover-open");
    trigger.setAttribute("aria-expanded", String(open));
    positioning?.abort();
    if (open) {
      search.value = "";
      filter();
      position();
      search.focus({ preventScroll: true });
      positioning = new AbortController();
      window.addEventListener("resize", position, { signal: positioning.signal });
      document.addEventListener("scroll", position, { capture: true, signal: positioning.signal });
    }
  });
  search.addEventListener("input", () => { filter(); position(); });
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); popup.showPopover(); }
  });
  popup.addEventListener("keydown", (event) => {
    const visible = options.filter((option) => !option.hidden);
    const index = visible.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      popup.hidePopover();
      trigger.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = event.key === "ArrowDown" ? (index + 1) % visible.length : (index < 0 ? visible.length - 1 : (index - 1 + visible.length) % visible.length);
      visible[next]?.focus();
    } else if (event.key === "Enter" && event.target === search) {
      event.preventDefault();
      visible[0]?.click();
    } else if (event.key === "Tab") {
      event.preventDefault();
      popup.hidePopover();
      trigger.focus();
    }
  });
  select.addEventListener("change", refresh);
  select.addEventListener("invalid", (event) => {
    event.preventDefault();
    error.hidden = false;
    trigger.setAttribute("aria-invalid", "true");
    if (!connectionContent.querySelector('.connection-select-trigger[aria-invalid="true"]:focus')) trigger.focus();
  });
  refresh();
}

function updateConnectionDependencies() {
  connectionContent.querySelectorAll("[data-depends]").forEach((element) => {
    const enabled = connectionForm.elements.namedItem(element.dataset.depends).checked;
    element.hidden = !enabled;
    element.querySelectorAll("select").forEach((select) => { select.disabled = !enabled; });
  });
  const allVideos = connectionForm.elements.namedItem("allVideos");
  if (allVideos) {
    const selected = connectionForm.elements.namedItem("selectedVideos");
    selected.checked = !allVideos.checked;
    const videos = connectionForm.elements.namedItem("video");
    videos.closest(".connection-select-setting").hidden = allVideos.checked;
    videos.disabled = allVideos.checked;
  }
  connectionContent.querySelectorAll(".connection-select-setting").forEach((wrapper) => {
    const select = wrapper.querySelector("select");
    const trigger = wrapper.querySelector(".connection-select-trigger");
    trigger.disabled = select.disabled;
    trigger.classList.toggle("needs-selection", select.willValidate && select.validity.valueMissing);
    if (select.disabled) wrapper.querySelectorAll(":popover-open").forEach((popup) => popup.hidePopover());
  });
  connectionSave.disabled = Array.from(connectionContent.querySelectorAll("input, select"))
    .some((input) => input.willValidate && !input.validity.valid);
}

function openConnectionSettings(record, opener) {
  editingConnection = record;
  connectionOpener = opener;
  const provider = connectionProviders.find((item) => item.id === record.provider);
  const config = connectionSettings[record.provider];
  connectionDialog.dataset.provider = record.provider;
  document.querySelector("#connection-cancel").hidden = true;
  document.querySelector("#connection-dialog-title").replaceChildren(connectionLogo(provider), provider.name);
  document.querySelector("#connection-dialog-description").textContent = config.description;
  connectionContent.replaceChildren();
  const account = document.createElement("section");
  account.className = "connection-settings-group connection-account";
  const heading = document.createElement("h3");
  heading.textContent = config.account;
  const identity = document.createElement("strong");
  identity.textContent = record.name;
  const access = document.createElement("p");
  access.textContent = config.access;
  account.append(heading, identity, access);
  connectionContent.append(account);
  const values = record.settings || {};
  for (const group of config.groups) {
    const section = document.createElement("section");
    section.className = "connection-settings-group";
    if (group.title) {
      const title = document.createElement("h3");
      title.textContent = group.title;
      section.append(title);
    }
    if (group.description) {
      const description = document.createElement("p");
      description.className = "connection-group-description";
      description.textContent = group.description;
      section.append(description);
    }
    if (group.fields === "videos") {
      const all = connectionToggle(["allVideos", record.provider === "youtube" ? "All Channel Videos" : "All Public Videos"], { allVideos: values.allVideos ?? false });
      const selected = connectionToggle(["selectedVideos", "Selected Videos Only"], { selectedVideos: !(values.allVideos ?? false) });
      selected.querySelector("input").addEventListener("change", (event) => {
        all.querySelector("input").checked = !event.target.checked;
      });
      const videos = record.status === "preview" ? ["Launch trailer", "Development update", "Gameplay preview"] : [];
      const selection = connectionSelect({ id: "video", label: "Video Title", hideLabel: true, placeholder: "Video Title", options: videos }, values, record);
      section.append(all, selected, selection);
    } else {
      for (const field of group.fields) {
        section.append(Array.isArray(field) ? connectionToggle(field, values) : connectionSelect(field, values, record));
      }
    }
    connectionContent.append(section);
  }
  connectionRemove.hidden = false;
  connectionSave.hidden = false;
  document.querySelector("#dashboard-status").textContent = "";
  updateConnectionDependencies();
  connectionDialog.showModal();
}

connectionContent.addEventListener("change", updateConnectionDependencies);
document.querySelectorAll("[data-connections-filter]").forEach((select) => {
  const group = select.dataset.connectionsFilter;
  const trigger = document.createElement("button");
  trigger.id = `connection-types-${group}-trigger`;
  trigger.type = "button";
  trigger.className = "filter-trigger connection-type-filter";
  trigger.setAttribute("aria-label", select.getAttribute("aria-label"));
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  const label = document.createElement("span");
  label.dataset.dropdownLabel = "";
  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chevron.setAttribute("class", "icon");
  chevron.setAttribute("viewBox", "0 0 24 24");
  chevron.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(chevron.namespaceURI, "path");
  path.setAttribute("d", "m6 9 6 6 6-6");
  chevron.append(path);
  trigger.append(label, chevron);
  const menu = document.createElement("div");
  menu.id = `connection-types-${group}`;
  menu.className = "filter-menu connection-types-menu";
  menu.setAttribute("popover", "auto");
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", select.getAttribute("aria-label"));
  trigger.setAttribute("popovertarget", menu.id);
  trigger.setAttribute("aria-controls", menu.id);
  const heading = document.createElement("p");
  heading.className = "connection-types-heading";
  heading.textContent = "TYPE";
  menu.append(heading);
  for (const option of select.options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-option";
    button.dataset.value = option.value;
    button.setAttribute("role", "menuitemradio");
    button.tabIndex = -1;
    const text = document.createElement("span");
    text.textContent = option.textContent;
    button.append(text, dashboardIcon("check"));
    menu.append(button);
  }
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "connection-types-clear";
  clear.setAttribute("role", "menuitem");
  clear.tabIndex = -1;
  clear.textContent = "Clear all";
  clear.addEventListener("click", () => {
    select.value = "all";
    select.dispatchEvent(new Event("change"));
    menu.hidePopover();
    trigger.focus();
  });
  menu.append(clear);
  select.hidden = true;
  select.after(trigger, menu);
  function refresh() {
    label.textContent = select.selectedOptions[0].textContent;
    menu.querySelectorAll("[data-value]").forEach((button) => button.setAttribute("aria-checked", String(button.dataset.value === select.value)));
    trigger.classList.toggle("has-filters", select.value !== "all");
  }
  connectDropdown(trigger, menu, (option) => {
    select.value = option.dataset.value;
    select.dispatchEvent(new Event("change"));
  });
  select.addEventListener("change", () => { refresh(); renderConnections(); });
  refresh();
});
document.querySelector("[data-add-application]").addEventListener("click", (event) => {
  connectionOpener = event.currentTarget;
  editingConnection = null;
  delete connectionDialog.dataset.provider;
  document.querySelector("#connection-cancel").hidden = false;
  document.querySelector("#connection-dialog-title").textContent = "Add Application";
  document.querySelector("#connection-dialog-description").textContent = "Choose an application to connect.";
  connectionContent.replaceChildren(...connectionProviders.filter((provider) => !connectedApplications().some((item) => item.provider === provider.id)).map((provider) => {
    const choice = document.createElement("button");
    choice.type = "button";
    choice.className = "connection-provider-choice";
    choice.append(connectionLogo(provider), provider.name, dashboardIcon("plus"));
    choice.addEventListener("click", () => {
      connectionDialog.close();
      beginConnection(provider, connectionOpener);
    });
    return choice;
  }));
  connectionRemove.hidden = true;
  connectionSave.hidden = true;
  connectionDialog.showModal();
});

connectionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!editingConnection || !connectionForm.checkValidity()) return;
  const settings = { ...editingConnection.settings };
  connectionContent.querySelectorAll("input[name], select[name]").forEach((input) => {
    settings[input.name] = input.type === "checkbox" ? input.checked : input.value;
  });
  editingConnection.settings = settings;
  if (editingConnection.status === "preview") seedConnectionDemo(activeProject);
  saveProject(activeProject);
  renderConnections();
  connectionStatus("Connection preferences saved.");
  connectionDialog.close();
});

connectionRemove.addEventListener("click", () => {
  if (!editingConnection) return;
  connectionRemovalTarget = editingConnection.provider;
  const provider = connectionProviders.find((item) => item.id === connectionRemovalTarget);
  connectionDialog.querySelectorAll(":popover-open").forEach((popup) => popup.hidePopover());
  document.querySelector("#remove-connection-title").textContent = `Remove ${provider.name}?`;
  document.querySelector("#remove-connection-description").textContent = `“${provider.name}” and its preferences will be removed. Existing statistics are kept.`;
  removeConnectionDialog.showModal();
});
document.querySelector("#confirm-remove-connection").addEventListener("click", () => {
  if (!connectionRemovalTarget) return;
  activeProject.connections = (activeProject.connections || []).filter((item) => item.provider !== connectionRemovalTarget);
  saveProject(activeProject);
  renderConnections();
  connectionStatus("Application disconnected.");
  removeConnectionDialog.close();
  connectionDialog.close();
});
removeConnectionDialog.addEventListener("close", () => {
  connectionRemovalTarget = null;
  if (connectionDialog.open) connectionRemove.focus();
});
connectionDialog.addEventListener("close", restoreConnectionFocus);

