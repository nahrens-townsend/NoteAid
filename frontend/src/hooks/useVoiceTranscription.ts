export interface UseVoiceTranscriptionOptions {
  onFinal: (text: string) => void;
}

export interface UseVoiceTranscriptionResult {
  isRecording: boolean;
  start: () => void;
  stop: () => void;
  partialTranscript: string;
  error: string | null;
}

export function useVoiceTranscription(
  _options: UseVoiceTranscriptionOptions,
): UseVoiceTranscriptionResult {
  return {
    isRecording: false,
    start: () => {},
    stop: () => {},
    partialTranscript: "",
    error: null,
  };
}
