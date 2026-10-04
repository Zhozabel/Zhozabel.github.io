const viewer =
  document.querySelector('.viewer');

const viewerMedia =
  document.querySelector('.viewer_media');

const viewerAuthor =
  document.querySelector('.viewer_author');

const viewerTitle =
  document.querySelector('.viewer_title');

const viewerCharacters =
  document.querySelector('.viewer_characters');

const viewerFandom =
  document.querySelector('.viewer_fandom');

const viewerYear =
  document.querySelector('.viewer_year');

const viewerYearRow =
  document.querySelector('.viewer_year_row');

const viewerWarnings =
  document.querySelector('.viewer_warnings');

const closeButton =
  document.querySelector('.viewer_close');

const prevButton =
  document.querySelector('.viewer_prev');

const nextButton =
  document.querySelector('.viewer_next');


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


// Источники данных
const dataSources = {
  artworks: 'data/artworks.json',
  gifts: 'data/gifts.json'
};


let items = [];
let currentIndex = -1;
let currentSource = '';


// Получаем параметры из URL
const params =
  new URLSearchParams(
    window.location.search
  );

const source =
  params.get('source');

const id =
  params.get('id');


// Запускаем viewer
loadData();


// ========================================
// Загрузка данных
// ========================================

async function loadData() {

  if (!source || !dataSources[source]) {

    console.error(
      'Unknown viewer source:',
      source
    );

    return;
  }


  currentSource = source;


  try {

    const response =
      await fetch(dataSources[source]);


    if (!response.ok) {

      throw new Error(
        `HTTP error: ${response.status}`
      );

    }


    items = await response.json();


    currentIndex =
      items.findIndex(
        item => item.id === id
      );


    if (currentIndex === -1) {

      console.error(
        'Item not found:',
        id
      );

      return;
    }


    renderItem();

    setupViewer();


  } catch (error) {

    console.error(
      'Failed to load viewer data:',
      error
    );

  }

}


// ========================================
// Отображение работы
// ========================================

function renderItem() {

  const item =
    items[currentIndex];


  renderMedia(item);

  renderInfo(item);

  updateNavigation();

}


// ========================================
// Медиа
// ========================================

function renderMedia(item) {

  viewerMedia.innerHTML = '';


  let media;


  // Видео
  if (item.type === 'video' || item.video) {

    media =
      document.createElement('video');


    media.className =
      'viewer_video';


    media.src =
      item.video;


    media.controls = true;

    media.playsInline = true;

    media.preload = 'metadata';


  }

  // Картинка
  else if (item.image) {

    media =
      document.createElement('img');


    media.className =
      'viewer_image';


    media.src =
      item.image;


    media.alt =
      item.characters?.join(', ') || '';

  }

  else {

    console.error(
      'No media found for item:',
      item
    );

    return;
  }


  viewerMedia.appendChild(media);


  // Blur
  if (item.blur) {

    viewerMedia.classList.add(
      'is_blurred'
    );

    renderRevealButton(item);

  } else {

    viewerMedia.classList.remove(
      'is_blurred'
    );

  }

}


// ========================================
// Кнопка раскрытия
// ========================================

function renderRevealButton(item) {

  const revealButton =
    document.createElement('button');


  revealButton.className =
    'viewer_reveal';


  revealButton.type =
    'button';


  revealButton.innerHTML = `

${renderWarningHtml(item.warnings)}

<span class="viewer_reveal_action">
  Click to reveal
</span>

  `;


  revealButton.addEventListener(
    'click',
    () => {

      viewerMedia.classList.remove(
        'is_blurred'
      );

      revealButton.remove();

    }
  );


  viewerMedia.appendChild(
    revealButton
  );

}


// ========================================
// Информация
// ========================================

