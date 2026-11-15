// Shared popup calendar; the original date input keeps form values and validation.
let datePickerId = 0;

function enhanceDatePicker(input, caption) {
  const id = `date-picker-${++datePickerId}`;
  const root = document.createElement("div");
  root.className = "date-picker";
  const trigger = document.createElement("button");
  trigger.id = `${id}-trigger`;
  trigger.className = "date-picker-trigger";
  trigger.type = "button";
  trigger.setAttribute("popovertarget", id);
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", id);
  const valueLabel = document.createElement("span");
  valueLabel.id = `${id}-value`;
  trigger.setAttribute("aria-labelledby", `${caption.id} ${valueLabel.id}`);
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("icon");
  icon.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(icon.namespaceURI, "use");
  use.setAttribute("href", "#calendar");
  icon.append(use);
  trigger.append(valueLabel, icon);

  const popup = document.createElement("div");
  popup.id = id;
  popup.className = "calendar-popover";
  popup.setAttribute("popover", "auto");
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-label", `Choose ${caption.textContent.replace(" *", "").toLowerCase()}`);
  const heading = document.createElement("div");
  heading.className = "calendar-heading";
  const monthLabel = document.createElement("h3");
  monthLabel.id = `${id}-month`;
  monthLabel.setAttribute("aria-live", "polite");
  const navigation = document.createElement("div");
  navigation.className = "calendar-navigation";
  const todayButton = document.createElement("button");
  todayButton.type = "button";
  todayButton.className = "calendar-today";
  todayButton.textContent = "Today";
  navigation.append(todayButton);
  [-1, 1].forEach((direction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-arrow";
    button.setAttribute("aria-label", direction < 0 ? "Previous month" : "Next month");
    const arrow = document.createElementNS(icon.namespaceURI, "svg");
    arrow.classList.add("icon");
    arrow.setAttribute("viewBox", "0 0 24 24");
    arrow.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(icon.namespaceURI, "path");
    path.setAttribute("d", direction < 0 ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6");
    arrow.append(path);
    button.append(arrow);
    button.addEventListener("click", () => {
      visibleMonth.setMonth(visibleMonth.getMonth() + direction);
      focusDate = dateKey(visibleMonth);
      render();
    });
    navigation.append(button);
  });
  heading.append(monthLabel, navigation);
  const weekdays = document.createElement("div");
  weekdays.className = "calendar-weekdays";
  weekdays.setAttribute("aria-hidden", "true");
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => {
    const label = document.createElement("span");
    label.textContent = day;
    weekdays.append(label);
  });
  const days = document.createElement("div");
  days.className = "calendar-days";
  days.setAttribute("role", "group");
  days.setAttribute("aria-labelledby", monthLabel.id);
  popup.append(heading, weekdays, days);
  input.replaceWith(root);
  root.append(input, trigger, popup);
  input.hidden = true;
  caption.htmlFor = trigger.id;

  let visibleMonth;
  let focusDate;
  let positionEvents;

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function renderValue() {
    valueLabel.textContent = input.value ? input.value.replaceAll("-", "/") : "Select a date";
    trigger.classList.toggle("has-value", Boolean(input.value));
  }

  function render() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = new Date(year, month, 1).getDay();
    const today = dateKey(new Date());
    monthLabel.textContent = visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    days.replaceChildren();
    for (let index = 0; index < 42; index++) {
      const date = new Date(year, month, index - offset + 1);
      const key = dateKey(date);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-day";
      button.classList.toggle("calendar-day--outside", date.getMonth() !== month);
      button.dataset.date = key;
      button.textContent = String(date.getDate());
      button.tabIndex = key === focusDate ? 0 : -1;
      button.setAttribute("aria-label", date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
      button.setAttribute("aria-pressed", String(key === input.value));
      if (key === today) button.setAttribute("aria-current", "date");
      days.append(button);
    }
  }

  function position() {
    const bounds = trigger.getBoundingClientRect();
    const width = Math.min(380, innerWidth - 32);
    popup.style.width = `${width}px`;
    popup.style.maxHeight = `${Math.max(0, bounds.top - 24)}px`;
    popup.style.left = `${Math.max(16, Math.min(bounds.left, innerWidth - width - 16))}px`;
    popup.style.top = `${Math.max(16, bounds.top - popup.offsetHeight - 8)}px`;
  }

  popup.addEventListener("beforetoggle", (event) => {
    if (event.newState === "closed") positionEvents?.abort();
  });
  popup.addEventListener("toggle", (event) => {
    const open = event.newState === "open";
    trigger.setAttribute("aria-expanded", String(open));
    if (!open) return;
    const date = input.value ? new Date(`${input.value}T12:00:00`) : new Date();
    visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    focusDate = dateKey(date);
    render();
    position();
    positionEvents?.abort();
    positionEvents = new AbortController();
    window.addEventListener("resize", position, { signal: positionEvents.signal });
    window.addEventListener("scroll", position, { capture: true, signal: positionEvents.signal });
    days.querySelector('[tabindex="0"]').focus({ preventScroll: true });
  });
  todayButton.addEventListener("click", () => {
    const today = new Date();
    visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    focusDate = dateKey(today);
    render();
    days.querySelector('[tabindex="0"]').focus({ preventScroll: true });
  });
  days.addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (!button) return;
    input.value = button.dataset.date;
    input.setCustomValidity("");
    renderValue();
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    popup.hidePopover();
    trigger.focus();
  });
  days.addEventListener("keydown", (event) => {
    const button = event.target.closest("[data-date]");
    if (!button) return;
    const date = new Date(`${button.dataset.date}T12:00:00`);
    const shifts = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -date.getDay(), End: 6 - date.getDay() };
    if (event.key in shifts) date.setDate(date.getDate() + shifts[event.key]);
    else if (event.key === "PageUp" || event.key === "PageDown") {
      const day = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + (event.key === "PageUp" ? -1 : 1));
      date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
    } else return;
    event.preventDefault();
    focusDate = dateKey(date);
    visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    render();
    days.querySelector('[tabindex="0"]').focus({ preventScroll: true });
  });
  popup.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      popup.hidePopover();
      trigger.focus();
    }
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      popup.showPopover();
    }
  });
  input.addEventListener("invalid", (event) => {
    event.preventDefault();
    trigger.focus();
  });
  input.addEventListener("change", renderValue);
  renderValue();
}
