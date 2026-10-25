
/* ========================================
   COMIC PAGE
======================================== */

const comicTitle = document.querySelector(".comic_title");
const comicDate = document.querySelector(".comic_date");
const comicContent = document.querySelector(".comic_content");

const navigationBlocks = document.querySelectorAll(
  ".comic_navigation"
);

// const CONTENTS_URL = "../story.html";
const COMICS_URL = "comic.html?comic=";

let comicsList = [];
let currentComic = null;
let currentComicIndex = -1;


/* ========================================
   TRANSLATIONS
======================================== */

function getCurrentLanguage() {
  return document.documentElement.lang === "ru" ? "ru" : "en";
}

function getLocalizedValue(value, language) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    return value[language] || value.en || value.ru || "";
  }

  return "";
}

function getComicTranslation(key, fallback) {
  const translations = window.siteTranslations || {};

  const value = key
    .split(".")
    .reduce((result, part) => result?.[part], translations);

  return typeof value === "string" ? value : fallback;
}


/* ========================================
   ERROR MESSAGES
======================================== */

function showMessage(message) {
  const paragraph = document.createElement("p");

  paragraph.className = "comic_message";
  paragraph.textContent = message;

  comicContent.replaceChildren(paragraph);
}

function clearComicPage() {
  comicTitle.textContent = "";
  comicDate.textContent = "";
  comicDate.removeAttribute("datetime");
  comicContent.replaceChildren();

  navigationBlocks.forEach((navigation) => {
    navigation.querySelectorAll(".comic_navigation-link").forEach((link) => {
      link.removeAttribute("href");
      link.textContent = "";
      link.style.visibility = "hidden";
    });
  });
}


/* ========================================
   LOAD COMICS LIST
======================================== */

async function loadComics() {
  const response = await fetch("../data/comics.json");

  if (!response.ok) {
    throw new Error(
      `Could not load comics.json: ${response.status}`
    );
  }

  const comics = await response.json();

  if (!Array.isArray(comics)) {
    throw new Error("comics.json must contain an array.");
  }

  return comics;
}


/* ========================================
   GET COMIC ID
======================================== */

function getComicId() {
  const params = new URLSearchParams(window.location.search);

  return params.get("comic");
}


/* ========================================
   FORMAT DATE
======================================== */

function formatDate(dateString, language) {
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString || "";
  }

  const locale = language === "ru" ? "ru-RU" : "en-US";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}


/* ========================================
   LOAD COMIC JSON
======================================== */

async function loadComicFile(file) {
  if (typeof file !== "string" || !file) {
    throw new Error("Comic file path is missing.");
  }

  const response = await fetch(`../data/${file}`);

  if (!response.ok) {
    throw new Error(
      `Could not load comic file: ${file} (${response.status})`
    );
  }

  const comicData = await response.json();

  if (!comicData || !Array.isArray(comicData.pages)) {
    throw new Error("Comic JSON must contain a pages array.");
  }

  return comicData;
}


/* ========================================
   RENDER PAGES
======================================== */

function renderPages(pages) {
  const language = getCurrentLanguage();

  comicContent.replaceChildren();

  if (!Array.isArray(pages) || pages.length === 0) {
    showMessage(
      getComicTranslation(
        "comics.noPages",
        language === "ru"
          ? "В этой главе пока нет страниц."
          : "There are no pages in this chapter yet."
      )
    );

    return;
  }

  pages.forEach((page, index) => {
    const imagePath = getLocalizedValue(page.src, language);

    if (!imagePath) {
      const message = document.createElement("p");

      message.className = "comic_message";
      message.textContent = language === "ru"
        ? `Не указан файл страницы ${index + 1}.`
        : `Image file missing for page ${index + 1}.`;

      comicContent.appendChild(message);
      return;
    }

    const image = document.createElement("img");

    image.className = "comic_page-image";
    image.src = `../${imagePath}`;
    image.alt = getLocalizedValue(page.alt, language) ||
      (language === "ru"
        ? `Страница ${index + 1}`
        : `Page ${index + 1}`);

    image.loading = index === 0 ? "eager" : "lazy";
    image.decoding = "async";

    image.addEventListener("error", () => {
      console.error("Failed to load comic page:", image.src);

      image.alt = language === "ru"
        ? `Не удалось загрузить страницу ${index + 1}`
        : `Failed to load page ${index + 1}`;

      image.classList.add("comic_page-image-error");
    });

    comicContent.appendChild(image);
  });
}


