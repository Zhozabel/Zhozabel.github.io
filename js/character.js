
// ========================================
// CHARACTER PAGE
// ========================================

const characterFandom = document.querySelector("#characterFandom");
const characterTitle = document.querySelector("#characterTitle");

const characterForms = document.querySelector("#characterForms");
const characterPortrait = document.querySelector("#characterPortrait");

const characterDetails = document.querySelector("#characterDetails");
const characterConnections = document.querySelector("#characterConnections");

const characterPersonality = document.querySelector("#characterPersonality");
const characterAppearance = document.querySelector("#characterAppearance");

// Новые динамические контейнеры из character.html.
// Старые элементы истории и способностей оставлены как fallback.
const characterStorySections =
  document.querySelector("#characterStorySections");

const characterAbilitiesSections =
  document.querySelector("#characterAbilitiesSections");

const characterPast = document.querySelector("#characterPast");
const characterSeason1 = document.querySelector("#characterSeason1");
const characterSeason2 = document.querySelector("#characterSeason2");
const characterBlankPeriod = document.querySelector("#characterBlankPeriod");
const characterBoruto = document.querySelector("#characterBoruto");

const characterAbilities = document.querySelector("#characterAbilities");
const characterWeapons = document.querySelector("#characterWeapons");

const characterRelationships = document.querySelector("#characterRelationships");
const characterGallery = document.querySelector("#characterGallery");

const GALLERY_PAGE_SIZE = 4;

const CHARACTER_FILES = [
  "../data/canon-characters.json",
  "../data/original-characters.json",
  "../data/other-characters.json"
];

let currentCharacter = null;
let currentCharacterData = null;
let currentTextData = null;
let currentCharacters = [];

let currentForm = null;
let currentForms = [];

let galleryWorks = [];
let galleryPage = 0;

let galleryPreviousButton = null;
let galleryNextButton = null;

let initializationId = 0;


// ========================================
// LANGUAGE
// ========================================

function getCurrentLanguage() {
  return document.documentElement.lang === "ru" ? "ru" : "en";
}


function getCharacterTranslation(key) {
  const translations = window.siteTranslations || {};

  return key.split(".").reduce(
    (value, part) => value?.[part],
    translations
  );
}


function getLocalizedText(value) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const language = getCurrentLanguage();

  return value[language] ?? value.en ?? value.ru ?? "";
}


function getLabel(key, fallback = "") {
  const value = getCharacterTranslation(`character.fields.${key}`);

  if (typeof value === "string") {
    return value;
  }

  return fallback;
}


// ========================================
// URLS AND IMAGES
// ========================================

function getCharacterId() {
  return new URLSearchParams(window.location.search).get("character");
}


