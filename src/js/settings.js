// Settings use the same browser-session persistence as the prototype's projects.
const settingsStorageKey = "aggro.settings";
const settingsDefaults = { username: "Maya Character", email: "mayacharacter@example.com", phone: "+1 555 010 1234", picture: null, notifications: { milestones: true, goals: true, connections: true, opportunities: false } };
let accountSettings;
try { accountSettings = JSON.parse(sessionStorage.getItem(settingsStorageKey) || "null"); } catch { accountSettings = null; }
accountSettings = { ...settingsDefaults, ...accountSettings, notifications: { ...settingsDefaults.notifications, ...accountSettings?.notifications } };
const settingsPage = document.querySelector("#settings-page");
const settingsTabs = [...document.querySelectorAll('.settings-tabs [role="tab"]')];
const settingsDialog = document.createElement("dialog");
settingsDialog.className = "settings-dialog";
settingsDialog.setAttribute("aria-labelledby", "settings-dialog-title");
document.body.append(settingsDialog);

function settingsNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function settingsMessage(message) {
  document.querySelector("#settings-status").textContent = message;
}

function saveAccountSettings(next, message) {
  try {
    sessionStorage.setItem(settingsStorageKey, JSON.stringify(next));
    accountSettings = next;
    settingsMessage(message);
    return true;
  } catch {
    settingsMessage("There isn’t enough browser storage to save this change. Try a smaller picture.");
    return false;
  }
}

function renderSettingsAvatar() {
  const initials = accountSettings.username.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  for (const avatar of [document.querySelector("#settings-avatar"), document.querySelector(".account-nav .avatar")]) {
    avatar.replaceChildren();
    if (accountSettings.picture) {
      const image = document.createElement("img");
      image.src = accountSettings.picture;
      image.alt = "";
      avatar.append(image);
    } else avatar.textContent = initials;
    avatar.setAttribute("aria-label", `Profile for ${accountSettings.username}`);
  }
}

function renderSettingsInfo() {
  const rows = document.querySelector("#settings-info-rows");
  rows.replaceChildren();
  for (const [key, title] of [["username", "Username"], ["email", "Email"], ["phone", "Phone Number"]]) {
    const row = settingsNode("div", "settings-row");
    const value = settingsNode("span", "settings-value");
    const masked = () => key === "email" ? `**********@${accountSettings.email.split("@")[1]}` : `******${accountSettings.phone.replace(/\D/g, "").slice(-4)}`;
    value.textContent = key === "username" ? accountSettings[key] : masked();
    row.append(settingsNode("span", "settings-label", title), value);
    if (key !== "username") {
      const reveal = settingsNode("button", "settings-reveal", "Reveal");
      reveal.type = "button";
      reveal.setAttribute("aria-label", `Reveal ${title.toLowerCase()}`);
      reveal.setAttribute("aria-pressed", "false");
      reveal.addEventListener("click", () => {
        const showing = reveal.getAttribute("aria-pressed") !== "true";
        value.textContent = showing ? accountSettings[key] : masked();
        reveal.textContent = showing ? "Hide" : "Reveal";
        reveal.setAttribute("aria-label", `${showing ? "Hide" : "Reveal"} ${title.toLowerCase()}`);
        reveal.setAttribute("aria-pressed", String(showing));
      });
      row.append(reveal);
    }
    const edit = settingsNode("button", "icon-button settings-edit");
    edit.type = "button";
    edit.setAttribute("aria-label", `Edit ${title.toLowerCase()}`);
    edit.append(dashboardIcon("edit"));
    edit.addEventListener("click", () => openSettingsEditor(`Edit ${title}`, title, accountSettings[key], key === "email" ? "email" : key === "phone" ? "tel" : "text", (next) => {
      if (!saveAccountSettings({ ...accountSettings, [key]: next }, `${title} updated for this browser session.`)) return false;
      renderSettingsInfo();
      renderSettingsAvatar();
      return true;
    }));
    row.append(edit);
    rows.append(row);
  }
}

