import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoz({ onTranscripcion, idioma = 'es-AR' }) {
  const [escuchando, setEscuchando] = useState(false);
  const [soportado, setSoportado] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  // Ref so SpeechRecognition never needs to be recreated when el callback cambia
  const onTranscripcionRef = useRef(onTranscripcion);

  useEffect(() => {
    onTranscripcionRef.current = onTranscripcion;
  }, [onTranscripcion]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSoportado(true);
      const recognition = new SpeechRecognition();
      recognition.lang = idioma;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const texto = event.results[0][0].transcript;
        onTranscripcionRef.current(texto);
        setEscuchando(false);
      };

      recognition.onerror = (event) => {
        setError(event.error === 'not-allowed' ? 'Permiso de micrófono denegado' : 'Error al reconocer voz');
        setEscuchando(false);
      };

      recognition.onend = () => {
        setEscuchando(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSoportado(false);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      synthRef.current?.cancel();
    };
  }, [idioma]); // onTranscripcion removido — se lee via ref

  const iniciarEscucha = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setEscuchando(true);
    try {
      recognitionRef.current.start();
    } catch (_) {
      setEscuchando(false);
    }
  }, []);

  const detenerEscucha = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setEscuchando(false);
  }, []);

  // onEnd callback para saber exactamente cuándo termina la síntesis
  const hablar = useCallback((texto, onEnd) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = idioma;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    synthRef.current.speak(utterance);
  }, [idioma]);

  const detenerVoz = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  return { escuchando, soportado, error, iniciarEscucha, detenerEscucha, hablar, detenerVoz };
}