function getImagePath(path) {
  if (!path || typeof path !== "string") {
    return "";
  }

  if (/^(https?:\/\/|data:|blob:)/i.test(path)) {
    return path;
  }

  path = path.replace(/^image\//, "images/");

  return `../${path.replace(/^\/+/, "")}`;
}


function getTextFilePath(file, language) {
  return `../${file
    .replace(/^\/+/, "")
    .replace(/character\.json$/, `text-${language}.json`)}`;
}


// ========================================
// DATA LOADING
// ========================================

async function fetchJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Не удалось загрузить файл: ${path}`);
  }

  return response.json();
}


async function loadCharacters() {
  const catalogues = await Promise.all(
    CHARACTER_FILES.map(fetchJSON)
  );

  return catalogues
    .flat()
    .filter(character =>
      character &&
      typeof character.id === "string" &&
      character.id.trim() !== ""
    );
}



async function loadCharacterFile(file) {
  return fetchJSON(`../${file.replace(/^\/+/, "")}`);
}


async function loadCharacterTexts(file, language) {
  return fetchJSON(getTextFilePath(file, language));
}



function findCharacter(characters, characterId) {
  return characters.find(character =>
    character.id === characterId &&
    typeof character.file === "string" &&
    character.file.trim() !== ""
  );
}



function findCatalogCharacter(characterId) {
  return currentCharacters.find(character => character.id === characterId);
}


// ========================================
// GENERAL HELPERS
// ========================================

function hasContent(value) {
  if (Array.isArray(value)) {
    return value.some(hasContent);
  }

  if (value && typeof value === "object") {
    return Object.values(value).some(hasContent);
  }

  return value !== null &&
    value !== undefined &&
    String(value).trim() !== "";
}


function renderText(element, value) {
  if (!element) {
    return;
  }

  element.replaceChildren();

  const values = Array.isArray(value)
    ? value
    : value !== null && value !== undefined
      ? [value]
      : [];

  values.forEach(item => {
    const text = getLocalizedText(item);

    if (!text) {
      return;
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = text;

    element.appendChild(paragraph);
  });
}


function renderParagraphs(element, paragraphs) {
  renderText(element, paragraphs);
}


function appendDetailRow(container, label, value) {
  if (!container || !hasContent(value)) {
    return;
  }

  const row = document.createElement("div");
  row.className = "character_detail";

  const term = document.createElement("dt");
  term.textContent = label;

  const description = document.createElement("dd");
  description.textContent = value;

  row.append(term, description);
  container.appendChild(row);
}


// ========================================
// LOCALIZED DATA VALUES
// ========================================

// Преобразует коды из character.json в подписи из text-ru/en.json.
// Поддерживает строки, массивы кодов и словари переводов.


function resolveDataValue(value, dictionary) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map(item => resolveDataValue(item, dictionary))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return getLocalizedText(value);
  }

  // В языковом JSON может быть уже готовый перевод:
  // gender: "Female", hairColor: "Caramel".
  if (typeof dictionary === "string") {
    return dictionary;
  }

  // Или словарь кодов:
  // magic: { "constellation-magic": "Constellation Magic" }.
  if (
    dictionary &&
    typeof dictionary === "object" &&
    Object.prototype.hasOwnProperty.call(dictionary, String(value))
  ) {
    return resolveDataValue(dictionary[String(value)]);
  }

  // Если перевода нет, показываем исходное значение.
  return String(value);
}



// ========================================
// BASIC INFORMATION
// ========================================

const DETAIL_FIELDS = [
  ["gender", "Пол", "Gender"],
  ["birthDate", "Дата рождения", "Date of birth"],
  ["birthPlace", "Место рождения", "Place of birth"],
  ["age", "Возраст", "Age"],
  ["height", "Рост", "Height"],
  ["weight", "Вес", "Weight"],
  ["status", "Статус", "Status"],
  ["hairColor", "Цвет волос", "Hair color"],
  ["eyeColor", "Цвет глаз", "Eye color"],
  ["bloodType", "Группа крови", "Blood type"],
  ["residence", "Место жительства", "Residence"],
  ["clan", "Клан", "Clan"],
  ["affiliation", "Принадлежность", "Affiliation"],
  ["occupation", "Профессия", "Occupation"],
  ["rank", "Ранг", "Rank"],
  ["natureElements", "Стихии природы", "Nature types"],
  ["kekkeiGenkai", "Кеккей генкай", "Kekkei genkai"],
  ["summoning", "Призыв", "Summoning"],
  ["magic", "Магия", "Magic"]
];


function formatBirthDate(value) {
  if (!value || typeof value !== "object") {
    return getLocalizedText(value);
  }

  const {day, month, year} = value;

  const monthNames = {
    ru: [
      "января", "февраля", "марта", "апреля",
      "мая", "июня", "июля", "августа",
      "сентября", "октября", "ноября", "декабря"
    ],
    en: [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
    ]
  };

  const language = getCurrentLanguage();
  const monthName = monthNames[language][Number(month) - 1];

  if (!day && !monthName && !year) {
    return "";
  }

  if (language === "ru") {
    return [
      day ? `${day}${monthName ? " " : ""}` : "",
      monthName || "",
      year || ""
    ].filter(Boolean).join(" ").trim();
  }

  return [
    monthName || "",
    day ? `${day}${year ? "," : ""}` : "",
    year || ""
  ].filter(Boolean).join(" ").trim();
}


function renderDetails() {
  if (!characterDetails || !currentCharacterData) {
    return;
  }

  characterDetails.replaceChildren();

  const language = getCurrentLanguage();
  const mainBasic = currentCharacterData.basic || {};
  const formBasic = currentForm?.basic || {};
  const dictionaries = currentTextData?.basic || {};
  const formLabels = currentTextData?.forms?.[currentForm?.id]?.basic || {};

  DETAIL_FIELDS.forEach(([key, ruLabel, enLabel]) => {
    // null в форме означает «использовать основное значение».
    const formValue = formBasic[key];
    const mainValue = mainBasic[key];

    const value = formValue !== null && formValue !== undefined
      ? formValue
      : mainValue;

    if (!hasContent(value)) {
      return;
    }

    let formattedValue;

    if (key === "birthDate") {
      formattedValue = formatBirthDate(value);
    } else {
      formattedValue = resolveDataValue(value, dictionaries[key]);
    }

    const label = formLabels[key] ||
      getLabel(key, language === "ru" ? ruLabel : enLabel);

    appendDetailRow(characterDetails, label, formattedValue);
  });
}


// ========================================
// CONNECTIONS
// ========================================

function getCatalogName(characterId) {
  const character = findCatalogCharacter(characterId);

  return character ? getLocalizedText(character.name) : characterId;
}


function renderConnectionList(items, getText) {
  if (!Array.isArray(items)) {
    return "";
  }

  return items
    .map(item => {
      const text = getText(item);
      return text ? String(text) : "";
    })
    .filter(Boolean)
    .join(",\n");
}


function renderConnections(connections = {}) {
  if (!characterConnections) {
    return;
  }

  characterConnections.replaceChildren();

  const language = getCurrentLanguage();
  const dictionaries = currentTextData?.connections || {};

  const labels = {
    team: language === "ru" ? "Команда" : "Team",
    comrades: language === "ru" ? "Товарищи" : "Teammates",
    clan: language === "ru" ? "Клан" : "Clan",
    relatives: language === "ru" ? "Родственники" : "Relatives"
  };

  const team = connections.team
    ? resolveDataValue(connections.team, dictionaries.team)
    : "";

  appendDetailRow(characterConnections, labels.team, team);

  const relatives = renderConnectionList(
    connections.relatives,
    item => {
      if (!item || typeof item !== "object") {
        return getLocalizedText(item);
      }

      const name = getCatalogName(item.id);
      const relation = resolveDataValue(item.relation, dictionaries.relations);

      return relation ? `${name} (${relation})` : name;
    }
  );

  appendDetailRow(characterConnections, labels.relatives, relatives);

  const comrades = renderConnectionList(
    connections.comrades,
    item => {
      if (!item || typeof item !== "object") {
        return getLocalizedText(item);
      }

      const name = getCatalogName(item.id);
      const role = resolveDataValue(item.role, dictionaries.roles);

      return role ? `${name} (${role})` : name;
    }
  );

  appendDetailRow(characterConnections, labels.comrades, comrades);

  const clan = resolveDataValue(connections.clan);
  appendDetailRow(characterConnections, labels.clan, clan);
}


// ========================================
// FORM SWITCHER
// ========================================

function getFormTextData(form) {
  return currentTextData?.forms?.[form?.id] || {};
}


function getFormName(form) {
  return getLocalizedText(getFormTextData(form).name) ||
    getLocalizedText(form?.name) ||
    form?.id ||
    "";
}


function createFormButton(form, index) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "character_form";
  button.setAttribute("aria-pressed", String(form.id === currentForm?.id));

  if (form.id === currentForm?.id || (!currentForm && index === 0)) {
    button.classList.add("active");
  }

  const image = document.createElement("img");
  image.className = "character_form-image";

  const portrait = form.portrait || currentCharacter?.portrait;

  if (portrait) {
    image.src = getImagePath(portrait);
  }

  image.alt = getFormName(form);
  image.loading = "lazy";

  const name = document.createElement("span");
  name.className = "character_form-name";
  name.textContent = getFormName(form);

  button.append(image, name);

  button.addEventListener("click", () => {
    selectForm(form);
  });

  return button;
}


function renderForms() {
  if (!characterForms) {
    return;
  }

  characterForms.replaceChildren();

  if (currentForms.length <= 1) {
    characterForms.hidden = true;
    return;
  }

  characterForms.hidden = false;

  currentForms.forEach((form, index) => {
    characterForms.appendChild(createFormButton(form, index));
  });
}


function selectForm(form) {
  currentForm = form;

  renderForms();
  updatePortrait();
  renderDetails();
}


function updatePortrait() {
  if (!characterPortrait || !currentCharacter) {
    return;
  }

  const portrait = currentForm?.portrait || currentCharacter.portrait;

  if (portrait) {
    characterPortrait.src = getImagePath(portrait);
  } else {
    characterPortrait.removeAttribute("src");
  }

  characterPortrait.alt = getLocalizedText(currentCharacter.name);
}


// ========================================
// PERSONALITY AND APPEARANCE
// ========================================

function renderFormText(key, target) {
  if (!target) {
    return;
  }

  target.replaceChildren();

  currentForms.forEach(form => {
    const formText = getFormTextData(form);
    const paragraphs = formText[key];

    if (!hasContent(paragraphs)) {
      return;
    }

    const values = Array.isArray(paragraphs) ? paragraphs : [paragraphs];

    values.forEach(value => {
      const text = getLocalizedText(value);

      if (!text) {
        return;
      }

      const paragraph = document.createElement("p");

      if (currentForms.length > 1) {
        const strong = document.createElement("strong");
        strong.textContent = `${getFormName(form)}: `;
        paragraph.appendChild(strong);
      }

      paragraph.appendChild(document.createTextNode(text));
      target.appendChild(paragraph);
    });
  });
}


// ========================================
// DYNAMIC STORY SECTIONS
// ========================================

function createCharacterArticle(title, paragraphs, className = "character_article") {
  if (!hasContent(paragraphs)) {
    return null;
  }

  const article = document.createElement("article");
  article.className = className;

  const heading = document.createElement("h3");
  heading.className = "character_article-title";
  heading.textContent = title;

  const textContainer = document.createElement("div");
  textContainer.className = "character_article-text";

  renderParagraphs(textContainer, paragraphs);

  article.append(heading, textContainer);

  return article;
}


function renderDynamicStory() {
  if (!characterStorySections) {
    return false;
  }

  characterStorySections.replaceChildren();

  // Порядок ID задаётся в character.json через form.storySections.
  // Повторяющиеся ID показываем один раз.
  const seen = new Set();

  currentForms.forEach(form => {
    const formText = getFormTextData(form);
    const story = formText.story || {};
    const sectionIds = Array.isArray(form.storySections)
      ? form.storySections
      : Object.keys(story);

    sectionIds.forEach(id => {
      if (seen.has(id)) {
        return;
      }

      const section = story[id];

      if (!section || !hasContent(section.paragraphs)) {
        return;
      }

      seen.add(id);

      const article = createCharacterArticle(
        getLocalizedText(section.title) || id,
        section.paragraphs
      );

      if (article) {
        characterStorySections.appendChild(article);
      }
    });
  });

  return true;
}


function renderLegacyStory() {
  const legacySections = [
    ["past", characterPast],
    ["season1", characterSeason1],
    ["season2", characterSeason2],
    ["blankPeriod", characterBlankPeriod],
    ["boruto", characterBoruto]
  ];

  legacySections.forEach(([key, element]) => {
    if (!element) {
      return;
    }

    element.replaceChildren();

    currentForms.forEach(form => {
      const section = getFormTextData(form).story?.[key];

      if (section) {
        renderParagraphs(element, section.paragraphs ?? section);
      }
    });
  });
}


// ========================================
// DYNAMIC ABILITIES AND EQUIPMENT
// ========================================

function renderNamedSections(container, idsKey, dataKey) {
  if (!container) {
    return false;
  }

  container.replaceChildren();

  currentForms.forEach(form => {
    const formText = getFormTextData(form);
    const dictionary = formText[dataKey] || {};

    const ids = Array.isArray(form[idsKey])
      ? form[idsKey]
      : Object.keys(dictionary);

    ids.forEach(id => {
      const section = dictionary[id];

      if (!section || !hasContent(section.description)) {
        return;
      }

      const article = createCharacterArticle(
        getLocalizedText(section.name) || id,
        section.description
      );

      if (article) {
        container.appendChild(article);
      }
    });
  });

  return true;
}


function renderLegacyNamedSections(container, idsKey, dataKey) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  currentForms.forEach(form => {
    const formText = getFormTextData(form);
    const dictionary = formText[dataKey] || {};

    const ids = Array.isArray(form[idsKey])
      ? form[idsKey]
      : Object.keys(dictionary);

    ids.forEach(id => {
      const section = dictionary[id];

      if (section) {
        const article = createCharacterArticle(
          getLocalizedText(section.name) || id,
          section.description
        );

        if (article) {
          container.appendChild(article);
        }
      }
    });
  });
}


function renderBiography() {
  renderFormText("personality", characterPersonality);
  renderFormText("appearance", characterAppearance);

  if (!renderDynamicStory()) {
    renderLegacyStory();
  }

  if (!renderNamedSections(characterAbilitiesSections, "abilities", "abilities")) {
    renderLegacyNamedSections(characterAbilities, "abilities", "abilities");
  }

  renderLegacyNamedSections(characterWeapons, "equipment", "equipment");
}


// ========================================
// RELATIONSHIPS
// ========================================

function createHeartRating(rating) {
  const container = document.createElement("div");
  container.className = "character_relationship-rating";

  const total = 6;
  const value = Math.max(0, Math.min(total, Number(rating) || 0));

  for (let index = 1; index <= total; index++) {
    const heart = document.createElement("span");
    const filled = index <= value;

    heart.className = filled ? "filled" : "empty";
    heart.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <use href="#${filled ? "heart_fill" : "heart_empty"}"></use>
      </svg>
    `;

    container.appendChild(heart);
  }

  return container;
}


