const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "images", "artworks");
const OUTPUT_DIR = path.join(ROOT, "images", "artworks-thumbnails");

const MAX_WIDTH = 600;
const MAX_HEIGHT = 600;
const QUALITY = 95;
const EFFORT = 5;
const TEST_LIMIT = 0;

function collectImages() {
  const files = [];

  for (const year of fs.readdirSync(SOURCE_DIR, { withFileTypes: true })) {
    if (!year.isDirectory()) continue;

    const yearDir = path.join(SOURCE_DIR, year.name);

    for (const file of fs.readdirSync(yearDir, { withFileTypes: true })) {
      if (!file.isFile() || !/\.(jpe?g|png)$/i.test(file.name)) continue;

      files.push({
        input: path.join(yearDir, file.name),
        output: path.join(
          OUTPUT_DIR,
          year.name,
          `${path.parse(file.name).name}.webp`
        )
      });
    }
  }

  return files;
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Не найдена папка с оригиналами: ${SOURCE_DIR}`);
  }

  const allFiles = collectImages();
  const files = TEST_LIMIT ? allFiles.slice(0, TEST_LIMIT) : allFiles;

  if (files.length === 0) {
    console.log("Изображения JPG/PNG не найдены.");
    return;
  }

  let processed = 0;
  let skipped = 0;
  let errors = 0;
  let originalBytes = 0;
  let thumbnailBytes = 0;
  let savedBytes = 0;

  console.log(`Найдено изображений: ${files.length}`);
  console.log(`Настройки: WebP, качество ${QUALITY}, максимум ${MAX_WIDTH}×${MAX_HEIGHT}`);
  console.log("");

  for (const file of files) {
    try {
      const originalStat = fs.statSync(file.input);
      originalBytes += originalStat.size;

      // ропускаем превью, если оно новее оригинала.
      if (
        fs.existsSync(file.output) &&
        fs.statSync(file.output).mtimeMs >= originalStat.mtimeMs
      ) {
        const existingSize = fs.statSync(file.output).size;
        thumbnailBytes += existingSize;
        savedBytes += originalStat.size - existingSize;
        skipped++;
        continue;
      }

      fs.mkdirSync(path.dirname(file.output), { recursive: true });

      await sharp(file.input)
        .rotate()
        .resize({
          width: MAX_WIDTH,
          height: MAX_HEIGHT,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({
          quality: QUALITY,
          effort: EFFORT
        })
        .toFile(file.output);

      const outputSize = fs.statSync(file.output).size;
      thumbnailBytes += outputSize;
      savedBytes += originalStat.size - outputSize;
      processed++;

      console.log(
        `[${processed + skipped}/${files.length}] ` +
        `${path.relative(SOURCE_DIR, file.input)}: ` +
        `${(originalStat.size / 1024).toFixed(1)} KB → ` +
        `${(outputSize / 1024).toFixed(1)} KB`
      );
    } catch (error) {
      errors++;
      console.error(`шибка: ${file.input}`);
      console.error(error.message);
    }
  }

  const formatSize = bytes => {
    const sign = bytes < 0 ? "-" : "";
    return sign + (Math.abs(bytes) / (1024 * 1024)).toFixed(2) + " MiB";
  };

  const reduction = originalBytes > 0
    ? (1 - thumbnailBytes / originalBytes) * 100
    : 0;

  console.log("\n========== Т ==========");
  console.log(`Всего изображений: ${files.length}`);
  console.log(`Создано превью: ${processed}`);
  console.log(`Пропущено актуальных: ${skipped}`);
  console.log(`Ошибок: ${errors}`);
  console.log(`Размер оригиналов: ${formatSize(originalBytes)}`);
  console.log(`Размер превью: ${formatSize(thumbnailBytes)}`);
  console.log(`Экономия: ${formatSize(savedBytes)} (${reduction.toFixed(1)}%)`);
  console.log("\nОригиналы не изменялись.");
}

main().catch(error => {
  console.error("Критическая ошибка:", error);
  process.exitCode = 1;
});
