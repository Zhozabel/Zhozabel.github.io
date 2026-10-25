const DATA_FILES = {
  comic: "../data/comics.json",
  fanfic: "../data/fanfics.json",
  original: "../data/originals.json"
};

let currentStory = null;
let currentChapters = [];
let currentLanguage = "en";

const params = new URLSearchParams(window.location.search);
const storyType = params.get("type");
const storyId = params.get("id");


function getLanguage() {
  const savedLanguage = localStorage.getItem("zhozabel-language");

  if (savedLanguage === "ru" || savedLanguage === "en") {
    return savedLanguage;
  }

  return document.documentElement.lang === "ru" ? "ru" : "en";
}


function getLocalized(value) {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  return value[currentLanguage] || value.en || value.ru || "";
}


function getAssetPath(path) {
  if (!path) return "";

  // Внешние URL оставляем без изменений.
  if (/^(?:[a-z]+:)?\/\//i.test(path)) {
    return path;
  }

  // Абсолютные и уже относительные пути не меняем.
  if (
    path.startsWith("../") ||
    path.startsWith("./") ||
    path.startsWith("/")
  ) {
    return path;
  }

  // Пути из JSON отсчитываем от корня проекта.
  return `../${path.replace(/^\/+/, "")}`;
}


async function fetchJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Не удалось загрузить ${path}: ${response.status}`);
  }

  return response.json();
}


async function loadStory() {
  currentLanguage = getLanguage();

  try {
    if (!storyType || !storyId || !DATA_FILES[storyType]) {
      throw new Error("Неверный адрес произведения: проверьте type и id.");
    }

    const stories = await fetchJSON(DATA_FILES[storyType]);

    currentStory = stories.find(
      item => item.id === storyId && item.type === storyType
    );

    if (!currentStory) {
      throw new Error(`Произведение "${storyId}" не найдено.`);
    }

    currentChapters = currentStory.chaptersFile
      ? await fetchJSON(getAssetPath(currentStory.chaptersFile))
      : [];

    renderStory();
  } catch (error) {
    console.error("Ошибка загрузки произведения:", error);

    document.querySelector(".story_title").textContent =
      currentLanguage === "ru"
        ? "Не удалось загрузить произведение"
        : "Unable to load this story";

    document.querySelector(".story_description-text").textContent =
      currentLanguage === "ru"
        ? "Проверьте адрес страницы и JSON-файлы."
        : "Please check the page URL and JSON files.";
  }
}


function renderStory() {
  if (!currentStory) return;

  const title = getLocalized(currentStory.title);

  document.title = title ? `${title}` : "Zhozabel";
  document.querySelector(".story_title").textContent = title;

  // Баннер
  const bannerImage = document.querySelector(".story_banner-image");
  const bannerPath = getLocalized(currentStory.banner);

  if (bannerPath) {
    bannerImage.src = getAssetPath(bannerPath);
    bannerImage.alt = title;
    bannerImage.hidden = false;
  } else {
    bannerImage.removeAttribute("src");
    bannerImage.alt = "";
    bannerImage.hidden = true;
  }

  // Обложка
  const coverImage = document.querySelector(".story_cover-image");
  const coverPath = getLocalized(currentStory.cover);

  if (coverPath) {
    coverImage.src = getAssetPath(coverPath);
    coverImage.alt = title;
    coverImage.hidden = false;
  } else {
    coverImage.removeAttribute("src");
    coverImage.alt = "";
    coverImage.hidden = true;
  }

  // Описание
  const description = document.querySelector(".story_description-text");
  description.replaceChildren();

  const descriptionText = getLocalized(currentStory.description);

  descriptionText
    .split(/\n+/)
    .map(text => text.trim())
    .filter(Boolean)
    .forEach(text => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      description.appendChild(paragraph);
    });

  // Жанры
  renderChips(
    document.querySelector(".story_genres"),
    (currentStory.genres || []).map(genre => {
      const value = getLocalized(genre);
      return getLocalizedGenre(value);
    })
  );

  // Рейтинг
  const ratingElement = document.querySelector(".story_rating");
  const rating = getLocalized(currentStory.rating);

  ratingElement.textContent = rating;

// Убираем предыдущий класс рейтинга.
  ratingElement.classList.remove(
    "story_rating--G",
    "story_rating--PG",
    "story_rating--PG-13",
    "story_rating--R",
    "story_rating--NC-17"
  );

// Добавляем класс для текущего рейтинга.
  const ratingClass = `story_rating--${rating}`;

  if (
    ["G", "PG", "PG-13", "R", "NC-17"].includes(rating)
  ) {
    ratingElement.classList.add(ratingClass);
  }

  // Предупреждения
  renderChips(
    document.querySelector(".story_warnings"),
    (currentStory.warnings || []).map(getLocalizedWarning)
  );

  // Список глав
  renderChapters(currentChapters);
}

function getLocalizedGenre(genre) {
  return window.siteTranslations?.story?.genresList?.[genre] || genre;
}

function getLocalizedWarning(warning) {
  return window.siteTranslations?.story?.warningsList?.[warning] || warning;
}


function renderChips(container, items) {
  container.replaceChildren();

  items
    .filter(Boolean)
    .forEach(item => {
      const chip = document.createElement("span");
      chip.textContent = item;
      container.appendChild(chip);
    });
}


function renderChapters(chapters) {
  const container = document.querySelector(".story_chapter-list");
  container.replaceChildren();

  chapters.forEach(chapter => {
    const chapterElement = document.createElement("a");
    chapterElement.className = "story_chapter";


    if (storyType === "comic") {
      chapterElement.href =
        `comic.html?comic=${encodeURIComponent(storyId)}`;
    } else {
      const chapterParams = new URLSearchParams({
        type: storyType,
        id: storyId,
        chapter: chapter.id
      });

      chapterElement.href = `stories/chapter.html?${chapterParams.toString()}`;
    }

    const coverContainer = document.createElement("div");
    coverContainer.className = "story_chapter-cover";

    const image = document.createElement("img");
    const coverPath = getLocalized(chapter.cover);

    if (coverPath) {
      image.src = getAssetPath(coverPath);
    }

    image.alt = getLocalized(chapter.title);
    image.loading = "lazy";

    coverContainer.appendChild(image);

    const info = document.createElement("div");
    info.className = "story_chapter-info";

    const chapterTitle = document.createElement("div");
    chapterTitle.className = "story_chapter-title";
    chapterTitle.textContent = getLocalized(chapter.title);

    const chapterDate = document.createElement("div");
    chapterDate.className = "story_chapter-date";
    chapterDate.textContent = formatDate(chapter.date);

    info.append(chapterTitle, chapterDate);
    chapterElement.append(coverContainer, info);
    container.appendChild(chapterElement);
  });
}


function formatDate(date) {
  if (!date) return "";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    currentLanguage === "ru" ? "ru-RU" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );
}


// Переключение языка
document.addEventListener("languageChanged", event => {
  const language = event.detail?.language;

  if (language !== "ru" && language !== "en") return;

  currentLanguage = language;
  renderStory();
});


loadStory();
