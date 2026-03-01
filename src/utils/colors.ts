export type BadgeStatus = "ok" | "warn" | "off";

export interface BadgeInfo {
  symbol: string;
  color: string;
}

export function badge(status: BadgeStatus): BadgeInfo {
  switch (status) {
    case "ok":   return { symbol: "●", color: "green" };
    case "warn": return { symbol: "◐", color: "yellow" };
    case "off":  return { symbol: "○", color: "gray" };
  }
}
