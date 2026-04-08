import { Badge, Progress, Stack, Text } from "@chakra-ui/react";

interface ConfidenceBadgeProps {
  confidence: number;
}

function getColor(confidence: number): string {
  if (confidence >= 0.8) return "green";
  if (confidence >= 0.5) return "yellow";
  return "red";
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const color = getColor(confidence);
  const percentage = Math.round(confidence * 100);

  return (
    <Stack gap={2}>
      <Stack direction="row" align="center" gap={2}>
        <Text fontWeight="semibold">Confidence</Text>
        <Badge colorPalette={color}>{percentage}%</Badge>
      </Stack>
      <Progress.Root value={percentage} colorPalette={color} size="sm">
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
    </Stack>
  );
}
