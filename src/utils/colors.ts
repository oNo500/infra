import { colors } from "consola/utils";

export type BadgeStatus = "ok" | "warn" | "off";

export function badge(status: BadgeStatus): string {
  switch (status) {
    case "ok":   return colors.green("●");
    case "warn": return colors.yellow("◐");
    case "off":  return colors.gray("○");
  }
}
