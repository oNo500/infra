import { Box, Text } from "ink";
import { SectionBox } from "./SectionBox.tsx";
import type { CursorData } from "../utils/data.ts";

interface Props {
  data: CursorData;
}

export function CursorSection({ data }: Props) {
  return (
    <SectionBox title="Cursor">
      {!data.available ? (
        <Box marginLeft={2}>
          <Text color="gray">○ </Text><Text>Cursor 配置未找到</Text>
        </Box>
      ) : (
        <>
          <Box marginLeft={2}>
            <Text color="green">● </Text><Text>{"格式化器   "}</Text><Text color="white">{data.formatter}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="green">● </Text><Text>{"AI 语言   "}</Text><Text color="white">{data.aiLang}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="green">● </Text><Text>{"已记录项目 "}</Text><Text color="white">{data.projCount}</Text><Text> 个</Text>
          </Box>
        </>
      )}
    </SectionBox>
  );
}
