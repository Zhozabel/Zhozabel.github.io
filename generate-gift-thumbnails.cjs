const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const SOURCE_DIR = path.join(process.cwd(), "images", "gifts");
const OUTPUT_DIR = path.join(process.cwd(), "images", "gifts-thumbnails");

const MAX_WIDTH = 600;
const MAX_HEIGHT = 600;
const QUALITY = 95;
const EFFORT = 5;

async function main() {
  const files = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter(file => file.isFile() && /\.(jpe?g|png)$/i.test(file.name));

  let originalBytes = 0;
  let thumbnailBytes = 0;
  let errors = 0;

  console.log(`Найдено изображений: ${files.length}`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const input = path.join(SOURCE_DIR, file.name);
    const output = path.join(
      OUTPUT_DIR,
      `${path.parse(file.name).name}.webp`
    );

    try {
      const inputSize = fs.statSync(input).size;
      originalBytes += inputSize;

      fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      await sharp(input)
        .rotate()
        .resize({
          width: MAX_WIDTH,
          height: MAX_HEIGHT,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: QUALITY, effort: EFFORT })
        .toFile(output);

      const outputSize = fs.statSync(output).size;
      thumbnailBytes += outputSize;

      console.log(
        `[${i + 1}/${files.length}] ${file.name}: ` +
        `${(inputSize / 1024).toFixed(1)} KB → ` +
        `${(outputSize / 1024).toFixed(1)} KB`
      );
    } catch (error) {
      errors++;
      console.error(`шибка: ${file.name}: ${error.message}`);
    }
  }

  const saved = originalBytes - thumbnailBytes;
  const reduction = originalBytes
    ? (saved / originalBytes) * 100
    : 0;

  console.log("\n========== Т ==========");
  console.log(`Обработано: ${files.length}`);
  console.log(`Ошибок: ${errors}`);
  console.log(`Размер оригиналов: ${(originalBytes / 1048576).toFixed(2)} MiB`);
  console.log(`Размер превью: ${(thumbnailBytes / 1048576).toFixed(2)} MiB`);
  console.log(`Экономия: ${(saved / 1048576).toFixed(2)} MiB (${reduction.toFixed(1)}%)`);
  console.log("Оригиналы не изменялись.");
}

main().catch(error => {
  console.error("Критическая ошибка:", error);
  process.exitCode = 1;
});
