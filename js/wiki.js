
const fandomsContainer = document.querySelector(".wiki_fandoms");

// ========================================
// LOCALIZED TEXT
// ========================================

function getLocalizedText(value) {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const language = document.documentElement.lang;

  return value[language] || value.en || value.ru || "";
}

// ========================================
// LOAD CHARACTERS
// ========================================

async function loadCharacters() {
  const files = [
    "../data/canon-characters.json",
    "../data/original-characters.json",
    "../data/other-characters.json"
  ];

  const responses = await Promise.all(
    files.map(file => fetch(file))
  );

  for (const response of responses) {
    if (!response.ok) {
      throw new Error(
        `Не удалось загрузить файл: ${response.url}`
      );
    }
  }

  const characterGroups = await Promise.all(
    responses.map(response => response.json())
  );

  // Оставляем только персонажей с заполненным file
  return characterGroups
    .flat()
    .filter(character =>
      typeof character.file === "string" &&
      character.file.trim() !== ""
    );
}

// ========================================
// GROUP BY FANDOM
// ========================================

function groupByFandom(characters) {
  return characters.reduce((groups, character) => {
    const fandom =
      getLocalizedText(character.fandom) || "Other";

    if (!groups[fandom]) {
      groups[fandom] = [];
    }

    groups[fandom].push(character);

    return groups;
  }, {});
}

// ========================================
// CREATE CHARACTER CARD
// ========================================

function createCharacterCard(character) {
  const card = document.createElement("a");

  card.className = "wiki_character";

  // Пока используем существующую страницу персонажа
  card.href =
    `character.html?character=${encodeURIComponent(character.id)}`;

  // Image
  if (character.portrait) {
    const image = document.createElement("img");

    image.className = "wiki_character-image";
    image.src = `../${character.portrait}`;
    image.alt = getLocalizedText(character.name);
    image.loading = "lazy";

    card.appendChild(image);
  }

  // Info
  const info = document.createElement("div");

  info.className = "wiki_character-info";

  const name = document.createElement("h3");

  name.className = "wiki_character-name";
  name.textContent = getLocalizedText(character.name);

  info.appendChild(name);

  // Description (если она есть)
  if (character.description) {
    const description = document.createElement("p");

    description.className = "wiki_character-description";
    description.textContent =
      getLocalizedText(character.description);

    info.appendChild(description);
  }

  card.appendChild(info);

  return card;
}

// ========================================
// CREATE FANDOM SECTION
// ========================================

function createFandomSection(fandom, characters) {
  const section = document.createElement("section");

  section.className = "wiki_fandom";

  const title = document.createElement("h2");

  title.className = "wiki_fandom-title";
  title.textContent = fandom;

  const charactersGrid = document.createElement("div");

  charactersGrid.className = "wiki_characters";

  characters.forEach(character => {
    const card = createCharacterCard(character);

    charactersGrid.appendChild(card);
  });

  section.appendChild(title);
  section.appendChild(charactersGrid);

  return section;
}

// ========================================
// RENDER WIKI
// ========================================

function renderWiki(characters) {
  fandomsContainer.innerHTML = "";

  if (characters.length === 0) {
    fandomsContainer.textContent =
      getTranslation("wiki.empty");
    return;
  }

  const groupedCharacters = groupByFandom(characters);

  Object.entries(groupedCharacters).forEach(
    ([fandom, fandomCharacters]) => {
      const section = createFandomSection(
        fandom,
        fandomCharacters
      );

      fandomsContainer.appendChild(section);
    }
  );
}

// ========================================
// INIT
// ========================================

async function initWiki() {
  try {
    const characters = await loadCharacters();

    console.log(
      `Wiki: загружено персонажей — ${characters.length}`
    );

    renderWiki(characters);
  } catch (error) {
    console.error("Ошибка загрузки Wiki:", error);

    fandomsContainer.textContent =
      getTranslation("wiki.loadError");
  }
}

initWiki();

// ========================================
// LANGUAGE CHANGE
// ========================================

document.addEventListener("languageChanged", initWiki);
