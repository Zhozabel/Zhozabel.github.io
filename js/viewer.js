// ========================================
// VIEWER — просмотр работ и подарков
// ========================================

// DOM
const viewer = document.querySelector(".viewer");
const viewerMedia = document.querySelector(".viewer_media");
const viewerAuthor = document.querySelector(".viewer_author");
const viewerTitle = document.querySelector(".viewer_title");
const viewerCharacters = document.querySelector(".viewer_characters");
const viewerFandom = document.querySelector(".viewer_fandom");
const viewerYear = document.querySelector(".viewer_year");
const viewerWarnings = document.querySelector(".viewer_warnings");

const closeButton = document.querySelector(".viewer_close");
const prevButton = document.querySelector(".viewer_prev");
const nextButton = document.querySelector(".viewer_next");

// Источники данных
const dataSources = {
  artworks: "../data/artworks.json",
  gifts: "../data/gifts.json"
};

const characterFiles = [
  "../data/canon-characters.json",
  "../data/other-characters.json",
  "../data/original-characters.json"
];

// Состояние просмотрщика
let currentSource = "artworks";
let currentItems = [];
let currentIndex = -1;
let currentItem = null;
let isLoading = false;
let isMobileFullscreen = false;
let lastSwipeAt = 0;
let hasShownSwipeHint =
  localStorage.getItem("viewerSwipeHintShown") === "true";
let touchStartYFullscreen = 0;

let characterNames = new Map();


// ========================================
// ЛОКАЛИЗАЦИЯ
// ========================================

function getLanguage() {
  return document.documentElement.lang || "en";
}

function getTranslation(key, fallback = key) {
  const translations = window.siteTranslations || {};

  const value = key.split(".").reduce(
    (result, part) => result?.[part],
    translations
  );

  return typeof value === "string" ? value : fallback;
}

function getLabel(key, en, ru) {
  const fallback = getLanguage() === "ru" ? ru : en;

  return getTranslation(`viewer.${key}`, fallback);
}

function getLocalizedValue(value, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const language = getLanguage();

    return value[language] || value.en || value.ru || fallback;
  }

  return fallback;
}


// ========================================
// ПУТИ К МЕДИАФАЙЛАМ
// ========================================

function getLocalizedPath(path) {
  return getLocalizedValue(path, "");
}

function getMediaUrl(path) {
  if (!path || typeof path !== "string") {
    return "";
  }

  // Абсолютные URL и пути от корня сайта.
  if (/^(https?:|data:|blob:|\/)/i.test(path)) {
    return path;
  }

  // JSON хранит пути относительно корня сайта.
  const relativePath = path.startsWith("../")
    ? path
    : `../${path}`;

  return new URL(relativePath, document.baseURI).href;
}


// ========================================
// ТЕКСТОВЫЕ ЭЛЕМЕНТЫ
// ========================================

function createTextElement(tag, className, text) {
  const element = document.createElement(tag);

  element.className = className;
  element.textContent = text;

  return element;
}


// ========================================
// ПЕРСОНАЖИ
// ========================================

