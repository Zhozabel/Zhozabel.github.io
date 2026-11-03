
/* ========================================
   DTIYS 2024
======================================== */

const dtiysWinners = document.querySelector("#dtiys-winners");
const dtiysAdditional = document.querySelector("#dtiys-additional");
const dtiysParticipants = document.querySelector("#dtiys-participants");


/* ========================================
   HELPERS
======================================== */

// Получает перевод по ключу из текущего языкового файла.
function getTranslation(key, fallback = "") {
  const translations = window.siteTranslations;

  if (!translations || !key) {
    return fallback;
  }

  return key.split(".").reduce((value, part) => {
    return value?.[part];
  }, translations) ?? fallback;
}

// Возвращает текущий язык сайта.
function getCurrentLanguage() {
  return document.documentElement.lang?.startsWith("en") ? "en" : "ru";
}

// Возвращает текст на текущем языке из двуязычного объекта.
function getLocalizedText(value) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const language = getCurrentLanguage();

  return value[language] ?? value.ru ?? value.en ?? "";
}

// Формирует путь к миниатюре изображения.
function getGiftThumbnail(imagePath) {
  if (!imagePath) {
    return "";
  }

  return imagePath
    .replace(/^images\/gifts\//i, "images/gifts-thumbnails/")
    .replace(/\.(jpe?g|png)$/i, ".webp");
}

// Преобразует путь к изображению в полный URL.
function getImageUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  return new URL("../" + imagePath, document.baseURI).href;
}

// Создаёт HTML-элемент с классом и текстом.
function createElement(tag, className, text = "") {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== "" && text !== null && text !== undefined) {
    element.textContent = text;
  }

  return element;
}


/* ========================================
   EVENT INFORMATION
======================================== */

// Подставляет данные из event.json в HTML.
function renderEventData(eventData) {
  if (!eventData || typeof eventData !== "object") {
    console.error("DTIYS: invalid event data.");
    return;
  }

  const fields = document.querySelectorAll("[data-dtiys-field]");

  fields.forEach(element => {
    const path = element.dataset.dtiysField;

    if (!path) {
      return;
    }

    const value = path.split(".").reduce((current, key) => {
      return current?.[key];
    }, eventData);

    if (value === undefined || value === null) {
      console.warn(`DTIYS: event field not found: "${path}"`);
      return;
    }

    let text = getLocalizedText(value);

    // Показываем количество просмотров в компактном формате.
    if (path === "about.views" && typeof value === "number") {
      text = value >= 1000
        ? `${(value / 1000).toLocaleString(getCurrentLanguage(), {
          maximumFractionDigits: 1
        })}k`
        : String(value);
    }

    element.textContent = text;
  });
}


/* ========================================
   PARTICIPANT CARD
======================================== */

// Создаёт блок с отзывами жюри.
function createReviewsBlock(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return null;
  }

  const section = createElement("div", "dtiys_reviews");

  const title = createElement(
    "h5",
    "dtiys_reviews_title",
    getTranslation("dtiys.reviews.title", "Jury reviews")
  );

  const list = createElement("div", "dtiys_reviews_list");

  reviews.forEach(review => {
    const reviewCard = createElement("article", "dtiys_review");
    const heading = createElement("div", "dtiys_review_heading");

    const judge = createElement(
      "h6",
      "dtiys_review_judge",
      getTranslation(
        `dtiys.reviews.judges.${review.judge}`,
        review.judge || getTranslation("dtiys.reviews.unknownJudge", "Judge")
      )
    );

    heading.append(judge);

    if (review.place) {
      const place = createElement(
        "span",
        "dtiys_review_place",
        `${review.place}${getTranslation("dtiys.card.placeSuffix", " place")}`
      );

      heading.append(place);
    }

    const comment = createElement(
      "p",
      "dtiys_review_comment",
      getLocalizedText(review.comment)
    );

    reviewCard.append(heading, comment);
    list.append(reviewCard);
  });

  section.append(title, list);

  return section;
}


// Создаёт карточку победителя.
function createWinnerCard(participant, link, info, profile) {
  const artworkCard = createElement(
    "article",
    "dtiys_card dtiys_winner_art_card"
  );

  const meta = createElement("div", "dtiys_winner_meta");

  const place = createElement(
    "span",
    "dtiys_card_place",
    `${participant.place}${getTranslation("dtiys.card.placeSuffix", " place")}`
  );

  const score = createElement(
    "span",
    "dtiys_card_score",
    `${getTranslation("dtiys.card.average", "Average")}: ${participant.averageScore.toFixed(1)}`
  );

  meta.append(place, score);
  info.append(meta);
  artworkCard.append(link, info, profile);

  const reviewsCard = createElement("div", "dtiys_winner_content");
  const reviews = createReviewsBlock(participant.reviews);

  if (reviews) {
    reviewsCard.append(reviews);
  }

  const card = createElement("div", "dtiys_winner_card");
  card.append(artworkCard, reviewsCard);

  return card;
}


