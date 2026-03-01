import { Box, Text } from "ink";

interface Props {
  claudeVersion: string;
}

export function Footer({ claudeVersion }: Props) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="gray">{"──────────────────────────────────────────────────────────────"}</Text>
      <Box marginLeft={2}>
        <Text color="gray">运行 </Text>
        <Text color="white">node ~/code/infra/dist/dashboard.js</Text>
        <Text color="gray"> 刷新  ·  Claude Code v{claudeVersion}</Text>
      </Box>
      <Text> </Text>
    </Box>
  );
}
