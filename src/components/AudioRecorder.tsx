import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface AudioRecorderProps {
  language: 'Hindi' | 'English';
  onAudioRecorded: (blob: Blob | null, audioUrl: string | null) => void;
  onTranscriptionUpdate: (text: string) => void;
  initialTranscript?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  language,
  onAudioRecorded,
  onTranscriptionUpdate,
  initialTranscript = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcription, setTranscription] = useState(initialTranscript);
  const [speechSupported, setSpeechSupported] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Store only FINAL speech results here.
  // This prevents interim recognition results from being appended repeatedly.
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    setSpeechSupported(Boolean(SpeechRec));
  }, []);

  useEffect(() => {
    setTranscription(initialTranscript || '');
    finalTranscriptRef.current = initialTranscript || '';
  }, [initialTranscript]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (_) {}
      }

      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        } catch (_) {}
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    // Reset transcript for a fresh recording.
    finalTranscriptRef.current = '';
    setTranscription('');
    onTranscriptionUpdate('');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Microphone access is not supported by this browser.'
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });

        const url = URL.createObjectURL(audioBlob);

        setAudioUrl(url);
        onAudioRecorded(audioBlob, url);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);

      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      const SpeechRec =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRec) {
        setSpeechSupported(false);
        return;
      }

      try {
        const recognition = new SpeechRec();

        recognition.continuous = true;

        // We need interim results for live feedback,
        // but ONLY FINAL results are stored permanently.
        recognition.interimResults = true;

        recognition.maxAlternatives = 1;

        recognition.lang =
          language === 'Hindi' ? 'hi-IN' : 'en-IN';

        recognition.onresult = (event: any) => {
          let finalText = finalTranscriptRef.current;
          let interimText = '';

          for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
          ) {
            const result = event.results[i];

            if (!result || !result[0]) continue;

            const text = result[0].transcript.trim();

            if (!text) continue;

            if (result.isFinal) {
              finalText = `${finalText} ${text}`.trim();
            } else {
              interimText = `${interimText} ${text}`.trim();
            }
          }

          finalTranscriptRef.current = finalText;

          // Display final + current interim result.
          const displayText = `${finalText} ${interimText}`
            .replace(/\s+/g, ' ')
            .trim();

          setTranscription(displayText);

          // Send the complete current transcript to the parent.
          // Parent MUST replace the value rather than append it.
          onTranscriptionUpdate(displayText);
        };

        recognition.onerror = (event: any) => {
          console.warn(
            '[Web Speech API]',
            event?.error || 'unknown error'
          );

          if (event?.error === 'not-allowed') {
            setErrorMessage(
              'Microphone permission was denied. Please allow microphone access in your browser.'
            );
          } else if (event?.error === 'audio-capture') {
            setErrorMessage(
              'No microphone was detected. Please check your microphone.'
            );
          } else if (event?.error === 'network') {
            setErrorMessage(
              'Speech recognition network error. Please check your internet connection.'
            );
          }
        };

        recognition.onend = () => {
          recognitionRef.current = null;
        };

        recognition.start();

        recognitionRef.current = recognition;
      } catch (speechError) {
        console.warn(
          '[Web Speech API] Could not start:',
          speechError
        );
      }
    } catch (err: any) {
      console.error('[Audio Recording Error]', err);

      if (
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError'
      ) {
        setErrorMessage(
          'Microphone access was denied. Please grant microphone permission in your browser.'
        );
      } else {
        setErrorMessage(
          err?.message ||
            'Unable to access the microphone.'
        );
      }
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    // Stop speech recognition first.
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (_) {}

      recognitionRef.current = null;
    }

    // Stop media recorder.
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (_) {}
    }

    setIsRecording(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Make sure the final transcript is what the parent receives.
    const finalText = finalTranscriptRef.current
      .replace(/\s+/g, ' ')
      .trim();

    setTranscription(finalText);
    onTranscriptionUpdate(finalText);
  };

  const resetRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}

      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (_) {}
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingDuration(0);
    setTranscription('');
    setErrorMessage(null);

    finalTranscriptRef.current = '';

    onAudioRecorded(null, null);
    onTranscriptionUpdate('');
  };

  const togglePlayback = async () => {
    if (!audioPlayerRef.current || !audioUrl) return;

    try {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('[Audio Playback Error]', error);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;

    return `${mins
      .toString()
      .padStart(2, '0')}:${remaining
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div
      id="audio-recorder-section"
      className="bg-white/50 backdrop-blur-xs border border-white/80 rounded-2xl p-4 sm:p-5 shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-blue-600" />

          <h4 className="font-semibold text-sm text-slate-800">
            Voice Recording (
            {language === 'Hindi'
              ? 'हिन्दी में बोलें'
              : 'Speak in English'}
            )
          </h4>
        </div>

        <span className="self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50/80 text-blue-700 border border-blue-200/80">
          {language} Audio
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Click the microphone and speak naturally. The system records
        your voice and converts it into text.
      </p>

      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50/80 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!speechSupported && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          Live speech-to-text is not supported by this browser.
          Your voice recording can still be saved.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        {!isRecording ? (
          <button
            type="button"
            id="start-recording-btn"
            onClick={startRecording}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-200/80 transition"
          >
            <Mic className="w-4 h-4" />
            <span>
              {audioUrl
                ? 'Record Again'
                : 'Start Voice Recording'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            id="stop-recording-btn"
            onClick={stopRecording}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-rose-200/80 transition"
          >
            <Square className="w-4 h-4" />
            <span>
              Stop Recording ({formatSeconds(recordingDuration)})
            </span>
          </button>
        )}

        {isRecording && (
          <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>
              Recording live ({language})...
            </span>
          </div>
        )}

        {audioUrl && !isRecording && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="play-audio-btn"
              onClick={togglePlayback}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/70 hover:bg-white border border-white/80 text-slate-700 text-xs font-medium rounded-xl shadow-2xs transition"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <Play className="w-3.5 h-3.5 text-blue-600" />
              )}

              <span>
                {isPlaying
                  ? 'Pause Audio'
                  : 'Play Voice Note'}
              </span>
            </button>

            <button
              type="button"
              id="reset-audio-btn"
              onClick={resetRecording}
              className="flex items-center gap-1 px-2.5 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium rounded-xl hover:bg-white/80 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {transcription && (
        <div
          id="voice-transcription-preview"
          className="mt-4 pt-3 border-t border-white/60"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Speech-to-Text Transcription ({language})
              </span>
            </div>

            <span className="self-start text-[11px] text-emerald-700 bg-emerald-50/80 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Transcribed
            </span>
          </div>

          <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-white/80 text-xs text-slate-800 leading-relaxed shadow-2xs">
            {transcription}
          </div>

          <p className="text-[11px] text-slate-500 mt-1">
            Review or edit the text in the problem description
            before submitting.
          </p>
        </div>
      )}
    </div>
  );
};