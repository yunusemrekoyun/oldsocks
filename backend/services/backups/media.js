const fs = require("node:fs/promises");
const path = require("node:path");

async function verifyMediaInStage(archive, stage) {
  const media = archive.collections.find((collection) => collection.name === "mediaassets");
  let readyAssets = 0;
  let referencedFiles = 0;
  for (const asset of media?.documents || []) {
    if (asset.status !== "ready") continue;
    readyAssets += 1;
    const keys = [asset.manifestKey, ...(asset.variants || []).map((variant) => variant.key)];
    for (const key of keys) {
      if (!key) continue;
      const parts = key.split("/");
      if (parts.some((part) => !part || part === "." || part === ".." || !/^[A-Za-z0-9._-]+$/.test(part))) {
        throw new Error("Backup media key is unsafe");
      }
      const file = path.join(stage, "media", "assets", ...parts);
      const info = await fs.lstat(file);
      if (!info.isFile()) throw new Error("Backup media reference is not a regular file");
      referencedFiles += 1;
    }
  }
  return { readyAssets, referencedFiles };
}

module.exports = { verifyMediaInStage };
