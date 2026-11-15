// The dialog owns its draft; the library receives a completed game:create event.
(() => {
  const dialog = document.querySelector("#new-game-dialog");
  const gameForm = document.querySelector("#new-game-form");
  const nameInput = document.querySelector("#game-name");
  enableSuggestedCompletion(nameInput, ["Hollow Signal"]);
  const nextButton = document.querySelector("#game-next");
  const inviteForm = document.querySelector("#invite-form");
  const emailInput = document.querySelector("#invite-email");
  const permissionInput = document.querySelector("#invite-permission");
  const permissionDropdown = enhancePermissionDropdown(permissionInput);
  const inviteButton = document.querySelector("#invite-submit");
  const inviteError = document.querySelector("#invite-error");
  const suggestion = document.querySelector("#invite-suggestion");
  const suggestions = document.querySelector("#invite-suggestions");
  const inviteSearch = document.querySelector(".invite-search");
  const peopleList = document.querySelector("#people-list");
  const peopleCount = document.querySelector("#people-count");
  const coverInput = document.querySelector("#game-cover");
  const replaceCover = document.querySelector("#replace-cover");
  const coverPlaceholder = document.querySelector(".cover-upload-placeholder");
  const doneDescription = document.querySelector("#done-description");
  const doneInviteLabel = document.querySelector("#done-invite-label");
  const doneInviteArrow = document.querySelector("#done-invite-arrow");
  const doneShared = document.querySelector("#done-shared");
  const doneSharedCount = document.querySelector("#done-shared-count");
  const donePeopleButton = document.querySelector("#done-people");
  const peopleBackButton = document.querySelector(".people-back");
  const samplePerson = { name: "James Sullivan", email: "jsullivan23@gmail.com" };
  const steps = {
    setup: document.querySelector("#game-setup-step"),
    people: document.querySelector("#game-people-step"),
    done: document.querySelector("#game-done-step"),
  };
  const titles = { setup: "new-game-title", people: "people-step-title", done: "done-step-title" };
  let createdGameId = null;
  let sampleCoverSelected = false;
  let people = [];

  function showStep(next) {
    Object.entries(steps).forEach(([name, panel]) => {
      panel.hidden = name !== next;
    });
    gameForm.hidden = next !== "setup";
    dialog.classList.toggle("new-game-dialog--people", next === "people");
    dialog.classList.toggle("new-game-dialog--done", next === "done");
    dialog.setAttribute("aria-labelledby", titles[next]);
    peopleBackButton.setAttribute("aria-label", createdGameId ? "Back to All Done" : "Back to Add a game");
    if (dialog.open) {
      if (next === "people") document.querySelector("#people-step-title").focus();
      else if (next === "done") document.querySelector("#done-step-title").focus();
      else nameInput.focus();
    }
  }

  function renderDone() {
    const shared = people.length > 0;
    doneDescription.textContent = `${nameInput.value.trim()} has been added successfully`;
    doneInviteLabel.hidden = shared;
    doneInviteArrow.toggleAttribute("hidden", shared);
    doneShared.hidden = !shared;
    doneSharedCount.textContent = `${people.length} Shared`;
    donePeopleButton.setAttribute("aria-label", shared ? `Manage sharing with ${people.length} ${people.length === 1 ? "person" : "people"}` : "Invite People");
  }

  donePeopleButton.addEventListener("click", () => showStep("people"));
  document.querySelector("#done-open").addEventListener("click", () => {
    const id = createdGameId;
    document.dispatchEvent(new CustomEvent("game:open", { detail: { id } }));
  });

  function updateTitle() {
    nameInput.setCustomValidity("");
    nextButton.disabled = !nameInput.value.trim();
  }

  function renderCover() {
    coverInput.classList.toggle("has-default", sampleCoverSelected);
    coverInput.setAttribute("aria-label", sampleCoverSelected ? "Replace sample game cover" : "Use sample game cover");
    coverPlaceholder.hidden = sampleCoverSelected;
    replaceCover.hidden = !sampleCoverSelected;
  }

  function updateInvite() {
    emailInput.setCustomValidity("");
    inviteError.textContent = "";
    const email = emailInput.value.trim();
    const typing = email.length > 0;
    permissionDropdown.element.hidden = !typing;
    permissionDropdown.refresh();
    inviteButton.hidden = !typing;
    inviteButton.disabled = !emailInput.validity.valid;
    const query = email.toLowerCase();
    const matches = samplePerson.name.toLowerCase().includes(query) || samplePerson.email.includes(query);
    const available = !people.some((person) => person.email === samplePerson.email);
    setSuggestionsOpen(document.activeElement === emailInput && matches && available);
  }

  function setSuggestionsOpen(open) {
    suggestions.hidden = !open;
    emailInput.setAttribute("aria-expanded", String(open));
    emailInput.removeAttribute("aria-activedescendant");
    suggestion.setAttribute("aria-selected", "false");
  }

  function selectSuggestion() {
    emailInput.value = samplePerson.email;
    updateInvite();
    setSuggestionsOpen(false);
    inviteButton.focus();
  }

  function renderPeople() {
    peopleList.querySelectorAll("[data-invite-email]").forEach((row) => {
      row.querySelectorAll(":popover-open").forEach((menu) => menu.hidePopover());
      row.remove();
    });
    const template = document.querySelector("#person-row-template");
    people.forEach((person) => {
      const row = template.content.firstElementChild.cloneNode(true);
      row.dataset.inviteEmail = person.email;
      row.querySelector(".person-avatar").textContent = person.name
        ? person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")
        : person.email.slice(0, 2).toUpperCase();
      row.querySelector(".person-name").textContent = person.name || person.email.split("@")[0];
      row.querySelector(".person-email").textContent = person.email;
      const permission = row.querySelector(".person-permission");
      permission.value = person.permission;
      permission.setAttribute("aria-label", `Permission for ${person.email}`);
      peopleList.append(row);
      enhancePermissionDropdown(permission, () => {
        people = people.filter((item) => item.email !== person.email);
        renderPeople();
        document.querySelector("#people-status").textContent = `${person.email} removed from the preview invite list.`;
        setSuggestionsOpen(false);
        document.querySelector("#people-step-title").focus();
      });
    });
    peopleCount.querySelector(".people-count-value").textContent = String(people.length);
    peopleCount.setAttribute("aria-label", `${people.length} people invited`);
    document.querySelector("#people-arrow").toggleAttribute("hidden", people.length > 0);
    peopleCount.hidden = people.length === 0;
    syncGamePeople();
  }

  function syncGamePeople() {
    if (createdGameId) {
      renderDone();
      document.dispatchEvent(new CustomEvent("game:people", {
        detail: { id: createdGameId, people },
      }));
    }
  }

  function resetDraft() {
    createdGameId = null;
    sampleCoverSelected = false;
    people = [];
    gameForm.reset();
    inviteForm.reset();
    nameInput.setCustomValidity("");
    document.querySelector("#people-status").textContent = "";
    updateTitle();
    renderCover();
    updateInvite();
    renderPeople();
    showStep("setup");
  }

  function openNewGame() {
    if (dialog.open) return;
    resetDraft();
    dialog.showModal();
    nameInput.focus();
  }

  document.querySelectorAll("[data-new-game]").forEach((button) => {
    button.addEventListener("click", openNewGame);
  });
  document.querySelector(".add-card").addEventListener("click", openNewGame);
  nameInput.addEventListener("input", updateTitle);
  emailInput.addEventListener("input", updateInvite);
  emailInput.addEventListener("focus", updateInvite);
  emailInput.addEventListener("click", updateInvite);
  suggestion.addEventListener("click", selectSuggestion);
  suggestion.addEventListener("pointerdown", (event) => event.preventDefault());
  emailInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      updateInvite();
      if (!suggestions.hidden) {
        emailInput.setAttribute("aria-activedescendant", suggestion.id);
        suggestion.setAttribute("aria-selected", "true");
      }
    } else if (event.key === "Enter" && emailInput.hasAttribute("aria-activedescendant")) {
      event.preventDefault();
      selectSuggestion();
    } else if (event.key === "Escape" && !suggestions.hidden) {
      event.preventDefault();
      event.stopPropagation();
      setSuggestionsOpen(false);
    } else if (event.key === "Tab") {
      setSuggestionsOpen(false);
    }
  });
  inviteSearch.addEventListener("focusout", (event) => {
    if (event.relatedTarget !== emailInput) setSuggestionsOpen(false);
  });
  dialog.addEventListener("pointerdown", (event) => {
    if (event.target !== emailInput && !suggestions.contains(event.target)) setSuggestionsOpen(false);
  });
  document.querySelector("#open-people").addEventListener("click", () => showStep("people"));
  dialog.querySelectorAll("[data-setup]").forEach((button) => {
    button.addEventListener("click", () => {
      inviteForm.reset();
      updateInvite();
      setSuggestionsOpen(false);
      showStep(createdGameId ? "done" : "setup");
    });
  });

  gameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.setCustomValidity("Enter a game title.");
      nameInput.reportValidity();
      return;
    }
    if (createdGameId) return;
    createdGameId = crypto.randomUUID();
    document.dispatchEvent(new CustomEvent("game:create", {
      detail: { id: createdGameId, name, people, sampleCoverSelected },
    }));
    renderDone();
    showStep("done");
  });

  function selectSampleCover() {
    sampleCoverSelected = true;
    renderCover();
  }

  coverInput.addEventListener("click", selectSampleCover);
  replaceCover.addEventListener("click", () => {
    sampleCoverSelected = false;
    renderCover();
    coverInput.focus();
  });

  inviteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    if (people.some((person) => person.email === email)) {
      inviteError.textContent = "This person is already on the list.";
      emailInput.focus();
      return;
    }
    if (email === "you@gmail.com") {
      inviteError.textContent = "This person is already the owner.";
      return;
    }
    people.push({
      email,
      name: email === samplePerson.email ? samplePerson.name : "",
      permission: permissionInput.value,
    });
    renderPeople();
    inviteForm.reset();
    updateInvite();
    document.querySelector("#people-status").textContent = `${email} added to the preview invite list.`;
    setSuggestionsOpen(false);
    peopleList.querySelector("[data-invite-email]:last-child .filter-trigger").focus();
  });

  peopleList.addEventListener("change", (event) => {
    if (!event.target.matches(".person-permission")) return;
    const email = event.target.closest("[data-invite-email]").dataset.inviteEmail;
    people.find((person) => person.email === email).permission = event.target.value;
    syncGamePeople();
  });
})();
