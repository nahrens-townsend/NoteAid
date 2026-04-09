import { Box, Button, Text, Tooltip } from "@chakra-ui/react";

interface VoiceRecordButtonProps {
  isRecording: boolean;
  isLoading: boolean;
  onStart: () => void;
  onStop: () => void;
  error: string | null;
}

const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  const w = window as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
};

const pulseKeyframes = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }
`;

export default function VoiceRecordButton({
  isRecording,
  isLoading,
  onStart,
  onStop,
  error,
}: VoiceRecordButtonProps) {
  const supported = isSpeechRecognitionSupported();

  const button = (
    <Button
      variant="outline"
      colorPalette={isRecording ? "red" : "gray"}
      onClick={isRecording ? onStop : onStart}
      disabled={!supported || isLoading}
      size="sm"
    >
      {isRecording && (
        <>
          <style>{pulseKeyframes}</style>
          <Box
            as="span"
            display="inline-block"
            width="8px"
            height="8px"
            borderRadius="full"
            bg="red.500"
            mr={2}
            style={{ animation: "pulse-dot 1s ease-in-out infinite" }}
          />
        </>
      )}
      {isRecording ? "Stop Recording" : "Start Recording"}
    </Button>
  );

  return (
    <Box>
      {supported ? (
        button
      ) : (
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Box as="span" display="inline-block">
              {button}
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Content>Voice input requires Chrome or Edge</Tooltip.Content>
        </Tooltip.Root>
      )}
      {error && (
        <Text color="red.500" fontSize="sm" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
}
