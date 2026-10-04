const timeline = document.querySelector('.timeline');


// Названия предупреждений
const warningLabels = {
  ambiguity: 'Ambiguity',
  problematic: 'Problematic',
  kissing: 'Passionate kiss',
  blood: 'Blood',
  violence: 'Violence',
  gore: 'Gore',
  nudity: 'Nudity',
  risque: 'Risqué humor',
  sex: 'Sexual content',
  death: 'Death'
};


// Загрузка данных
fetch('data/artworks.json')
  .then(response => response.json())
  .then(artworks => {
    renderArtworks(artworks);
  })
  .catch(error => {
    console.error('Failed to load artworks:', error);
  });


// Создание блока предупреждений
function renderWarnings(warnings) {

  if (!warnings || warnings.length === 0) {
    return '';
  }

  const warningText = warnings
    .map(warning => warningLabels[warning] ?? warning)
    .join(', ');

  return `
    <div class="art_warning">
      ⚠ Content warning: ${warningText}
    </div>
  `;
}


// Отрисовка всех работ
function renderArtworks(artworks) {

  const artworksByYear = {};


  // Группируем работы по годам
  artworks.forEach(artwork => {

    if (!artworksByYear[artwork.year]) {
      artworksByYear[artwork.year] = [];
    }

    artworksByYear[artwork.year].push(artwork);
  });


  // Новые годы сверху
  const sortedYears = Object.keys(artworksByYear)
    .sort((a, b) => b - a);


  sortedYears.forEach(year => {

    const yearSection = document.createElement('section');

    yearSection.className = 'year collapsed';


    yearSection.innerHTML = `
      <button class="year_header" type="button">

        <span class="year_title">
          ${year}
        </span>

        <span class="year_toggle">

          <svg
            class="year_chevron"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            aria-hidden="true"
          >
            <use href="image/icons/navigation.svg#chevron_down"></use>
          </svg>

        </span>

      </button>


      <div class="year_content">

        <div class="year_gallery"></div>

      </div>
    `;


    const yearGallery =
      yearSection.querySelector('.year_gallery');


    // Создаём карточки работ
    artworksByYear[year].forEach(artwork => {

      const artCard = document.createElement('article');

      artCard.className = 'art_card';

      artCard.dataset.id = artwork.id;


      // Содержимое карточки
      artCard.innerHTML = `
        <a
          class="art_card_link"
          href="viewer.html?source=artworks&id=${artwork.id}"
        >

          <img
            src="${artwork.image}"
            alt="${artwork.characters.join(', ')}"
            loading="lazy"
          >

        </a>


        ${
        artwork.blur
          ? `
              <button
                class="art_reveal"
                type="button"
              >

                ${renderWarnings(artwork.warnings)}

                <span class="art_reveal_action">
                  Click to reveal
                </span>

              </button>
            `
          : ''
      }
      `;


      // Если работа заблюрена —
      // добавляем класс и обработчик кнопки
      if (artwork.blur) {

        artCard.classList.add('is_blurred');


        const revealButton =
          artCard.querySelector('.art_reveal');


        revealButton.addEventListener('click', () => {

          artCard.classList.remove('is_blurred');

          revealButton.remove();

        });
      }


      yearGallery.appendChild(artCard);
    });


    timeline.appendChild(yearSection);
  });


  setupYearToggles();
}


// Раскрытие годов
function setupYearToggles() {

  document
    .querySelectorAll('.year_header')
    .forEach(yearHeader => {

      yearHeader.addEventListener('click', () => {

        const yearSection =
          yearHeader.closest('.year');

        yearSection.classList.toggle('collapsed');

      });

    });
}