async function loadCharacterNames() {
  characterNames = new Map();

  const results = await Promise.allSettled(
    characterFiles.map(async path => {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(
          `Не удалось загрузить ${path}: ${response.status}`
        );
      }

      const characters = await response.json();

      if (!Array.isArray(characters)) {
        throw new Error(`${path} должен содержать массив персонажей.`);
      }

      return characters;
    })
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Ошибка загрузки справочника ${characterFiles[index]}:`,
        result.reason
      );

      return;
    }

    result.value.forEach(character => {
      if (character?.id && character.name) {
        characterNames.set(character.id, character.name);
      }
    });
  });
}

function getCharacterName(character) {
  const id = typeof character === "string"
    ? character
    : character?.id;

  if (!id) {
    return "";
  }

  const name = characterNames.get(id);

  if (name) {
    return getLocalizedValue(name, id);
  }

  // Поддерживаем объекты персонажей, если они уже содержат имя.
  if (typeof character === "object" && character?.name) {
    return getLocalizedValue(character.name, id);
  }

  console.warn(`Персонаж "${id}" не найден в справочниках.`);

  return id;
}

function getCharactersText(characters) {
  if (!Array.isArray(characters)) {
    return "";
  }

  return characters
    .map(getCharacterName)
    .filter(Boolean)
    .join(", ");
}


// ========================================
// ФАНДОМЫ И ПРЕДУПРЕЖДЕНИЯ
// ========================================

function getFandomName(fandom) {
  return getLocalizedValue(fandom, "");
}

function getWarningLabel(warning) {
  const labels = {
    ambiguity: {
      en: "Ambiguity",
      ru: "Неоднозначность"
    },
    problematic: {
      en: "Problematic themes",
      ru: "Проблемные темы"
    },
    kissing: {
      en: "Passionate kiss",
      ru: "Страстный поцелуй"
    },
    blood: {
      en: "Blood",
      ru: "Кровь"
    },
    violence: {
      en: "Violence",
      ru: "Насилие"
    },
    gore: {
      en: "Gore",
      ru: "Жестокие сцены"
    },
    nudity: {
      en: "Nudity",
      ru: "Обнажённость"
    },
    risque: {
      en: "Risqué humor",
      ru: "Пикантный юмор"
    },
    sex: {
      en: "Sexual content",
      ru: "Сексуальный контент"
    },
    death: {
      en: "Death",
      ru: "Смерть"
    }
  };

  const language = getLanguage();
  const fallback = labels[warning]?.[language] || warning;

  return getTranslation(`art.warningLabels.${warning}`, fallback);
}

function getWarningsText(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) {
    return "";
  }

  const title = getLabel(
    "contentWarning",
    "Content warning",
    "Предупреждение о содержании"
  );

  return `${title}: ${warnings.map(getWarningLabel).join(", ")}`;
}


// ========================================
// ОТОБРАЖЕНИЕ МЕДИА
// ========================================

function renderMedia(item) {
  viewerMedia.replaceChildren();
  viewerMedia.classList.remove("is_blurred");

  const isVideo = item.type === "video" || Boolean(item.video);

  const mediaPath = getLocalizedPath(
    isVideo ? item.video : item.image
  );

  if (!mediaPath) {
    viewerMedia.textContent = getLabel(
      "mediaMissing",
      "Media file not specified.",
      "Файл изображения или видео не указан."
    );

    return;
  }

  const mediaUrl = getMediaUrl(mediaPath);

  const media = document.createElement(isVideo ? "video" : "img");

  media.className = "viewer_media_content";

  if (isVideo) {
    media.controls = true;
    media.preload = "metadata";
    media.playsInline = true;

    const posterPath = getLocalizedPath(item.poster);

    if (posterPath) {
      media.poster = getMediaUrl(posterPath);
    }
  } else {
    media.alt = getCharactersText(item.characters);
    media.decoding = "async";
  }

  media.addEventListener("error", () => {
    if (!media.isConnected) {
      return;
    }

    console.error("Не удалось загрузить медиа:", mediaUrl);

    viewerMedia.classList.remove("is_blurred");

    viewerMedia.replaceChildren(
      createTextElement(
        "p",
        "viewer_media_error",
        getLabel(
          "mediaError",
          "Failed to load media.",
          "Не удалось загрузить файл."
        )
      )
    );
  });

  media.src = mediaUrl;
  viewerMedia.appendChild(media);

  if (item.blur) {
    viewerMedia.classList.add("is_blurred");
    renderRevealButton(item);
  }

  // Счётчик работ для мобильного просмотрщика.
  const counter = document.createElement("span");
  counter.className = "viewer_counter";
  counter.setAttribute("aria-live", "polite");
  counter.setAttribute("aria-atomic", "true");

  viewerMedia.appendChild(counter);

}


// ========================================
// РАСКРЫТИЕ РАБОТЫ
// ========================================

function renderRevealButton(item) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "viewer_reveal";

  button.setAttribute(
    "aria-label",
    getLabel("reveal", "Reveal media", "Показать изображение")
  );

  const warningsText = getWarningsText(item.warnings);

  if (warningsText) {
    button.appendChild(
      createTextElement(
        "span",
        "viewer_reveal_warning",
        warningsText
      )
    );
  }

  button.appendChild(
    createTextElement(
      "span",
      "viewer_reveal_action",
      getTranslation(
        "art.reveal",
        getLabel(
          "revealAction",
          "Click to reveal",
          "Нажмите, чтобы открыть"
        )
      )
    )
  );

  button.addEventListener("click", () => {
    viewerMedia.classList.remove("is_blurred");
    button.remove();
  });

  viewerMedia.appendChild(button);
}


// ========================================
// ИНФОРМАЦИЯ О РАБОТЕ
// ========================================

function setDetail(element, value) {
  element.textContent = value || "";

  const row = element.closest(".viewer_detail");

  if (row) {
    row.hidden = !value;
  }
}

function renderInfo(item) {
  const author = getLocalizedValue(item.author, "");
  const title = getLocalizedValue(item.title, "");

  viewerAuthor.textContent = author;
  viewerAuthor.hidden = !author;

  viewerTitle.textContent = title;
  viewerTitle.hidden = !title;

  setDetail(
    viewerCharacters,
    getCharactersText(item.characters)
  );

  setDetail(
    viewerFandom,
    getFandomName(item.fandom)
  );

  setDetail(
    viewerYear,
    item.year != null ? String(item.year) : ""
  );

  // Локализуем подписи к полям.
  const labels = {
    viewer_characters: getLabel(
      "characters",
      "Characters",
      "Персонажи"
    ),
    viewer_fandom: getLabel(
      "fandom",
      "Fandom",
      "Фандом"
    ),
    viewer_year: getLabel(
      "year",
      "Year",
      "Год"
    )
  };

  viewer.querySelectorAll(".viewer_detail").forEach(row => {
    const label = row.querySelector("dt");
    const value = row.querySelector("dd");

    if (!label || !value) {
      return;
    }

    for (const [className, text] of Object.entries(labels)) {
      if (value.classList.contains(className)) {
        label.textContent = text;
        break;
      }
    }
  });

  closeButton.setAttribute(
    "aria-label",
    getLabel("close", "Close", "Закрыть")
  );

  prevButton.setAttribute(
    "aria-label",
    getLabel("previous", "Previous", "Предыдущая работа")
  );

  nextButton.setAttribute(
    "aria-label",
    getLabel("next", "Next", "Следующая работа")
  );
}


// ========================================
// НАВИГАЦИЯ
// ========================================

function updateNavigation() {
  prevButton.disabled = isLoading || currentIndex <= 0;

  nextButton.disabled =
    isLoading ||
    currentIndex < 0 ||
    currentIndex >= currentItems.length - 1;
}

function updateCounter() {
  const counter = viewerMedia.querySelector(".viewer_counter");

  if (!counter || currentIndex < 0 || !currentItems.length) {
    return;
  }

  counter.textContent = `${currentIndex + 1} / ${currentItems.length}`;
}

// ========================================
// MOBILE FULLSCREEN
// ========================================

function setMobileFullscreen(enabled) {
  if (!mobileViewerQuery.matches) return;

  isMobileFullscreen = enabled;

  const showHint = enabled && !hasShownSwipeHint;

  viewer.classList.toggle("is_mobile_fullscreen", enabled);
  viewer.classList.toggle("show_swipe_hint", showHint);

  if (showHint) {
    hasShownSwipeHint = true;
    localStorage.setItem("viewerSwipeHintShown", "true");
  }

  if (!enabled) {
    viewer.classList.remove("show_swipe_hint");
    updateCounter();
  }
}

function toggleMobileFullscreen() {
  if (
    !mobileViewerQuery.matches ||
    !currentItem ||
    currentItem.type === "video" ||
    currentItem.video ||
    viewerMedia.classList.contains("is_blurred")
  ) {
    return;
  }

  setMobileFullscreen(!isMobileFullscreen);
}

function updateUrl() {
  if (!currentItem) {
    return;
  }

  const url = new URL(window.location.href);

  url.searchParams.set("source", currentSource);
  url.searchParams.set("id", currentItem.id);

  history.replaceState({}, "", url);
}

function renderItem() {
  if (!currentItem) {
    return;
  }

  renderMedia(currentItem);
  renderInfo(currentItem);
  updateNavigation();
  updateCounter();
  updateUrl();
}

function showPrevious() {
  if (isLoading || currentIndex <= 0) {
    return;
  }

  currentIndex--;
  currentItem = currentItems[currentIndex];

  renderItem();
}

function showNext() {
  if (
    isLoading ||
    currentIndex < 0 ||
    currentIndex >= currentItems.length - 1
  ) {
    return;
  }

  currentIndex++;
  currentItem = currentItems[currentIndex];

  renderItem();
}


// ========================================
// ЗАГРУЗКА ДАННЫХ
// ========================================

async function loadData() {
  const params = new URLSearchParams(window.location.search);

  const requestedSource = params.get("source") || "artworks";
  const requestedId = params.get("id");
  const requestedCharacter = params.get("character");

  currentSource = Object.hasOwn(dataSources, requestedSource)
    ? requestedSource
    : "artworks";

  isLoading = true;
  updateNavigation();

  try {
    const [response] = await Promise.all([
      fetch(dataSources[currentSource]),
      loadCharacterNames()
    ]);

    if (!response.ok) {
      throw new Error(
        `Не удалось загрузить ${dataSources[currentSource]}: ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("JSON должен содержать массив объектов.");
    }

    currentItems = data.filter(item => {
      if (!item || item.id == null) {
        return false;
      }

      // Если просмотрщик открыт из галереи персонажа,
      // оставляем только работы этого персонажа.
      if (requestedCharacter) {
        return (
          Array.isArray(item.characters) &&
          item.characters.includes(requestedCharacter)
        );
      }

      // В остальных разделах сохраняем прежнее поведение.
      return true;
    });

    currentIndex = currentItems.findIndex(
      item => String(item.id) === String(requestedId)
    );


    if (currentIndex === -1) {
      throw new Error(
        `Работа с id "${requestedId}" не найдена в источнике "${currentSource}".`
      );
    }

    currentItem = currentItems[currentIndex];

    renderItem();
  } catch (error) {
    console.error("Ошибка загрузки viewer:", error);

    viewerMedia.classList.remove("is_blurred");

    viewerMedia.replaceChildren(
      createTextElement(
        "p",
        "viewer_error",
        getLabel(
          "loadError",
          "Unable to load this item. Check the data files and try again.",
          "Не удалось загрузить работу. Проверьте JSON и попробуйте ещё раз."
        )
      )
    );

    viewerAuthor.textContent = "";
    viewerTitle.textContent = "";
    viewerCharacters.textContent = "";
    viewerFandom.textContent = "";
    viewerYear.textContent = "";
    viewerWarnings.textContent = "";

    viewer.querySelectorAll(".viewer_detail").forEach(row => {
      row.hidden = true;
    });
  } finally {
    isLoading = false;
    updateNavigation();
  }
}