function renderRelationships(relationships) {
  if (!characterRelationships) {
    return;
  }

  characterRelationships.replaceChildren();

  if (!Array.isArray(relationships)) {
    return;
  }

  const textRelationships = currentTextData?.relationships || {};

  relationships.forEach(relationship => {
    const characterId = relationship.character;
    const catalogCharacter = findCatalogCharacter(characterId);
    const localizedRelationship = textRelationships[characterId] || {};

    const card = document.createElement("a");
    card.className = "character_relationship";

    if (catalogCharacter) {
      card.href =
        `character.html?character=${encodeURIComponent(characterId)}`;
    } else {
      card.removeAttribute("href");
    }

    const portrait = catalogCharacter?.portrait ||
      localizedRelationship.portrait ||
      relationship.portrait;

    if (portrait) {
      const image = document.createElement("img");

      image.className = "character_relationship-image";
      image.src = getImagePath(portrait);
      image.alt = getLocalizedText(catalogCharacter?.name) ||
        getLocalizedText(localizedRelationship.name) ||
        characterId;
      image.loading = "lazy";

      card.appendChild(image);
    }

    const info = document.createElement("div");
    info.className = "character_relationship-info";

    const name = document.createElement("h3");
    name.className = "character_relationship-name";
    name.textContent =
      getLocalizedText(catalogCharacter?.name) ||
      getLocalizedText(localizedRelationship.name) ||
      characterId ||
      "—";

    info.appendChild(name);

    if (relationship.rating !== undefined) {
      info.appendChild(createHeartRating(relationship.rating));
    }

    if (hasContent(localizedRelationship.description)) {
      const description = document.createElement("p");
      description.className = "character_relationship-description";
      description.textContent = getLocalizedText(localizedRelationship.description);

      info.appendChild(description);
    }

    card.appendChild(info);
    characterRelationships.appendChild(card);
  });
}


