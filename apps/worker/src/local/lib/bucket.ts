import fs from "node:fs";
import path from "node:path";

const BUCKET_DIR = path.join(process.cwd(), "local-storage", "fish-images");

if (!fs.existsSync(BUCKET_DIR)) fs.mkdirSync(BUCKET_DIR, { recursive: true });

function keyToPath(key: string) {
  const safe = key.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(BUCKET_DIR, safe);
}

export const localBucket = new (class {
  async put(key: string, value: ArrayBuffer, _opts?: unknown) {
    const filePath = keyToPath(key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, Buffer.from(value));
  }

  async get(key: string) {
    const filePath = keyToPath(key);
    if (!fs.existsSync(filePath)) return null;
    const buffer = await fs.promises.readFile(filePath);
    const stat = await fs.promises.stat(filePath);
    return {
      body: buffer,
      httpMetadata: { contentType: "image/png" },
      writeHttpMetadata(headers: Headers) {
        headers.set("Content-Type", "image/png");
      },
    };
  }

  async head(key: string) {
    const filePath = keyToPath(key);
    if (!fs.existsSync(filePath)) return null;
    const stat = await fs.promises.stat(filePath);
    return { size: stat.size, httpMetadata: { contentType: "image/png" } };
  }
});