// ========================================
// ЗАКРЫТИЕ ПРОСМОТРЩИКА
// ========================================

function closeViewer() {
  if (history.length > 1) {
    history.back();
  } else {
    window.location.href = "art.html";
  }
}


// ========================================
// СОБЫТИЯ
// ========================================

// Тап по изображению переключает полноэкранный режим.
viewerMedia.addEventListener("click", event => {
  if (
    !mobileViewerQuery.matches ||
    !(event.target instanceof HTMLImageElement) ||
    viewerMedia.classList.contains("is_blurred")
  ) {
    return;
  }

  // Не открываем полноэкранный режим после свайпа.
  if (Date.now() - lastSwipeAt < 500) {
    return;
  }

  toggleMobileFullscreen();
});

closeButton.addEventListener("click", () => {
  if (isMobileFullscreen) {
    setMobileFullscreen(false);
    return;
  }
  closeViewer();
});
prevButton.addEventListener("click", showPrevious);
nextButton.addEventListener("click", showNext);

document.addEventListener("keydown", event => {
  // Не перехватываем клавиши при управлении видео.
  if (event.target instanceof HTMLVideoElement) {
    return;
  }

  if (event.key === "Escape") {
    if (isMobileFullscreen) {
      setMobileFullscreen(false);
    } else {
      closeViewer();
    }
  }

  if (event.key === "ArrowLeft") {
    showPrevious();
  }

  if (event.key === "ArrowRight") {
    showNext();
  }
});


