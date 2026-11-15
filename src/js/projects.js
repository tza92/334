// Project data survives navigation for this browser tab's session.
const projectStorageKey = "aggro.projects";

function loadProjects() {
  const projects = JSON.parse(sessionStorage.getItem(projectStorageKey) || "[]");
  return projects.map((project) => ({
    ...project,
    seededDemoPanels: new Set(project.seededDemoPanels || []),
    milestoneFilters: new Set(project.milestoneFilters || []),
  }));
}

function saveProjects(projects) {
  sessionStorage.setItem(projectStorageKey, JSON.stringify(projects, (key, value) =>
    value instanceof Set ? Array.from(value) : value));
}

function saveProject(project) {
  const projects = loadProjects();
  const index = projects.findIndex((item) => item.id === project.id);
  if (index === -1) projects.push(project);
  else projects[index] = project;
  saveProjects(projects);
}

function openProject(project, section = "Home") {
  project.openedAt = new Date().toISOString();
  saveProject(project);
  const query = new URLSearchParams({ project: project.id, section });
  window.location.assign(`workspace.html?${query}`);
}
