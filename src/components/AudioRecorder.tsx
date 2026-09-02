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

// Extend Window interface for Web Speech API
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
  const [transcription, setTranscription] = useState<string>(initialTranscript);
  const [speechSupported, setSpeechSupported] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      setSpeechSupported(true);
    }
  }, []);

  // Update transcription on initial transcript change
  useEffect(() => {
    if (initialTranscript && !transcription) {
      setTranscription(initialTranscript);
    }
  }, [initialTranscript]);

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      // 1. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Initialize MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioRecorded(audioBlob, url);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // 3. Start Web Speech recognition if supported
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = language === 'Hindi' ? 'hi-IN' : 'en-IN';

          rec.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript + ' ';
            }
            const trimmed = currentTranscript.trim();
            setTranscription(trimmed);
            onTranscriptionUpdate(trimmed);
          };

          rec.onerror = (e: any) => {
            console.warn('[Web Speech API] Recognition notice:', e.error);
          };

          rec.start();
          recognitionRef.current = rec;
        } catch (speechErr) {
          console.warn('[Web Speech API] Start error:', speechErr);
        }
      }
    } catch (err: any) {
      console.error('[Audio Recording Error]:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please grant microphone permission in your browser.');
      } else {
        setErrorMessage(`Microphone error: ${err.message || 'Unable to access audio device.'}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingDuration(0);
    onAudioRecorded(null, null);
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div id="audio-recorder-section" className="bg-white/50 backdrop-blur-xs border border-white/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-blue-600" />
          <h4 className="font-semibold text-sm text-slate-800">
            Voice Recording ({language === 'Hindi' ? 'हिन्दी में बोलें' : 'Speak in English'})
          </h4>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50/80 text-blue-700 border border-blue-200/80">
          {language} Audio
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Click the microphone to describe your symptoms verbally in your preferred language. The system will
        record your voice and automatically transcribe it into text.
      </p>

      {/* Error notification */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50/80 backdrop-blur-xs border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {!isRecording ? (
          <button
            type="button"
            id="start-recording-btn"
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-200/80 transition"
          >
            <Mic className="w-4 h-4" />
            <span>{audioUrl ? 'Record Again' : 'Start Voice Recording'}</span>
          </button>
        ) : (
          <button
            type="button"
            id="stop-recording-btn"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-rose-200/80 animate-pulse transition"
          >
            <Square className="w-4 h-4" />
            <span>Stop Recording ({formatSeconds(recordingDuration)})</span>
          </button>
        )}

        {isRecording && (
          <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>Recording live ({language})...</span>
          </div>
        )}

        {audioUrl && !isRecording && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="play-audio-btn"
              onClick={togglePlayback}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/70 hover:bg-white border border-white/80 text-slate-700 text-xs font-medium rounded-xl shadow-2xs backdrop-blur-xs transition"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-blue-600" /> : <Play className="w-3.5 h-3.5 text-blue-600" />}
              <span>{isPlaying ? 'Pause Audio' : 'Play Voice Note'}</span>
            </button>

            <button
              type="button"
              id="reset-audio-btn"
              onClick={resetRecording}
              className="flex items-center gap-1 px-2.5 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium rounded-xl hover:bg-white/80 transition"
              title="Delete recording"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden HTML Audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Real-time Transcription feedback */}
      {transcription && (
        <div id="voice-transcription-preview" className="mt-4 pt-3 border-t border-white/60">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Speech-to-Text Transcription ({language})</span>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50/80 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Transcribed
            </span>
          </div>
          <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-white/80 text-xs text-slate-800 leading-relaxed italic shadow-2xs">
            "{transcription}"
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            You can review or edit this text directly in the problem description box below before submitting.
          </p>
        </div>
      )}
    </div>
  );
};
