const characterFandom = document.querySelector("#characterFandom");
const characterTitle = document.querySelector("#characterTitle");

const characterForms = document.querySelector("#characterForms");
const characterPortrait = document.querySelector("#characterPortrait");

const characterDetails = document.querySelector("#characterDetails");
const characterConnections = document.querySelector("#characterConnections");

const characterPersonality = document.querySelector("#characterPersonality");
const characterAppearance = document.querySelector("#characterAppearance");

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

const warningLabels = {
  ambiguity: "Ambiguity",
  problematic: "Problematic",
  kissing: "Passionate kiss",
  blood: "Blood",
  violence: "Violence",
  gore: "Gore",
  nudity: "Nudity",
  risque: "Risqué humor",
  sex: "Sexual content",
  death: "Death"
};

let currentCharacter = null;
let currentForm = null;

let galleryWorks = [];
let galleryPage = 0;

let galleryPreviousButton = null;
let galleryNextButton = null;

/* =========================
   Загрузка данных
========================= */

async function loadCharacters() {
  const response = await fetch("../data/characters.json");

  if (!response.ok) {
    throw new Error("Не удалось загрузить characters.json");
  }

  return await response.json();
}


async function loadCharacterFile(file) {
  const response = await fetch(`../data/${file}`);

  if (!response.ok) {
    throw new Error(`Не удалось загрузить файл персонажа: ${file}`);
  }

  return await response.json();
}


async function loadWorks(file, type) {
  const response = await fetch(`../data/${file}`);

  if (!response.ok) {
    throw new Error(`Не удалось загрузить ${file}`);
  }

  const data = await response.json();

  return data.map(work => ({
    ...work,
    type
  }));
}


/* =========================
   URL
========================= */

function getCharacterId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("character");
}


/* =========================
   Поиск персонажа
========================= */

function findCharacter(characters, characterId) {
  return characters.find(character => {
    return character.id === characterId;
  });
}


/* =========================
   Изображения
========================= */

function getImagePath(path) {
  if (!path) {
    return "";
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  // В JSON путь начинается с image/,
  // а фактическая папка на сайте называется images/
  path = path.replace(/^image\//, "images/");

  return `../${path}`;
}

function renderWarnings(warnings) {
  if (!warnings || warnings.length === 0) {
    return "";
  }

  const warningText = warnings
    .map(warning => warningLabels[warning] ?? warning)
    .join(", ");

  return `
    <span class="character_gallery-warning">
      ⚠ Content warning: ${warningText}
    </span>
  `;
}

/* =========================
   Текст
========================= */

function renderText(element, value) {
  if (!element) {
    return;
  }

  element.innerHTML = "";

  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(paragraph => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      element.appendChild(p);
    });

    return;
  }

  const p = document.createElement("p");
  p.textContent = value;
  element.appendChild(p);
}


/* =========================
   Форматирование значений
========================= */

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—";
    }

    return value.join(", ");
  }

  return value;
}


/* =========================
   Основная информация
========================= */