// ========================================
// GALLERY
// ========================================

function createGalleryLayout() {
  if (!characterGallery) {
    return;
  }

  characterGallery.replaceChildren();

  const slider = document.createElement("div");
  slider.className = "character_gallery-slider";

  galleryPreviousButton = document.createElement("button");
  galleryPreviousButton.type = "button";
  galleryPreviousButton.className =
    "character_gallery-arrow character_gallery-arrow-prev";

  galleryPreviousButton.setAttribute(
    "aria-label",
    getCurrentLanguage() === "ru"
      ? "Предыдущие работы"
      : "Previous works"
  );

  galleryPreviousButton.innerHTML = `
    <svg
      class="leftchevron"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
    >
      <use href="../images/icons/navigation.svg#chevron_left"></use>
    </svg>
  `;

  const track = document.createElement("div");
  track.className = "character_gallery-track";
  track.id = "characterGalleryTrack";

  galleryNextButton = document.createElement("button");
  galleryNextButton.type = "button";
  galleryNextButton.className =
    "character_gallery-arrow character_gallery-arrow-next";

  galleryNextButton.setAttribute(
    "aria-label",
    getCurrentLanguage() === "ru"
      ? "Следующие работы"
      : "Next works"
  );

  galleryNextButton.innerHTML = `
    <svg
      class="rightchevron"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
    >
      <use href="../images/icons/navigation.svg#chevron_right"></use>
    </svg>
  `;

  slider.append(galleryPreviousButton, track, galleryNextButton);
  characterGallery.appendChild(slider);

  galleryPreviousButton.addEventListener("click", () => {
    if (galleryPage > 0) {
      galleryPage--;
      renderGalleryPage();
    }
  });

  galleryNextButton.addEventListener("click", () => {
    const totalPages = Math.ceil(galleryWorks.length / GALLERY_PAGE_SIZE);

    if (galleryPage < totalPages - 1) {
      galleryPage++;
      renderGalleryPage();
    }
  });
}