function settingsDialogContent(title) {
  settingsDialog.replaceChildren();
  const heading = settingsNode("h2", "", title);
  heading.id = "settings-dialog-title";
  settingsDialog.append(heading);
}

function openSettingsEditor(title, label, current, type, onSave) {
  settingsDialogContent(title);
  const form = settingsNode("form");
  const field = settingsNode("label", "", label);
  const input = settingsNode("input");
  input.type = type;
  input.value = current;
  input.required = true;
  input.maxLength = type === "email" ? 254 : 120;
  if (type === "tel") input.pattern = "[+0-9 ()-]{7,30}";
  field.append(input);
  const note = settingsNode("p", "settings-note", "Changes are saved in this browser session.");
  const footer = settingsNode("footer");
  const cancel = settingsNode("button", "button button--secondary", "Cancel");
  cancel.type = "button";
  cancel.addEventListener("click", () => settingsDialog.close());
  const save = settingsNode("button", "button button--primary", "Save Changes");
  save.type = "submit";
  footer.append(cancel, save);
  form.append(field, note, footer);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const next = input.value.trim();
    input.setCustomValidity(next ? "" : "Enter a value.");
    if (!form.reportValidity()) return;
    if (onSave(next) !== false) settingsDialog.close();
  });
  input.addEventListener("input", () => input.setCustomValidity(""));
  settingsDialog.append(form);
  settingsDialog.showModal();
  input.focus();
}

function openSettingsNotice(title, message) {
  settingsDialogContent(title);
  settingsDialog.append(settingsNode("p", "settings-note", message));
  const footer = settingsNode("footer");
  const close = settingsNode("button", "button button--primary", "Done");
  close.type = "button";
  close.addEventListener("click", () => settingsDialog.close());
  footer.append(close);
  settingsDialog.append(footer);
  settingsDialog.showModal();
}

function renderSettingsProjects() {
  const panel = document.querySelector("#settings-projects");
  const card = settingsNode("section", "settings-card");
  card.append(settingsNode("h2", "", "Your Projects"));
  const projects = loadProjects();
  if (!projects.some((project) => project.id === activeProject.id)) projects.push(activeProject);
  projects.forEach((project) => {
    const row = settingsNode("div", "settings-project");
    const copy = settingsNode("div", "settings-project-copy");
    copy.append(settingsNode("strong", "", project.name), settingsNode("small", "", project.id === activeProject.id ? "Current project" : project.setupFinished ? "Workspace ready" : "Setup in progress"));
    const edit = settingsNode("button", "icon-button settings-edit");
    edit.type = "button";
    edit.setAttribute("aria-label", `Rename ${project.name}`);
    edit.append(dashboardIcon("edit"));
    edit.addEventListener("click", () => openSettingsEditor("Rename Project", "Project name", project.name, "text", (name) => {
      const target = project.id === activeProject.id ? activeProject : project;
      target.name = name;
      saveProject(target);
      if (target === activeProject) {
        document.title = `Settings · ${name} · Aggro.`;
        document.querySelector("#dashboard-game-name").textContent = name;
      }
      renderSettingsProjects();
      settingsMessage("Project name updated.");
      return true;
    }));
    const open = settingsNode("button", "button button--secondary", "Open");
    open.type = "button";
    open.setAttribute("aria-label", `Open ${project.name}`);
    open.addEventListener("click", () => project.id === activeProject.id ? selectWorkspaceSection("Home") : openProject(project));
    row.append(copy, edit, open);
    card.append(row);
  });
  panel.replaceChildren(card);
}

