// Fill a matching sample on the first character, then leave the value freely editable.
function enableSuggestedCompletion(input, suggestions) {
  let ready = !input.value;
  input.autocomplete = "off";
  input.setAttribute("aria-autocomplete", "inline");
  const describedBy = input.getAttribute("aria-describedby");
  input.setAttribute("aria-describedby", [describedBy, "text-completion-hint"].filter(Boolean).join(" "));

  input.addEventListener("beforeinput", () => {
    if (!input.value) ready = true;
  });

  input.addEventListener("input", (event) => {
    if (!input.value) {
      ready = true;
      return;
    }
    if (!event.inputType) {
      ready = false;
      return;
    }
    if (!ready || event.isComposing || !event.inputType?.startsWith("insert")) return;
    ready = false;
    const choices = typeof suggestions === "function" ? suggestions() : suggestions;
    const prefix = input.value.toLowerCase();
    const match = choices.find((suggestion) => suggestion.toLowerCase().startsWith(prefix)
      && (input.maxLength < 0 || suggestion.length <= input.maxLength));
    if (!match) return;
    input.value = match;
    input.setSelectionRange(match.length, match.length);
  });
}
