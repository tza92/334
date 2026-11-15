const workspaceSidebar = document.querySelector("#workspace-sidebar");
const gameWorkspace = document.querySelector("#game-workspace");
const workspaceHeaderTitle = document.querySelector("#workspace-header-title");
const workspacePageTitle = document.querySelector("#workspace-page-title");
const workspaceQuery = new URLSearchParams(window.location.search);
const activeProject = loadProjects().find((project) => project.id === workspaceQuery.get("project"))
  || { id: "blank", name: "Untitled game", temporary: true };

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
      workspacePageTitle.focus();
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
  const gameName = activeProject.name;
  workspaceSidebar.querySelectorAll("[data-section]").forEach((button) => {
    if (button.dataset.section === section) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  workspaceHeaderTitle.textContent = section;
  renderDashboard(activeProject, section);
  saveProject(activeProject);
  document.title = `${section} · ${gameName} · Aggro.`;
  workspaceQuery.set("project", activeProject.id);
  workspaceQuery.set("section", section);
  history.replaceState(null, "", `workspace.html?${workspaceQuery}`);
  workspacePageTitle.focus();
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
  const section = workspaceQuery.get("section") || "Home";
  const validSection = Array.from(workspaceSidebar.querySelectorAll("[data-section]"))
    .some((button) => button.dataset.section === section);
  selectWorkspaceSection(validSection ? section : "Home");
});