function renderInfo(item) {

  // Author
  if (item.author) {

    viewerAuthor.textContent =
      item.author;

    viewerAuthor.hidden =
      false;

  } else {

    viewerAuthor.hidden =
      true;

  }


  // Title
  if (item.title) {

    viewerTitle.textContent =
      item.title;

    viewerTitle.hidden =
      false;

  } else {

    viewerTitle.hidden =
      true;

  }


  // Characters
  const charactersRow =
    viewerCharacters.closest(
      '.viewer_detail'
    );


  if (
    item.characters &&
    item.characters.length > 0
  ) {

    viewerCharacters.textContent =
      item.characters.join(', ');

    charactersRow.hidden =
      false;

  } else {

    charactersRow.hidden =
      true;

  }


  // Fandom
  const fandomRow =
    viewerFandom.closest(
      '.viewer_detail'
    );


  if (item.fandom) {

    viewerFandom.textContent =
      item.fandom;

  } else {

    viewerFandom.textContent =
      'Original';

  }

  fandomRow.hidden =
    false;


  // Year
  const hasYear =
    item.year !== undefined &&
    item.year !== null &&
    item.year !== '';

  if (hasYear) {

    viewerYear.textContent =
      item.year;

    viewerYearRow.hidden =
      false;

  } else {

    viewerYear.textContent =
      '';

    viewerYearRow.hidden =
      true;

  }

}


// ========================================
// Предупреждения
// ========================================

function renderWarnings(warnings) {

  if (
    !warnings ||
    warnings.length === 0
  ) {

    viewerWarnings.innerHTML = '';

    return;

  }


  viewerWarnings.innerHTML =
    renderWarningHtml(warnings);

}


function renderWarningHtml(warnings) {

  if (
    !warnings ||
    warnings.length === 0
  ) {

    return '';

  }


  const warningText =
    warnings
      .map(
        warning =>
          warningLabels[warning] ?? warning
      )
      .join(', ');


  return `
<div class="viewer_warning">
      ⚠ Content warning: ${warningText}
  </div>
`;

}


// ========================================
// Навигация
// ========================================

function updateNavigation() {

  prevButton.disabled =
    currentIndex <= 0;


  nextButton.disabled =
    currentIndex >= items.length - 1;

}


function showNext() {

  if (
    currentIndex >=
    items.length - 1
  ) {

    return;

  }


  currentIndex++;

  const item =
    items[currentIndex];


  renderItem();

  updateUrl(item.id);

}


function showPrevious() {

  if (currentIndex <= 0) {

    return;

  }


  currentIndex--;

  const item =
    items[currentIndex];


  renderItem();

  updateUrl(item.id);

}


// ========================================
// URL
// ========================================

function updateUrl(id) {

  const url =
    `viewer.html?source=${currentSource}&id=${id}`;


  history.replaceState(
    {
      source: currentSource,
      id: id
    },
    '',
    url
  );

}


// ========================================
// Закрытие
// ========================================

function closeViewer() {

  window.history.back();

}


// ========================================
// Browser Back / Forward
// ========================================

function handlePopState() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const newSource =
    params.get('source');

  const newId =
    params.get('id');


  if (
    newSource !== currentSource ||
    !newId
  ) {

    return;

  }


  const index =
    items.findIndex(
      item => item.id === newId
    );


  if (index === -1) {

    return;

  }


  currentIndex =
    index;


  renderItem();

}


// ========================================
// События
// ========================================

function setupViewer() {

  prevButton.addEventListener(
    'click',
    showPrevious
  );


  nextButton.addEventListener(
    'click',
    showNext
  );


  closeButton.addEventListener(
    'click',
    closeViewer
  );


  document.addEventListener(
    'keydown',
    handleKeyboard
  );


  window.addEventListener(
    'popstate',
    handlePopState
  );


  document.body.classList.add(
    'viewer_open'
  );

}


// ========================================
// Клавиатура
// ========================================

function handleKeyboard(event) {

  if (event.key === 'Escape') {

    closeViewer();

    return;

  }


  if (event.key === 'ArrowLeft') {

    showPrevious();

    return;

  }


  if (event.key === 'ArrowRight') {

    showNext();

  }

}
