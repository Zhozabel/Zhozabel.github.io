async function loadStory() {
  try {
    const storyId = getStoryId();

    console.log("Story ID:", storyId);

    const response = await fetch("../data/stories.json");

    if (!response.ok) {
      throw new Error(
        `Failed to load stories.json: ${response.status}`
      );
    }

    const stories = await response.json();

    console.log("Stories:", stories);

    const story = stories.find(
      story => story.id === storyId
    );

    if (!story) {
      throw new Error(
        `Story "${storyId}" not found`
      );
    }

    console.log("Found story:", story);

    renderStory(story);

    await loadChapters(story.id);

  } catch (error) {
    console.error(
      "Failed to load story:",
      error
    );
  }
}


function getStoryId() {
  const fileName =
    window.location.pathname
      .split("/")
      .pop();

  return fileName.replace(".html", "");
}


function renderStory(story) {

  document.title =
    `${story.title} — Zhozabel`;


  // TITLE

  document.querySelector(
    ".story_title"
  ).textContent =
    story.title;


  // BANNER

  const bannerImage =
    document.querySelector(
      ".story_banner-image"
    );

  if (story.banner) {

    bannerImage.src =
      `../${story.banner}`;

    bannerImage.alt =
      story.title;

  }


  // BANNER GENRES

  const bannerGenres =
    document.querySelector(
      ".story_banner-genres"
    );

  renderChips(
    bannerGenres,
    story.genres.slice(0, 3)
  );


  // COVER

  const coverImage =
    document.querySelector(
      ".story_cover-image"
    );

  coverImage.src =
    `../${story.cover}`;

  coverImage.alt =
    story.title;


  // DESCRIPTION

  const description =
    document.querySelector(
      ".story_description-text"
    );

  description.innerHTML = "";

  story.description
    .split("\n")
    .filter(Boolean)
    .forEach(text => {

      const paragraph =
        document.createElement("p");

      paragraph.textContent =
        text;

      description.appendChild(
        paragraph
      );

    });


  // GENRES

  const genres =
    document.querySelector(
      ".story_genres"
    );

  renderChips(
    genres,
    story.genres
  );


  // RATING

  const rating =
    document.querySelector(
      ".story_rating"
    );

  rating.textContent =
    story.rating;

  rating.className =
    `story_rating story_rating--${story.rating}`;


  // WARNINGS

  const warnings =
    document.querySelector(
      ".story_warnings"
    );

  renderChips(
    warnings,
    story.warnings
  );

}


async function loadChapters(storyId) {

  const response =
    await fetch(
      `../data/stories/${storyId}.json`
    );

  if (!response.ok) {

    throw new Error(
      `Failed to load chapters: ${response.status}`
    );

  }

  const chapters =
    await response.json();

  console.log(
    "Chapters:",
    chapters
  );

  renderChapters(chapters);
}


function renderChapters(chapters) {

  const container =
    document.querySelector(
      ".story_chapter-list"
    );

  container.innerHTML = "";


  chapters.forEach(chapter => {

    const chapterElement =
      document.createElement("a");

    chapterElement.className =
      "story_chapter";

    chapterElement.href =
      `chapter.html?id=${chapter.id}`;


    chapterElement.innerHTML = `

      <div class="story_chapter-cover">

        <img
          src="../${chapter.cover}"
          alt="${chapter.title}"
        >

      </div>


      <div class="story_chapter-info">

        <div class="story_chapter-title">
          ${chapter.title}
        </div>

        <div class="story_chapter-date">
          ${formatDate(chapter.date)}
        </div>

      </div>

    `;


    container.appendChild(
      chapterElement
    );

  });

}


function renderChips(
  container,
  items
) {

  container.innerHTML = "";

  items.forEach(item => {

    const chip =
      document.createElement(
        "span"
      );

    chip.textContent =
      item;

    container.appendChild(
      chip
    );

  });

}


function formatDate(date) {

  return new Date(date)
    .toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric"
      }
    );

}


loadStory();
