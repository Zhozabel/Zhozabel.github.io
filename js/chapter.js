/* ========================================
   CHAPTER PAGE
======================================== */


/* ========================================
   ELEMENTS
======================================== */

const chapterTitle = document.querySelector(".chapter_title");
const chapterDate = document.querySelector(".chapter_date");
const chapterContent = document.querySelector(".chapter_content");

const navigationBlocks = document.querySelectorAll(
  ".chapter_navigation"
);


/* ========================================
   URL PARAMETERS
======================================== */

function getPageParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    type: params.get("type"),
    id: params.get("id"),
    chapterId: params.get("chapter")
  };
}


/* ========================================
   LANGUAGE
======================================== */

function getLanguage() {
  const language = document.documentElement.lang
    .toLowerCase()
    .split("-")[0];

  return language === "en" ? "en" : "ru";
}


function getLocalizedText(value) {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const language = getLanguage();

  return value[language] || value.ru || value.en || "";
}


/* ========================================
   PROJECT PATHS
======================================== */

/*
  chapter.html is located in /pages/stories/.

  Data and Markdown paths in JSON are relative
  to the project root.
*/

function getProjectUrl(path) {
  const cleanPath = path.replace(/^\/+/, "");

  return new URL(`../../${cleanPath}`, window.location.href).href;
}


/* ========================================
   LOAD JSON
======================================== */

async function loadJSON(path) {
  const response = await fetch(getProjectUrl(path));

  if (!response.ok) {
    throw new Error(
      `Could not load ${path}: ${response.status}`
    );
  }

  return await response.json();
}


/* ========================================
   LOAD WORK
======================================== */

/*
  The URL contains the work type and ID.

  Example:
  chapter.html?type=fanfic&id=oblaan&chapter=chapter-01
*/

function getCatalogPath(type) {
  const catalogs = {
    fanfic: "data/fanfics.json",
    original: "data/originals.json"
  };

  return catalogs[type] || null;
}


async function loadWork(type, id) {
  const catalogPath = getCatalogPath(type);

  if (!catalogPath) {
    throw new Error(
      `Unsupported work type: ${type}`
    );
  }

  const catalog = await loadJSON(catalogPath);

  const work = catalog.find(
    item => item.id === id
  );

  if (!work) {
    throw new Error(
      `Work not found: ${id}`
    );
  }

  return work;
}


/* ========================================
   LOAD CHAPTERS
======================================== */

async function loadChapters(work) {
  if (!work.chaptersFile) {
    throw new Error(
      "The work has no chaptersFile property."
    );
  }

  const chapters = await loadJSON(work.chaptersFile);

  if (!Array.isArray(chapters)) {
    throw new Error(
      "The chapters file must contain an array."
    );
  }

  return chapters;
}


/* ========================================
   FORMAT DATE
======================================== */

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  // Use a fixed time to avoid timezone shifts.
  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const locale = getLanguage() === "en"
    ? "en-US"
    : "ru-RU";

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}


/* ========================================
   LOAD MARKDOWN
======================================== */

async function loadMarkdown(files) {
  if (!files || typeof files !== "object") {
    throw new Error("The chapter has no language files.");
  }

  const language = getLanguage();
  const fallbackLanguage = language === "ru" ? "en" : "ru";

  const languagesToTry = [language, fallbackLanguage];

  for (const lang of languagesToTry) {
    const file = files[lang];

    // Если путь для языка не указан — пробуем следующий
    if (!file) continue;

    try {
      const response = await fetch(getProjectUrl(file));

      // Если файл не найден — пробуем следующий язык
      if (!response.ok) continue;

      return await response.text();
    } catch (error) {
      console.warn(`Could not load ${lang} chapter file:`, file);
    }
  }

  throw new Error("No available Markdown file could be loaded.");
}


/* ========================================
   INSERT ILLUSTRATIONS
======================================== */

/*
  Inserts illustrations after the specified
  paragraph in the rendered Markdown.

  Example:
  {
    "position": 3,
    "src": "images/stories/example/image.png",
    "caption": {
      "en": "Illustration",
      "ru": "Иллюстрация"
    }
  }
*/

