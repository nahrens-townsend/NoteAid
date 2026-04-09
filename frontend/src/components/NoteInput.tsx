import { Button, Flex, Heading, Stack, Text, Textarea } from "@chakra-ui/react";
import VoiceRecordButton from "./VoiceRecordButton";

interface NoteInputProps {
  onGenerate: (rawInput: string) => void;
  isLoading: boolean;
  value: string;
  onChange: (val: string) => void;
  partialTranscript: string;
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  voiceError: string | null;
}

export default function NoteInput({
  onGenerate,
  isLoading,
  value,
  onChange,
  partialTranscript,
  isRecording,
  onStart,
  onStop,
  voiceError,
}: NoteInputProps) {
  const handleSubmit = () => {
    onGenerate(value);
  };

  return (
    <Stack gap={3}>
      <Flex align="center" justify="space-between" mb={4}>
        <Heading as="h2" size="md" color="gray.700">
          Raw Clinical Notes
        </Heading>
        <VoiceRecordButton
          isRecording={isRecording}
          isLoading={isLoading}
          onStart={onStart}
          onStop={onStop}
          error={voiceError}
        />
      </Flex>
      <Textarea
        placeholder="Enter unstructured clinical notes here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        resize="vertical"
      />
      {isRecording && partialTranscript && (
        <Text color="gray.400" fontStyle="italic" fontSize="sm">
          {partialTranscript}
        </Text>
      )}
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
