import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

const svgPath = "scripts/icon.svg";

const targets = [
  { size: 192, file: "public/icons/icon-192.png" },
  { size: 512, file: "public/icons/icon-512.png" },
  { size: 512, file: "public/icons/icon-maskable-512.png" },
  { size: 180, file: "public/icons/apple-touch-icon.png" },
];

for (const { size, file } of targets) {
  await sharp(svgPath).resize(size, size).png().toFile(file);
  console.log("Generated", file);
}
