// Project data survives navigation for this browser tab's session.
const projectStorageKey = "aggro.projects";
let projectResetInProgress = false;

function createDefaultHollowSignalProject() {
  return {
    id: "hollow-signal", name: "Hollow Signal", isDefaultGame: true,
    setupFinished: true, goalSetupComplete: true, platformSetupComplete: true,
    sampleCoverSelected: true, launchDate: "2026-10-14",
    connections: [
      { provider: "steamworks", status: "preview", name: "MC Game Studio", settings: { game: "HOLLOW SIGNAL" } },
      { provider: "discord", status: "preview", name: "HOLLOW SIGNAL OFFICIAL (GL)", settings: { viewedChannel: "#general", notificationChannel: "#marketing-updates" } },
      { provider: "youtube", status: "preview", name: "HOLLOW SIGNAL", settings: { allVideos: true } },
      { provider: "tiktok", status: "preview", name: "Import Video Performance", settings: { allVideos: true } },
    ],
  };
}

function loadProjects() {
  const projects = JSON.parse(sessionStorage.getItem(projectStorageKey) || "[]");
  return projects.map((project) => ({
    ...project,
    seededDemoPanels: new Set(project.seededDemoPanels || []),
    milestoneFilters: new Set(project.milestoneFilters || []),
    touchpointFilters: new Set(project.touchpointFilters || []),
  }));
}

function saveProjects(projects) {
  sessionStorage.setItem(projectStorageKey, JSON.stringify(projects, (key, value) =>
    value instanceof Set ? Array.from(value) : value));
}

function saveProject(project) {
  if (projectResetInProgress) return;
  project.setupFinished ??= false;
  const projects = loadProjects();
  const index = projects.findIndex((item) => item.id === project.id);
  if (index === -1) projects.push(project);
  else projects[index] = project;
  saveProjects(projects);
}

function resetToBlankHome() {
  projectResetInProgress = true;
  sessionStorage.removeItem(projectStorageKey);
  window.location.replace("workspace.html?project=blank&section=Home");
}

function openProject(project, section = "Home") {
  project.openedAt = new Date().toISOString();
  saveProject(project);
  const query = new URLSearchParams({ project: project.id, section });
  window.location.assign(`workspace.html?${query}`);
}
