/* ========================================
   COMIC PAGE
======================================== */

const comicTitle = document.querySelector(".comic_title");
const comicDate = document.querySelector(".comic_date");
const comicContent = document.querySelector(".comic_content");

const navigationBlocks = document.querySelectorAll(
  ".comic_navigation"
);


/* ========================================
   LOAD COMICS LIST
======================================== */

async function loadComics() {
  try {
    const response = await fetch("../data/comics.json");

    if (!response.ok) {
      throw new Error(
        `Could not load comics.json: ${response.status}`
      );
    }

    return await response.json();

  } catch (error) {
    console.error("COMICS ERROR:", error);

    comicContent.innerHTML = `
      <p>
        Не удалось загрузить список комиксов.
      </p>
    `;

    return null;
  }
}


/* ========================================
   GET COMIC ID
======================================== */

function getComicId() {
  const params =
    new URLSearchParams(window.location.search);

  return params.get("comic");
}


/* ========================================
   FORMAT DATE
======================================== */

function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}


/* ========================================
   LOAD COMIC JSON
======================================== */

async function loadComicFile(file) {
  const response =
    await fetch(`../data/${file}`);

  if (!response.ok) {
    throw new Error(
      `Could not load comic file: ${file}`
    );
  }

  return await response.json();
}


/* ========================================
   RENDER PAGES
======================================== */

function renderPages(pages) {

  comicContent.innerHTML = "";

  if (!pages || pages.length === 0) {
    comicContent.innerHTML = `
      <p>
        В этом комиксе пока нет страниц.
      </p>
    `;

    return;
  }


  pages.forEach((page, index) => {

    const image = document.createElement("img");

    image.className = "comic_page-image";

    image.src = `../${page.src}`;

    image.alt =
      page.alt ||
      `Страница ${index + 1}`;

    image.loading =
      index === 0
        ? "eager"
        : "lazy";

    comicContent.appendChild(image);

  });
}


/* ========================================
   NAVIGATION
======================================== */

function setupNavigation(
  currentIndex,
  comics
) {

  navigationBlocks.forEach(navigation => {

    const links =
      navigation.querySelectorAll(
        ".comic_navigation-link"
      );

    const previousLink = links[0];
    const contentsLink = links[1];
    const nextLink = links[2];


    /* ---------- PREVIOUS ---------- */

    if (currentIndex > 0) {

      const previousComic =
        comics[currentIndex - 1];

      previousLink.href =
        `comic.html?comic=${previousComic.id}`;

      previousLink.textContent =
        `← ${previousComic.title}`;

      previousLink.style.visibility =
        "visible";

    } else {

      previousLink.removeAttribute("href");

      previousLink.textContent = "";

      previousLink.style.visibility =
        "hidden";
    }


    /* ---------- CONTENTS ---------- */

    contentsLink.href =
      "../story.html";


    /* ---------- NEXT ---------- */

    if (
      currentIndex <
      comics.length - 1
    ) {

      const nextComic =
        comics[currentIndex + 1];

      nextLink.href =
        `comic.html?comic=${nextComic.id}`;

      nextLink.textContent =
        `${nextComic.title} →`;

      nextLink.style.visibility =
        "visible";

    } else {

      nextLink.removeAttribute("href");

      nextLink.textContent = "";

      nextLink.style.visibility =
        "hidden";
    }

  });
}


/* ========================================
   DISPLAY COMIC
======================================== */

async function displayComic(
  comic,
  comicIndex,
  comics
) {

  try {

    /* ---------- HEADER ---------- */

    comicTitle.textContent =
      comic.title;

    comicDate.textContent =
      formatDate(comic.date);

    comicDate.dateTime =
      comic.date;


    /* ---------- COMIC JSON ---------- */

    const comicData =
      await loadComicFile(
        comic.file
      );


    /* ---------- PAGES ---------- */

    renderPages(
      comicData.pages
    );


    /* ---------- NAVIGATION ---------- */

    setupNavigation(
      comicIndex,
      comics
    );


    /* ---------- PAGE TITLE ---------- */

    document.title =
      `${comic.title} — Zhozabel`;


    console.log(
      "COMIC LOADED:",
      comic
    );

    console.log(
      "PAGES LOADED:",
      comicData.pages
    );

  } catch (error) {

    console.error(
      "COMIC ERROR:",
      error
    );

    comicContent.innerHTML = `
      <p>
        Не удалось загрузить комикс.
      </p>
    `;
  }
}


/* ========================================
   INITIALIZE
======================================== */

async function initComicPage() {

  console.log(
    "COMIC JS STARTED"
  );


  /* ---------- LOAD COMICS ---------- */

  const comics =
    await loadComics();

  if (!comics) {
    return;
  }


  console.log(
    "COMICS LOADED:",
    comics
  );


  /* ---------- GET ID ---------- */

  const comicId =
    getComicId();


  if (!comicId) {

    comicContent.innerHTML = `
      <p>
        Комикс не указан.
      </p>
    `;

    return;
  }


  console.log(
    "REQUESTED COMIC:",
    comicId
  );


  /* ---------- FIND COMIC ---------- */

  const comicIndex =
    comics.findIndex(
      comic =>
        comic.id === comicId
    );


  if (comicIndex === -1) {

    comicContent.innerHTML = `
      <p>
        Комикс не найден.
      </p>
    `;

    return;
  }


  /* ---------- DISPLAY ---------- */

  const comic =
    comics[comicIndex];


  await displayComic(
    comic,
    comicIndex,
    comics
  );
}


/* ========================================
   START
======================================== */

initComicPage();