function renderSettingsNotifications() {
  const panel = document.querySelector("#settings-notifications");
  const card = settingsNode("section", "settings-card");
  card.append(settingsNode("h2", "", "Notification Preferences"), settingsNode("p", "settings-note", "Save your preferences for this browser session. Notification delivery is not connected in this prototype."));
  for (const [key, title, description] of [
    ["milestones", "Milestone reminders", "Upcoming dates and milestone deadlines."],
    ["goals", "Goal progress", "Progress updates and completed goals."],
    ["connections", "Connection updates", "Application syncs and connection issues."],
    ["opportunities", "Events & Funds", "New opportunities for your project."],
  ]) {
    const row = settingsNode("div", "settings-row settings-toggle-row");
    const copy = settingsNode("div", "settings-project-copy");
    copy.append(settingsNode("span", "settings-label", title), settingsNode("small", "", description));
    const toggle = settingsNode("button", "settings-toggle");
    toggle.type = "button";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-label", title);
    toggle.setAttribute("aria-checked", String(accountSettings.notifications[key]));
    toggle.addEventListener("click", () => {
      const next = !accountSettings.notifications[key];
      if (saveAccountSettings({ ...accountSettings, notifications: { ...accountSettings.notifications, [key]: next } }, "Notification preferences saved.")) toggle.setAttribute("aria-checked", String(next));
    });
    row.append(copy, toggle);
    card.append(row);
  }
  panel.replaceChildren(card);
}

let settingsPanelAnimation = null;
function selectSettingsTab(tab) {
  const changed = tab.getAttribute("aria-selected") !== "true";
  settingsPanelAnimation?.cancel();
  document.querySelector(".settings-tabs").style.setProperty("--settings-tab-index", String(settingsTabs.indexOf(tab)));
  settingsTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute("aria-controls")).hidden = !selected;
  });
  if (changed && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    settingsPanelAnimation = panel.animate([
      { opacity: 0, transform: "translateY(6px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 220, easing: "ease-out" });
  }
  settingsMessage("");
}

settingsTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectSettingsTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % settingsTabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + settingsTabs.length) % settingsTabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = settingsTabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectSettingsTab(settingsTabs[next]);
    settingsTabs[next].focus();
  });
});

document.querySelector("#settings-upload").addEventListener("click", () => document.querySelector("#settings-picture-input").click());
document.querySelector("#settings-picture-input").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/gif"].includes(file.type) || file.size > 10 * 1024 * 1024) {
    settingsMessage("Choose a JPEG, PNG, or GIF no larger than 10MB.");
    return;
  }
  try {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const picture = new Image();
    picture.src = data;
    await picture.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 192;
    const size = Math.min(picture.naturalWidth, picture.naturalHeight);
    canvas.getContext("2d").drawImage(picture, (picture.naturalWidth - size) / 2, (picture.naturalHeight - size) / 2, size, size, 0, 0, 192, 192);
    if (saveAccountSettings({ ...accountSettings, picture: canvas.toDataURL("image/png") }, "Profile picture updated for this browser session.")) renderSettingsAvatar();
  } catch { settingsMessage("This image couldn’t be opened. Try another JPEG, PNG, or GIF."); }
});

document.querySelectorAll("[data-settings-security]").forEach((button) => button.addEventListener("click", () => {
  const password = button.dataset.settingsSecurity === "password";
  openSettingsNotice(password ? "Password" : "Two-Factor Authentication", password ? "Password changes will be available when account sign-in is connected. No password is stored by this prototype." : "Two-factor authentication will be available when account sign-in is connected. It is not enabled for this prototype.");
}));
document.querySelector("#settings-devices").addEventListener("click", () => openSettingsNotice("Logged-in Devices", "This browser · Current session. This prototype stores your workspace in this browser session; account device management is not connected."));
document.querySelector(".account-nav .avatar").addEventListener("click", () => {
  selectWorkspaceSection("Settings");
  selectSettingsTab(settingsTabs[0]);
});

function renderSettingsPage(visible) {
  settingsPage.hidden = !visible;
  if (!visible) return;
  renderSettingsInfo();
  renderSettingsProjects();
  renderSettingsNotifications();
  renderSettingsAvatar();
}

renderSettingsAvatar();

document.querySelector("#settings-logout").addEventListener("click", () => {
  // There is no sign-in service yet; leave the workspace and retain saved work.
  saveProject(activeProject);
  window.location.assign("index.html");
});
