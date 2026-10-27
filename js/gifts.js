
const giftsGallery = document.querySelector(".gifts_gallery");

let giftsData = [];
let characterNames = new Map();

const characterFiles = [
  "../data/canon-characters.json",
  "../data/other-characters.json",
  "../data/original-characters.json"
];


// ========================================
// ЛОКАЛИЗАЦИЯ
// ========================================

function getTranslation(key) {
  return key.split(".").reduce((value, part) => {
    return value?.[part];
  }, window.siteTranslations || {});
}

function getCurrentLanguage() {
  return document.documentElement.lang || "en";
}

function translate(key, fallback = key) {
  const value = getTranslation(key);

  return typeof value === "string" ? value : fallback;
}

function getLocalizedValue(value, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const language = getCurrentLanguage();

    return value[language] || value.en || value.ru || fallback;
  }

  return fallback;
}


// ========================================
// ПУТИ К ФАЙЛАМ
// ========================================

function getMediaUrl(path) {
  if (!path || typeof path !== "string") {
    return "";
  }

  if (/^(https?:|data:|blob:|\/)/i.test(path)) {
    return path;
  }

  const relativePath = path.startsWith("../")
    ? path
    : `../${path}`;

  return new URL(relativePath, document.baseURI).href;
}

function getGiftThumbnailPath(imagePath) {
  if (!imagePath || typeof imagePath !== "string") {
    return "";
  }

  // Внешние URL и другие нестандартные пути не преобразуем.
  if (/^(https?:|data:|blob:|\/)/i.test(imagePath)) {
    return imagePath;
  }

  return imagePath
    .replace(/^images\/gifts\//, "images/gifts-thumbnails/")
    .replace(/\.(jpe?g|png)$/i, ".webp");
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
// ПРЕДУПРЕЖДЕНИЯ
// ========================================

function renderWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) {
    return null;
  }

  const warning = document.createElement("div");
  warning.className = "art_warning";

  const title = translate(
    "art.contentWarning",
    getCurrentLanguage() === "ru"
      ? "Предупреждение о содержании"
      : "Content warning"
  );

  const labels = warnings.map(item => {
    return translate(
      `art.warningLabels.${item}`,
      item
    );
  });

  warning.textContent = `${title}: ${labels.join(", ")}`;

  return warning;
}


// ========================================
// МЕДИА
// ========================================


function createGiftMedia(gift) {
  const isVideo = gift.type === "video" || Boolean(gift.video);

  const mediaPath = isVideo ? gift.video : gift.image;
  const mediaUrl = getMediaUrl(mediaPath);

  if (!mediaUrl) {
    return createTextElement(
      "span",
      "gifts_media_error",
      translate(
        "gifts.mediaMissing",
        getCurrentLanguage() === "ru"
          ? "Файл не указан"
          : "Media file not specified"
      )
    );
  }

  const media = document.createElement(isVideo ? "video" : "img");

  media.className = isVideo
    ? "art_card_video"
    : "art_card_image";

  if (isVideo) {
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
    media.preload = "metadata";

    const poster = getMediaUrl(gift.poster);

    if (poster) {
      media.poster = poster;
    }
  } else {
    media.alt = getCharactersText(gift.characters);
    media.loading = "lazy";
    media.decoding = "async";
  }

  let triedOriginal = isVideo;

  media.addEventListener("error", () => {
    if (!media.isConnected) {
      return;
    }

    // Если WebP не загрузился, пробуем оригинал.
    if (!isVideo && !triedOriginal && mediaUrl) {
      triedOriginal = true;
      media.src = mediaUrl;
      return;
    }

    console.error("Не удалось загрузить медиа:", media.currentSrc || mediaUrl);

    const error = createTextElement(
      "span",
      "gifts_media_error",
      translate(
        "gifts.mediaError",
        getCurrentLanguage() === "ru"
          ? "Не удалось загрузить файл"
          : "Failed to load media"
      )
    );

    media.replaceWith(error);
  });

  if (isVideo) {
    media.src = mediaUrl;
  } else {
    const thumbnailPath = getGiftThumbnailPath(mediaPath);
    const thumbnailUrl = getMediaUrl(thumbnailPath);

    media.src = thumbnailUrl || mediaUrl;

    // Если миниатюра не сформирована, оригинал уже используется.
    if (!thumbnailUrl || thumbnailUrl === mediaUrl) {
      triedOriginal = true;
    }
  }

  return media;
}

