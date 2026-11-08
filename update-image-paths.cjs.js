
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

// Резервные копии будут вне папки сайта.
const BACKUP_ROOT = path.join(
  path.dirname(ROOT),
  "Zhozabel-webp-migration-backup"
);

const files = [
  "data/artworks.json",
  "data/gifts.json",
  "pages/dtiys/dtiys-2024.html",
];

function absolute(relative) {
  return path.join(ROOT, relative);
}

function read(relative) {
  return fs.readFileSync(absolute(relative), "utf8");
}

function verifyImage(relative) {
  const imagePath = absolute(relative);

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Не найден WebP: ${relative}`);
  }
}

function main() {
  const contents = {};

  // Сначала читаем все файлы.
  for (const file of files) {
    contents[file] = read(file);
  }

  let artworkCount = 0;
  let giftCount = 0;

  // Меняем только пути к изображениям в двух JSON.
  for (const file of ["data/artworks.json", "data/gifts.json"]) {
    contents[file] = contents[file].replace(
      /(images\/(artworks|gifts)\/[^"\\]*?)\.(?:png|jpe?g)(?=["\\])/gi,
      (match, base, category) => {
        const newPath = `${base}.webp`;

        verifyImage(newPath);

        if (category.toLowerCase() === "artworks") {
          artworkCount++;
        } else {
          giftCount++;
        }

        return newPath;
      }
    );

    // Проверяем, что JSON после замены остаётся корректным.
    JSON.parse(contents[file].replace(/^\uFEFF/, ""));
  }

  // Обновляем прямую ссылку на полноразмерную работу в DTIYS.
  const htmlPattern =
    /(\.\.\/\.\.\/images\/artworks\/2020\/2020-113)\.(?:png|jpe?g)/gi;

  let htmlCount = 0;

  contents["pages/dtiys/dtiys-2024.html"] =
    contents["pages/dtiys/dtiys-2024.html"].replace(
      htmlPattern,
      (_, base) => {
        verifyImage("images/artworks/2020/2020-113.webp");
        htmlCount++;
        return `${base}.webp`;
      }
    );

  if (htmlCount !== 1) {
    throw new Error(
      `Ожидалась одна ссылка в DTIYS HTML, найдено: ${htmlCount}. Файлы не изменены.`
    );
  }

  if (artworkCount === 0 || giftCount === 0) {
    throw new Error(
      `Неожиданное количество замен: artworks=${artworkCount}, gifts=${giftCount}. Файлы не изменены.`
    );
  }

  // Создаём резервные копии только после всех проверок.
  if (fs.existsSync(BACKUP_ROOT)) {
    throw new Error(
      `Папка резервных копий уже существует: ${BACKUP_ROOT}`
    );
  }

  fs.mkdirSync(BACKUP_ROOT, { recursive: true });

  for (const file of files) {
    const backup = path.join(BACKUP_ROOT, file);

    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(absolute(file), backup);
  }

  // Записываем обновлённые файлы.
  for (const file of files) {
    fs.writeFileSync(absolute(file), contents[file], "utf8");
  }

  console.log("\nОбновление завершено!");
  console.log(`Artworks: ${artworkCount} замен`);
  console.log(`Gifts: ${giftCount} замен`);
  console.log(`DTIYS HTML: ${htmlCount} замена`);
  console.log(`Резервные копии: ${BACKUP_ROOT}`);
}

try {
  main();
} catch (error) {
  console.error("\nОШИБКА:", error.message);
  console.error("Проверь файлы. При ошибке изменения не должны записываться.");
  process.exitCode = 1;
}
