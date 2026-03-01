import { Text } from "ink";

function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (
      (cp >= 0x1100 && cp <= 0x115f) ||
      (cp >= 0x2e80 && cp <= 0x9fff) ||
      (cp >= 0xac00 && cp <= 0xd7af) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe10 && cp <= 0xfe6f) ||
      (cp >= 0xff01 && cp <= 0xff60)
    ) {
      w += 2;
    } else {
      w += 1;
    }
  }
  return w;
}

function centerInBox(content: string, innerWidth: number): string {
  const cw = displayWidth(content);
  const total = innerWidth - cw;
  const left = Math.floor(total / 2);
  return " ".repeat(Math.max(0, left)) + content + " ".repeat(Math.max(0, total - left));
}

interface HeaderProps {
  now: string;
}

export function Header({ now }: HeaderProps) {
  const INNER = 58;
  const titleContent = `AI 工具配置看板  ${now}`;
  const centeredTitle = centerInBox(titleContent, INNER);

  return (
    <Text bold color="cyan">
      {"\n  ╔══════════════════════════════════════════════════════════╗\n"}
      {"  ║"}{centeredTitle}{"║\n"}
      {"  ╚══════════════════════════════════════════════════════════╝"}
    </Text>
  );
}