function insertIllustrations(content, illustrations) {
  if (!Array.isArray(illustrations) || illustrations.length === 0) {
    return;
  }

  const language = getLanguage();

  // Select the current language, then fall back to the other version.
  function getIllustrationValue(value) {
    if (typeof value === "string") {
      return value;
    }

    if (!value || typeof value !== "object") {
      return "";
    }

    return (
      value[language] ||
      value.en ||
      value.ru ||
      ""
    );
  }

  // Insert in descending order so paragraph positions remain stable.
  const sortedIllustrations = [...illustrations].sort(
    (a, b) => Number(b.position) - Number(a.position)
  );

  sortedIllustrations.forEach(illustration => {
    const position = Number(illustration.position);

    const paragraphs = content.querySelectorAll("p");
    const paragraph = paragraphs[position - 1];

    const imageSrc = getIllustrationValue(illustration.src);

    if (
      !Number.isInteger(position) ||
      position < 1 ||
      !paragraph ||
      !imageSrc
    ) {
      console.warn(
        `Could not insert illustration at paragraph ${position}.`
      );
      return;
    }

    const figure = document.createElement("figure");

    const size = illustration.size === "large" ? "large" : "normal";

    figure.className = `chapter_illustration chapter_illustration--${size}`;

    const image = document.createElement("img");

    image.src = getProjectUrl(imageSrc);
    image.alt =
      getIllustrationValue(illustration.alt) ||
      getIllustrationValue(illustration.caption);

    image.loading = "lazy";

    figure.appendChild(image);

    const captionText = getLocalizedText(illustration.caption);

    if (captionText) {
      const caption = document.createElement("figcaption");

      caption.textContent = captionText;

      figure.appendChild(caption);
    }

    paragraph.after(figure);
  });
}


/* ========================================
   SETUP NAVIGATION
======================================== */

function setupNavigation(
  currentIndex,
  chapters,
  workType,
  workId
) {
  const contentsUrl =
    `../story.html?type=${encodeURIComponent(workType)}` +
  `&id=${encodeURIComponent(workId)}`;

navigationBlocks.forEach(navigation => {
  const links = navigation.querySelectorAll(
    ".chapter_navigation-link"
  );

  const previousLink = links[0];
  const contentsLink = links[1];
  const nextLink = links[2];

  if (!previousLink || !contentsLink || !nextLink) {
    return;
  }

  function setChapterLink(link, chapter, direction) {
    const params = new URLSearchParams({
      type: workType,
      id: workId,
      chapter: chapter.id
    });

    link.href = `chapter.html?${params.toString()}`;

    const title = getLocalizedText(chapter.title);

    link.textContent = direction === "previous"
      ? `${title}`
      : `${title}`;

    link.style.visibility = "visible";
  }

  // Previous chapter
  if (currentIndex > 0) {
    setChapterLink(
      previousLink,
      chapters[currentIndex - 1],
      "previous"
    );
  } else {
    previousLink.removeAttribute("href");
    previousLink.textContent = "";
    previousLink.style.visibility = "hidden";
  }

  // Contents
  contentsLink.href = contentsUrl;

  // Next chapter
  if (currentIndex < chapters.length - 1) {
    setChapterLink(
      nextLink,
      chapters[currentIndex + 1],
      "next"
    );
  } else {
    nextLink.removeAttribute("href");
    nextLink.textContent = "";
    nextLink.style.visibility = "hidden";
  }
});
}


/* ========================================
   DISPLAY CHAPTER
======================================== */

async function displayChapter(
  chapter,
  chapterIndex,
  chapters,
  workType,
  workId
) {
  // Header
  const title = getLocalizedText(chapter.title);

  chapterTitle.textContent = title;

  chapterDate.textContent = formatDate(chapter.date);
  chapterDate.dateTime = chapter.date || "";

  // Markdown
  const markdown = await loadMarkdown(chapter.files);

  if (typeof marked === "undefined") {
    throw new Error(
      "Marked library is not loaded."
    );
  }

  chapterContent.innerHTML = marked.parse(markdown);

  // Inline illustrations
  insertIllustrations(
    chapterContent,
    chapter.illustrations
  );

  // Navigation
  setupNavigation(
    chapterIndex,
    chapters,
    workType,
    workId
  );

  // Page title
  document.title = `${title} — Zhozabel`;

  console.log("CHAPTER LOADED:", chapter);
}


/* ========================================
   INITIALIZE
======================================== */

async function initChapterPage() {
  console.log("CHAPTER JS STARTED");

  const { type, id, chapterId } = getPageParams();

  try {
    if (!type || !id || !chapterId) {
      throw new Error(
        "The URL must contain type, id and chapter parameters."
      );
    }

    // Find the work in the appropriate catalog.
    const work = await loadWork(type, id);

    // Load the work's chapter list.
    const chapters = await loadChapters(work);

    console.log("WORK LOADED:", work);
    console.log("CHAPTERS LOADED:", chapters);

    // Find the requested chapter.
    const chapterIndex = chapters.findIndex(
      chapter => chapter.id === chapterId
    );

    if (chapterIndex === -1) {
      throw new Error(
        `Chapter not found: ${chapterId}`
      );
    }

    const chapter = chapters[chapterIndex];

    await displayChapter(
      chapter,
      chapterIndex,
      chapters,
      type,
      id
    );

  } catch (error) {
    console.error("CHAPTER ERROR:", error);

    chapterContent.textContent =
      getLanguage() === "en"
        ? "Unable to load this chapter. Please check the URL and chapter data."
        : "Не удалось загрузить главу. Проверь URL и данные произведения.";
  }
}


/* ========================================
   START
======================================== */

initChapterPage();


/* UPDATE CHAPTER WHEN LANGUAGE CHANGES */
document.addEventListener("languageChanged", () => {
  initChapterPage();
});