// ========================================
// РАСКРЫТИЕ РАБОТЫ
// ========================================

function createRevealButton(gift, card) {
  const button = document.createElement("button");

  button.className = "art_reveal";
  button.type = "button";

  button.setAttribute(
    "aria-label",
    translate(
      "art.reveal",
      getCurrentLanguage() === "ru"
        ? "Нажмите, чтобы открыть"
        : "Click to reveal"
    )
  );

  const warning = renderWarnings(gift.warnings);

  if (warning) {
    button.appendChild(warning);
  }

  button.appendChild(
    createTextElement(
      "span",
      "art_reveal_action",
      translate(
        "art.reveal",
        getCurrentLanguage() === "ru"
          ? "Нажмите, чтобы открыть"
          : "Click to reveal"
      )
    )
  );

  button.addEventListener("click", () => {
    card.classList.remove("is_blurred");
    button.remove();
  });

  return button;
}


// ========================================
// КАРТОЧКА ПОДАРКА
// ========================================

function createGiftCard(gift) {
  const card = document.createElement("article");

  card.className = "art_card";
  card.dataset.id = gift.id;

  const link = document.createElement("a");

  link.className = "art_card_link";
  link.href =
    `viewer.html?source=gifts&id=${encodeURIComponent(gift.id)}`;

  link.setAttribute(
    "aria-label",
    getCharactersText(gift.characters) ||
    translate(
      "gifts.openGift",
      getCurrentLanguage() === "ru" ? "Открыть подарок" : "Open gift"
    )
  );

  link.appendChild(createGiftMedia(gift));
  card.appendChild(link);

  if (gift.blur) {
    card.classList.add("is_blurred");
    card.appendChild(createRevealButton(gift, card));
  }

  return card;
}


// ========================================
// ГАЛЕРЕЯ
// ========================================

function renderGifts() {
  if (!giftsGallery) {
    return;
  }

  giftsGallery.replaceChildren();

  giftsData.forEach(gift => {
    giftsGallery.appendChild(createGiftCard(gift));
  });

  setupVideoPreviews();
}


// ========================================
// ПРЕВЬЮ ВИДЕО
// ========================================

function setupVideoPreviews() {
  const videos = giftsGallery.querySelectorAll(".art_card_video");

  videos.forEach(video => {
    video.addEventListener("mouseenter", () => {
      const result = video.play();

      if (result && typeof result.catch === "function") {
        result.catch(() => {});
      }
    });

    video.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
    });

    // На сенсорных устройствах нет hover.
    video.addEventListener("click", event => {
      event.preventDefault();
    });
  });
}


// ========================================
// ЗАГРУЗКА ДАННЫХ
// ========================================

async function loadGifts() {
  if (!giftsGallery) {
    return;
  }

  try {
    const [response] = await Promise.all([
      fetch("../data/gifts.json"),
      loadCharacterNames()
    ]);

    if (!response.ok) {
      throw new Error(
        `Не удалось загрузить gifts.json: ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("gifts.json должен содержать массив подарков.");
    }

    giftsData = data.filter(gift => gift && gift.id != null);

    renderGifts();
  } catch (error) {
    console.error("Ошибка загрузки подарков:", error);

    giftsGallery.textContent = translate(
      "gifts.loadError",
      getCurrentLanguage() === "ru"
        ? "Не удалось загрузить подарки. Попробуйте обновить страницу."
        : "Unable to load gifts. Please refresh the page."
    );
  }
}


// ========================================
// СМЕНА ЯЗЫКА
// ========================================

document.addEventListener("languageChanged", () => {
  renderGifts();
});


// ========================================
// ЗАПУСК
// ========================================

loadGifts();
