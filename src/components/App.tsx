import { useState, useEffect } from "react";
import { Box, useApp } from "ink";
import { collectAllData } from "../utils/data.ts";
import type { AppData } from "../utils/data.ts";
import { Header } from "./Header.tsx";
import { ClaudeSection } from "./ClaudeSection.tsx";
import { McpSection } from "./McpSection.tsx";
import { SkillsSection } from "./SkillsSection.tsx";
import { ObsidianSection } from "./ObsidianSection.tsx";
import { CursorSection } from "./CursorSection.tsx";
import { ProjectsSection } from "./ProjectsSection.tsx";
import { Footer } from "./Footer.tsx";

export function App() {
  const { exit } = useApp();
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    collectAllData()
      .then((result) => {
        setData(result);
        setImmediate(() => exit());
      })
      .catch((err) => exit(err as Error));
  }, [exit]);

  if (!data) return null;

  return (
    <Box flexDirection="column">
      <Header now={data.now} />
      <ClaudeSection data={data.claude} />
      <McpSection data={data.mcp} />
      <SkillsSection data={data.skills} />
      <ObsidianSection data={data.obsidian} />
      <CursorSection data={data.cursor} />
      <ProjectsSection data={data.projects} />
      <Footer claudeVersion={data.claude.version} />
    </Box>
  );
}
