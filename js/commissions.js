
const GOOGLE_FORM_URL = "https://forms.gle/GuWmGryJTrmNF64W9";

const commissionCards = document.querySelectorAll(".commission_card");
const modal = document.getElementById("commission-modal");
const modalDialog = modal.querySelector(".commission_modal-dialog");
const modalFormat = document.getElementById("commission-modal-format");
const modalPrice = document.getElementById("commission-modal-price");
const modalConfirm = document.getElementById("commission-modal-confirm");
const tosCheckbox = document.getElementById("commission-tos-checkbox");

let usdToRub = null;
let selectedCard = null;
let previousFocus = null;

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const rubFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

function getTranslations() {
  return window.siteTranslations || {};
}

function translate(key) {
  return (
    key.split(".").reduce(
      (value, part) => value?.[part],
      getTranslations()
    ) || key
  );
}

// Цены в USD — эталон. Рубли рассчитываются только для русской версии.
function getPrice(card) {
  const usd = Number(card.dataset.priceUsd);

  if (document.documentElement.lang !== "ru" || usdToRub === null) {
    return usdFormatter.format(usd);
  }

  const exactRub = usd * usdToRub;

  let step;

  if (exactRub >= 1000) {
    step = 500;
  } else if (exactRub >= 100) {
    step = 50;
  } else {
    step = 1;
  }

  const roundedRub = Math.floor(exactRub / step) * step;

  return rubFormatter.format(roundedRub);
}

function updatePrices() {
  commissionCards.forEach((card) => {
    const priceElement = card.querySelector("[data-commission-price]");

    if (priceElement) {
      priceElement.textContent = getPrice(card);
    }
  });

  if (!modal.hidden && selectedCard) {
    updateModalContent(selectedCard);
  }
}

async function loadExchangeRate() {
  try {
    const response = await fetch(
      "https://open.er-api.com/v6/latest/USD"
    );

    if (!response.ok) {
      throw new Error("Could not load exchange rate");
    }

    const data = await response.json();
    const rate = Number(data?.rates?.RUB);

    if (
      data.result !== "success" ||
      !Number.isFinite(rate) ||
      rate <= 0
    ) {
      throw new Error("USD/RUB rate is unavailable");
    }

    usdToRub = rate;
    updatePrices();
  } catch (error) {
    console.error("Currency conversion error:", error);
    // Если курс недоступен, цены остаются в USD.
  }
}

function updateModalContent(card) {
  const key = `commissions.formats.${card.dataset.format}.title`;

  modalFormat.textContent = translate(key);
  modalPrice.textContent = getPrice(card);
}

// Кнопка активна только при согласии с условиями
// и наличии настоящей ссылки на Google Forms.
function updateConfirmButton() {
  const hasFormUrl =
    GOOGLE_FORM_URL !== "PASTE_YOUR_GOOGLE_FORM_URL_HERE";

  const canProceed = tosCheckbox.checked && hasFormUrl;

  if (canProceed) {
    modalConfirm.href = GOOGLE_FORM_URL;
    modalConfirm.removeAttribute("aria-disabled");
    modalConfirm.removeAttribute("tabindex");
  } else {
    modalConfirm.removeAttribute("href");
    modalConfirm.setAttribute("aria-disabled", "true");
    modalConfirm.setAttribute("tabindex", "-1");
  }
}

function openModal(card) {
  selectedCard = card;
  previousFocus = document.activeElement;

  // Каждый новый заказ требует отдельного подтверждения.
  tosCheckbox.checked = false;

  updateModalContent(card);
  updateConfirmButton();

  modal.hidden = false;
  document.body.style.overflow = "hidden";
  modalDialog.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";

  tosCheckbox.checked = false;
  updateConfirmButton();

  selectedCard = null;
  previousFocus?.focus();
}

// Открытие карточек мышью и клавиатурой
commissionCards.forEach((card) => {
  card.addEventListener("click", () => openModal(card));

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(card);
    }
  });
});

// Закрытие модалки
modal.querySelectorAll("[data-modal-close]").forEach((element) => {
  element.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (modal.hidden) return;

  if (event.key === "Escape") {
    closeModal();
  }
});

// Пересчёт цены при смене языка
document.addEventListener("languageChanged", updatePrices);

// Обновление доступности кнопки при изменении чекбокса
tosCheckbox.addEventListener("change", updateConfirmButton);

// Дополнительная защита от перехода без согласия
modalConfirm.addEventListener("click", (event) => {
  if (
    !tosCheckbox.checked ||
    GOOGLE_FORM_URL === "PASTE_YOUR_GOOGLE_FORM_URL_HERE"
  ) {
    event.preventDefault();
  }
});

// Начальное состояние и загрузка курса
updateConfirmButton();
loadExchangeRate();