// Создаёт карточку участника.
function createParticipantCard(participant, gifts) {
  // Находим изображение участника в gifts.json.
  const gift = gifts.find(item => item.id === participant.giftId);

  if (!gift) {
    console.warn(
      `DTIYS: gift not found for participant "${participant.name}"`,
      participant.giftId
    );

    return null;
  }

  // Ссылка на просмотр работы.
  const link = document.createElement("a");

  link.className = "dtiys_card_link";
  link.href = `viewer.html?source=dtiys&id=${encodeURIComponent(participant.giftId)}`;

  link.setAttribute(
    "aria-label",
    `${participant.name} — ${getTranslation("dtiys.card.open", "Open artwork")}`
  );

  // Изображение.
  const imageWrapper = createElement("div", "dtiys_card_image");
  const image = document.createElement("img");

  image.src = getImageUrl(getGiftThumbnail(gift.image));
  image.alt = participant.name;
  image.loading = "lazy";
  image.decoding = "async";

  // Если миниатюра не загрузилась, используем оригинал.
  image.onerror = function () {
    if (this.dataset.fallback) {
      this.onerror = null;
      return;
    }

    this.dataset.fallback = "true";
    this.src = getImageUrl(gift.image);
  };

  imageWrapper.append(image);
  link.append(imageWrapper);

  // Информация об участнике.
  const info = createElement("div", "dtiys_card_info");
  const name = createElement("h4", "dtiys_card_name", participant.name);

  info.append(name);

  // Ссылка на профиль художника.
  const profile = document.createElement("a");

  profile.className = "dtiys_card_profile";
  profile.href = participant.profile;
  profile.target = "_blank";
  profile.rel = "noopener noreferrer";
  profile.textContent = getTranslation(
    "dtiys.card.profile",
    "Artist profile"
  );

  // Для победителей используем расширенную карточку с отзывами.
  if (
    participant.category === "winner" &&
    participant.place &&
    typeof participant.averageScore === "number"
  ) {
    return createWinnerCard(
      participant,
      link,
      info,
      profile
    );
  }

  // Для остальных участников сохраняем компактную карточку.
  const card = createElement("article", "dtiys_card");

  card.append(link, info, profile);

  return card;
}


/* ========================================
   RENDER PARTICIPANTS
======================================== */

function renderParticipants(data, gifts) {
  if (!Array.isArray(data.participants)) {
    console.error("DTIYS: participants data is not an array.");
    return;
  }

  // Контейнеры для разных категорий участников.
  const groups = {
    winner: dtiysWinners,
    additional: dtiysAdditional,
    participant: dtiysParticipants
  };

  // Очищаем контейнеры перед повторной отрисовкой.
  Object.values(groups).forEach(container => {
    if (container) {
      container.replaceChildren();
    }
  });

  // Создаём карточки и распределяем их по категориям.
  data.participants.forEach(participant => {
    const container = groups[participant.category];

    if (!container) {
      console.warn(
        `DTIYS: unknown category "${participant.category}"`,
        participant
      );

      return;
    }

    const card = createParticipantCard(participant, gifts);

    if (card) {
      container.append(card);
    }
  });
}


/* ========================================
   LOAD DATA
======================================== */

async function loadDtiys() {
  try {
    // Загружаем информацию о мероприятии, участников и изображения.
    const [
      eventResponse,
      participantsResponse,
      giftsResponse
    ] = await Promise.all([
      fetch("../data/dtiys/dtiys-2024/event.json"),
      fetch("../data/dtiys/dtiys-2024/participants.json"),
      fetch("../data/gifts.json")
    ]);

    // Проверяем успешность загрузки файлов.
    if (!eventResponse.ok) {
      throw new Error(
        `Failed to load event.json: ${eventResponse.status}`
      );
    }

    if (!participantsResponse.ok) {
      throw new Error(
        `Failed to load participants.json: ${participantsResponse.status}`
      );
    }

    if (!giftsResponse.ok) {
      throw new Error(
        `Failed to load gifts.json: ${giftsResponse.status}`
      );
    }

    // Преобразуем ответы в JSON.
    const [
      eventData,
      participantsData,
      giftsData
    ] = await Promise.all([
      eventResponse.json(),
      participantsResponse.json(),
      giftsResponse.json()
    ]);

    // Проверяем структуру полученных данных.
    if (!Array.isArray(giftsData)) {
      throw new Error("gifts.json must contain an array.");
    }

    if (!Array.isArray(participantsData.participants)) {
      throw new Error("participants.json must contain a participants array.");
    }

    // Отображаем информацию о мероприятии и участниках.
    renderEventData(eventData);
    renderParticipants(participantsData, giftsData);

  } catch (error) {
    console.error("DTIYS loading error:", error);

    // Показываем сообщение об ошибке в галереях.
    const containers = [
      dtiysWinners,
      dtiysAdditional,
      dtiysParticipants
    ];

    containers.forEach(container => {
      if (!container) {
        return;
      }

      const message = createElement(
        "p",
        "dtiys_error",
        getTranslation(
          "dtiys.error",
          "Sorry, the artworks could not be loaded."
        )
      );

      container.replaceChildren(message);
    });
  }
}


/* ========================================
   LANGUAGE CHANGES
======================================== */

document.addEventListener("languageChanged", () => {
  loadDtiys();
});


/* ========================================
   INIT
======================================== */

if (
  dtiysWinners &&
  dtiysAdditional &&
  dtiysParticipants
) {
  loadDtiys();
}