function createGalleryItem(work) {
  const card = document.createElement("article");
  card.className = "art_card character_gallery-item";
  card.dataset.id = work.id || "";

  const link = document.createElement("a");
  link.className = "art_card_link";

  const imagePath = getLocalizedText(work.image || work.src || work.path);

  const viewerUrl = new URL("viewer.html", window.location.href);
  viewerUrl.searchParams.set("source", work.viewerSource);
  viewerUrl.searchParams.set("id", work.id);

  link.href = viewerUrl.href;

  const image = document.createElement("img");
  image.className = "art_card_image";
  image.src = getImagePath(imagePath);
  image.alt = getLocalizedText(currentCharacter?.name);
  image.loading = "lazy";
  image.decoding = "async";

  link.appendChild(image);
  card.appendChild(link);

  if (work.blur) {
    card.classList.add("is_blurred");

    const button = document.createElement("button");
    button.className = "art_reveal";
    button.type = "button";

    const language = getCurrentLanguage();

    const revealText =
      getCharacterTranslation("art.reveal") ||
      (language === "ru" ? "Нажмите, чтобы открыть" : "Click to reveal");

    button.setAttribute("aria-label", revealText);

    if (Array.isArray(work.warnings) && work.warnings.length > 0) {
      const warning = document.createElement("div");
      warning.className = "art_warning";

      const title = getCharacterTranslation("art.contentWarning") ||
        (language === "ru" ? "Предупреждение" : "Content warning");

      const labels = work.warnings.map(item => {
        const translation = getCharacterTranslation(`art.warningLabels.${item}`);
        return typeof translation === "string" ? translation : item;
      });

      warning.textContent = `${title}: ${labels.join(", ")}`;
      button.appendChild(warning);
    }

    const action = document.createElement("span");
    action.className = "art_reveal_action";
    action.textContent = revealText;
    button.appendChild(action);

    button.addEventListener("click", () => {
      card.classList.remove("is_blurred");
      button.remove();
    });

    card.appendChild(button);
  }

  return card;
}