function renderDetails(basic) {
  characterDetails.innerHTML = "";

  const details = [
    ["Пол", basic.gender],
    ["Дата рождения", basic.birthDate],
    ["Место рождения", basic.birthPlace],
    ["Возраст", basic.age],
    ["Рост", basic.height],
    ["Вес", basic.weight],
    ["Статус", basic.status],
    ["Место жительства", basic.residence],
    ["Клан", basic.clan],
    ["Принадлежность", basic.affiliation],
    ["Профессия", basic.occupation],
    ["Ранг", basic.rank],
    ["Стихии природы", basic.natureElements],
    ["Кеккей генкай", basic.kekkeiGenkai],
    ["Призыв", basic.summoning]
  ];

  details.forEach(([label, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    const row = document.createElement("div");
    row.className = "character_detail";

    const term = document.createElement("dt");
    term.textContent = label;

    const description = document.createElement("dd");
    description.textContent = formatValue(value);

    row.appendChild(term);
    row.appendChild(description);

    characterDetails.appendChild(row);
  });
}


/* =========================
   Связи
========================= */

function renderConnections(connections) {
  characterConnections.innerHTML = "";

  if (!connections) {
    return;
  }

  const details = [
    ["Команда", connections.team],
    ["Товарищи", connections.comrades],
    ["Клан", connections.clan],
    ["Родственники", connections.relatives]
  ];

  details.forEach(([label, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    const row = document.createElement("div");
    row.className = "character_detail";

    const term = document.createElement("dt");
    term.textContent = label;

    const description = document.createElement("dd");
    description.textContent = formatValue(value);

    row.appendChild(term);
    row.appendChild(description);

    characterConnections.appendChild(row);
  });
}


/* =========================
   Карточка формы / эпохи
========================= */

function createFormButton(form, index) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "character_form";

  if (index === 0) {
    button.classList.add("active");
  }

  const image = document.createElement("img");
  image.className = "character_form-image";
  image.src = getImagePath(form.portrait);
  image.alt = form.name || "";

  const name = document.createElement("span");
  name.className = "character_form-name";
  name.textContent = form.name || "";

  button.appendChild(image);
  button.appendChild(name);

  button.addEventListener("click", () => {
    selectForm(form, button);
  });

  return button;
}


/* =========================
   Формы / эпохи
========================= */

function renderForms(forms) {
  characterForms.innerHTML = "";

  /*
   * Если форм нет или есть только одна,
   * переключатель вообще не показываем.
   */
  if (!Array.isArray(forms) || forms.length <= 1) {
    characterForms.style.display = "none";
    return;
  }

  characterForms.style.display = "";

  forms.forEach((form, index) => {
    characterForms.appendChild(
      createFormButton(form, index)
    );
  });
}


function selectForm(form, button) {
  document
    .querySelectorAll(".character_form")
    .forEach(item => {
      item.classList.remove("active");
    });

  button.classList.add("active");

  currentForm = form;

  updateCharacter();
}


/* =========================
   Обновление страницы
========================= */

function updateCharacter() {
  if (!currentCharacter || !currentForm) {
    return;
  }

  const basic = {
    ...(currentCharacter.basic || {}),
    ...(currentForm.basic || {})
  };

  /*
   * Портрет
   */
  characterPortrait.src = getImagePath(
    currentForm.portrait || currentCharacter.portrait
  );

  characterPortrait.alt = currentCharacter.name;

  /*
   * Основная информация
   */
  renderDetails(basic);

  /*
   * Личность и внешность могут зависеть от эпохи
   */
  renderText(
    characterPersonality,
    currentForm.personality || currentCharacter.personality
  );

  renderText(
    characterAppearance,
    currentForm.appearance || currentCharacter.appearance
  );
}


/* =========================
   Отношения
========================= */

function createHeartRating(rating) {
  const container = document.createElement("div");

  container.className = "character_relationship-rating";

  const total = 6;
  const value = Math.max(
    0,
    Math.min(total, Number(rating) || 0)
  );

  for (let i = 1; i <= total; i++) {
    const heart = document.createElement("span");

    heart.className = i <= value
      ? "filled"
      : "empty";

    heart.textContent = i <= value ? "♥" : "♡";

    container.appendChild(heart);
  }

  return container;
}


function renderRelationships(relationships) {
  characterRelationships.innerHTML = "";

  if (!Array.isArray(relationships)) {
    return;
  }

  relationships.forEach(relationship => {
    const card = document.createElement("a");

    card.className = "character_relationship";

    if (relationship.character) {
      card.href =
        `character.html?character=${relationship.character}`;
    } else {
      card.href = "#";
    }

    /*
     * Изображение
     */
    if (relationship.portrait) {
      const image = document.createElement("img");

      image.className = "character_relationship-image";

      image.src = getImagePath(
        relationship.portrait
      );

      image.alt = relationship.name || "";

      card.appendChild(image);
    }

    /*
     * Информация
     */
    const info = document.createElement("div");

    info.className = "character_relationship-info";

    const name = document.createElement("h3");

    name.className = "character_relationship-name";

    name.textContent =
      relationship.name || "Без имени";

    info.appendChild(name);

    if (relationship.rating !== undefined) {
      info.appendChild(
        createHeartRating(relationship.rating)
      );
    }

    if (relationship.description) {
      const description = document.createElement("p");

      description.className =
        "character_relationship-description";

      description.textContent =
        relationship.description;

      info.appendChild(description);
    }

    card.appendChild(info);

    characterRelationships.appendChild(card);
  });
}


/* =========================
   Галерея
========================= */

function createGalleryLayout() {
  if (!characterGallery) {
    return;
  }

  characterGallery.innerHTML = "";

  const slider = document.createElement("div");

  slider.className = "character_gallery-slider";

  /*
   * Левая кнопка
   */
  galleryPreviousButton = document.createElement("button");

  galleryPreviousButton.type = "button";
  galleryPreviousButton.className =
    "character_gallery-arrow character_gallery-arrow-prev";

  galleryPreviousButton.setAttribute(
    "aria-label",
    "Предыдущие работы"
  );

  galleryPreviousButton.textContent = "←";

  /*
   * Центральная область
   */
  const track = document.createElement("div");

  track.className = "character_gallery-track";
  track.id = "characterGalleryTrack";

  /*
   * Правая кнопка
   */
  galleryNextButton = document.createElement("button");

  galleryNextButton.type = "button";
  galleryNextButton.className =
    "character_gallery-arrow character_gallery-arrow-next";

  galleryNextButton.setAttribute(
    "aria-label",
    "Следующие работы"
  );

  galleryNextButton.textContent = "→";

  slider.appendChild(galleryPreviousButton);
  slider.appendChild(track);
  slider.appendChild(galleryNextButton);

  characterGallery.appendChild(slider);

  galleryPreviousButton.addEventListener(
    "click",
    () => {
      if (galleryPage > 0) {
        galleryPage--;
        renderGalleryPage();
      }
    }
  );

  galleryNextButton.addEventListener(
    "click",
    () => {
      const totalPages = Math.ceil(
        galleryWorks.length / GALLERY_PAGE_SIZE
      );

      if (galleryPage < totalPages - 1) {
        galleryPage++;
        renderGalleryPage();
      }
    }
  );
}


/* =========================
   Карточка работы
========================= */

function createGalleryItem(work) {
  const link = document.createElement("a");

  link.className = "character_gallery-item";

  link.href =
    `../viewer.html?type=${encodeURIComponent(work.type)}&id=${encodeURIComponent(work.id)}`;

  const image = document.createElement("img");

  image.src = getImagePath(work.image);
  image.alt = "";
  image.loading = "lazy";

  link.appendChild(image);

  if (work.blur) {
    link.classList.add("is_blurred");

    const revealButton = document.createElement("button");

    revealButton.className = "character_gallery-reveal";
    revealButton.type = "button";

    revealButton.innerHTML = `
      ${renderWarnings(work.warnings)}

      <span class="character_gallery-reveal-action">
        Click to reveal
      </span>
    `;

    revealButton.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      link.classList.remove("is_blurred");
      revealButton.remove();
    });

    link.appendChild(revealButton);
  }

  return link;
}


