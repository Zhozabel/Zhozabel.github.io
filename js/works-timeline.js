
(() => {
  const timeline = document.querySelector(".works-timeline");

  if (!timeline) return;

  const dataFile = timeline.dataset.file;
  const workType = timeline.dataset.type;

  let worksData = [];
  let currentLanguage = getCurrentLanguage();

  // Получаем перевод по ключу из siteTranslations.
  function getTranslation(key) {
    return key.split(".").reduce((value, part) => {
      return value?.[part];
    }, window.siteTranslations || {});
  }

  // Текущий язык сайта.
  function getCurrentLanguage() {
    const htmlLanguage = document.documentElement.lang;

    if (htmlLanguage === "ru" || htmlLanguage === "en") {
      return htmlLanguage;
    }

    return "en";
  }

  // Получаем локализованное значение.
  function localize(value) {
    if (typeof value === "string") return value;

    if (value && typeof value === "object") {
      return value[currentLanguage] || value.en || value.ru || "";
    }

    return "";
  }

  // Перевод с запасным значением.
  function translate(key, fallback = key) {
    const value = getTranslation(key);

    return typeof value === "string" ? value : fallback;
  }

  // Путь к локализованной обложке.
  function getCover(work) {
    return localize(work.cover);
  }

  // Преобразуем путь от корня сайта в URL.
  function getAssetUrl(path) {
    if (!path) return "";

    if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("data:")) {
      return path;
    }

    if (path.startsWith("/")) {
      return new URL(path, document.baseURI).href;
    }

    return new URL(`../${path.replace(/^(\.\/)+/, "")}`, document.baseURI).href;
  }

  // Создаём текстовый элемент.
  function createTextElement(tag, className, text) {
    const element = document.createElement(tag);

    element.className = className;
    element.textContent = text;

    return element;
  }

  // Переводим статус произведения.
  function getStatusLabel(status) {
    const fallback = status
      .replaceAll("-", " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());

    return translate(`works.status.${status}`, fallback);
  }

  // Переводим жанр, если для него есть локализация.
  function getGenreLabel(genre) {
    return translate(`story.genresList.${genre}`, genre);
  }


  // Локализуем подпись количества глав.
  function getChaptersLabel(count) {
    const number = Number(count);

    if (!Number.isFinite(number) || number < 0) return "";

    if (currentLanguage === "ru") {
      const mod10 = number % 10;
      const mod100 = number % 100;

      let word = "глав";

      if (mod10 === 1 && mod100 !== 11) {
        word = "глава";
      } else if (
        mod10 >= 2 &&
        mod10 <= 4 &&
        (mod100 < 12 || mod100 > 14)
      ) {
        word = "главы";
      }

      return `${number} ${word}`;
    }

    const key = number === 1
      ? "works.chapterCount"
      : "works.chaptersCount";

    const fallback = number === 1
      ? "{count} chapter"
      : "{count} chapters";

    return translate(key, fallback).replace("{count}", String(number));
  }


  // Создаём обложку.
  function createCover(work) {
    const cover = document.createElement("div");
    cover.className = "story_card_cover";

    const imagePath = getCover(work);

    if (imagePath) {
      const image = document.createElement("img");

      image.className = "story_card_cover-image";
      image.src = getAssetUrl(imagePath);
      image.alt = localize(work.title);
      image.loading = "lazy";
      image.decoding = "async";

      image.addEventListener("error", () => {
        image.hidden = true;
      }, { once: true });

      cover.appendChild(image);
    }

    return cover;
  }

  // Создаём жанровые чипсины — максимум три.
  function createGenreTags(genres) {
    const container = document.createElement("div");
    container.className = "story_card_tags";

    if (!Array.isArray(genres)) return container;

    genres.slice(0, 3).forEach(genre => {
      const tag = createTextElement(
        "span",
        "",
        getGenreLabel(genre)
      );

      container.appendChild(tag);
    });

    return container;
  }

  // Создаём строку статуса и количества глав.
  function createMeta(work) {
    const meta = document.createElement("div");
    meta.className = "story_card_meta";

    if (work.status) {
      const status = createTextElement(
        "span",
        `story_status story_status--${work.status}`,
        getStatusLabel(work.status)
      );

      meta.appendChild(status);
    }

    if (work.chapters !== undefined && work.chapters !== null) {
      meta.appendChild(
        createTextElement(
          "span",
          "story_card_chapters",
          getChaptersLabel(work.chapters)
        )
      );
    }

    return meta;
  }

  // Создаём карточку произведения.
  function createWorkCard(work) {
    const card = document.createElement("a");

    card.className = "story_card";
    card.dataset.id = work.id;
    card.href =
      `story.html?type=${encodeURIComponent(work.type || workType)}` +
      `&id=${encodeURIComponent(work.id)}`;

    const info = document.createElement("div");
    info.className = "story_card_info";

    info.appendChild(
      createTextElement(
        "h2",
        "story_card_title",
        localize(work.title) || work.id
      )
    );

    info.appendChild(createGenreTags(work.genres));
    info.appendChild(createMeta(work));

    card.append(
      createCover(work),
      info
    );

    return card;
  }

  // Получаем год из даты.
  function getWorkYear(work) {
    if (!work.date) return null;

    const match = String(work.date).match(/^(\d{4})/);

    return match ? match[1] : null;
  }

  // Группируем произведения по годам.
  function groupWorksByYear(works) {
    return works.reduce((groups, work) => {
      const year = getWorkYear(work);

      if (!year) return groups;

      if (!groups[year]) {
        groups[year] = [];
      }

      groups[year].push(work);

      return groups;
    }, {});
  }

  // Создаём стрелку раскрытия.
  function createChevron() {
    const toggle = document.createElement("span");
    toggle.className = "works-year__toggle";

    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

    svg.classList.add("works-year__chevron");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("aria-hidden", "true");

    const use = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "use"
    );

    use.setAttribute(
      "href",
      "../images/icons/navigation.svg#chevron_down"
    );

    svg.appendChild(use);
    toggle.appendChild(svg);

    return toggle;
  }

  // Создаём секцию одного года.
  function createYearSection(year, works) {
    const section = document.createElement("section");
    section.className = "works-year collapsed";

    const header = document.createElement("button");
    header.className = "works-year__header";
    header.type = "button";
    header.setAttribute("aria-expanded", "false");

    header.append(
      createTextElement(
        "span",
        "works-year__title",
        String(year)
      ),
      createChevron()
    );

    const content = document.createElement("div");
    content.className = "works-year__content";

    const inner = document.createElement("div");
    inner.className = "works-year__content-inner";

    const grid = document.createElement("div");
    grid.className = "works-grid";

    works.forEach(work => {
      grid.appendChild(createWorkCard(work));
    });

    inner.appendChild(grid);
    content.appendChild(inner);
    section.append(header, content);

    header.addEventListener("click", () => {
      const isCollapsed = section.classList.toggle("collapsed");

      header.setAttribute(
        "aria-expanded",
        String(!isCollapsed)
      );
    });

    return section;
  }

  // Отрисовываем весь таймлайн.
  function renderWorks() {
    timeline.replaceChildren();

    const worksByYear = groupWorksByYear(worksData);

    const years = Object.keys(worksByYear)
      .sort((a, b) => Number(b) - Number(a));

    if (years.length === 0) {
      timeline.textContent = translate(
        "works.empty",
        "No works to display yet."
      );

      return;
    }

    years.forEach(year => {
      timeline.appendChild(
        createYearSection(year, worksByYear[year])
      );
    });
  }

  // Загружаем JSON.
  async function loadWorks() {
    if (!dataFile) {
      timeline.textContent = "Missing data file configuration.";
      return;
    }

    try {
      const response = await fetch(dataFile);

      if (!response.ok) {
        throw new Error(
          `Failed to load ${dataFile}: ${response.status}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The works JSON must contain an array.");
      }

      worksData = data.filter(work => work && work.id);

      renderWorks();
    } catch (error) {
      console.error("Failed to load works:", error);

      timeline.textContent = translate(
        "works.loadError",
        "Could not load works. Please refresh the page."
      );
    }
  }

  // Перерисовываем карточки при смене языка.
  document.addEventListener("languageChanged", () => {
    currentLanguage = getCurrentLanguage();
    renderWorks();
  });

  loadWorks();
})();
