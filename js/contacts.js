document.querySelectorAll(".contact_card--flip").forEach((card) => {
  const qrFace = card.querySelector(".contact_face-back");

  card.addEventListener("click", () => {
    const isOpen = card.classList.toggle("is-flipped");

    card.setAttribute("aria-pressed", String(isOpen));

    if (qrFace) {
      qrFace.setAttribute("aria-hidden", String(!isOpen));
    }
  });
});
