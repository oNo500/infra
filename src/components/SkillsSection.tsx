import { Box, Text } from "ink";
import { SectionBox } from "./SectionBox.tsx";
import type { SkillsData } from "../utils/data.ts";

const HOME = process.env.HOME!;
const COL_WIDTH = 27;

interface Props {
  data: SkillsData;
}

export function SkillsSection({ data }: Props) {
  const pairs: Array<[string, string | undefined]> = [];
  for (let i = 0; i < data.skills.length; i += 2) {
    pairs.push([data.skills[i], data.skills[i + 1]]);
  }

  return (
    <SectionBox title={`Skills (${HOME}/.agents/skills)`}>
      {!data.available ? (
        <Box marginLeft={2}>
          <Text color="gray">○ </Text><Text>Skills 目录未找到</Text>
        </Box>
      ) : (
        <>
          <Box marginLeft={2}>
            <Text color="gray">共 </Text>
            <Text color="white">{data.skills.length}</Text>
            <Text color="gray"> 个已安装</Text>
          </Box>
          <Text> </Text>
          {pairs.map(([left, right], i) => (
            <Box key={i} marginLeft={2}>
              <Text color="green">● </Text>
              <Text>{left.padEnd(COL_WIDTH)}</Text>
              {right !== undefined && (
                <>
                  <Text color="green">● </Text>
                  <Text>{right}</Text>
                </>
              )}
            </Box>
          ))}
        </>
      )}
    </SectionBox>
  );
}
