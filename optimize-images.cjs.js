
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = __dirname;
const ARCHIVE = "D:\\Projects\\Web\\Zhozabel-originals";
const IMAGES = path.join(ROOT, "images");

const FORCE = process.argv.includes("--all");

const SETTINGS = {
  full: {
    quality: 95,
    alphaQuality: 100,
    effort: 6,
  },
  thumbnail: {
    quality: 95,
    effort: 5,
  },
};

const stats = {
  converted: 0,
  thumbnails: 0,
  copied: 0,
  skipped: 0,
  errors: 0,
};

async function isUpToDate(source, destination) {
  if (FORCE || !fs.existsSync(destination)) {
    return false;
  }

  const sourceStat = await fs.promises.stat(source);
  const destinationStat = await fs.promises.stat(destination);

  return destinationStat.mtimeMs >= sourceStat.mtimeMs;
}

async function prepareDirectory(filePath) {
  await fs.promises.mkdir(path.dirname(filePath), {
    recursive: true,
  });
}

async function replaceFile(temp, destination) {
  await fs.promises.rename(temp, destination);
}

async function convertImage(source, destination, settings, thumbnail = false) {
  if (thumbnail) {
    // Миниатюры пересоздаём по новым правилам.
    // Полноразмерные WebP не затрагиваем.
  }
  await prepareDirectory(destination);

  if (!thumbnail && await isUpToDate(source, destination)) {
    stats.skipped++;
    return;
  }

  const temp = destination + ".tmp.webp";

  try {
    let pipeline = sharp(source).rotate();

    if (thumbnail) {
      pipeline = pipeline.resize({
        width: 600,
        withoutEnlargement: true,
      });
    }

    await pipeline
      .webp(settings)
      .toFile(temp);

    await replaceFile(temp, destination);

    if (thumbnail) {
      stats.thumbnails++;
    } else {
      stats.converted++;
    }

    console.log(`Готово: ${path.relative(ROOT, destination)}`);
  } catch (error) {
    stats.errors++;
    console.error(`Ошибка: ${source}`);
    console.error(error.message);

    if (fs.existsSync(temp)) {
      await fs.promises.rm(temp, { force: true });
    }
  }
}

async function copyVideo(source, destination) {
  await prepareDirectory(destination);

  if (await isUpToDate(source, destination)) {
    stats.skipped++;
    return;
  }

  const temp = destination + ".tmp";

  try {
    await fs.promises.copyFile(source, temp);
    await replaceFile(temp, destination);

    stats.copied++;

    console.log(`Скопировано: ${path.relative(ROOT, destination)}`);
  } catch (error) {
    stats.errors++;
    console.error(`Ошибка копирования: ${source}`);
    console.error(error.message);

    if (fs.existsSync(temp)) {
      await fs.promises.rm(temp, { force: true });
    }
  }
}

async function getFiles(directory) {
  if (!fs.existsSync(directory)) {
    throw new Error(`Не найдена папка: ${directory}`);
  }

  const result = [];

  async function scan(current) {
    const entries = await fs.promises.readdir(current, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        result.push(fullPath);
      }
    }
  }

  await scan(directory);
  return result;
}

async function processFolder(name) {
  const sourceRoot = path.join(ARCHIVE, name);
  const files = await getFiles(sourceRoot);

  const images = files.filter(file =>
    /\.(png|jpe?g)$/i.test(file)
  );

  const videos = name === "gifts"
    ? files.filter(file => /\.mp4$/i.test(file))
    : [];

  console.log(`\n${name}:`);
  console.log(`Изображений: ${images.length}`);
  console.log(`Видео: ${videos.length}`);

  // Проверяем конфликты одинаковых имён с разными расширениями.
  const destinations = new Map();

  for (const source of images) {
    const relative = path.relative(sourceRoot, source);
    const destination = path.join(
      IMAGES,
      name,
      relative.replace(/\.(png|jpe?g)$/i, ".webp")
    );

    const key = destination.toLowerCase();

    if (destinations.has(key)) {
      throw new Error(
        `Конфликт имён: ${destinations.get(key)} и ${source}`
      );
    }

    destinations.set(key, source);
  }

  for (const source of images) {
    const relative = path.relative(sourceRoot, source);

    const fullDestination = path.join(
      IMAGES,
      name,
      relative.replace(/\.(png|jpe?g)$/i, ".webp")
    );

    const thumbnailDestination = path.join(
      IMAGES,
      `${name}-thumbnails`,
      relative.replace(/\.(png|jpe?g)$/i, ".webp")
    );

    await convertImage(
      source,
      fullDestination,
      SETTINGS.full
    );

    await convertImage(
      source,
      thumbnailDestination,
      SETTINGS.thumbnail,
      true
    );
  }

  for (const source of videos) {
    const relative = path.relative(sourceRoot, source);
    const destination = path.join(IMAGES, name, relative);

    await copyVideo(source, destination);
  }
}

async function main() {
  console.log("=================================");
  console.log("   Zhozabel — оптимизация");
  console.log("=================================");

  console.log(`Режим: ${FORCE ? "полная обработка" : "обновление"}`);
  console.log("Качество WebP: 95");
  console.log("Миниатюры: 600×600");
  console.log("Оригиналы не изменяются.");

  try {
    await processFolder("artworks");
    await processFolder("gifts");
  } catch (error) {
    stats.errors++;
    console.error("\nКритическая ошибка:");
    console.error(error.message);
  }

  console.log("\n=================================");
  console.log("РЕЗУЛЬТАТ");
  console.log("=================================");
  console.log(`Полноразмерных WebP: ${stats.converted}`);
  console.log(`Миниатюр WebP:       ${stats.thumbnails}`);
  console.log(`Скопировано видео:   ${stats.copied}`);
  console.log(`Пропущено актуальных: ${stats.skipped}`);
  console.log(`Ошибок:              ${stats.errors}`);

  if (stats.errors > 0) {
    process.exitCode = 1;
    console.log("\nЕсть ошибки. Проверь вывод выше.");
  } else {
    console.log("\nОбработка завершена успешно.");
  }
}

main();
