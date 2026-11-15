// One trigger/menu interaction shared by ownership and permission selectors.
let activeDropdownPosition = null;
let permissionDropdownId = 0;

function connectDropdown(trigger, menu, onSelect, { placement = "auto" } = {}) {
  const options = [...menu.querySelectorAll('[role="menuitemradio"], [role="menuitem"]')];
  function position() {
    if (!menu.matches(":popover-open")) return;
    const bounds = trigger.getBoundingClientRect();
    if (placement === "below") {
      const top = bounds.bottom + 8;
      menu.style.width = `${Math.min(bounds.width, innerWidth - 32)}px`;
      menu.style.left = `${Math.max(16, Math.min(bounds.left, innerWidth - menu.offsetWidth - 16))}px`;
      menu.style.top = `${top}px`;
      menu.style.maxHeight = `${Math.max(0, Math.min(360, innerHeight - top - 16))}px`;
      return;
    }
    menu.style.width = "max-content";
    const contentWidth = menu.offsetWidth;
    menu.style.width = `${Math.min(Math.max(bounds.width, contentWidth), innerWidth - 32)}px`;
    menu.style.left = `${Math.max(16, Math.min(bounds.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 16))}px`;
    menu.style.top = `${Math.max(16, Math.min(bounds.bottom + 8, innerHeight - menu.offsetHeight - 16))}px`;
  }
  menu.addEventListener("toggle", (event) => {
    const open = event.newState === "open";
    trigger.setAttribute("aria-expanded", String(open));
    if (open) {
      activeDropdownPosition = position;
      position();
      (menu.querySelector('[aria-checked="true"]') || options[0]).focus();
    } else if (activeDropdownPosition === position) activeDropdownPosition = null;
  });
  menu.addEventListener("click", (event) => {
    const option = event.target.closest('[role="menuitemradio"]');
    if (!option) return;
    options.forEach((item) => item.setAttribute("aria-checked", String(item === option)));
    trigger.querySelector("[data-dropdown-label]").textContent = option.querySelector("span").textContent;
    onSelect(option);
    menu.hidePopover();
    trigger.focus();
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      menu.showPopover();
    }
  });
  menu.addEventListener("keydown", (event) => {
    const index = options.indexOf(document.activeElement);
    let next;
    if (event.key === "ArrowDown") next = (index + 1) % options.length;
    if (event.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = options.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      options[next].focus();
    }
    if (event.key === "Tab") menu.hidePopover();
    if (event.key === "Escape") {
      event.preventDefault();
      menu.hidePopover();
      trigger.focus();
    }
  });
}

window.addEventListener("resize", () => activeDropdownPosition?.());
window.addEventListener("scroll", () => activeDropdownPosition?.(), true);

function connectFilterPopover(trigger, popup, { width, onOpen }) {
  let positionEvents;
  function position() {
    let bounds = trigger.getBoundingClientRect();
    const needed = Math.min(440, innerHeight - 100) - (innerHeight - bounds.bottom - 24);
    if (needed > 0 && bounds.top > 24) {
      window.scrollBy(0, Math.min(needed, bounds.top - 24));
      bounds = trigger.getBoundingClientRect();
    }
    const availableWidth = Math.min(width, innerWidth - 32);
    popup.style.width = `${availableWidth}px`;
    popup.style.left = `${Math.max(16, Math.min(bounds.right - availableWidth, innerWidth - availableWidth - 16))}px`;
    popup.style.top = `${bounds.bottom + 8}px`;
    popup.style.maxHeight = `${Math.max(0, innerHeight - bounds.bottom - 24)}px`;
  }
  popup.addEventListener("beforetoggle", (event) => {
    if (event.newState === "closed") positionEvents?.abort();
  });
  popup.addEventListener("toggle", (event) => {
    const open = event.newState === "open";
    trigger.setAttribute("aria-expanded", String(open));
    if (!open) return;
    position();
    positionEvents?.abort();
    positionEvents = new AbortController();
    window.addEventListener("resize", position, { signal: positionEvents.signal });
    window.addEventListener("scroll", position, { capture: true, signal: positionEvents.signal });
    onOpen();
  });
  popup.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    popup.hidePopover();
    trigger.focus();
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    popup.showPopover();
  });
}

function enhancePermissionDropdown(select, onRemove) {
  const root = document.createElement("div");
  root.className = "dropdown";
  root.hidden = select.hidden;
  const trigger = document.createElement("button");
  trigger.className = "filter-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", select.getAttribute("aria-label") || "Permission");
  const label = document.createElement("span");
  label.dataset.dropdownLabel = "";
  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chevron.classList.add("icon");
  chevron.setAttribute("viewBox", "0 0 24 24");
  chevron.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(chevron.namespaceURI, "path");
  path.setAttribute("d", "m6 9 6 6 6-6");
  chevron.append(path);
  trigger.append(label, chevron);
  const menu = document.createElement("div");
  menu.id = `permission-menu-${++permissionDropdownId}`;
  menu.className = "filter-menu";
  menu.setAttribute("popover", "auto");
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", trigger.getAttribute("aria-label"));
  trigger.setAttribute("popovertarget", menu.id);
  trigger.setAttribute("aria-controls", menu.id);
  [...select.options].forEach((item) => {
    const option = document.createElement("button");
    option.className = "filter-option";
    option.type = "button";
    option.tabIndex = -1;
    option.dataset.value = item.value;
    option.setAttribute("role", "menuitemradio");
    const text = document.createElement("span");
    text.textContent = item.textContent;
    const check = document.createElementNS(chevron.namespaceURI, "svg");
    check.classList.add("icon");
    check.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(chevron.namespaceURI, "use");
    use.setAttribute("href", "#check");
    check.append(use);
    option.append(text, check);
    menu.append(option);
  });
  if (onRemove) {
    const remove = document.createElement("button");
    remove.className = "filter-option permission-remove";
    remove.type = "button";
    remove.tabIndex = -1;
    remove.setAttribute("role", "menuitem");
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      menu.hidePopover();
      onRemove();
    });
    menu.append(remove);
  }
  select.replaceWith(root);
  root.append(select, trigger, menu);
  select.hidden = true;
  function refresh() {
    label.textContent = select.selectedOptions[0].textContent;
    menu.querySelectorAll("[data-value]").forEach((option) => {
      option.setAttribute("aria-checked", String(option.dataset.value === select.value));
    });
  }
  connectDropdown(trigger, menu, (option) => {
    select.value = option.dataset.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  select.addEventListener("change", refresh);
  refresh();
  return { element: root, trigger, refresh };
}
