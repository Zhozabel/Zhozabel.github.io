const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = process.cwd();
const sourceDir = path.join(root, "images", "artworks");
const outputDir = path.join(root, "images", "artworks-thumbnails");

async function main() {
  const files = [];

  for (const year of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!year.isDirectory()) continue;

    const yearDir = path.join(sourceDir, year.name);

    for (const file of fs.readdirSync(yearDir, { withFileTypes: true })) {
      if (file.isFile() && /\.(jpe?g|png)$/i.test(file.name)) {
        files.push({
          input: path.join(yearDir, file.name),
          year: year.name,
          name: path.parse(file.name).name
        });
      }
    }
  }

  const selected = files.slice(0, 5);

  if (selected.length === 0) {
    console.log("зображения не найдены.");
    return;
  }

  for (const file of selected) {
    const destinationDir = path.join(outputDir, file.year);
    fs.mkdirSync(destinationDir, { recursive: true });

    const destination = path.join(destinationDir, `${file.name}.webp`);

    await sharp(file.input)
      .rotate()
      .resize({
        width: 600,
        height: 600,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 80, effort: 4 })
      .toFile(destination);

    const originalSize = fs.statSync(file.input).size;
    const previewSize = fs.statSync(destination).size;
    const reduction = (1 - previewSize / originalSize) * 100;

    console.log(
      `${file.year}/${file.name}: ` +
      `${(originalSize / 1024).toFixed(1)} KB -> ` +
      `${(previewSize / 1024).toFixed(1)} KB ` +
      `(${reduction.toFixed(1)}% меньше)`
    );
  }

  console.log(`\nотово! Создано превью: ${selected.length}`);
  console.log("ригиналы не изменялись.");
}

main().catch(error => {
  console.error("шибка генерации:", error);
  process.exitCode = 1;
});
