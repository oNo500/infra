import { Box, Text } from "ink";
import { SectionBox } from "./SectionBox.tsx";
import type { ObsidianData } from "../utils/data.ts";

interface Props {
  data: ObsidianData;
}

export function ObsidianSection({ data }: Props) {
  return (
    <SectionBox title="Obsidian 笔记库">
      {!data.available || data.mode === "unavailable" ? (
        <Box marginLeft={2}>
          <Text color="gray">○ </Text><Text>Obsidian 库未找到</Text>
        </Box>
      ) : (
        <>
          <Box marginLeft={2}>
            <Text color="gray">[via {data.mode === "cli" ? "obsidian-cli" : "文件系统"}]</Text>
          </Box>
          {data.stats && <ObsidianStats stats={data.stats} />}
        </>
      )}
    </SectionBox>
  );
}

function ObsidianStats({ stats }: { stats: NonNullable<ObsidianData["stats"]> }) {
  const { inboxCount, projCount, areaCount, resCount, archCount, recent, topTags } = stats;

  return (
    <>
      <Box marginLeft={2}>
        {inboxCount > 10 ? (
          <><Text color="yellow">◐ </Text><Text>{"00-inbox       "}</Text><Text color="yellow">({inboxCount} 条待整理!)</Text></>
        ) : (
          <><Text color="green">● </Text><Text>{"00-inbox       "}</Text><Text color="gray">{inboxCount} 条</Text></>
        )}
      </Box>
      <Box marginLeft={2}>
        <Text color="green">● </Text>
        <Text>{"10-projects    "}</Text>
        <Text color="gray">{projCount} 个项目</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color="green">● </Text>
        <Text>{"20-areas       "}</Text>
        <Text color="gray">{areaCount} 个领域</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color="green">● </Text>
        <Text>{"30-resources   "}</Text>
        <Text color="gray">{resCount} 篇参考</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color="gray">○ </Text>
        <Text>{"90-archive     "}</Text>
        <Text color="gray">{archCount} 篇归档</Text>
      </Box>
      {recent.length > 0 && (
        <>
          <Text> </Text>
          <Box marginLeft={2}>
            <Text color="gray">近期更新:</Text>
          </Box>
          {recent.map(name => (
            <Box key={name} marginLeft={2}>
              <Text color="gray">  · </Text><Text color="white">{name}</Text>
            </Box>
          ))}
        </>
      )}
      {topTags.length > 0 && (
        <>
          <Text> </Text>
          <Box marginLeft={2}>
            <Text color="gray">热门标签: </Text><Text color="white">{topTags.join("  ")}</Text>
          </Box>
        </>
      )}
    </>
  );
}
