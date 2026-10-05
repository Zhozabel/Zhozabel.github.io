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
   LOAD CHAPTERS
======================================== */

async function loadChapters() {
  try {
    const response = await fetch("../data/stories/keep-the-promise/keep-the-promise.json");

    if (!response.ok) {
      throw new Error(
        `Could not load chapters.json: ${response.status}`
      );
    }

    return await response.json();

  } catch (error) {

    console.error("CHAPTERS ERROR:", error);

    chapterContent.innerHTML = `
      <p>
        Не удалось загрузить список глав.
      </p>
    `;

    return null;
  }
}


/* ========================================
   GET CHAPTER ID
======================================== */

function getChapterId() {

  const params =
    new URLSearchParams(window.location.search);

  return params.get("chapter");
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
   LOAD MARKDOWN
======================================== */

async function loadMarkdown(file) {

  /*
    chapters.json stores paths relative
    to the project root.

    chapter.html is inside /stories/,
    so we need ../ here.
  */

  const response = await fetch(`../${file}`);

  if (!response.ok) {
    throw new Error(
      `Could not load chapter file: ${file}`
    );
  }

  return await response.text();
}


/* ========================================
   INSERT ILLUSTRATIONS
======================================== */

function insertIllustrations(
  content,
  illustrations
) {

  if (
    !illustrations ||
    illustrations.length === 0
  ) {
    return;
  }


  const paragraphs =
    content.querySelectorAll("p");


  illustrations.forEach(illustration => {

    const position =
      Number(illustration.position);

    const paragraph =
      paragraphs[position - 1];


    if (!paragraph) {

      console.warn(
        `Illustration position ${position} does not exist.`
      );

      return;
    }


    const figure =
      document.createElement("figure");

    figure.className =
      "chapter_illustration";


    /* Image */

    const image =
      document.createElement("img");

    image.src =
      `../${illustration.src}`;

    image.alt =
      illustration.caption || "";


    figure.appendChild(image);


    /* Caption */

    if (illustration.caption) {

      const caption =
        document.createElement("figcaption");

      caption.textContent =
        illustration.caption;

      figure.appendChild(caption);
    }


    /* Insert */

    paragraph.after(figure);
  });
}


/* ========================================
   SETUP NAVIGATION
======================================== */

function setupNavigation(
  currentIndex,
  chapters
) {

  navigationBlocks.forEach(
    navigation => {

      const links =
        navigation.querySelectorAll(
          ".chapter_navigation-link"
        );

      const previousLink = links[0];
      const contentsLink = links[1];
      const nextLink = links[2];


      /* Previous */

      if (currentIndex > 0) {

        const previousChapter =
          chapters[currentIndex - 1];

        previousLink.href =
          `chapter.html?chapter=${previousChapter.id}`;

        previousLink.textContent =
          `← ${previousChapter.title}`;

        previousLink.style.visibility =
          "visible";

      } else {

        previousLink.removeAttribute("href");
        previousLink.textContent = "";
        previousLink.style.visibility =
          "hidden";
      }


      /* Contents */

      contentsLink.href =
        "../story.html";


      /* Next */

      if (
        currentIndex <
        chapters.length - 1
      ) {

        const nextChapter =
          chapters[currentIndex + 1];

        nextLink.href =
          `chapter.html?chapter=${nextChapter.id}`;

        nextLink.textContent =
          `${nextChapter.title} →`;

        nextLink.style.visibility =
          "visible";

      } else {

        nextLink.removeAttribute("href");
        nextLink.textContent = "";
        nextLink.style.visibility =
          "hidden";
      }
    }
  );
}


/* ========================================
   DISPLAY CHAPTER
======================================== */

async function displayChapter(
  chapter,
  chapterIndex,
  chapters
) {

  try {

    /* Header */

    chapterTitle.textContent =
      chapter.title;

    chapterDate.textContent =
      formatDate(chapter.date);

    chapterDate.dateTime =
      chapter.date;


    /* Markdown */

    const markdown =
      await loadMarkdown(chapter.file);


    /* Markdown → HTML */

    chapterContent.innerHTML =
      marked.parse(markdown);


    /* Illustrations */

    insertIllustrations(
      chapterContent,
      chapter.illustrations
    );


    /* Navigation */

    setupNavigation(
      chapterIndex,
      chapters
    );


    /* Page title */

    document.title =
      `${chapter.title} — Zhozabel`;


    console.log(
      "CHAPTER LOADED:",
      chapter
    );

  } catch (error) {

    console.error(
      "CHAPTER ERROR:",
      error
    );

    chapterContent.innerHTML = `
      <p>
        Не удалось загрузить главу.
      </p>
    `;
  }
}


/* ========================================
   INITIALIZE
======================================== */

async function initChapterPage() {

  console.log(
    "CHAPTER JS STARTED"
  );


  const chapters =
    await loadChapters();


  if (!chapters) {
    return;
  }


  console.log(
    "CHAPTERS LOADED:",
    chapters
  );


  const chapterId =
    getChapterId();


  if (!chapterId) {

    chapterContent.innerHTML = `
      <p>
        Глава не указана.
      </p>
    `;

    return;
  }


  console.log(
    "REQUESTED CHAPTER:",
    chapterId
  );


  const chapterIndex =
    chapters.findIndex(
      chapter =>
        chapter.id === chapterId
    );


  if (chapterIndex === -1) {

    chapterContent.innerHTML = `
      <p>
        Глава не найдена.
      </p>
    `;

    return;
  }


  const chapter =
    chapters[chapterIndex];


  await displayChapter(
    chapter,
    chapterIndex,
    chapters
  );
}


/* ========================================
   START
======================================== */

initChapterPage();
