
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

const datasets = [
  {
    file: "data/artworks.json",
    folder: "artworks",
    thumbnails: "artworks-thumbnails",
  },
  {
    file: "data/gifts.json",
    folder: "gifts",
    thumbnails: "gifts-thumbnails",
  },
];

let total = 0;
let missingFull = 0;
let missingThumb = 0;
let oldExtensions = 0;
let invalidPaths = 0;

for (const dataset of datasets) {
  const data = JSON.parse(
    fs.readFileSync(path.join(ROOT, dataset.file), "utf8")
  );

  let count = 0;

  for (const item of data) {
    if (!item.image) continue;

    // Поддерживаем и обычную строку, и объект { en, ru }
    const images =
      typeof item.image === "string"
        ? [item.image]
        : Object.values(item.image);

    for (const image of images) {
      if (typeof image !== "string") {
        invalidPaths++;
        console.log(`Некорректный путь, ID ${item.id}:`, image);
        continue;
      }

      count++;
      total++;

      if (!image.toLowerCase().endsWith(".webp")) {
        oldExtensions++;
        console.log(`Старое расширение: ${image}`);
        continue;
      }

      const fullPath = path.join(ROOT, ...image.split("/"));

      const thumbnail = image.replace(
        `images/${dataset.folder}/`,
        `images/${dataset.thumbnails}/`
      );

      const thumbPath = path.join(ROOT, ...thumbnail.split("/"));

      if (!fs.existsSync(fullPath)) {
        missingFull++;
        console.log(`Нет полноразмерного файла: ${image}`);
      }

      if (!fs.existsSync(thumbPath)) {
        missingThumb++;
        console.log(`Нет миниатюры: ${thumbnail}`);
      }
    }
  }

  console.log(`\n${dataset.file}: ${count} изображений`);
}

console.log("\n========== ИТОГ ==========");
console.log(`Всего путей: ${total}`);
console.log(`Старых расширений: ${oldExtensions}`);
console.log(`Некорректных путей: ${invalidPaths}`);
console.log(`Нет полноразмерных файлов: ${missingFull}`);
console.log(`Нет миниатюр: ${missingThumb}`);
