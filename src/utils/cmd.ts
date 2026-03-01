import { execFileSync } from "node:child_process";

export async function runCmd(cmd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const out = execFileSync(cmd, args, { encoding: "utf8", timeout: 5000 });
      resolve(out.trim() || null);
    } catch {
      resolve(null);
    }
  });
}

export const OBSIDIAN_BIN = "/Applications/Obsidian.app/Contents/MacOS/Obsidian";

function stripCliPrefix(s: string | null): string | null {
  if (!s) return null;
  const lines = s.split("\n").filter(l => {
    const t = l.trim();
    if (!t) return false;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} /.test(t)) return false;
    if (t.startsWith("Your Obsidian installer")) return false;
    return true;
  }).map(l => l.replace(/^=> /, ""));
  return lines.join("\n").trim() || null;
}

export async function obsidianCmd(args: string[]): Promise<string | null> {
  const raw = await runCmd(OBSIDIAN_BIN, args);
  const cleaned = stripCliPrefix(raw);
  if (!cleaned) return null;
  const lines = cleaned.split("\n").map(l => l.trim()).filter(Boolean);
  return lines[lines.length - 1] ?? null;
}

export async function obsidianCmdMulti(args: string[]): Promise<string | null> {
  return stripCliPrefix(await runCmd(OBSIDIAN_BIN, args));
}

export async function obsidianCliAvailable(): Promise<boolean> {
  const out = await obsidianCmd(["version"]);
  return out !== null;
}
