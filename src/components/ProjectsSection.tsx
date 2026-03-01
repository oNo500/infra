import { Box, Text } from "ink";
import { SectionBox } from "./SectionBox.tsx";
import type { ProjectsData } from "../utils/data.ts";

interface Props {
  data: ProjectsData;
}

export function ProjectsSection({ data }: Props) {
  return (
    <SectionBox title="活跃代码项目 (~/code)">
      {!data.available ? (
        <Box marginLeft={2}>
          <Text color="gray">○ </Text><Text>~/code 目录未找到</Text>
        </Box>
      ) : (
        <>
          <Box marginLeft={2}>
            <Text color="gray">最近 7 天有活动的项目:</Text>
          </Box>
          {data.projects.length === 0 ? (
            <Box marginLeft={2}>
              <Text color="gray">  (无近期活动)</Text>
            </Box>
          ) : (
            data.projects.map(proj => (
              <Box key={proj.name} marginLeft={2}>
                <Text color="green">● </Text>
                <Text>{proj.name.padEnd(20)}</Text>
                <Text color="cyan">{proj.branch}</Text>
                <Text color="gray"> {proj.date} · {proj.msg}</Text>
              </Box>
            ))
          )}
        </>
      )}
    </SectionBox>
  );
}
