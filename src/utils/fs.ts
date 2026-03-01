import { readdir, stat, readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

export async function countMd(dir: string, maxDepth = 99, depth = 0): Promise<number> {
  if (depth > maxDepth) return 0;
  let count = 0;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        count += await countMd(join(dir, entry.name), maxDepth, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        count++;
      }
    }
  } catch { /* ignore */ }
  return count;
}

export async function countSubdirs(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter(e => e.isDirectory() && !e.name.startsWith(".")).length;
  } catch {
    return 0;
  }
}

export async function getRecentMd(dir: string, exclude = "99-system", topN = 3): Promise<string[]> {
  const files: { name: string; mtime: number }[] = [];

  async function walk(d: string, depth = 0) {
    if (depth > 5) return;
    try {
      const entries = await readdir(d, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) {
          if (!full.includes(exclude)) {
            await walk(full, depth + 1);
          }
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const s = await stat(full);
          files.push({ name: entry.name.replace(/\.md$/, ""), mtime: s.mtimeMs });
        }
      }
    } catch { /* ignore */ }
  }

  await walk(dir);
  files.sort((a, b) => b.mtime - a.mtime);
  return files.slice(0, topN).map(f => f.name);
}
