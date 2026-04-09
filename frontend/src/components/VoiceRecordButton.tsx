import { Box, Button, Text, Tooltip } from "@chakra-ui/react";

interface VoiceRecordButtonProps {
  isRecording: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  onStart: () => void;
  onStop: () => void;
  error: string | null;
}

const isMediaRecorderSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(
    typeof MediaRecorder !== "undefined" && navigator.mediaDevices?.getUserMedia
  );
};

const pulseKeyframes = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }
`;

export default function VoiceRecordButton({
  isRecording,
  isConnecting,
  isLoading,
  onStart,
  onStop,
  error,
}: VoiceRecordButtonProps) {
  const supported = isMediaRecorderSupported();

  const button = (
    <Button
      variant="outline"
      colorPalette={isRecording ? "red" : "gray"}
      onClick={isRecording ? onStop : onStart}
      disabled={!supported || isLoading || isConnecting}
      loading={isConnecting}
      loadingText="Connecting..."
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
          <Tooltip.Content>
            Voice input is not supported in this browser
          </Tooltip.Content>
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
