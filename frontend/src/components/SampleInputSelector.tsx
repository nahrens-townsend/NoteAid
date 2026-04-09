import { Button, NativeSelect, HStack } from "@chakra-ui/react";
import { useState } from "react";
import { SAMPLE_INPUTS } from "../data/sampleInputs";

interface SampleInputSelectorProps {
  onInsert: (text: string) => void;
}

export default function SampleInputSelector({
  onInsert,
}: SampleInputSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  const handleInsert = () => {
    const sample = SAMPLE_INPUTS.find((s) => s.id === selectedId);
    if (sample) {
      onInsert(sample.text);
    }
  };

  return (
    <HStack gap={2}>
      <NativeSelect.Root flex={1}>
        <NativeSelect.Field
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="" disabled>
            Select a sample input
          </option>
          {SAMPLE_INPUTS.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.label}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      <Button
        onClick={handleInsert}
        disabled={!selectedId}
        colorPalette="blue"
        variant="outline"
        size="sm"
        flexShrink={0}
      >
        Insert Sample Input
      </Button>
    </HStack>
  );
}
