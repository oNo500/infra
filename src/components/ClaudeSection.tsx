import { Box, Text } from "ink";
import { SectionBox } from "./SectionBox.tsx";
import type { ClaudeData } from "../utils/data.ts";

interface Props {
  data: ClaudeData;
}

export function ClaudeSection({ data }: Props) {
  return (
    <SectionBox title="Claude Code">
      {!data.available ? (
        <Box marginLeft={2}>
          <Text color="gray">○ </Text><Text>配置文件未找到</Text>
        </Box>
      ) : (
        <>
          <Box marginLeft={2}>
            <Text color="green">● </Text><Text>{"版本     "}</Text><Text color="white">{data.version}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="green">● </Text><Text>{"模型     "}</Text><Text color="white">{data.model}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="green">● </Text><Text>{"语言     "}</Text><Text color="white">{data.language}</Text>
          </Box>
          <Box marginLeft={2}>
            {data.skipDangerous ? (
              <><Text color="yellow">◐ </Text><Text>{"危险确认 "}</Text><Text color="yellow">已跳过</Text></>
            ) : (
              <><Text color="green">● </Text><Text>{"危险确认 "}</Text><Text color="white">开启</Text></>
            )}
          </Box>
        </>
      )}
    </SectionBox>
  );
}
