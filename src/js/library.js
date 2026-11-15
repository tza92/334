const gamesLibrary = document.querySelector("#games-library");
const gameGrid = document.querySelector("#game-grid");
const ownershipFilter = document.querySelector("#ownership");
const ownershipTrigger = document.querySelector("#ownership-trigger");

// Capture the card pattern before interactions change its content.
const gameCardTemplate = gameGrid.querySelector(".game-card").cloneNode(true);
const sampleGameCard = gameGrid.querySelector(".game-card");
sampleGameCard.project = loadProjects().find((project) => project.id === "hollow-signal") || createDefaultHollowSignalProject();
const launchDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});


function createGameCard(project) {
  const { id, name, launchDate, coverImage, sampleCoverSelected = false } = project;
  const card = gameCardTemplate.cloneNode(true);
  card.querySelector(".game-card-art").classList.toggle("has-no-cover", !coverImage && !sampleCoverSelected);
  if (id) card.dataset.gameId = id;
  card.querySelector("h3").textContent = name;
  card.setAttribute("aria-label", `Open ${name} dashboard`);
  card.querySelector(".game-card-open").setAttribute("aria-label", `Open ${name} dashboard`);
  card.querySelector(".game-card-opened").textContent = project.openedAt ? "Opened today" : "Not opened yet";

  if (launchDate) {
    const time = card.querySelector("time");
    time.dateTime = launchDate;
    time.textContent = launchDateFormatter.format(new Date(`${launchDate}T12:00:00`));
  } else {
    card.querySelector(".game-card-launch").textContent = "Launch · Not set";
  }
  card.querySelector("nav").setAttribute("aria-label", `${name} workspace`);
  if (coverImage) {
    const image = document.createElement("img");
    image.src = coverImage;
    image.alt = `${name} cover`;
    const artwork = card.querySelector(".game-card-art");
    artwork.prepend(image);
    artwork.classList.add("has-cover");
  }
  card.project = project;
  return card;
}

function renderStoredProjects() {
  const projects = loadProjects();
  sampleGameCard.project = projects.find((project) => project.id === "hollow-signal") || sampleGameCard.project;
  gameGrid.querySelectorAll("[data-game-id]").forEach((card) => card.remove());
  projects.filter((project) => !project.temporary && project.id !== "hollow-signal").forEach((project) => {
    gameGrid.insertBefore(createGameCard(project), gameGrid.querySelector(".add-card"));
  });
}

renderStoredProjects();
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    document.querySelector("#new-game-dialog").close();
    closePopovers();
    renderStoredProjects();
    filterGames();
  }
});

function openGameWorkspace(card, section) {
  openProject(card.project, section);
}

function filterGames() {
  const owner = ownershipFilter.querySelector('[aria-checked="true"]').dataset.ownerFilter;
  gameGrid.querySelectorAll(".game-card").forEach((card) => {
    card.hidden = owner !== "all" && card.dataset.owner !== owner;
  });
}

connectDropdown(ownershipTrigger, ownershipFilter, filterGames);

const gameContextMenu = document.querySelector("#game-context-menu");
let contextGame = null;

function showGameContextMenu(card, x, y) {
  contextGame = card;
  gameContextMenu.showPopover();
  gameContextMenu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - gameContextMenu.offsetWidth - 8))}px`;
  gameContextMenu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - gameContextMenu.offsetHeight - 8))}px`;
  document.querySelector("#delete-game").focus();
}

gameGrid.addEventListener("contextmenu", (event) => {
  const card = event.target.closest(".game-card");
  if (!card) return;
  event.preventDefault();
  showGameContextMenu(card, event.clientX, event.clientY);
});

gameGrid.addEventListener("keydown", (event) => {
  if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
  const card = event.target.closest(".game-card");
  if (!card) return;
  event.preventDefault();
  const bounds = card.getBoundingClientRect();
  showGameContextMenu(card, bounds.left + 16, bounds.top + 16);
});

gameContextMenu.addEventListener("keydown", (event) => {
  if (event.key === "Tab") gameContextMenu.hidePopover();
});

document.querySelector("#delete-game").addEventListener("click", () => {
  if (!contextGame) return;
  const name = contextGame.querySelector("h3").textContent;
  if (contextGame.project) {
    saveProjects(loadProjects().filter((project) => project.id !== contextGame.project.id));
  }
  contextGame.remove();
  contextGame = null;
  gameContextMenu.hidePopover();
  document.querySelector("#game-status").textContent = `${name} deleted.`;
  gameGrid.querySelector(".game-card, .add-card-action").focus();
});

document.addEventListener("game:create", (event) => {
  saveProject(event.detail);
  const card = createGameCard(event.detail);
  gameGrid.insertBefore(card, gameGrid.querySelector(".add-card"));
  filterGames();
  document.querySelector("#game-status").textContent = `${event.detail.name} added.`;
});

function findGameCard(id) {
  return Array.from(gameGrid.querySelectorAll(".game-card")).find((card) => card.dataset.gameId === id);
}

document.addEventListener("game:people", (event) => {
  const card = findGameCard(event.detail.id);
  if (card) {
    card.project.people = event.detail.people.map((person) => ({ ...person }));
    saveProject(card.project);
  }
});

document.addEventListener("game:open", (event) => {
  const card = findGameCard(event.detail.id);
  if (card) card.querySelector(".game-card-open").click();
});

gameGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".game-card");
  if (!card) return;
  const button = event.target.closest("[data-workspace]");
  if (!button && event.target.closest("button, a, input, select, textarea")) return;
  const sections = { Dashboard: "Home", Planning: "Plan", Analytics: "Analytics", Connections: "Connect" };
  openGameWorkspace(card, sections[button?.dataset.workspace] || "Home");
});

gameGrid.addEventListener("keydown", (event) => {
  if (!event.target.matches(".game-card") || !["Enter", " "].includes(event.key)) return;
  event.preventDefault();
  openGameWorkspace(event.target, "Home");
});

let workspaceShortcutPresses = [];
document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (gamesLibrary.hidden || document.querySelector("dialog[open]") ||
      event.target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])") ||
      event.ctrlKey || event.altKey || event.metaKey || event.key.toLowerCase() !== "s") {
    workspaceShortcutPresses = [];
    return;
  }

  const now = performance.now();
  workspaceShortcutPresses = workspaceShortcutPresses.filter((time) => now - time < 900);
  workspaceShortcutPresses.push(now);
  if (workspaceShortcutPresses.length < 3) return;
  workspaceShortcutPresses = [];
  openProject({ id: "blank", name: "Untitled game", temporary: true });
});
