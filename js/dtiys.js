
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
  }, translations) || fallback;
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

  if (text) {
    element.textContent = text;
  }

  return element;
}


/* ========================================
   PARTICIPANT CARD
======================================== */

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
      review.judge || getTranslation("dtiys.reviews.unknownJudge", "Judge")
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
      review.comment || ""
    );

    reviewCard.append(heading, comment);
    list.append(reviewCard);
  });

  section.append(title, list);

  return section;
}


// Создаёт карточку победителя.
function createWinnerCard(participant, gift, link, imageWrapper, info, profile) {
  const card = createElement("article", "dtiys_winner_card");
  const content = createElement("div", "dtiys_winner_content");

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

  const imageInfo = createElement("div", "dtiys_winner_image_info");
  imageInfo.append(info, meta, profile);

  const reviews = createReviewsBlock(participant.reviews);

  content.append(reviews);
  card.append(link, imageInfo, content);

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
      gift,
      link,
      imageWrapper,
      info,
      profile
    );
  }

  // Для остальных участников сохраняем прежнюю компактную карточку.
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
    // Загружаем данные челленджа и изображения участников.
    const [dtiysResponse, giftsResponse] = await Promise.all([
      fetch("../data/dtiys/dtiys-2024.json"),
      fetch("../data/gifts.json")
    ]);

    if (!dtiysResponse.ok) {
      throw new Error(
        `Failed to load dtiys-2024.json: ${dtiysResponse.status}`
      );
    }

    if (!giftsResponse.ok) {
      throw new Error(
        `Failed to load gifts.json: ${giftsResponse.status}`
      );
    }

    // Преобразуем ответы в JSON.
    const [dtiysData, giftsData] = await Promise.all([
      dtiysResponse.json(),
      giftsResponse.json()
    ]);

    if (!Array.isArray(giftsData)) {
      throw new Error("gifts.json must contain an array.");
    }

    renderParticipants(dtiysData, giftsData);

  } catch (error) {
    console.error("DTIYS loading error:", error);

    // Показываем сообщение об ошибке во всех разделах.
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
