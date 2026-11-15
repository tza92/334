function closePopovers() {
  document.querySelectorAll(":popover-open").forEach((popover) => popover.hidePopover());
}

// Five separate R presses within 1.2 seconds reset the prototype session.
let resetShortcutPresses = [];
document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey
      || event.key.toLowerCase() !== "r"
      || event.target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) {
    resetShortcutPresses = [];
    return;
  }
  const now = performance.now();
  resetShortcutPresses = resetShortcutPresses.filter((time) => now - time < 1200);
  resetShortcutPresses.push(now);
  if (resetShortcutPresses.length < 5) return;
  resetShortcutPresses = [];
  event.preventDefault();
  resetToBlankHome();
});

// Browsers may skip a cross-document fade during history restoration.
for (const eventName of ["pageswap", "pagereveal"]) {
  window.addEventListener(eventName, (event) => {
    const transition = event.viewTransition;
    if (transition) {
      Promise.allSettled([transition.ready, transition.finished, transition.updateCallbackDone]);
    }
  });
}

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