/* ========================================
   NAVIGATION
======================================== */

function setupNavigation(currentIndex) {
  const language = getCurrentLanguage();

  const previousComic = comicsList[currentIndex - 1];
  const nextComic = comicsList[currentIndex + 1];

  const contentsLabel = getComicTranslation(
    "comics.contents",
    language === "ru" ? "Содержание" : "Contents"
  );

  navigationBlocks.forEach((navigation) => {
    const contentsLink = navigation.querySelector(
      ".comic_navigation-contents"
    );

    const links = [
      ...navigation.querySelectorAll(".comic_navigation-link")
    ];

    const chapterLinks = links.filter(
      (link) => !link.classList.contains("comic_navigation-contents")
    );

    const previousLink = chapterLinks[0];
    const nextLink = chapterLinks[1];

    if (contentsLink) {
      contentsLink.href =
        `story.html?type=comic&id=${encodeURIComponent(currentComic.id)}`;
      contentsLink.textContent = contentsLabel;
      contentsLink.style.visibility = "visible";
    }

    if (previousLink) {
      if (previousComic) {
        previousLink.href =
          `${COMICS_URL}${encodeURIComponent(previousComic.id)}`;

        previousLink.textContent =
          `← ${getLocalizedValue(previousComic.title, language)}`;

        previousLink.style.visibility = "visible";
      } else {
        previousLink.removeAttribute("href");
        previousLink.textContent = "";
        previousLink.style.visibility = "hidden";
      }
    }

    if (nextLink) {
      if (nextComic) {
        nextLink.href =
          `${COMICS_URL}${encodeURIComponent(nextComic.id)}`;

        nextLink.textContent =
          `${getLocalizedValue(nextComic.title, language)} →`;

        nextLink.style.visibility = "visible";
      } else {
        nextLink.removeAttribute("href");
        nextLink.textContent = "";
        nextLink.style.visibility = "hidden";
      }
    }
  });
}


/* ========================================
   DISPLAY COMIC
======================================== */

let currentComicData = null;

function renderComicInfo() {
  if (!currentComic) {
    return;
  }

  const language = getCurrentLanguage();

  const title = getLocalizedValue(currentComic.title, language);

  comicTitle.textContent = title;

  comicDate.textContent = formatDate(
    currentComic.date,
    language
  );

  if (currentComic.date) {
    comicDate.dateTime = currentComic.date;
  } else {
    comicDate.removeAttribute("datetime");
  }

  document.title = title
    ? `${title}`
    : "Zhozabel";

  if (currentComicData) {
    renderPages(currentComicData.pages);
  }

  setupNavigation(currentComicIndex);
}


/* ========================================
   INITIALIZE
======================================== */

async function initComicPage() {
  clearComicPage();

  const language = getCurrentLanguage();

  try {
    comicsList = await loadComics();
  } catch (error) {
    console.error("COMICS ERROR:", error);

    showMessage(
      getComicTranslation(
        "comics.loadError",
        language === "ru"
          ? "Не удалось загрузить список комиксов. Попробуйте обновить страницу."
          : "Unable to load comics. Please refresh the page."
      )
    );

    return;
  }

  const comicId = getComicId();

  if (!comicId) {
    showMessage(
      getComicTranslation(
        "comics.missingId",
        language === "ru"
          ? "Комикс не указан."
          : "No comic was specified."
      )
    );

    return;
  }

  currentComicIndex = comicsList.findIndex(
    (comic) => comic.id === comicId
  );

  if (currentComicIndex === -1) {
    showMessage(
      getComicTranslation(
        "comics.notFound",
        language === "ru"
          ? "Комикс не найден."
          : "Comic not found."
      )
    );

    return;
  }

  currentComic = comicsList[currentComicIndex];

  try {
    currentComicData = await loadComicFile(currentComic.file);

    renderComicInfo();
  } catch (error) {
    console.error("COMIC ERROR:", error);

    renderComicInfo();

    showMessage(
      getComicTranslation(
        "comics.chapterLoadError",
        language === "ru"
          ? "Не удалось загрузить главу комикса."
          : "Unable to load this comic chapter."
      )
    );
  }
}


/* ========================================
   LANGUAGE CHANGE
======================================== */

document.addEventListener("languageChanged", () => {
  if (currentComic && currentComicData) {
    renderComicInfo();
  }
});


/* ========================================
   START
======================================== */

initComicPage();
