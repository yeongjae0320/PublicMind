import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechRecognition({ onResult, onEnd, continuous = false }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onEndRef = useRef(onEnd);

  // 콜백 함수 최신 상태 유지
  useEffect(() => {
    onResultRef.current = onResult;
    onEndRef.current = onEnd;
  }, [onResult, onEnd]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = continuous;
        recognition.interimResults = true; // 실시간 인식 결과 반환
        recognition.lang = 'ko-KR';

        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          if (onResultRef.current) {
            onResultRef.current(currentTranscript, event.results[event.results.length - 1].isFinal);
          }
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setError(event.error);
          isListeningRef.current = false;
          setIsListening(false);
        };

        recognition.onend = () => {
          isListeningRef.current = false;
          setIsListening(false);
          if (onEndRef.current) {
            onEndRef.current();
          }
        };

        return () => {
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.onend = null;
          try {
            recognition.stop();
          } catch(e) {}
        };
      } else {
        setError('not_supported');
      }
    }
  }, [continuous]);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, []);

  const isSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    isSupported
  };
}
