
const mobileContactsQuery = window.matchMedia("(max-width: 600px)");
const QR_HINT_KEY = "kakaoQrSwipeHintShown";

document.querySelectorAll(".contact_card--flip").forEach((card) => {
  const qrFace = card.querySelector(".contact_face-back");
  const qrImage = card.querySelector(".contact_qr-image");

  card.addEventListener("click", (event) => {
    // На мобильном тап по самому QR открывает полноэкранный просмотр.
    if (
      mobileContactsQuery.matches &&
      event.target instanceof Element &&
      event.target.closest(".contact_face-back")
    ) {
      event.preventDefault();
      event.stopPropagation();

      if (card.classList.contains("is-flipped")) {
        openQrFullscreen(qrImage);
      }

      return;
    }

    const isOpen = card.classList.toggle("is-flipped");

    card.setAttribute("aria-pressed", String(isOpen));

    if (qrFace) {
      qrFace.setAttribute("aria-hidden", String(!isOpen));
    }
  });
});

function openQrFullscreen(image) {
  if (!image) return;

  let overlay = document.querySelector(".contact_qr_overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "contact_qr_overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "KakaoTalk QR code");

    overlay.innerHTML = `
  <div
    class="contact_qr_swipe_hint"
    role="status"
    aria-live="polite"
    data-i18n="contacts.qrSwipeHint"
  ></div>
  <img
    class="contact_qr_fullscreen_image"
    alt="KakaoTalk QR code"
  >
`;

    let touchStartX = 0;
    let touchStartY = 0;

    overlay.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1) return;

      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    overlay.addEventListener("touchend", (event) => {
      if (event.changedTouches.length !== 1) return;

      const deltaX = event.changedTouches[0].clientX - touchStartX;
      const deltaY = event.changedTouches[0].clientY - touchStartY;

      overlay.addEventListener("touchend", (event) => {
        if (event.changedTouches.length !== 1) return;

        const deltaX = event.changedTouches[0].clientX - touchStartX;
        const deltaY = event.changedTouches[0].clientY - touchStartY;

        const isVerticalSwipe =
          Math.abs(deltaY) > 80 &&
          Math.abs(deltaY) > Math.abs(deltaX) * 1.3;

        if (isVerticalSwipe) {
          closeQrFullscreen();
        }
      }, { passive: true });
    }, { passive: true });

    document.body.append(overlay);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeQrFullscreen();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeQrFullscreen();
    });
  }

  const fullImage = overlay.querySelector(".contact_qr_fullscreen_image");
  fullImage.src = image.src;

  overlay.classList.add("is-open");
  const hint = overlay.querySelector(".contact_qr_swipe_hint");

  if (!localStorage.getItem(QR_HINT_KEY)) {
    hint.textContent =
      window.siteTranslations?.contacts?.qrSwipeHint ||
      "Swipe down to close the QR code";

    hint.classList.remove("is-hidden");
    hint.classList.add("is-visible");

    localStorage.setItem(QR_HINT_KEY, "true");

    setTimeout(() => {
      hint.classList.remove("is-visible");
      hint.classList.add("is-hidden");
    }, 3500);
  }
  document.body.classList.add("qr-fullscreen-open");
}

function closeQrFullscreen() {
  const overlay = document.querySelector(".contact_qr_overlay");
  if (!overlay) return;

  overlay.classList.remove("is-open");
  document.body.classList.remove("qr-fullscreen-open");
}
