const giftsGallery = document.querySelector('.gifts_gallery');


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
fetch('data/gifts.json')
  .then(response => response.json())
  .then(gifts => {
    renderGifts(gifts);
  })
  .catch(error => {
    console.error('Failed to load gifts:', error);
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


// Создание медиа
function renderMedia(gift) {

  if (gift.type === 'video') {

    return `
      <video
        class="art_card_video"
        src="${gift.video}"
        muted
        loop
        playsinline
        preload="metadata"
      ></video>
    `;

  }


  return `
    <img
      src="${gift.image}"
      alt="${gift.characters.join(', ')}"
      loading="lazy"
    >
  `;
}


// Отрисовка всех гифтов
function renderGifts(gifts) {

  gifts.forEach(gift => {

    const card = document.createElement('article');

    card.className = 'art_card';

    card.dataset.id = gift.id;


    card.innerHTML = `
      <a
        class="art_card_link"
        href="gift.html?id=${gift.id}"
      >

        ${renderMedia(gift)}

      </a>


      ${
      gift.blur
        ? `
            <button
              class="art_reveal"
              type="button"
            >

              ${renderWarnings(gift.warnings)}

              <span class="art_reveal_action">
                Click to reveal
              </span>

            </button>
          `
        : ''
    }
    `;


    // Если рисунок заблюрен
    if (gift.blur) {

      card.classList.add('is_blurred');


      const revealButton =
        card.querySelector('.art_reveal');


      revealButton.addEventListener('click', () => {

        card.classList.remove('is_blurred');

        revealButton.remove();

      });
    }


    giftsGallery.appendChild(card);
  });


  setupVideoPreviews();
}


// Управление превью видео
function setupVideoPreviews() {

  const videos =
    document.querySelectorAll('.art_card_video');


  videos.forEach(video => {

    video.addEventListener('mouseenter', () => {

      video.play();

    });


    video.addEventListener('mouseleave', () => {

      video.pause();

    });

  });
}
