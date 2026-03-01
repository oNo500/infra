import type { ReactNode } from "react";
import { Box, Text } from "ink";

interface SectionBoxProps {
  title: string;
  children: ReactNode;
}

export function SectionBox({ title, children }: SectionBoxProps) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold><Text color="blue">▌ </Text>{title}</Text>
      <Text color="gray">{"  " + "─".repeat(55)}</Text>
      {children}
    </Box>
  );
}
