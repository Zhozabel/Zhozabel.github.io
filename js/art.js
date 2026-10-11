
const timeline = document.querySelector(".timeline");

let artworksData = [];

// Возвращает перевод по ключу.
// Например: getTranslation("art.reveal")
function getTranslation(key) {
  return key.split(".").reduce((value, part) => {
    return value?.[part];
  }, window.siteTranslations || {});
}

// Получаем язык сайта
function getCurrentLanguage() {
  return document.documentElement.lang || "en";
}

// Получаем перевод из локализации с запасным значением
function translate(key, fallback = key) {
  const value = getTranslation(key);

  return typeof value === "string" ? value : fallback;
}

// Выбираем изображение для текущего языка
function getArtworkImage(artwork) {
  const image = artwork.image;
  const language = getCurrentLanguage();

  // Старый формат: строка с путём
  if (typeof image === "string") {
    return image;
  }

  // Новый формат: объект с языковыми версиями
  if (image && typeof image === "object") {
    return image[language] || image.en || image.ru || "";
  }

  return "";
}

// Преобразуем путь к изображению в URL относительно страницы
function getImageUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  return new URL(`../${imagePath}`, document.baseURI).href;
}

// Создаём текстовый элемент
function createTextElement(tag, className, text) {
  const element = document.createElement(tag);

  element.className = className;
  element.textContent = text;

  return element;
}

// Создаём предупреждение о содержании
function renderWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) {
    return null;
  }

  const warning = document.createElement("div");
  warning.className = "art_warning";

  const title = translate(
    "art.contentWarning",
    "Content warning"
  );

  const labels = warnings.map((item) => {
    return translate(
      `art.warningLabels.${item}`,
      item
    );
  });

  warning.textContent = `${title}: ${labels.join(", ")}`;

  return warning;
}

// Создаём карточку работы
function createArtworkCard(artwork) {
  const card = document.createElement("article");

  card.className = "art_card";
  card.dataset.id = artwork.id;

  const link = document.createElement("a");

  link.className = "art_card_link";
  link.href =
    `viewer.html?source=artworks&id=${encodeURIComponent(artwork.id)}`;

  const image = document.createElement("img");
  const imagePath = getArtworkImage(artwork);

  image.alt = Array.isArray(artwork.characters)
    ? artwork.characters.join(", ")
    : "";

  image.loading = "lazy";
  image.decoding = "async";

  if (imagePath) {
    image.src = getImageUrl(imagePath);
  }

  link.appendChild(image);
  card.appendChild(link);

  // Размытие и кнопка раскрытия
  if (artwork.blur) {
    card.classList.add("is_blurred");

    const revealButton = document.createElement("button");

    revealButton.className = "art_reveal";
    revealButton.type = "button";

    const warning = renderWarnings(artwork.warnings);

    if (warning) {
      revealButton.appendChild(warning);
    }

    const revealAction = createTextElement(
      "span",
      "art_reveal_action",
      translate("art.reveal", "Click to reveal")
    );

    revealButton.appendChild(revealAction);

    revealButton.addEventListener("click", () => {
      card.classList.remove("is_blurred");
      revealButton.remove();
    });

    card.appendChild(revealButton);
  }

  return card;
}

// Группируем работы по годам
function groupArtworksByYear(artworks) {
  return artworks.reduce((groups, artwork) => {
    const year = artwork.year;

    if (!groups[year]) {
      groups[year] = [];
    }

    groups[year].push(artwork);

    return groups;
  }, {});
}

// Создаём секцию одного года
function createYearSection(year, artworks) {
  const section = document.createElement("section");

  section.className = "year collapsed";

  const header = document.createElement("button");

  header.className = "year_header";
  header.type = "button";
  header.setAttribute("aria-expanded", "false");

  const title = createTextElement(
    "span",
    "year_title",
    String(year)
  );

  const toggle = document.createElement("span");
  toggle.className = "year_toggle";

  const chevron = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );

  chevron.classList.add("year_chevron");
  chevron.setAttribute("viewBox", "0 0 24 24");
  chevron.setAttribute("width", "24");
  chevron.setAttribute("height", "24");
  chevron.setAttribute("aria-hidden", "true");

  const use = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "use"
  );

  use.setAttribute(
    "href",
    "../images/icons/navigation.svg#chevron_down"
  );

  chevron.appendChild(use);
  toggle.appendChild(chevron);

  header.append(title, toggle);

  const content = document.createElement("div");
  content.className = "year_content";

  const gallery = document.createElement("div");
  gallery.className = "year_gallery";

  artworks.forEach((artwork) => {
    gallery.appendChild(createArtworkCard(artwork));
  });

  content.appendChild(gallery);
  section.append(header, content);

  header.addEventListener("click", () => {
    const isCollapsed = section.classList.toggle("collapsed");

    header.setAttribute(
      "aria-expanded",
      String(!isCollapsed)
    );
  });

  return section;
}

// Отрисовываем таймлайн
function renderArtworks() {
  if (!timeline) {
    return;
  }

  // Не допускаем дублирования карточек
  timeline.replaceChildren();

  const artworksByYear = groupArtworksByYear(artworksData);

  const sortedYears = Object.keys(artworksByYear)
    .sort((a, b) => Number(b) - Number(a));

  sortedYears.forEach((year) => {
    const section = createYearSection(
      year,
      artworksByYear[year]
    );

    timeline.appendChild(section);
  });
}

// Загружаем JSON
async function loadArtworks() {
  if (!timeline) {
    return;
  }

  try {
    const response = await fetch("../data/artworks.json");

    if (!response.ok) {
      throw new Error(
        `Не удалось загрузить artworks.json: ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("artworks.json должен содержать массив работ");
    }

    artworksData = data;

    renderArtworks();
  } catch (error) {
    console.error("Ошибка загрузки работ:", error);

    timeline.textContent =
      "Не удалось загрузить работы. Попробуйте обновить страницу.";
  }
}

// Перерисовываем карточки после смены языка
document.addEventListener("languageChanged", () => {
  renderArtworks();
});

// Начальная загрузка
loadArtworks();
