const fandomsContainer = document.querySelector(".wiki_fandoms");


// ========================================
// LOAD CHARACTERS
// ========================================

async function loadCharacters() {
  const response = await fetch("../data/characters.json");

  if (!response.ok) {
    throw new Error("Не удалось загрузить characters.json");
  }

  return await response.json();
}


// ========================================
// GROUP BY FANDOM
// ========================================

function groupByFandom(characters) {
  return characters.reduce((groups, character) => {

    const fandom = character.fandom || "other";

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
  card.href = `character.html?character=${character.id}`;


  // Image

  const image = document.createElement("img");

  image.className = "wiki_character-image";
  image.src = `../${character.portrait}`;
  image.alt = character.name;

  image.loading = "lazy";


  // Info

  const info = document.createElement("div");

  info.className = "wiki_character-info";


  const name = document.createElement("h3");

  name.className = "wiki_character-name";
  name.textContent = character.name;


  info.appendChild(name);


  // Description (если она есть)

  if (character.description) {

    const description = document.createElement("p");

    description.className = "wiki_character-description";
    description.textContent = character.description;

    info.appendChild(description);
  }


  card.appendChild(image);
  card.appendChild(info);


  return card;
}


// ========================================
// CREATE FANDOM SECTION
// ========================================

function createFandomSection(fandom, characters) {

  const section = document.createElement("section");

  section.className = "wiki_fandom";


  // Fandom title

  const title = document.createElement("h2");

  title.className = "wiki_fandom-title";
  title.textContent = fandom;


  // Characters grid

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

    renderWiki(characters);

  } catch (error) {

    console.error(error);

    fandomsContainer.innerHTML = `
      <p>
        Не удалось загрузить персонажей.
      </p>
    `;
  }
}


initWiki();
