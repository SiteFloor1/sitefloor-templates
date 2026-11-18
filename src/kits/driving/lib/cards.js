// @ts-check
/**
 * The first screen's answer cards on a phone: each card is one row showing its answer; tapping the row opens the card
 * in place. On wider screens the row is hidden and every card is open (CSS). On a phone the rows are closed from the
 * first paint (no layout shift once the script starts); every answer is also on its own page.
 * @param {HTMLElement} root
 */
export function openable(root) {
  const head = root.querySelector("[data-dv-open]");
  if (!head) return;
  head.addEventListener("click", () => {
    const open = !root.classList.contains("open");
    root.classList.toggle("open", open);
    head.setAttribute("aria-expanded", String(open));
  });
}
