import { Button, Textarea, Stack, Text, Heading } from "@chakra-ui/react";

interface NoteInputProps {
  onGenerate: (rawInput: string) => void;
  isLoading: boolean;
  value: string;
  onChange: (val: string) => void;
}

export default function NoteInput({
  onGenerate,
  isLoading,
  value,
  onChange,
}: NoteInputProps) {
  const handleSubmit = () => {
    onGenerate(value);
  };

  return (
    <Stack gap={3}>
      <Heading as="h2" size="md" mb={4} color="gray.700">
        Raw Clinical Notes
      </Heading>
      <Textarea
        placeholder="Enter unstructured clinical notes here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        resize="vertical"
      />
      <Button
        colorPalette="blue"
        onClick={handleSubmit}
        loading={isLoading}
        loadingText="Generating..."
        disabled={isLoading || value.trim().length < 10}
      >
        Generate SOAP Note
      </Button>
    </Stack>
  );
}
