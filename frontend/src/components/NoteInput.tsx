import { useState } from "react";
import { Button, Textarea, Stack, Text, Heading } from "@chakra-ui/react";

interface NoteInputProps {
  onGenerate: (rawInput: string) => void;
  isLoading: boolean;
}

export default function NoteInput({ onGenerate, isLoading }: NoteInputProps) {
  const [rawInput, setRawInput] = useState("");

  const handleSubmit = () => {
    onGenerate(rawInput);
  };

  return (
    <Stack gap={3}>
      <Heading as="h2" size="md" mb={4} color="gray.700">
        Raw Clinical Notes
      </Heading>
      <Textarea
        placeholder="Enter unstructured clinical notes here..."
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        rows={12}
        resize="vertical"
      />
      <Button
        colorPalette="blue"
        onClick={handleSubmit}
        loading={isLoading}
        loadingText="Generating..."
        disabled={isLoading || rawInput.trim().length < 10}
      >
        Generate SOAP Note
      </Button>
    </Stack>
  );
}