/* =========================
   Страница галереи
========================= */

function renderGalleryPage() {
  const track = document.querySelector(
    "#characterGalleryTrack"
  );

  if (!track) {
    return;
  }

  track.innerHTML = "";

  const start =
    galleryPage * GALLERY_PAGE_SIZE;

  const end =
    start + GALLERY_PAGE_SIZE;

  const pageWorks =
    galleryWorks.slice(start, end);

  pageWorks.forEach(work => {
    track.appendChild(
      createGalleryItem(work)
    );
  });

  const totalPages = Math.ceil(
    galleryWorks.length / GALLERY_PAGE_SIZE
  );

  /*
   * Если страница последняя и на ней
   * меньше четырёх работ — центрируем их.
   */
  if (pageWorks.length < GALLERY_PAGE_SIZE) {
    track.classList.add(
      "character_gallery-track--short"
    );
  } else {
    track.classList.remove(
      "character_gallery-track--short"
    );
  }

  /*
   * Состояние стрелок
   */
  galleryPreviousButton.disabled =
    galleryPage === 0;

  galleryNextButton.disabled =
    galleryPage === totalPages - 1;

  /*
   * Если всего одна страница,
   * стрелки не нужны.
   */
  const showArrows = totalPages > 1;

  galleryPreviousButton.style.display =
    showArrows ? "" : "none";

  galleryNextButton.style.display =
    showArrows ? "" : "none";
}


/* =========================
   Загрузка галереи персонажа
========================= */

