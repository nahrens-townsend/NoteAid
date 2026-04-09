import { useCallback, useEffect, useRef, useState } from "react";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

function getSpeechRecognition(): (new () => AnySpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function mapErrorCode(code: string): string {
  switch (code) {
    case "not-allowed":
      return "Microphone access was denied. Please allow microphone permission and try again.";
    case "no-speech":
      return "No speech was detected. Please try again.";
    case "network":
      return "A network error occurred during transcription. Please check your connection.";
    default:
      return `Speech recognition error: ${code}`;
  }
}

export function useVoiceTranscription(
  options: UseVoiceTranscriptionOptions,
): UseVoiceTranscriptionResult {
  const [isRecording, setIsRecording] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<AnySpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const onFinalRef = useRef(options.onFinal);
  const startRecognitionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onFinalRef.current = options.onFinal;
  }, [options.onFinal]);

  const startRecognition = useCallback(() => {
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: AnySpeechRecognition) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          onFinalRef.current(result[0].transcript);
        } else {
          interim += result[0].transcript;
        }
      }
      setPartialTranscript(interim);
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        startRecognitionRef.current?.();
      } else {
        setPartialTranscript("");
      }
    };

    recognition.onerror = (event: AnySpeechRecognition) => {
      setError(mapErrorCode(event.error));
      setIsRecording(false);
      isRecordingRef.current = false;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  useEffect(() => {
    startRecognitionRef.current = startRecognition;
  }, [startRecognition]);

  const start = useCallback(() => {
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) {
      setError("Voice input requires Chrome or Edge.");
      return;
    }
    setError(null);
    setIsRecording(true);
    isRecordingRef.current = true;
    startRecognition();
  }, [startRecognition]);

  const stop = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setPartialTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  return { isRecording, start, stop, partialTranscript, error };
}