function renderGalleryPage() {
  const track = document.querySelector("#characterGalleryTrack");

  if (!track) {
    return;
  }

  track.replaceChildren();

  const start = galleryPage * GALLERY_PAGE_SIZE;
  const pageWorks = galleryWorks.slice(start, start + GALLERY_PAGE_SIZE);

  pageWorks.forEach(work => {
    track.appendChild(createGalleryItem(work));
  });

  track.classList.toggle(
    "character_gallery-track--short",
    pageWorks.length > 0 && pageWorks.length < GALLERY_PAGE_SIZE
  );

  const totalPages = Math.ceil(galleryWorks.length / GALLERY_PAGE_SIZE);

  galleryPreviousButton.disabled = galleryPage === 0;
  galleryNextButton.disabled = galleryPage >= totalPages - 1;

  const showArrows = totalPages > 1;

  galleryPreviousButton.hidden = !showArrows;
  galleryNextButton.hidden = !showArrows;
}


function renderGallery(gallery, resetPage = true) {
  if (!characterGallery) {
    return;
  }

  galleryWorks = Array.isArray(gallery) ? gallery : [];

  if (resetPage) {
    galleryPage = 0;
  }

  const totalPages = Math.ceil(galleryWorks.length / GALLERY_PAGE_SIZE);

  if (totalPages > 0) {
    galleryPage = Math.min(galleryPage, totalPages - 1);
  } else {
    galleryPage = 0;
  }

  if (galleryWorks.length === 0) {
    characterGallery.replaceChildren();

    const message = document.createElement("p");
    message.className = "character_gallery-empty";
    message.textContent = getCurrentLanguage() === "ru"
      ? "Работ пока нет."
      : "No works yet.";

    characterGallery.appendChild(message);
    return;
  }

  createGalleryLayout();
  renderGalleryPage();
}


