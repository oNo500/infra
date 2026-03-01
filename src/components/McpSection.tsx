import { Box, Text } from "ink";
import { SectionBox } from "./SectionBox.tsx";
import type { McpData } from "../utils/data.ts";

interface Props {
  data: McpData;
}

export function McpSection({ data }: Props) {
  return (
    <SectionBox title="MCP 服务器">
      {!data.available ? (
        <Box marginLeft={2}>
          <Text color="gray">○ </Text><Text>claude_desktop_config.json 未找到</Text>
        </Box>
      ) : (
        data.servers.map(({ name, pkg }) => (
          <Box key={name} marginLeft={2}>
            <Text color="green">● </Text>
            <Text>{name.padEnd(22)}</Text>
            <Text color="gray">{pkg}</Text>
          </Box>
        ))
      )}
    </SectionBox>
  );
}