/* ========================================
   MOBILE SWIPE NAVIGATION
======================================== */

const mobileViewerQuery = window.matchMedia("(max-width: 800px)");

let touchStartX = 0;
let touchStartY = 0;
let touchStarted = false;

const swipeThreshold = 50;

viewerMedia.addEventListener("touchstart", event => {
  if (
    !mobileViewerQuery.matches ||
    event.touches.length !== 1 ||
    viewerMedia.classList.contains("is_blurred") ||
    (
      event.target instanceof Element &&
      event.target.closest("button, video")
    )
  ) {
    touchStarted = false;
    return;
  }

  const touch = event.touches[0];

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartYFullscreen = touch.clientY;
  touchStarted = true;
}, { passive: true });

viewerMedia.addEventListener("touchend", event => {
  if (
    !touchStarted ||
    !mobileViewerQuery.matches ||
    event.changedTouches.length !== 1
  ) {
    touchStarted = false;
    return;
  }

  touchStarted = false;

  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

// В полноэкранном режиме свайп вверх закрывает изображение.
  if (
    isMobileFullscreen &&
    Math.abs(deltaY) > 80 &&
    Math.abs(deltaY) > Math.abs(deltaX) * 1.3
  ) {
    setMobileFullscreen(false);
    return;
  }

  // Не переключаем работу при вертикальном движении.
  if (
    Math.abs(deltaX) < swipeThreshold ||
    Math.abs(deltaX) <= Math.abs(deltaY) * 1.3
  ) {
    return;
  }

  lastSwipeAt = Date.now();

  if (deltaX < 0) {
    showNext();
  } else {
    showPrevious();
  }
}, { passive: true });

viewerMedia.addEventListener("touchcancel", () => {
  touchStarted = false;
}, { passive: true });

// Перерисовываем работу при смене языка.
document.addEventListener("languageChanged", () => {
  if (currentItem) {
    renderItem();
  }
});


// ========================================
// ЗАПУСК
// ========================================

loadData();
