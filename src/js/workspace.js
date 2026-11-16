const workspaceSidebar = document.querySelector("#workspace-sidebar");
const gameWorkspace = document.querySelector("#game-workspace");
const workspaceHeaderTitle = document.querySelector("#workspace-header-title");
const workspacePageTitle = document.querySelector("#workspace-page-title");
const workspaceQuery = new URLSearchParams(window.location.search);
const activeProject = loadProjects().find((project) => project.id === workspaceQuery.get("project"))
  || (workspaceQuery.get("project") === "hollow-signal" ? createDefaultHollowSignalProject()
    : { id: "blank", name: "Untitled game", temporary: true, setupFinished: false });
const setupRestrictedSections = new Set(["Analytics", "Plan"]);

function syncWorkspaceSetupNavigation() {
  gameWorkspace.dataset.dashboardState = activeProject.setupFinished ? "finished" : "setup";
  syncWorkspaceNotifications();
  document.querySelectorAll("#workspace-sidebar [data-section], #game-workspace [data-dashboard-section]").forEach((button) => {
    const disabled = !activeProject.setupFinished && setupRestrictedSections.has(button.dataset.section || button.dataset.dashboardSection);
    button.disabled = disabled;
    button.setAttribute("aria-disabled", String(disabled));
  });
}

async function dissolveToWorkspace(dialog, reveal) {
  if (dialog.dataset.transitioning === "true") return;
  dialog.dataset.transitioning = "true";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let fade;
  try {
    gameWorkspace.dataset.revealing = "true";
    if (!reduceMotion) {
      dialog.inert = true;
      // Render the destination underneath the modal before fading it away.
      reveal();
      fade = dialog.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 800, easing: "ease-in-out", fill: "forwards",
      });
      await fade.finished.catch(() => {});
      dialog.close();
      workspacePageTitle.focus({ preventScroll: true });
    } else {
      dialog.close();
      reveal();
    }
    delete gameWorkspace.dataset.revealing;
    gameWorkspace.dispatchEvent(new Event("workspace:revealed"));
  } finally {
    fade?.cancel();
    dialog.inert = false;
    delete dialog.dataset.transitioning;
    delete gameWorkspace.dataset.revealing;
  }
}

document.querySelectorAll("#dashboard-dialog").forEach((dialog) => {
  dialog.addEventListener("cancel", (event) => {
    if (dialog.dataset.transitioning === "true") event.preventDefault();
  });
});

function selectWorkspaceSection(section) {
  syncWorkspaceSetupNavigation();
  if (!activeProject.setupFinished && setupRestrictedSections.has(section)) section = "Home";
  const sameSection = gameWorkspace.dataset.section === section;
  const gameName = activeProject.name;
  workspaceSidebar.querySelectorAll("[data-section]").forEach((button) => {
    if (button.dataset.section === section) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  renderDashboard(activeProject, section);
  syncWorkspaceSetupNavigation();
  const connect = section === "Connect";
  const plan = section === "Plan";
  const settings = section === "Settings";
  const analytics = section === "Analytics";
  const inProgress = false;
  gameWorkspace.classList.toggle("has-placeholder", inProgress);
  document.querySelector("#workspace-in-progress").hidden = !inProgress;
  document.querySelector("#workspace-in-progress-title").textContent = `${section} is currently in progress`;
  document.querySelector(".dashboard-grid").hidden = section !== "Home";
  document.querySelector("#connections-page").hidden = !connect;
  document.querySelector("#dashboard-game-name").hidden = connect || plan || settings || analytics;
  renderSettingsPage(settings);
  if (typeof renderAnalyticsPage === "function") renderAnalyticsPage(analytics);
  workspaceHeaderTitle.replaceChildren();
  if (section !== "Home") {
    const home = document.createElement("button");
    home.type = "button";
    home.className = "workspace-breadcrumb-home";
    home.textContent = "Home";
    home.addEventListener("click", () => selectWorkspaceSection("Home"));
    workspaceHeaderTitle.append(home, ` / ${section}`);
    workspacePageTitle.textContent = plan ? "Upcoming Milestone" : connect ? "Connected Apps" : section;
    if (connect) renderConnections();
  } else {
    workspaceHeaderTitle.textContent = section;
  }
  saveProject(activeProject);
  document.title = `${section} · ${gameName} · Aggro.`;
  workspaceQuery.set("project", activeProject.id);
  workspaceQuery.set("section", section);
  history.replaceState(null, "", `workspace.html?${workspaceQuery}`);
  const heading = section === "Home" && activeProject.setupFinished ? document.querySelector("#campaign-title") : workspacePageTitle;
  heading.focus({ preventScroll: sameSection });
}

workspaceSidebar.addEventListener("click", (event) => {
  const section = event.target.closest("[data-section]");
  if (section) selectWorkspaceSection(section.dataset.section);
  if (event.target.closest("[data-library]")) {
    saveProject(activeProject);
    window.location.assign("index.html");
  }
});

window.addEventListener("pagehide", () => saveProject(activeProject));
document.addEventListener("DOMContentLoaded", () => {
  initializeDefaultGameDashboard(activeProject);
  const section = workspaceQuery.get("section") || "Home";
  const validSection = Array.from(workspaceSidebar.querySelectorAll("[data-section]"))
    .some((button) => button.dataset.section === section);
  selectWorkspaceSection(validSection ? section : "Home");
});
