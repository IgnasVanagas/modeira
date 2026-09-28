import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");
const imageDirectory = path.join(projectRoot, "assets", "images");

const images = [
  ["hero-flat-roof-placeholder.png", "hero-flat-roof-placeholder.webp", 1920, 80],
  ["hero-flat-roof-placeholder.png", "hero-flat-roof-placeholder-mobile.webp", 900, 76],
  ["project-logistics-kaunas-placeholder.png", "project-logistics-kaunas-placeholder.webp", 1536, 78],
  ["project-logistics-kaunas-placeholder.png", "project-logistics-kaunas-placeholder-sm.webp", 800, 76],
  ["project-renovation-kaunas-placeholder.png", "project-renovation-kaunas-placeholder.webp", 1536, 78],
  ["project-renovation-kaunas-placeholder.png", "project-renovation-kaunas-placeholder-sm.webp", 800, 76],
  ["project-commercial-vilnius-placeholder.png", "project-commercial-vilnius-placeholder.webp", 1536, 78],
  ["project-commercial-vilnius-placeholder.png", "project-commercial-vilnius-placeholder-sm.webp", 800, 76],
  ["project-waterproofing-detail-placeholder.png", "project-waterproofing-detail-placeholder.webp", 1536, 78],
  ["project-waterproofing-detail-placeholder.png", "project-waterproofing-detail-placeholder-sm.webp", 800, 76],
];

await Promise.all(
  images.map(async ([sourceName, destinationName, width, quality]) => {
    const source = path.join(imageDirectory, sourceName);
    const destination = path.join(imageDirectory, destinationName);
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toFile(destination);
    console.log(`Paruošta: ${destinationName}`);
  }),
);
