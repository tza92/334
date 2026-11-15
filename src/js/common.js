function closePopovers() {
  document.querySelectorAll(":popover-open").forEach((popover) => popover.hidePopover());
}

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