async function loadCharacterGallery(characterName) {
  const [artworks, gifts] = await Promise.all([
    loadWorks("artworks.json", "art"),
    loadWorks("gifts.json", "gift")
  ]);

  const allWorks = [
    ...artworks,
    ...gifts
  ];

  /*
   * Сравниваем имя персонажа
   * с именами в characters у работы.
   *
   * Регистр не имеет значения.
   */
  const normalizedName =
    characterName.trim().toLowerCase();

  galleryWorks = allWorks.filter(work => {
    return (
      Array.isArray(work.characters) &&
      work.characters.some(name => {
        return (
          typeof name === "string" &&
          name.trim().toLowerCase() === normalizedName
        );
      })
    );
  });

  galleryPage = 0;

  createGalleryLayout();

  /*
   * Если работ нет
   */
  if (galleryWorks.length === 0) {
    const track = document.querySelector(
      "#characterGalleryTrack"
    );

    if (track) {
      const message = document.createElement("p");

      message.className =
        "character_gallery-empty";

      message.textContent =
        "В галерее пока ничего нет.";

      track.appendChild(message);
    }

    galleryPreviousButton.style.display = "none";
    galleryNextButton.style.display = "none";

    return;
  }

  renderGalleryPage();
}


/* =========================
   Заполнение страницы
========================= */

async function displayCharacter(character, characterData) {
  currentCharacter = {
    ...character,
    ...characterData
  };

  /*
   * Заголовок
   */
  characterFandom.textContent =
    character.fandom || "";

  characterTitle.textContent =
    character.name || "";


  /*
   * Формы / эпохи
   */
  const forms = currentCharacter.forms || [];

  renderForms(forms);


  /*
   * Выбираем первую форму.
   *
   * Если forms отсутствует,
   * используем данные самого персонажа.
   */
  if (forms.length > 0) {
    currentForm = forms[0];
  } else {
    currentForm = {
      basic: {},
      portrait: currentCharacter.portrait,
      personality: currentCharacter.personality,
      appearance: currentCharacter.appearance
    };
  }


  /*
   * Общие данные
   */
  const basic = {
    ...(currentCharacter.basic || {}),
    ...(currentForm.basic || {})
  };

  renderDetails(basic);

  renderConnections(
    currentCharacter.connections
  );


  /*
   * Текстовые разделы
   */
  renderText(
    characterPersonality,
    currentForm.personality ||
    currentCharacter.personality
  );

  renderText(
    characterAppearance,
    currentForm.appearance ||
    currentCharacter.appearance
  );


  /*
   * История
   */
  const story =
    currentCharacter.story || {};

  renderText(
    characterPast,
    story.past
  );

  renderText(
    characterSeason1,
    story.season1
  );

  renderText(
    characterSeason2,
    story.season2
  );

  renderText(
    characterBlankPeriod,
    story.blankPeriod
  );

  renderText(
    characterBoruto,
    story.boruto
  );


  /*
   * Способности
   */
  renderText(
    characterAbilities,
    currentCharacter.abilities
  );

  renderText(
    characterWeapons,
    currentCharacter.weapons
  );


  /*
   * Отношения
   */
  renderRelationships(
    currentCharacter.relationships
  );


  /*
   * Галерея
   *
   * Используем NAME персонажа,
   * потому что artworks/gifts хранят имена,
   * а не ID.
   */
  await loadCharacterGallery(
    currentCharacter.name
  );


  /*
   * Обновляем портрет и данные формы
   */
  updateCharacter();
}


/* =========================
   Инициализация
========================= */

async function initCharacterPage() {
  try {
    const characterId =
      getCharacterId();

    if (!characterId) {
      characterTitle.textContent =
        "Персонаж не выбран";

      characterFandom.textContent = "";

      return;
    }


    /*
     * Загружаем список персонажей
     */
    const characters =
      await loadCharacters();


    /*
     * Ищем персонажа по ID из URL
     */
    const character =
      findCharacter(
        characters,
        characterId
      );


    if (!character) {
      throw new Error(
        `Персонаж "${characterId}" не найден`
      );
    }


    /*
     * Загружаем подробный JSON
     */
    const characterData =
      await loadCharacterFile(
        character.file
      );


    /*
     * Отображаем страницу
     */
    await displayCharacter(
      character,
      characterData
    );

  } catch (error) {
    console.error(error);

    characterTitle.textContent =
      "Не удалось загрузить персонажа";

    characterFandom.textContent = "";

    if (characterForms) {
      characterForms.innerHTML = "";
    }
  }
}


initCharacterPage();
