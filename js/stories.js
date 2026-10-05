const timeline = document.querySelector("#stories-timeline");

const statusLabels = {
  completed: "Completed",
  "in-progress": "In progress",
  hiatus: "Hiatus",
  abandoned: "Abandoned"
};


async function loadStories() {
  const response = await fetch("data/stories.json");
  const stories = await response.json();

  renderStories(stories);
}


function renderStories(stories) {
  const groupedStories = groupStoriesByYear(stories);

  const years = Object.keys(groupedStories)
    .sort((a, b) => b - a);

  timeline.innerHTML = "";

  years.forEach(year => {
    const yearElement = createYear(year, groupedStories[year]);
    timeline.appendChild(yearElement);
  });
}


function groupStoriesByYear(stories) {
  return stories.reduce((groups, story) => {
    const year = new Date(story.date).getFullYear();

    if (!groups[year]) {
      groups[year] = [];
    }

    groups[year].push(story);

    return groups;
  }, {});
}

function createYear(year, stories) {
  const yearElement = document.createElement("section");
  yearElement.className = "year";

  yearElement.innerHTML = `
  <div class="year_header">
    <span class="year_title">${year}</span>
  </div>

    <div class="year_content">
      <div class="story_list"></div>
    </div>
  `;

  const storyList = yearElement.querySelector(".story_list");

  stories.forEach(story => {
    storyList.appendChild(createStoryCard(story));
  });

  return yearElement;
}

function createStoryCard(story) {
  console.log("STORY:", story);
  console.log("STATUS:", story.status);
  const card = document.createElement("a");

  card.className = "story_card";
  card.href = `stories/${story.id}.html`;

  const statusLabel = statusLabels[story.status] ?? story.status;
  console.log("STATUS LABEL:", statusLabel);

  const fandom = story.type === "fanfiction"
    ? story.fandom
    : "Original";

  const genres = story.genres
    .map(genre => `<span>${genre}</span>`)
    .join("");

  card.innerHTML = `
    <div class="story_card_cover">
      <img
        class="story_card_cover-image"
        src="${story.cover}"
        alt="${story.title}"
      >

      <span class="story_status story_status--${story.status}">
        ${statusLabel}
      </span>
    </div>

    <div class="story_card_info">
      <h2 class="story_card_title">
        ${story.title}
      </h2>

      <div class="story_card_meta">
        ${fandom}
      </div>

      <div class="story_card_tags">
        ${genres}
      </div>

      <div class="story_card_chapters">
        ${story.chapters} chapters
      </div>
    </div>
  `;

  console.log(
    "STATUS ELEMENT:",
    card.querySelector(".story_status")
  );

  return card;
}

loadStories();