// ========================================
// LOAD ARTWORKS AND GIFTS
// ========================================

async function loadGalleryWorks(characterId) {
  const files = [
    {path: "../data/artworks.json", source: "artworks"},
    {path: "../data/gifts.json", source: "gifts"}
  ];

  const results = await Promise.allSettled(
    files.map(file => fetchJSON(file.path))
  );

  const allWorks = results.flatMap((result, index) => {
    if (result.status !== "fulfilled") {
      console.warn(
        `Не удалось загрузить ${files[index].path}:`,
        result.reason
      );
      return [];
    }

    return Array.isArray(result.value)
      ? result.value.map(work => ({
        ...work,
        viewerSource: files[index].source
      }))
      : [];
  });

  const characterWorks = allWorks.filter(work =>
    Array.isArray(work.characters) &&
    work.characters.includes(characterId) &&
    work.type !== "video"
  );

  // Перемешиваем один раз при первой загрузке.
  for (let i = characterWorks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [characterWorks[i], characterWorks[j]] =
      [characterWorks[j], characterWorks[i]];
  }

  return characterWorks;
}


// ========================================
// PAGE RENDERING
// ========================================

function updateCharacterPage(character, characterData, textData) {
  currentCharacter = character;
  currentCharacterData = characterData;
  currentTextData = textData;

  currentForms = Array.isArray(characterData.forms)
    ? characterData.forms
    : [];

  const previousFormId = currentForm?.id;

  currentForm =
    currentForms.find(form => form.id === previousFormId) ||
    currentForms[0] ||
    null;

  if (characterFandom) {
    characterFandom.textContent = getLocalizedText(character.fandom);
  }

  if (characterTitle) {
    characterTitle.textContent = getLocalizedText(character.name);
  }

  renderForms();
  updatePortrait();
  renderDetails();

  renderConnections(characterData.connections || {});
  renderBiography();
  renderRelationships(characterData.relationships || []);
}


// ========================================
// INITIALIZATION
// ========================================

async function initCharacterPage({reloadBase = false} = {}) {
  const thisInitialization = ++initializationId;

  try {
    const characterId = getCharacterId();

    if (!characterId) {
      throw new Error("Не указан ID персонажа в URL.");
    }

    // Каталоги, основная анкета и галерея загружаются только один раз.
    if (reloadBase || !currentCharacter || !currentCharacterData) {
      currentCharacters = await loadCharacters();

      const character = findCharacter(currentCharacters, characterId);

      if (!character) {
        throw new Error(`Персонаж "${characterId}" не найден в каталогах.`);
      }

      const characterData = await loadCharacterFile(character.file);
      const works = await loadGalleryWorks(character.id);

      if (thisInitialization !== initializationId) {
        return;
      }

      currentCharacter = character;
      currentCharacterData = characterData;
      galleryWorks = works;
      galleryPage = 0;
    }

    const character = currentCharacter;
    const characterData = currentCharacterData;

    const textData = await loadCharacterTexts(
      character.file,
      getCurrentLanguage()
    );

    if (thisInitialization !== initializationId) {
      return;
    }

    updateCharacterPage(character, characterData, textData);
    renderGallery(galleryWorks, false);

  } catch (error) {
    console.error("Ошибка загрузки страницы персонажа:", error);

    if (characterTitle) {
      characterTitle.textContent = getCurrentLanguage() === "ru"
        ? "Не удалось загрузить персонажа"
        : "Unable to load character";
    }

    if (characterFandom) {
      characterFandom.textContent = "";
    }

    if (characterForms) {
      characterForms.replaceChildren();
      characterForms.hidden = true;
    }
  }
}


initCharacterPage();

document.addEventListener("languageChanged", () => {
  // Повторно загружаем только языковые тексты.
  // Каталоги и галерея остаются прежними.
  initCharacterPage();
});
