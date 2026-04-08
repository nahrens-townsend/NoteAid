import { Stack, Text, Textarea } from "@chakra-ui/react";

interface SOAPFormProps {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  onChange: (
    field: "subjective" | "objective" | "assessment" | "plan",
    value: string,
  ) => void;
}

export default function SOAPForm({
  subjective,
  objective,
  assessment,
  plan,
  onChange,
}: SOAPFormProps) {
  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text fontWeight="semibold">Subjective</Text>
        <Textarea
          value={subjective}
          onChange={(e) => onChange("subjective", e.target.value)}
          rows={4}
          resize="vertical"
          placeholder="Subjective findings..."
        />
      </Stack>
      <Stack gap={1}>
        <Text fontWeight="semibold">Objective</Text>
        <Textarea
          value={objective}
          onChange={(e) => onChange("objective", e.target.value)}
          rows={4}
          resize="vertical"
          placeholder="Objective findings..."
        />
      </Stack>
      <Stack gap={1}>
        <Text fontWeight="semibold">Assessment</Text>
        <Textarea
          value={assessment}
          onChange={(e) => onChange("assessment", e.target.value)}
          rows={4}
          resize="vertical"
          placeholder="Assessment..."
        />
      </Stack>
      <Stack gap={1}>
        <Text fontWeight="semibold">Plan</Text>
        <Textarea
          value={plan}
          onChange={(e) => onChange("plan", e.target.value)}
          rows={4}
          resize="vertical"
          placeholder="Plan..."
        />
      </Stack>
    </Stack>
  );
}
