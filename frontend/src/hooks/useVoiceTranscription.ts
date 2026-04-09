import { useCallback, useEffect, useRef, useState } from "react";

export interface UseVoiceTranscriptionOptions {
  onFinal: (text: string) => void;
}

export interface UseVoiceTranscriptionResult {
  isRecording: boolean;
  isConnecting: boolean;
  start: () => void;
  stop: () => void;
  partialTranscript: string;
  error: string | null;
}

const WS_URL =
  (import.meta.env.VITE_AI_WS_URL as string) ??
  "ws://127.0.0.1:8000/ws/transcribe";

export function useVoiceTranscription(
  options: UseVoiceTranscriptionOptions,
): UseVoiceTranscriptionResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onFinalRef = useRef(options.onFinal);

  useEffect(() => {
    onFinalRef.current = options.onFinal;
  }, [options.onFinal]);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;

    socketRef.current?.close();
    socketRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setIsConnecting(false);
    setIsRecording(false);
    setPartialTranscript("");
  }, []);

  const start = useCallback(async () => {
    setError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(
        "Microphone access was denied. Please allow microphone permission and try again.",
      );
      return;
    }

    setIsConnecting(true);

    const ws = new WebSocket(WS_URL);
    ws.binaryType = "arraybuffer";

    ws.onerror = () => {
      setError("Could not connect to the transcription service.");
      stop();
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const frame = JSON.parse(event.data) as {
          type: "partial" | "final";
          text: string;
        };
        if (frame.type === "partial") {
          setPartialTranscript(frame.text);
        } else if (frame.type === "final") {
          setPartialTranscript("");
          if (frame.text) {
            onFinalRef.current(frame.text);
          }
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onopen = () => {
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e: BlobEvent) => {
        if (ws.readyState === WebSocket.OPEN && e.data.size > 0) {
          e.data.arrayBuffer().then((buf) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(buf);
            }
          });
        }
      };

      recorder.onstop = () => {
        ws.close();
      };

      mediaRecorderRef.current = recorder;
      streamRef.current = stream;
      socketRef.current = ws;

      recorder.start(250); // emit chunks every 250 ms
      setIsConnecting(false);
      setIsRecording(true);
    };
  }, [stop]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      socketRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { isRecording, isConnecting, start, stop, partialTranscript, error };
}
