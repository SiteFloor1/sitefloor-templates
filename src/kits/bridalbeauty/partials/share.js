// @ts-check
/**
 * Send a message to her own people (the bridal party, the family group): the phone's share sheet where there is one,
 * so she picks WhatsApp, Messages or anything else; otherwise WhatsApp in a new tab with the text and no number. The
 * button's text is in `data-share-text`; the button stays hidden until this runs, so it never shows without JavaScript.
 * @param {HTMLButtonElement} btn
 */
export function shareButton(btn) {
  btn.hidden = false;
  btn.addEventListener("click", () => {
    const text = btn.dataset.shareText ?? "";
    if (!text) return;
    if (typeof navigator.share === "function") navigator.share({ text }).catch(() => { /* she closed the sheet */ });
    else globalThis.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  });
}
